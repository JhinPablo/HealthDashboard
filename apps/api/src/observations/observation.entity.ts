import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { PatientEntity } from "../patients/patient.entity";

@Entity("observations")
export class ObservationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  patientId!: number;

  @ManyToOne(() => PatientEntity, (patient) => patient.observations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "patientId" })
  patient!: PatientEntity;

  @Column()
  code!: string;

  @Column("float")
  value!: number;

  @Column()
  unit!: string;

  @Column({ type: "timestamptz" })
  effectiveDateTime!: Date;

  @Column()
  status!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
