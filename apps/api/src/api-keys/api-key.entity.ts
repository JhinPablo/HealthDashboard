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
    type: "varchar"
  })
  role!: Role;

  @Column({ name: "access_key_hash" })
  accessKeyHash!: string;

  @Column({ name: "permission_key_hash" })
  permissionKeyHash!: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ name: "owner_user_id", type: "uuid", nullable: true })
  ownerUserId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.apiKeys, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "owner_user_id" })
  ownerUser!: UserEntity | null;

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
