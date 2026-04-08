import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';
import { CreateOrderDTO } from './dto/create.dto';
import { PrismaClient } from '@prisma/client/extension';

@Injectable()
export class OrderService {

    constructor(
        private prismaService: PrismaService,
    ){}

    async create(orderInfo: CreateOrderDTO) {
        const productIdList = orderInfo.items.map(product => product.productId);

        const products = await this.prismaService.product.findMany(
            {
                where: {
                    id: {
                        in: productIdList
                    }
                }
            }
        )

        if (products.length !== productIdList.length) {
            throw new NotFoundException("One or more products not found");
        }

        let total = 0;

        const orderItems = orderInfo.items.map(item => {
            const product = products.find((p: any) => p.id === item.productId)!;

            if (product.stock < item.quantity) {
                throw new BadRequestException(`Product ${product.name} only has ${product.stock} items in stock`);
            }

            total += product.price * item.quantity;

            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            }
        })

        const order = this.prismaService.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId: orderInfo.userId,
                    total,
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            await Promise.all(orderItems.map(item => {
                return tx.product.update({
                    where: {
                        id: item.productId
                    },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                })
            }))

            return newOrder
        })

        return order;

    }

}
