import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ProductFilterDTO {
  @IsOptional()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  minPrice: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  maxPrice: number;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit: number = 10;
}
