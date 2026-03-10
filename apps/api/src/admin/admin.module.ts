import { Module } from "@nestjs/common";
import { ApiKeysModule } from "../api-keys/api-keys.module";
import { ObservationsModule } from "../observations/observations.module";
import { PatientsModule } from "../patients/patients.module";
import { UsersModule } from "../users/users.module";
import { AdminController } from "./admin.controller";

@Module({
  imports: [UsersModule, PatientsModule, ObservationsModule, ApiKeysModule],
  controllers: [AdminController]
})
export class AdminModule {}
