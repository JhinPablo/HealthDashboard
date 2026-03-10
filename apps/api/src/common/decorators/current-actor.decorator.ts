import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthActor } from "../types/auth-actor.interface";

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthActor | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.actor;
  }
);
