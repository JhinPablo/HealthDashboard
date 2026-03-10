import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash } from "crypto";
import { Repository } from "typeorm";
import { AuthActor } from "../common/types/auth-actor.interface";
import { Role } from "../common/types/role.enum";
import { ApiKeyEntity } from "./api-key.entity";

interface CreateApiKeyInput {
  label: string;
  role: Role;
  accessKey: string;
  permissionKey: string;
  ownerUserId?: string;
}

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeysRepository: Repository<ApiKeyEntity>
  ) {}

  async validatePair(accessKey: string, permissionKey: string): Promise<AuthActor> {
    const accessKeyHash = this.hashKey(accessKey);
    const permissionKeyHash = this.hashKey(permissionKey);

    const apiKey = await this.apiKeysRepository.findOne({
      where: {
        accessKeyHash,
        permissionKeyHash,
        isActive: true
      },
      relations: {
        ownerUser: true
      }
    });

    if (!apiKey) {
      throw new UnauthorizedException("Invalid API keys.");
    }

    return {
      authType: "api_key",
      role: apiKey.role,
      userId: apiKey.ownerUserId ?? undefined,
      patientId: apiKey.ownerUser?.patientId ?? null,
      email: apiKey.ownerUser?.email,
      label: apiKey.label
    };
  }

  async createApiKey(input: CreateApiKeyInput): Promise<ApiKeyEntity> {
    const existing = await this.apiKeysRepository.findOne({
      where: { label: input.label }
    });
    if (existing) {
      throw new ConflictException("An API key with that label already exists.");
    }

    const apiKey = this.apiKeysRepository.create({
      label: input.label,
      role: input.role,
      accessKeyHash: this.hashKey(input.accessKey),
      permissionKeyHash: this.hashKey(input.permissionKey),
      ownerUserId: input.ownerUserId ?? null,
      isActive: true
    });

    return this.apiKeysRepository.save(apiKey);
  }

  async listApiKeys(): Promise<ApiKeyEntity[]> {
    return this.apiKeysRepository.find({
      relations: { ownerUser: true },
      order: { createdAt: "DESC" }
    });
  }

  async deactivateApiKey(id: string): Promise<ApiKeyEntity> {
    const apiKey = await this.apiKeysRepository.findOne({ where: { id } });
    if (!apiKey) {
      throw new NotFoundException("API key not found.");
    }

    apiKey.isActive = false;
    return this.apiKeysRepository.save(apiKey);
  }

  async ensureLegacyKeys(accessKeys: string[], doctorPermissionKeys: string[], patientPermissionKeys: string[]): Promise<void> {
    for (const [index, accessKey] of accessKeys.entries()) {
      const doctorPermissionKey = doctorPermissionKeys[index] ?? doctorPermissionKeys[0];
      if (doctorPermissionKey) {
        await this.ensureApiKeyRecord({
          label: `legacy-doctor-${index + 1}`,
          role: Role.DoctorAdmin,
          accessKey,
          permissionKey: doctorPermissionKey
        });
      }

      const patientPermissionKey = patientPermissionKeys[index] ?? patientPermissionKeys[0];
      if (patientPermissionKey) {
        await this.ensureApiKeyRecord({
          label: `legacy-patient-${index + 1}`,
          role: Role.Patient,
          accessKey,
          permissionKey: patientPermissionKey
        });
      }
    }
  }

  private async ensureApiKeyRecord(input: CreateApiKeyInput): Promise<void> {
    const existing = await this.apiKeysRepository.findOne({ where: { label: input.label } });
    if (existing) {
      return;
    }

    await this.createApiKey(input);
  }

  private hashKey(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }
}
