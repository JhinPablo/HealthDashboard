import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
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
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly apiKeysService: ApiKeysService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSchema();

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

  private async ensureSchema(): Promise<void> {
    await this.dataSource.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");

    await this.dataSource.query(`
      ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    await this.dataSource.query(`
      ALTER TABLE observations
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    await this.dataSource.query(`
      ALTER TABLE observations
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    await this.dataSource.query(`
      ALTER TABLE observations
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        patient_id INTEGER NULL REFERENCES patients(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT users_role_check CHECK (role IN ('doctor_admin', 'patient'))
      );
    `);

    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_users_patient_id ON users(patient_id);
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) NOT NULL,
        access_key_hash VARCHAR(255) NOT NULL,
        permission_key_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        owner_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT api_keys_role_check CHECK (role IN ('doctor_admin', 'patient'))
      );
    `);

    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_owner_user_id ON api_keys(owner_user_id);
    `);
  }
}
