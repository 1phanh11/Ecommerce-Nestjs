import {
  IsString,
  IsNumber,
  IsPositive,
  IsInt,
  IsOptional,
  IsUUID,
} from 'class-validator';

// name: string, price: number, stock: number, categoryId: string, description?: string
export class UpdateProductDTO {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber({}, { message: 'Field price must be number' })
  @IsPositive({ message: 'Price must be positive value' })
  price: number;

  @IsOptional()
  @IsInt({ message: 'Stock must be integer number' })
  @IsPositive({ message: 'Stock must be positive value' })
  stock: number;

  @IsOptional()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  description: string;
}
