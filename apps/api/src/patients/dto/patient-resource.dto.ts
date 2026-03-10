import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";

export class IdentifierDto {
  @ApiPropertyOptional({ example: "national-id" })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiProperty({ example: "12345678-9" })
  @IsString()
  value!: string;
}

export class HumanNameDto {
  @ApiProperty({ example: ["Ana"] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  given!: string[];

  @ApiProperty({ example: "Perez" })
  @IsString()
  family!: string;
}

export class CreatePatientDto {
  @ApiProperty({ example: "Patient" })
  @IsString()
  @IsIn(["Patient"])
  resourceType!: "Patient";

  @ApiProperty({ type: [IdentifierDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => IdentifierDto)
  identifier!: IdentifierDto[];

  @ApiProperty({ type: [HumanNameDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HumanNameDto)
  name!: HumanNameDto[];

  @ApiProperty({ example: "female" })
  @IsString()
  @IsIn(["male", "female", "other", "unknown"])
  gender!: string;

  @ApiProperty({ example: "1990-04-12" })
  @IsDateString()
  birthDate!: string;

  @ApiPropertyOptional({ example: "Patient with chronic hypertension." })
  @IsOptional()
  @IsString()
  medicalSummary?: string;
}

export class UpdatePatientDto {
  @ApiPropertyOptional({ type: [IdentifierDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => IdentifierDto)
  identifier?: IdentifierDto[];

  @ApiPropertyOptional({ type: [HumanNameDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HumanNameDto)
  name?: HumanNameDto[];

  @ApiPropertyOptional({ example: "male" })
  @IsOptional()
  @IsString()
  @IsIn(["male", "female", "other", "unknown"])
  gender?: string;

  @ApiPropertyOptional({ example: "1990-04-12" })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: "Updated clinical summary." })
  @IsOptional()
  @IsString()
  medicalSummary?: string;
}

export class PatientResourceDto {
  @ApiProperty({ example: "Patient" })
  resourceType!: "Patient";

  @ApiProperty({ example: "1" })
  id!: string;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ type: [IdentifierDto] })
  identifier!: IdentifierDto[];

  @ApiProperty({ type: [HumanNameDto] })
  name!: HumanNameDto[];

  @ApiProperty({ example: "female" })
  gender!: string;

  @ApiProperty({ example: "1990-04-12" })
  birthDate!: string;

  @ApiPropertyOptional({ example: "Patient with chronic hypertension." })
  medicalSummary?: string;

  @ApiProperty({
    example: {
      lastUpdated: "2026-03-10T00:00:00.000Z"
    }
  })
  meta!: {
    lastUpdated: string;
  };
}
