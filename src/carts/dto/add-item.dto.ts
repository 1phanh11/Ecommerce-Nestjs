import { IsInt, IsPositive, IsString, Min } from 'class-validator';

export class AddItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @IsPositive()
  @Min(1, { message: 'Product quantity at least 1' })
  quantity: number;
}
