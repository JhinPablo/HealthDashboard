import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PasswordService } from "../common/services/password.service";
import { UserEntity } from "./user.entity";
import { UsersService } from "./users.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UsersService, PasswordService],
  exports: [UsersService, TypeOrmModule, PasswordService]
})
export class UsersModule {}
