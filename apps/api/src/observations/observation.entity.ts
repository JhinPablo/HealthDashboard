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

  @Column({ name: "patient_id" })
  patientId!: number;

  @ManyToOne(() => PatientEntity, (patient) => patient.observations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;

  @Column()
  code!: string;

  @Column("float")
  value!: number;

  @Column()
  unit!: string;

  @Column({ name: "effective_datetime", type: "timestamptz" })
  effectiveDateTime!: Date;

  @Column()
  status!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

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
