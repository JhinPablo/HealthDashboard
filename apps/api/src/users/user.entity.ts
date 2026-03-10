import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Role } from "../common/types/role.enum";
import { PatientEntity } from "../patients/patient.entity";
import { ApiKeyEntity } from "../api-keys/api-key.entity";

@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: "full_name" })
  fullName!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;

  @Column({
    type: "enum",
    enum: Role
  })
  role!: Role;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ name: "patient_id", type: "int", nullable: true })
  patientId!: number | null;

  @OneToOne(() => PatientEntity, (patient) => patient.user, { nullable: true })
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity | null;

  @OneToMany(() => ApiKeyEntity, (apiKey) => apiKey.ownerUser)
  apiKeys!: ApiKeyEntity[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP"
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP"
  })
  updatedAt!: Date;
}
