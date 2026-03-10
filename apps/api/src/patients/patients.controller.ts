import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags
} from "@nestjs/swagger";
import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { AuthActor } from "../common/types/auth-actor.interface";
import { Role } from "../common/types/role.enum";
import { CreatePatientDto, PatientResourceDto, UpdatePatientDto } from "./dto/patient-resource.dto";
import { PatientsService } from "./patients.service";

@ApiTags("fhir-patient")
@ApiBearerAuth()
@ApiSecurity("access-key")
@ApiSecurity("permission-key")
@Controller("fhir/Patient")
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(Role.DoctorAdmin)
  @ApiOperation({ summary: "Create a FHIR-lite patient resource." })
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    schema: {
      example: {
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
        limit: 10,
        offset: 0,
        entry: []
      }
    }
  })
  findAll(
    @CurrentActor() actor: AuthActor,
    @Query() pagination: PaginationQueryDto
  ) {
    return this.patientsService.findAll(actor, pagination.limit, pagination.offset);
  }

  @Get(":id")
  @ApiOkResponse({ type: PatientResourceDto })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentActor() actor: AuthActor
  ) {
    return this.patientsService.findOne(id, actor);
  }

  @Patch(":id")
  @Roles(Role.DoctorAdmin)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePatientDto
  ) {
    return this.patientsService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.DoctorAdmin)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.patientsService.remove(id);
  }
}
