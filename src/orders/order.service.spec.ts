import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDTO } from './dto/create.dto';
import { OrderService } from './order.service';

const mockProduct = {
  id: 'prod-temp',
  name: 'Áo Thun',
  price: 199000,
  stock: 10,
  images: [],
};

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  status: 'PENDING',
  total: 398000,
  items: [{ productId: 'prod-temp', quantity: 2, price: 199000 }],
  createdAt: new Date(),
};

describe('OrderService', () => {
  let orderService: OrderService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            order: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            product: {
              update: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        OrderService,
      ],
    }).compile();

    orderService = module.get(OrderService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    return jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateOrderDTO = {
      items: [
        {
          productId: 'prod-temp',
          quantity: 2,
        },
      ],
    };
    it('Should throw not found exception when product not found', async () => {
      jest.spyOn(prismaService.product, 'findMany').mockResolvedValue([]);

      await expect(orderService.create('user-id1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Should throw bad request exception when product stock is not enough', async () => {
      jest.spyOn(prismaService.product, 'findMany').mockResolvedValue([
        {
          ...mockProduct,
          stock: 1,
        },
      ] as any);

      await expect(orderService.create('user-id1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Create order success and commit transaction', async () => {
      jest
        .spyOn(prismaService.product, 'findMany')
        .mockResolvedValue([mockProduct as any]);

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prismaService);
        });

      jest
        .spyOn(prismaService.order, 'create')
        .mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({} as any);

      const result = await orderService.create('user-1', dto);

      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            total: 398000,
          }),
        }),
      );
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getOneOrder', () => {
    it('Should throw not found order detail', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(
        orderService.getOneOrder('temp-id', 'temp-id', 'USER'),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should throw no permission to watch order', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue({
        ...mockOrder,
        user: {
          id: 'user-1',
        },
      } as any);

      await expect(
        orderService.getOneOrder('order-1', 'user-2', 'USER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Admin can access any user order', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue({
        ...mockOrder,
        user: {
          id: 'user-temp',
        },
      } as any);

      await expect(
        orderService.getOneOrder('order-1', 'user-admin', 'ADMIN'),
      ).resolves.toBeDefined();
    });
  });

  describe('cancelOrder', () => {
    it('Should throw order not found exception', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(
        orderService.cancelOrder('temp-id', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('Can not cancel a CANCELLED order status', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
      } as any);

      await expect(
        orderService.cancelOrder('order-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('User can only cancel a PENDING status', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue({
        ...mockOrder,
        status: 'DELIVERED',
      } as any);

      await expect(
        orderService.cancelOrder('order-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Cancel order success and transaction refund stock', async () => {
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder as any);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation((callback) => {
          return callback(prismaService);
        });

      jest.spyOn(prismaService.order, 'update').mockResolvedValue({} as any);
      const spyService = jest
        .spyOn(prismaService.product, 'update')
        .mockResolvedValue({} as any);

      await orderService.cancelOrder('order-1', 'user-1');

      expect(spyService).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            stock: {
              increment: 2,
            },
          },
        }),
      );
    });
  });
});
