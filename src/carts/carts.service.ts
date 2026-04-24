import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CartItem } from 'src/generated/prisma/client';

@Injectable()
export class CartsService {
  constructor(private prismaService: PrismaService) {}

  // ─── HELPER: Lấy hoặc tạo cart cho user ─────────────────

  private async getOrCreateCart(userId: string) {
    const upsertUserCart = await this.prismaService.cart.upsert({
      where: {
        userId,
      },
      create: {
        userId,
      },
      update: {
        updatedAt: new Date(),
      },
    });

    return upsertUserCart;
  }

  // ─── XEM GIỎ HÀNG ────────────────────────────────────────

  async getCart(userId: string) {
    const upsertCart = await this.getOrCreateCart(userId);

    const cart = await this.prismaService.cart.findUnique({
      where: {
        id: upsertCart.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return cart;
    // TODO: Bước 3 — Tính cartTotal từ items
    // cartTotal = sum(item.quantity * item.product.price)
    // Trả về: { ...cart, cartTotal }
  }

  // ─── ADD PRODUCT TO CART ──────────────────────────────

  async addItem(userId: string, dto: AddItemDto) {
    // TODO: Bước 1 — Kiểm tra product tồn tại và còn hàng
    // throw NotFoundException nếu không có product
    const product = await this.prismaService.product.findUnique({
      where: {
        id: dto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    // throw BadRequestException nếu stock < dto.quantity

    if (product.stock < dto.quantity) {
      throw new BadRequestException('Product stock is not enough');
    }
    // TODO: Bước 2 — getOrCreateCart(userId)
    const upsertCart = await this.getOrCreateCart(userId);

    // TODO: Bước 3 — Kiểm tra item đã có trong cart chưa?
    const existItem = await this.prismaService.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: upsertCart.id, productId: product.id },
      },
    });
    const currentQuantity = existItem ? existItem.quantity : 0;
    const totalDesiredQuantity = currentQuantity + dto.quantity;

    if (totalDesiredQuantity > product.stock) {
      throw new BadRequestException(`Only ${product.stock} in store`);
    }

    await this.prismaService.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: upsertCart.id,
          productId: product.id,
        },
      },
      update: {
        quantity: totalDesiredQuantity,
      },
      create: {
        cartId: upsertCart.id,
        productId: product.id,
        quantity: dto.quantity,
      },
    });

    return await this.getCart(userId);
  }

  // ─── CẬP NHẬT SỐ LƯỢNG ───────────────────────────────────

  async updateItem(userId: string, productId: string, dto: UpdateItemDto) {
    const upserCart = await this.getOrCreateCart(userId);

    const existItem = await this.prismaService.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: upserCart.id,
          productId: productId,
        },
      },
      include: {
        product: true,
      },
    });

    if (!existItem) {
      throw new NotFoundException('Cart item not found');
    }

    // If quantity equal 0 remove cart item
    if (dto.quantity === 0) {
      return await this.prismaService.cartItem.delete({
        where: {
          id: existItem.id,
        },
      });
    }

    const remainStock = existItem.product.stock;
    if (dto.quantity > remainStock) {
      throw new BadRequestException(
        'Remain stock is not enough to adding more product',
      );
    }

    await this.prismaService.cartItem.update({
      where: {
        id: existItem.id,
      },
      data: {
        quantity: dto.quantity,
      },
    });

    return await this.getCart(userId);
  }

  // ─── XÓA 1 SẢN PHẨM KHỎI GIỎ ────────────────────────────

  async removeItem(userId: string, productId: string) {
    const upserCart = await this.getOrCreateCart(userId);

    const existItem = await this.prismaService.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: upserCart.id,
          productId: productId,
        },
      },
      include: {
        product: true,
      },
    });

    if (!existItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prismaService.cartItem.delete({
      where: {
        id: existItem.id,
      },
    });
    return {
      message: 'Cart item remove success',
    };
  }

  // ─── XÓA TOÀN BỘ GIỎ HÀNG ───────────────────────────────

  async clearCart(userId: string) {
    const upserCart = await this.getOrCreateCart(userId);

    const existItems = await this.prismaService.cartItem.findMany({
      where: {
        cartId: upserCart.id,
      },
    });

    if (existItems.length === 0) {
      throw new BadRequestException('User cart is empty');
    }

    await this.prismaService.cartItem.deleteMany({
      where: {
        cartId: upserCart.id,
      },
    });

    return {
      message: 'Clear all item inside user cart',
    };
  }

  // ─── CHECKOUT: Chuyển cart thành order ───────────────────

  async checkout(userId: string) {
    // Đây là method kết nối Cart với Order
    // TODO: Bước 1 — getCart(userId), kiểm tra cart không rỗng
    // TODO: Bước 2 — Validate lại stock của từng item
    // (giá và stock có thể thay đổi từ lúc add vào cart)
    // TODO: Bước 3 — Gọi OrdersService.create() với items từ cart
    // Lưu ý: cần inject OrdersService vào CartService
    // Hoặc: copy logic tạo order vào đây (tránh circular dependency)
    // Câu hỏi: circular dependency xảy ra khi nào?
    // → Khi A inject B và B inject A — NestJS sẽ báo lỗi
    // TODO: Bước 4 — clearCart(userId) sau khi tạo order thành công
    // Dùng transaction để đảm bảo: hoặc cả 2 thành công hoặc rollback
  }
}
