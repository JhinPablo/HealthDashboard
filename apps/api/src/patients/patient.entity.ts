import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { ObservationEntity } from "../observations/observation.entity";
import { UserEntity } from "../users/user.entity";

@Entity("patients")
export class PatientEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "given_name" })
  givenName!: string;

  @Column({ name: "family_name" })
  familyName!: string;

  @Column()
  gender!: string;

  @Column({ name: "birth_date", type: "date" })
  birthDate!: string;

  @Column({ name: "identification_doc_encrypted", type: "text" })
  identificationDocEncrypted!: string;

  @Column({ name: "medical_summary_encrypted", type: "text" })
  medicalSummaryEncrypted!: string;

  @OneToMany(() => ObservationEntity, (observation) => observation.patient)
  observations!: ObservationEntity[];

  @OneToOne(() => UserEntity, (user) => user.patient)
  user!: UserEntity | null;

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
