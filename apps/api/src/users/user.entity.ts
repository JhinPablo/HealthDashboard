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

  @Column()
  fullName!: string;

  @Column()
  passwordHash!: string;

  @Column({
    type: "enum",
    enum: Role
  })
  role!: Role;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: "int", nullable: true })
  patientId!: number | null;

  @OneToOne(() => PatientEntity, (patient) => patient.user, { nullable: true })
  @JoinColumn({ name: "patientId" })
  patient!: PatientEntity | null;

  @OneToMany(() => ApiKeyEntity, (apiKey) => apiKey.ownerUser)
  apiKeys!: ApiKeyEntity[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
