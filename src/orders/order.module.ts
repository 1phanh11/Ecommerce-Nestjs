import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';

@Module({
    providers: [OrderService],
    controllers: [OrderController],
})

export class OrderModule {}
