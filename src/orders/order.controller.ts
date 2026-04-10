import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { GetUser, Public } from 'src/auth/decorators/user.decorator';
import { OrderService } from './order.service';
import { CreateOrderDTO } from './dto/create.dto';
import { GetAllOrderDTO } from './dto/get-all-orders.dto';
import { Roles } from "../auth/guards/roles.guard";
import { OrderStatusDTO } from './dto/update-status-order.dto';

@Controller('order')
export class OrderController {
    constructor(
        private orderService: OrderService
    ) { }

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async createOrder(@GetUser('id') userId: string, @Body() orderDto: CreateOrderDTO) {
        return await this.orderService.create(userId, orderDto);
    }

    @Get('my')
    @HttpCode(200)
    async getUserOrder(@GetUser('id') userId: string) {
        return await this.orderService.getMyOrders(userId);
    }

    @Get('all')
    @Roles('ADMIN')
    async getAllOrder(@GetUser('role') userRole: string, @Query() dto: GetAllOrderDTO) {
        return await this.orderService.getAllOrder(dto);
    }

    @Get(':id')
    async getOneOrder(@Param('id') id: string, @GetUser('id') userId: string, @GetUser('role') role: string) {
        return await this.orderService.getOneOrder(id, userId, role);
    }


    @Patch('status/:id')
    @Roles('ADMIN')
    async updateStatus(@Param('id') orderId: string, @Body() dto: OrderStatusDTO) {
        return await this.orderService.updateStatus(orderId, dto);
    }

    @Delete('cancel/:id')
    async cancelStatus(@Param('id') orderId: string, @GetUser('id') userId: string) {
        await this.orderService.cancelOrder(orderId, userId)
    }

}
