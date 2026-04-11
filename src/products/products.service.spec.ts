// src/products/products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { ProductsService } from './products.service'
import { PrismaService } from '../prisma/prisma.service'
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { UpdateProductDTO } from './dto/update.dto'
import { ProductFilterDTO } from './dto/get-all-products.dto'


const mockProduct = {
  id: 'prod-1',
  name: 'Áo Thun Nam',
  slug: 'ao-thun-nam',
  price: 199000,
  stock: 10,
  categoryId: 'cat-1',
  description: null,
  images: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockCategory = {
  id: 'cat-1',
  name: 'Áo',
  slug: 'ao',
}

describe('ProductsService', () => {
  let service: ProductsService
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            category: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<ProductsService>(ProductsService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── CREATE ──────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      name: 'Áo Thun Nam',
      price: 199000,
      stock: 10,
      categoryId: 'cat-1',
      description: ''
    }

    it('throws ConflictException if slug exist', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct)

      await expect(service.create(dto)).rejects.toThrow(ConflictException)
      // Confirm: không gọi create khi đã conflict
      expect(prisma.product.create).not.toHaveBeenCalled()
    })

    it('throws NotFoundException if category not exist', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null)
      jest.spyOn(prisma.category, 'findUnique').mockResolvedValue(null)

      await expect(service.create(dto)).rejects.toThrow(NotFoundException)
    })

    it('Create product success with slug', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null)
      jest.spyOn(prisma.category, 'findUnique').mockResolvedValue(mockCategory as any)
      jest.spyOn(prisma.product, 'create').mockResolvedValue(mockProduct)

      const result = await service.create(dto)

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'ao-thun-nam', // Kết quả từ mock slugify
          }),
        })
      )
      expect(result).toEqual(mockProduct)
    })
  })

  // ─── UPDATE ──────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException if product not exist', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null)

      await expect(service.update('bad-id', {name: "New Name"} as UpdateProductDTO))
        .rejects.toThrow(NotFoundException)
    })

    it('Keep slug if update not provide product name', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct)
      jest.spyOn(prisma.product, 'update').mockResolvedValue(mockProduct)

      await service.update('prod-1', { price: 299000 } as UpdateProductDTO) // Chỉ update giá

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'ao-thun-nam', // Giữ slug cũ
            price: 299000
          }),
        })
      )
    })

    it('create new slug if provide name', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct)
      jest.spyOn(prisma.product, 'update').mockResolvedValue({
        ...mockProduct,
        name: 'Áo Polo Siêu Flex',
      })

      await service.update('prod-1', { name: 'Áo Polo Siêu Flex' } as UpdateProductDTO)

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'ao-polo-sieu-flex',
          }),
        })
      )
    })
  })

  // ─── DELETE ──────────────────────────────────────────────

  describe('delete', () => {
    it('throws NotFoundException if product not exist', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null)

      await expect(service.delete('bad-id')).rejects.toThrow(NotFoundException)
      expect(prisma.product.delete).not.toHaveBeenCalled()
    })

    it('Remove product with match id', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct)
      jest.spyOn(prisma.product, 'delete').mockResolvedValue(mockProduct)

      await service.delete('prod-1')

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      })
    })
  })

  // ─── GET ALL ─────────────────────────────────────────────

  describe('getAllProduct', () => {
    it('Return products with right pagination', async () => {
      const mockProducts = [mockProduct]
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue(mockProducts)
      jest.spyOn(prisma.product, 'count').mockResolvedValue(1)

      const result = await service.getAllProduct({
        page: 1,
        limit: 10,
      } as ProductFilterDTO)

      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    })

    it('findMany and count parallely (Promise.all)', async () => {
      const findManySpy = jest
        .spyOn(prisma.product, 'findMany')
        .mockResolvedValue([])
      const countSpy = jest
        .spyOn(prisma.product, 'count')
        .mockResolvedValue(0)

      await service.getAllProduct({ page: 1, limit: 10 } as ProductFilterDTO)

      // Cả 2 phải được gọi
      expect(findManySpy).toHaveBeenCalledTimes(1)
      expect(countSpy).toHaveBeenCalledTimes(1)
    })
  })
})