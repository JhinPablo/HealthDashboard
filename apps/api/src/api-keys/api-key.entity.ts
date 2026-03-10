import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Role } from "../common/types/role.enum";
import { UserEntity } from "../users/user.entity";

@Entity("api_keys")
export class ApiKeyEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  label!: string;

  @Column({
    type: "enum",
    enum: Role
  })
  role!: Role;

  @Column()
  accessKeyHash!: string;

  @Column()
  permissionKeyHash!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: "uuid", nullable: true })
  ownerUserId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.apiKeys, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "ownerUserId" })
  ownerUser!: UserEntity | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
