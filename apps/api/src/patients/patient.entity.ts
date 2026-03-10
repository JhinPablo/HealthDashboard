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

  @Column()
  givenName!: string;

  @Column()
  familyName!: string;

  @Column()
  gender!: string;

  @Column({ type: "date" })
  birthDate!: string;

  @Column({ type: "text" })
  identificationDocEncrypted!: string;

  @Column({ type: "text" })
  medicalSummaryEncrypted!: string;

  @OneToMany(() => ObservationEntity, (observation) => observation.patient)
  observations!: ObservationEntity[];

  @OneToOne(() => UserEntity, (user) => user.patient)
  user!: UserEntity | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
