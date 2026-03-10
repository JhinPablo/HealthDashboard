import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiKeysModule } from "./api-keys/api-keys.module";
import { ApiKeyEntity } from "./api-keys/api-key.entity";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { HybridAuthGuard } from "./common/guards/hybrid-auth.guard";
import { RateLimitGuard } from "./common/guards/rate-limit.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { getEnvFilePaths } from "./config/environment";
import { BootstrapService } from "./database/bootstrap.service";
import { HealthModule } from "./health/health.module";
import { ObservationsModule } from "./observations/observations.module";
import { ObservationEntity } from "./observations/observation.entity";
import { PatientsModule } from "./patients/patients.module";
import { PatientEntity } from "./patients/patient.entity";
import { UsersModule } from "./users/users.module";
import { UserEntity } from "./users/user.entity";

function parseJwtExpiresIn(rawValue: string | undefined): number {
  const value = rawValue?.trim() || "8h";
  const numeric = Number(value);

  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 8 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier =
    unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 60 * 60 : 60 * 60 * 24;

  return amount * multiplier;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePaths()
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") ?? "dev-secret",
        signOptions: {
          expiresIn: parseJwtExpiresIn(configService.get<string>("JWT_EXPIRES_IN"))
        }
      })
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>("DATABASE_URL");
        if (!databaseUrl) {
          throw new Error("DATABASE_URL is required.");
        }

        return {
          type: "postgres" as const,
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: true,
          ssl: databaseUrl?.includes("render.com")
            ? { rejectUnauthorized: false }
            : false,
          entities: [UserEntity, ApiKeyEntity, PatientEntity, ObservationEntity]
        };
      }
    }),
    UsersModule,
    ApiKeysModule,
    PatientsModule,
    ObservationsModule,
    AuthModule,
    AdminModule,
    HealthModule
  ],
  providers: [
    BootstrapService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard
    },
    {
      provide: APP_GUARD,
      useClass: HybridAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
