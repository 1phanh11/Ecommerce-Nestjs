import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class FilterUserDTO {
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  page = 1;

  @IsOptional()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  limit = 10;
}
