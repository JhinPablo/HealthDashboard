import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CryptoService } from "../common/services/crypto.service";
import { AuthActor } from "../common/types/auth-actor.interface";
import { Role } from "../common/types/role.enum";
import { createFhirBundle } from "../common/utils/fhir-bundle.util";
import { CreatePatientDto, PatientResourceDto, UpdatePatientDto } from "./dto/patient-resource.dto";
import { PatientEntity } from "./patient.entity";

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientEntity)
    private readonly patientsRepository: Repository<PatientEntity>,
    private readonly cryptoService: CryptoService
  ) {}

  async create(dto: CreatePatientDto): Promise<PatientResourceDto> {
    const identifier = dto.identifier[0];
    const name = dto.name[0];

    const patient = this.patientsRepository.create({
      givenName: name.given[0],
      familyName: name.family,
      gender: dto.gender,
      birthDate: dto.birthDate,
      identificationDocEncrypted: this.cryptoService.encrypt(identifier.value),
      medicalSummaryEncrypted: this.cryptoService.encrypt(dto.medicalSummary ?? "")
    });

    const saved = await this.patientsRepository.save(patient);
    return this.toFhirResource(saved);
  }

  async findAll(actor: AuthActor, limit: number, offset: number) {
    if (actor.role === Role.Patient && !actor.patientId) {
      throw new ForbiddenException("Patient account is not linked to a patient record.");
    }

    const where =
      actor.role === Role.Patient && actor.patientId
        ? { id: actor.patientId }
        : undefined;

    const [patients, total] = await this.patientsRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset
    });

    return createFhirBundle(
      patients.map((patient) => this.toFhirResource(patient)),
      total,
      limit,
      offset
    );
  }

  async findOne(id: number, actor: AuthActor): Promise<PatientResourceDto> {
    if (actor.role === Role.Patient && actor.patientId !== id) {
      throw new ForbiddenException("Patients can only access their own record.");
    }

    const patient = await this.patientsRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException("Patient not found.");
    }

    return this.toFhirResource(patient);
  }

  async update(id: number, dto: UpdatePatientDto): Promise<PatientResourceDto> {
    const patient = await this.patientsRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException("Patient not found.");
    }

    if (dto.identifier?.length) {
      patient.identificationDocEncrypted = this.cryptoService.encrypt(dto.identifier[0].value);
    }

    if (dto.name?.length) {
      patient.givenName = dto.name[0].given[0];
      patient.familyName = dto.name[0].family;
    }

    if (dto.gender) {
      patient.gender = dto.gender;
    }

    if (dto.birthDate) {
      patient.birthDate = dto.birthDate;
    }

    if (typeof dto.medicalSummary === "string") {
      patient.medicalSummaryEncrypted = this.cryptoService.encrypt(dto.medicalSummary);
    }

    const updated = await this.patientsRepository.save(patient);
    return this.toFhirResource(updated);
  }

  async remove(id: number): Promise<{ deleted: true }> {
    const patient = await this.patientsRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException("Patient not found.");
    }

    await this.patientsRepository.remove(patient);
    return { deleted: true };
  }

  async findEntityById(id: number): Promise<PatientEntity | null> {
    return this.patientsRepository.findOne({ where: { id } });
  }

  async countPatients(): Promise<number> {
    return this.patientsRepository.count();
  }

  async findRecentPatients(limit = 5): Promise<PatientResourceDto[]> {
    const patients = await this.patientsRepository.find({
      order: { createdAt: "DESC" },
      take: limit
    });

    return patients.map((patient) => this.toFhirResource(patient));
  }

  private toFhirResource(patient: PatientEntity): PatientResourceDto {
    return {
      resourceType: "Patient",
      id: String(patient.id),
      active: true,
      identifier: [
        {
          system: "national-id",
          value: this.cryptoService.decrypt(patient.identificationDocEncrypted)
        }
      ],
      name: [
        {
          given: [patient.givenName],
          family: patient.familyName
        }
      ],
      gender: patient.gender,
      birthDate: patient.birthDate,
      medicalSummary: this.cryptoService.decrypt(patient.medicalSummaryEncrypted),
      meta: {
        lastUpdated: patient.updatedAt.toISOString()
      }
    };
  }
}
