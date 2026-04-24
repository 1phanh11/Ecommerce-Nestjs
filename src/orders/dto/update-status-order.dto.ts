import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums';

export class OrderStatusDTO {
  @IsEnum(OrderStatus, {
    message: `Order status must be one of ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus;
}
