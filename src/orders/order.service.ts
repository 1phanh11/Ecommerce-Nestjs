import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';
import { CreateOrderDTO } from './dto/create.dto';
import { PrismaClient } from '@prisma/client/extension';
import { OrderStatus } from 'src/generated/prisma/enums';
import { OrderStatusDTO } from './dto/update-status-order.dto';
import { GetAllOrderDTO } from './dto/get-all-orders.dto';

@Injectable()
export class OrderService {

    constructor(
        private prismaService: PrismaService,
    ) { }

    async create(userId: string, orderInfo: CreateOrderDTO) {
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
            const product = products.find((p) => p.id === item.productId)!;

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

        const order = await this.prismaService.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId: userId,
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


    async getMyOrders(userId: string) {
        const orders = this.prismaService.order.findMany({
            where: {
                userId
            },
            select: {
                id: true,
                status: true,
                total: true,
                items: {
                    select: {
                        price: true,
                        quantity: true,
                        product: {
                            select: {
                                id: true,
                                images: true,
                                name: true
                            }
                        }
                    },
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return orders
    }


    // Only owner order and admin can view this detail order
    async getOneOrder(orderId: string, userId: string, userRole: string) {

        
        const order = await this.prismaService.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: true,
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        })

        if (!order) {
            throw new NotFoundException(`Order detail not found`);
        }

        
        if (order.user.id !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('Not authorize to watch this order')
        }

        return order;
    }

    // Only admin can use this feature
    async getAllOrder(dto: GetAllOrderDTO) {
        const { page, limit, status } = dto

        let skip = (page - 1) * limit;
        let where = status ? { status } : {}

        const [orders, total] = await Promise.all([this.prismaService.order.findMany({
            where,
            select: {
                id: true,
                total: true,
                status: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    }
                },
                _count: {
                    select: {
                        items: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        this.prismaService.order.count({ where })
        ])

        return {
            orders, pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }


    // Admin only
    async updateStatus(orderId: string, updateDto: OrderStatusDTO) {
        const currentOrder = await this.prismaService.order.findUnique({
            where: {
                id: orderId
            }
        })

        if (!currentOrder) throw new NotFoundException('Order not found')

        if (currentOrder.status === 'CANCELLED') {
            throw new BadRequestException('Cannot update status of cancelled order')
        }

        return await this.prismaService.order.update({
            where: {
                id: currentOrder.id
            },
            data: {
                status: updateDto.status
            }
        })
    }

    async cancelOrder(orderId: string, userId: string) {
        const currentOrder = await this.prismaService.order.findUnique({
            where: {
                id: orderId,
                userId: userId
            },
            include: {
                items: true
            }
        })

        if (!currentOrder) throw new NotFoundException('Order not found')

        if (currentOrder.status === 'CANCELLED') {
            throw new BadRequestException('Cannot update status of cancelled order')
        }

        if (currentOrder.status !== 'PENDING') {
            throw new BadRequestException('Only cancel order with Pending status');
        }

        await this.prismaService.$transaction(async (tx) => {
            await tx.order.update({
                where: {
                    id: orderId
                },
                data: {
                    status: 'CANCELLED',
                }
            })

            // Update stock of product
            await Promise.all(
                currentOrder.items.map((item) => {
                    return tx.product.update({
                        where: {
                            id: item.productId
                        },
                        data: {
                            stock: {
                                increment: item.quantity
                            }
                        }
                    })
                })
            )
        })
        return { message: 'Cancel order success' }
    }

}
