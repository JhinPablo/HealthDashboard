import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CryptoService } from "../common/services/crypto.service";
import { PatientEntity } from "./patient.entity";
import { PatientsController } from "./patients.controller";
import { PatientsService } from "./patients.service";

@Module({
  imports: [TypeOrmModule.forFeature([PatientEntity])],
  controllers: [PatientsController],
  providers: [PatientsService, CryptoService],
  exports: [PatientsService, TypeOrmModule]
})
export class PatientsModule {}
