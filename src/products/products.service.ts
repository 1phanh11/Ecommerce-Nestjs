import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDTO } from './dto/create.dto';
import slugify from 'slugify';
import { UpdateProductDTO } from './dto/update.dto';
import { NotFoundError } from 'rxjs';
import { ProductFilterDTO } from './dto/get-all-products.dto';
import { Product } from 'src/generated';

@Injectable()
export class ProductsService {
    constructor(
        private prismaService: PrismaService
    ) { }

    async create(dto: CreateProductDTO) {
        const slug = slugify(dto.name, { lower: true, locale: 'vi' })

        const existSlug = await this.prismaService.product.findUnique({
            where: {
                slug
            }
        })

        if (existSlug) {
            throw new ConflictException('This product name is used by other product')
        }

        const category = await this.prismaService.category.findUnique({
            where: {
                id: dto.categoryId
            }
        })

        if(!category){
            throw new NotFoundException('Category not found');
        }

        return await this.prismaService.product.create({
            data: {
                ...dto,
                slug
            }
        })
    }

    async update(productId: string, dto: UpdateProductDTO) {
        const product = await this.prismaService.product.findUnique({
            where: {
                id: productId,
            }
        })

        if (!product) {
            throw new NotFoundException('Product not found')
        }

        let slug: string = product.slug;
        let categoryId: string = product.categoryId

        if (dto.name) {
            slug = slugify(dto.name, { lower: true, locale: 'vi' });
        }

        if(dto.categoryId){
            const category = await this.prismaService.category.findUnique({
                where: {id: dto.categoryId}
            })
            if(!category){
                throw new NotFoundException('Category not found')
            }
            categoryId = dto.categoryId
        }

        return await this.prismaService.product.update({
            where: { id: productId },
            data: {
                ...dto,
                slug,
                categoryId
            }
        })
    }

    async delete(productId: string) {
        const product = await this.prismaService.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            throw new NotFoundException("Product not found");
        }

        return await this.prismaService.product.delete({
            where: { id: product.id }
        })
    }

    async getSingleProduct(productId: string) {
        const product = await this.prismaService.product.findUnique({
            where: {
                id: productId
            }
        })
        if (!product) {
            throw new NotFoundException("Product");
        }
        return product;
    }

    async getAllProduct(dto: ProductFilterDTO) {
        const { categoryId, minPrice, maxPrice, search, page, limit } = dto;

        const skip = (page - 1) * limit;

        // Build dynamic where clause based on filters
        const where: any = {};

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive'
            }
        }

        if (minPrice || maxPrice) {
            where.price = {}
            if (minPrice) {
                where.price.gte = minPrice;
            }
            if (maxPrice) {
                where.price.lte = maxPrice;
            }
        }


        const [products, total] = await Promise.all([this.prismaService.product.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        this.prismaService.product.count({ where })
        ])

        return {
            products, pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }


}
