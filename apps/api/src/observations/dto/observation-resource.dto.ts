import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

export class ObservationCodeDto {
  @ApiProperty({ example: "body-temperature" })
  @IsString()
  text!: string;
}

export class ObservationSubjectDto {
  @ApiProperty({ example: "Patient/1" })
  @IsString()
  reference!: string;
}

export class ObservationValueQuantityDto {
  @ApiProperty({ example: 37.2 })
  @Type(() => Number)
  @IsNumber()
  value!: number;

  @ApiProperty({ example: "C" })
  @IsString()
  unit!: string;
}

export class CreateObservationDto {
  @ApiProperty({ example: "Observation" })
  @IsString()
  @IsIn(["Observation"])
  resourceType!: "Observation";

  @ApiProperty({ example: "final" })
  @IsString()
  status!: string;

  @ApiProperty({ type: ObservationCodeDto })
  @ValidateNested()
  @Type(() => ObservationCodeDto)
  code!: ObservationCodeDto;

  @ApiProperty({ type: ObservationSubjectDto })
  @ValidateNested()
  @Type(() => ObservationSubjectDto)
  subject!: ObservationSubjectDto;

  @ApiProperty({ example: "2026-03-10T12:00:00.000Z" })
  @IsDateString()
  effectiveDateTime!: string;

  @ApiProperty({ type: ObservationValueQuantityDto })
  @ValidateNested()
  @Type(() => ObservationValueQuantityDto)
  valueQuantity!: ObservationValueQuantityDto;

  @ApiPropertyOptional({ example: "Routine daily control." })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateObservationDto {
  @ApiPropertyOptional({ example: "amended" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: ObservationCodeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ObservationCodeDto)
  code?: ObservationCodeDto;

  @ApiPropertyOptional({ example: "2026-03-10T12:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  effectiveDateTime?: string;

  @ApiPropertyOptional({ type: ObservationValueQuantityDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ObservationValueQuantityDto)
  valueQuantity?: ObservationValueQuantityDto;

  @ApiPropertyOptional({ example: "Repeat measurement." })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ObservationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  patientId?: number;
}

export class ObservationResourceDto {
  @ApiProperty({ example: "Observation" })
  resourceType!: "Observation";

  @ApiProperty({ example: "10" })
  id!: string;

  @ApiProperty({ example: "final" })
  status!: string;

  @ApiProperty({ type: ObservationCodeDto })
  code!: ObservationCodeDto;

  @ApiProperty({ type: ObservationSubjectDto })
  subject!: ObservationSubjectDto;

  @ApiProperty({ example: "2026-03-10T12:00:00.000Z" })
  effectiveDateTime!: string;

  @ApiProperty({ type: ObservationValueQuantityDto })
  valueQuantity!: ObservationValueQuantityDto;

  @ApiPropertyOptional({
    example: [{ text: "critical-outlier" }]
  })
  interpretation?: Array<{ text: string }>;

  @ApiPropertyOptional({ example: [{ text: "Routine daily control." }] })
  note?: Array<{ text: string }>;
}
