import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("health")
@Controller()
export class HealthController {
  @Get()
  @Public()
  @ApiOkResponse({
    schema: {
      example: {
        service: "HealthDashboard API",
        status: "ok",
        docs: "/docs",
        health: "/health"
      }
    }
  })
  getRoot() {
    return {
      service: "HealthDashboard API",
      status: "ok",
      docs: "/docs",
      health: "/health"
    };
  }

  @Public()
  @ApiOkResponse({
    schema: {
      example: {
        status: "ok"
      }
    }
  })
  @Get("health")
  getHealth() {
    return { status: "ok" };
  }
}
