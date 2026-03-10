import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateApiKeyDto {
  @ApiProperty({ example: "swagger-doctor-admin" })
  @IsString()
  label!: string;

  @ApiProperty({ example: "doctor_admin" })
  @IsString()
  @IsIn(["doctor_admin", "patient"])
  role!: "doctor_admin" | "patient";

  @ApiProperty({ example: "public-access-key" })
  @IsString()
  accessKey!: string;

  @ApiProperty({ example: "doctor-permission-key" })
  @IsString()
  permissionKey!: string;

  @ApiPropertyOptional({ example: "uuid-user-id" })
  @IsOptional()
  @IsString()
  ownerUserId?: string;
}
