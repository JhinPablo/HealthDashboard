import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PasswordService } from "../common/services/password.service";
import { Role } from "../common/types/role.enum";
import { UserEntity } from "./user.entity";

interface EnsureDoctorAdminInput {
  email: string;
  password: string;
}

interface CreatePatientUserInput {
  email: string;
  fullName: string;
  password: string;
  patientId: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly passwordService: PasswordService
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id }, relations: { patient: true } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: { patient: true }
    });
  }

  async findByPatientId(patientId: number): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { patientId }, relations: { patient: true } });
  }

  async validateCredentials(email: string, password: string): Promise<UserEntity> {
    const user = await this.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const isValid = this.passwordService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    return user;
  }

  async ensureDoctorAdmin({ email, password }: EnsureDoctorAdminInput): Promise<UserEntity> {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      if (existing.role !== Role.DoctorAdmin) {
        existing.role = Role.DoctorAdmin;
        existing.isActive = true;
        existing.passwordHash = this.passwordService.hashPassword(password);
        existing.fullName = "Doctor Admin";
        return this.usersRepository.save(existing);
      }
      return existing;
    }

    const doctor = this.usersRepository.create({
      email: normalizedEmail,
      fullName: "Doctor Admin",
      passwordHash: this.passwordService.hashPassword(password),
      role: Role.DoctorAdmin,
      isActive: true,
      patientId: null
    });

    return this.usersRepository.save(doctor);
  }

  async createPatientUser(input: CreatePatientUserInput): Promise<UserEntity> {
    const email = input.email.toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException("A user with that email already exists.");
    }

    const duplicatedPatientAccount = await this.findByPatientId(input.patientId);
    if (duplicatedPatientAccount) {
      throw new ConflictException("This patient already has a linked portal user.");
    }

    const user = this.usersRepository.create({
      email,
      fullName: input.fullName,
      passwordHash: this.passwordService.hashPassword(input.password),
      role: Role.Patient,
      isActive: true,
      patientId: input.patientId
    });

    return this.usersRepository.save(user);
  }

  async listUsers(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      relations: { patient: true },
      order: { createdAt: "DESC" }
    });
  }

  async setUserStatus(id: string, isActive: boolean): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException("User not found.");
    }

    user.isActive = isActive;
    return this.usersRepository.save(user);
  }
}
