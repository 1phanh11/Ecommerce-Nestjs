import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class OrderItemDTO {
  @IsString({ message: 'Product id is not valid' })
  productId: string;

  @IsInt({ message: 'Product quantity must be integer' })
  @IsPositive({ message: 'Product quantity must more than 0' })
  quantity: number;
}

export class CreateOrderDTO {
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must have 1 product' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDTO)
  items: OrderItemDTO[];
}
