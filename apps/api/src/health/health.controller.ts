import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @Public()
  @ApiOkResponse({
    schema: {
      example: {
        status: "ok"
      }
    }
  })
  getHealth() {
    return { status: "ok" };
  }
}
