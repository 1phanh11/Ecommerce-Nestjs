import { Module } from '@nestjs/common';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';

@Module({
  providers: [CartsService],
  controllers: [CartsController],
})
export class CartsModule {}
