import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiKeyEntity } from "./api-key.entity";
import { ApiKeysService } from "./api-keys.service";

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyEntity])],
  providers: [ApiKeysService],
  exports: [ApiKeysService, TypeOrmModule]
})
export class ApiKeysModule {}
