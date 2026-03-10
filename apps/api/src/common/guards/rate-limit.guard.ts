import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type RequestLike = {
  actor?: {
    userId?: string;
    label?: string;
  };
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<string, number[]>();

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const key =
      request.actor?.userId ??
      request.actor?.label ??
      this.getHeader(request, "x-access-key") ??
      request.ip ??
      "anonymous";

    const now = Date.now();
    const maxRequests = Number(this.configService.get("RATE_LIMIT_PER_MINUTE") ?? 120);
    const windowStart = now - 60_000;
    const recent = (this.requests.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

    if (recent.length >= maxRequests) {
      throw new HttpException("Rate limit exceeded.", HttpStatus.TOO_MANY_REQUESTS);
    }

    recent.push(now);
    this.requests.set(key, recent);
    return true;
  }

  private getHeader(request: RequestLike, headerName: string): string | undefined {
    const value = request.headers[headerName];
    return Array.isArray(value) ? value[0] : value;
  }
}
