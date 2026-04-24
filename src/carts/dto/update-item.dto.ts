import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateItemDto {
  // TODO: quantity bắt buộc
  // Min(0) vì quantity = 0 nghĩa là xóa item khỏi cart
  // Cân nhắc: có nên handle logic "quantity = 0 → delete" ở đây
  // hay ở service?
  @IsInt()
  @Type(() => Number)
  quantity: number;
}
