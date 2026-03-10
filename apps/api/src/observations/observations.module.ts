import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ObservationEntity } from "./observation.entity";
import { ObservationsController } from "./observations.controller";
import { ObservationsService } from "./observations.service";

@Module({
  imports: [TypeOrmModule.forFeature([ObservationEntity])],
  controllers: [ObservationsController],
  providers: [ObservationsService],
  exports: [ObservationsService, TypeOrmModule]
})
export class ObservationsModule {}
