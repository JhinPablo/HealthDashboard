import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiKeysService } from "../api-keys/api-keys.service";
import { UsersService } from "../users/users.service";

function splitCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

@Injectable()
export class BootstrapService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly apiKeysService: ApiKeysService
  ) {}

  async onModuleInit(): Promise<void> {
    const doctorEmail =
      this.configService.get<string>("DEFAULT_DOCTOR_EMAIL") ??
      "doctor.admin@saluddigital.local";
    const doctorPassword =
      this.configService.get<string>("DEFAULT_DOCTOR_PASSWORD") ?? "ChangeMe123!";

    await this.usersService.ensureDoctorAdmin({
      email: doctorEmail,
      password: doctorPassword
    });

    const accessKeys = splitCsv(this.configService.get<string>("ACCESS_KEYS"));
    const doctorPermissionKeys = [
      this.configService.get<string>("ADMIN_PERMISSION_KEY"),
      this.configService.get<string>("MEDICO_PERMISSION_KEY")
    ].filter((value): value is string => Boolean(value));
    const patientPermissionKeys = [
      this.configService.get<string>("PACIENTE_PERMISSION_KEY")
    ].filter((value): value is string => Boolean(value));

    if (accessKeys.length && (doctorPermissionKeys.length || patientPermissionKeys.length)) {
      await this.apiKeysService.ensureLegacyKeys(
        accessKeys,
        doctorPermissionKeys,
        patientPermissionKeys
      );
    }
  }
}
