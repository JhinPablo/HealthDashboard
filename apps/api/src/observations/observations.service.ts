import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { AuthActor } from "../common/types/auth-actor.interface";
import { Role } from "../common/types/role.enum";
import { detectClinicalOutlier } from "../common/utils/clinical-outlier.util";
import { createFhirBundle } from "../common/utils/fhir-bundle.util";
import {
  CreateObservationDto,
  ObservationQueryDto,
  ObservationResourceDto,
  UpdateObservationDto
} from "./dto/observation-resource.dto";
import { ObservationEntity } from "./observation.entity";

@Injectable()
export class ObservationsService {
  constructor(
    @InjectRepository(ObservationEntity)
    private readonly observationsRepository: Repository<ObservationEntity>
  ) {}

  async create(dto: CreateObservationDto): Promise<ObservationResourceDto> {
    const patientId = this.extractPatientId(dto.subject.reference);
    const observation = this.observationsRepository.create({
      patientId,
      code: dto.code.text,
      value: dto.valueQuantity.value,
      unit: dto.valueQuantity.unit,
      effectiveDateTime: new Date(dto.effectiveDateTime),
      status: dto.status,
      notes: dto.note ?? null
    });

    const saved = await this.observationsRepository.save(observation);
    return this.toFhirResource(saved);
  }

  async findAll(
    actor: AuthActor,
    pagination: PaginationQueryDto,
    filters: ObservationQueryDto
  ) {
    const patientId = this.resolvePatientScope(actor, filters.patientId);

    const [observations, total] = await this.observationsRepository.findAndCount({
      where: patientId ? { patientId } : undefined,
      order: { effectiveDateTime: "DESC" },
      take: pagination.limit,
      skip: pagination.offset
    });

    return createFhirBundle(
      observations.map((observation) => this.toFhirResource(observation)),
      total,
      pagination.limit,
      pagination.offset
    );
  }

  async findOne(id: number, actor: AuthActor): Promise<ObservationResourceDto> {
    const observation = await this.observationsRepository.findOne({ where: { id } });
    if (!observation) {
      throw new NotFoundException("Observation not found.");
    }

    if (actor.role === Role.Patient && actor.patientId !== observation.patientId) {
      throw new ForbiddenException("Patients can only access their own observations.");
    }

    return this.toFhirResource(observation);
  }

  async update(id: number, dto: UpdateObservationDto): Promise<ObservationResourceDto> {
    const observation = await this.observationsRepository.findOne({ where: { id } });
    if (!observation) {
      throw new NotFoundException("Observation not found.");
    }

    if (dto.status) {
      observation.status = dto.status;
    }

    if (dto.code) {
      observation.code = dto.code.text;
    }

    if (dto.effectiveDateTime) {
      observation.effectiveDateTime = new Date(dto.effectiveDateTime);
    }

    if (dto.valueQuantity) {
      observation.value = dto.valueQuantity.value;
      observation.unit = dto.valueQuantity.unit;
    }

    if (typeof dto.note === "string") {
      observation.notes = dto.note;
    }

    const updated = await this.observationsRepository.save(observation);
    return this.toFhirResource(updated);
  }

  async remove(id: number): Promise<{ deleted: true }> {
    const observation = await this.observationsRepository.findOne({ where: { id } });
    if (!observation) {
      throw new NotFoundException("Observation not found.");
    }

    await this.observationsRepository.remove(observation);
    return { deleted: true };
  }

  async countObservations(): Promise<number> {
    return this.observationsRepository.count();
  }

  async findLatestOutliers(limit = 5): Promise<ObservationResourceDto[]> {
    const observations = await this.observationsRepository.find({
      order: { effectiveDateTime: "DESC" },
      take: 100
    });

    return observations
      .filter((observation) => detectClinicalOutlier(observation.code, observation.value))
      .slice(0, limit)
      .map((observation) => this.toFhirResource(observation));
  }

  async findRecentObservationsForPatient(
    patientId: number,
    limit = 20
  ): Promise<ObservationResourceDto[]> {
    const observations = await this.observationsRepository.find({
      where: { patientId },
      order: { effectiveDateTime: "DESC" },
      take: limit
    });

    return observations.map((observation) => this.toFhirResource(observation));
  }

  async countOutliers(): Promise<number> {
    const observations = await this.observationsRepository.find();
    return observations.filter((observation) =>
      detectClinicalOutlier(observation.code, observation.value)
    ).length;
  }

  private toFhirResource(observation: ObservationEntity): ObservationResourceDto {
    const outlier = detectClinicalOutlier(observation.code, observation.value);

    return {
      resourceType: "Observation",
      id: String(observation.id),
      status: observation.status,
      code: {
        text: observation.code
      },
      subject: {
        reference: `Patient/${observation.patientId}`
      },
      effectiveDateTime: observation.effectiveDateTime.toISOString(),
      valueQuantity: {
        value: observation.value,
        unit: observation.unit
      },
      interpretation: outlier ? [{ text: "critical-outlier" }] : undefined,
      note: observation.notes ? [{ text: observation.notes }] : undefined
    };
  }

  private extractPatientId(reference: string): number {
    const [resourceType, rawId] = reference.split("/");
    if (resourceType !== "Patient" || !rawId) {
      throw new NotFoundException("Observation subject must reference a Patient resource.");
    }

    const patientId = Number(rawId);
    if (Number.isNaN(patientId)) {
      throw new NotFoundException("Observation subject must include a numeric patient id.");
    }

    return patientId;
  }

  private resolvePatientScope(actor: AuthActor, requestedPatientId?: number): number | undefined {
    if (actor.role !== Role.Patient) {
      return requestedPatientId;
    }

    if (!actor.patientId) {
      throw new ForbiddenException("Patient account is not linked to a patient record.");
    }

    if (requestedPatientId && requestedPatientId !== actor.patientId) {
      throw new ForbiddenException("Patients can only access their own observations.");
    }

    return actor.patientId;
  }
}
