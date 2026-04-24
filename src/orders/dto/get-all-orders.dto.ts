import { IsEnum, IsOptional, IsPositive } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums';
import { Type } from 'class-transformer';

export class GetAllOrderDTO {
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsEnum(OrderStatus, {
    message: `Order status must be one of ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus;
}
