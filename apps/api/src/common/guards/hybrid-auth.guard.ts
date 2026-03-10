import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { ApiKeysService } from "../../api-keys/api-keys.service";
import { UsersService } from "../../users/users.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AuthActor } from "../types/auth-actor.interface";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  actor?: AuthActor;
};

interface JwtPayload {
  sub: string;
  role: string;
  patientId?: number | null;
  email: string;
}

@Injectable()
export class HybridAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly apiKeysService: ApiKeysService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestLike>();
    const bearer = this.getBearerToken(request);

    if (bearer) {
      request.actor = await this.validateJwt(bearer);
      return true;
    }

    const accessKey = this.getHeader(request, "x-access-key");
    const permissionKey = this.getHeader(request, "x-permission-key");
    if (accessKey && permissionKey) {
      request.actor = await this.apiKeysService.validatePair(accessKey, permissionKey);
      return true;
    }

    throw new UnauthorizedException("Authentication is required.");
  }

  private async validateJwt(token: string): Promise<AuthActor> {
    const secret = this.configService.get<string>("JWT_SECRET") ?? "dev-secret";
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException("Invalid token.");
      }

      return {
        authType: "jwt",
        role: user.role,
        userId: user.id,
        patientId: user.patientId,
        email: user.email
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Invalid token.");
    }
  }

  private getBearerToken(request: RequestLike): string | null {
    const authorization = this.getHeader(request, "authorization");
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(" ");
    if (type?.toLowerCase() !== "bearer" || !token) {
      return null;
    }

    return token;
  }

  private getHeader(request: RequestLike, headerName: string): string | undefined {
    const value = request.headers[headerName];
    return Array.isArray(value) ? value[0] : value;
  }
}
