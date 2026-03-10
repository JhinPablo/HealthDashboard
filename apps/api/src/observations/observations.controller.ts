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
  ApiSecurity,
  ApiTags
} from "@nestjs/swagger";
import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthActor } from "../common/types/auth-actor.interface";
import { Role } from "../common/types/role.enum";
import {
  CreateObservationDto,
  ObservationQueryDto,
  ObservationResourceDto,
  UpdateObservationDto
} from "./dto/observation-resource.dto";
import { ObservationsService } from "./observations.service";

@ApiTags("fhir-observation")
@ApiBearerAuth()
@ApiSecurity("access-key")
@ApiSecurity("permission-key")
@Controller("fhir/Observation")
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  @Roles(Role.DoctorAdmin)
  create(@Body() dto: CreateObservationDto) {
    return this.observationsService.create(dto);
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
    @Query() query: ObservationQueryDto
  ) {
    return this.observationsService.findAll(actor, query);
  }

  @Get(":id")
  @ApiOkResponse({ type: ObservationResourceDto })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentActor() actor: AuthActor
  ) {
    return this.observationsService.findOne(id, actor);
  }

  @Patch(":id")
  @Roles(Role.DoctorAdmin)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateObservationDto
  ) {
    return this.observationsService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.DoctorAdmin)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.observationsService.remove(id);
  }
}
