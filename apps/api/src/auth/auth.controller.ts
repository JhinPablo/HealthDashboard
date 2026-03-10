import { Body, Controller, Get, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Public } from "../common/decorators/public.decorator";
import { AuthActor } from "../common/types/auth-actor.interface";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Post("login")
  @Public()
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: "jwt-token",
        user: {
          id: "uuid",
          email: "doctor.admin@saluddigital.local",
          fullName: "Doctor Admin",
          role: "doctor_admin",
          patientId: null
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: "Invalid credentials." })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiSecurity("access-key")
  @ApiSecurity("permission-key")
  async me(@CurrentActor() actor: AuthActor) {
    if (!actor?.userId) {
      return {
        role: actor.role,
        authType: actor.authType,
        patientId: actor.patientId ?? null,
        label: actor.label
      };
    }

    const user = await this.usersService.findById(actor.userId);

    return {
      id: user?.id,
      email: user?.email,
      fullName: user?.fullName,
      role: user?.role,
      patientId: user?.patientId ?? null,
      authType: actor.authType
    };
  }
}
