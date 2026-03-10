import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiSecurity,
  ApiTags
} from "@nestjs/swagger";
import { ApiKeysService } from "../api-keys/api-keys.service";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../common/types/role.enum";
import { ObservationsService } from "../observations/observations.service";
import { PatientsService } from "../patients/patients.service";
import { UsersService } from "../users/users.service";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { CreatePatientUserDto } from "./dto/create-patient-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";

@ApiTags("admin")
@ApiBearerAuth()
@ApiSecurity("access-key")
@ApiSecurity("permission-key")
@Roles(Role.DoctorAdmin)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly patientsService: PatientsService,
    private readonly observationsService: ObservationsService,
    private readonly apiKeysService: ApiKeysService
  ) {}

  @Get("dashboard")
  @ApiOkResponse({
    schema: {
      example: {
        totals: {
          patients: 20,
          observations: 140,
          outliers: 3,
          activeUsers: 21
        },
        recentPatients: [],
        outlierObservations: []
      }
    }
  })
  async getDashboard() {
    const [patients, observations, outliers, users, recentPatients, outlierObservations] =
      await Promise.all([
        this.patientsService.countPatients(),
        this.observationsService.countObservations(),
        this.observationsService.countOutliers(),
        this.usersService.listUsers(),
        this.patientsService.findRecentPatients(),
        this.observationsService.findLatestOutliers()
      ]);

    return {
      totals: {
        patients,
        observations,
        outliers,
        activeUsers: users.filter((user) => user.isActive).length
      },
      recentPatients,
      outlierObservations
    };
  }

  @Get("users")
  async listUsers() {
    const users = await this.usersService.listUsers();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      patientId: user.patientId,
      createdAt: user.createdAt
    }));
  }

  @Post("users/patient")
  async createPatientUser(@Body() dto: CreatePatientUserDto) {
    const patient = await this.patientsService.findEntityById(dto.patientId);
    if (!patient) {
      throw new BadRequestException("Patient does not exist.");
    }

    const user = await this.usersService.createPatientUser({
      patientId: dto.patientId,
      email: dto.email,
      fullName: dto.fullName,
      password: dto.password
    });

    let apiKey = null;
    if (dto.apiKeyLabel || dto.accessKey || dto.permissionKey) {
      if (!dto.apiKeyLabel || !dto.accessKey || !dto.permissionKey) {
        throw new BadRequestException(
          "apiKeyLabel, accessKey and permissionKey are required together."
        );
      }

      apiKey = await this.apiKeysService.createApiKey({
        label: dto.apiKeyLabel,
        role: Role.Patient,
        accessKey: dto.accessKey,
        permissionKey: dto.permissionKey,
        ownerUserId: user.id
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        patientId: user.patientId
      },
      apiKey: apiKey
        ? {
            id: apiKey.id,
            label: apiKey.label,
            role: apiKey.role
          }
        : null
    };
  }

  @Patch("users/:id/status")
  updateUserStatus(@Param("id") id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.setUserStatus(id, dto.isActive);
  }

  @Get("api-keys")
  async listApiKeys() {
    const apiKeys = await this.apiKeysService.listApiKeys();
    return apiKeys.map((apiKey) => ({
      id: apiKey.id,
      label: apiKey.label,
      role: apiKey.role,
      ownerUserId: apiKey.ownerUserId,
      ownerEmail: apiKey.ownerUser?.email ?? null,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt
    }));
  }

  @Post("api-keys")
  createApiKey(@Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.createApiKey({
      ...dto,
      role: dto.role === "doctor_admin" ? Role.DoctorAdmin : Role.Patient
    });
  }

  @Patch("api-keys/:id/deactivate")
  deactivateApiKey(@Param("id") id: string) {
    return this.apiKeysService.deactivateApiKey(id);
  }
}
