import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { GetUser } from 'src/auth/decorators/user.decorator';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('carts')
export class CartsController {
  constructor(private cartsService: CartsService) {}

  @Get()
  async getCart(@GetUser('id') userId: string) {
    return await this.cartsService.getCart(userId);
  }

  @Post()
  async addItem(@GetUser('id') userId: string, @Body() dto: AddItemDto) {
    return await this.cartsService.addItem(userId, dto);
  }

  @Put('items/:productId')
  async updateItem(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return await this.cartsService.updateItem(userId, productId, dto);
  }

  @Delete('items/:productId')
  async removeItem(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return await this.cartsService.removeItem(userId, productId);
  }

  // DELETE /api/cart
  @Delete()
  async clearCart(@GetUser('id') userId: string) {
    return await this.cartsService.clearCart(userId);
  }
}
