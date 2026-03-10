import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreatePatientUserDto {
  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  patientId!: number;

  @ApiProperty({ example: "paciente1@saluddigital.local" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Paciente Uno" })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: "PortalPaciente123!" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: "patient-portal-key" })
  @IsOptional()
  @IsString()
  apiKeyLabel?: string;

  @ApiPropertyOptional({ example: "patient-access-key" })
  @IsOptional()
  @IsString()
  accessKey?: string;

  @ApiPropertyOptional({ example: "patient-permission-key" })
  @IsOptional()
  @IsString()
  permissionKey?: string;
}
