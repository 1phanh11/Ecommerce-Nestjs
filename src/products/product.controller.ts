import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDTO } from './dto/create.dto';
import { Roles } from 'src/auth/guards/roles.guard';
import { UpdateProductDTO } from './dto/update.dto';
import { Public } from  "../auth/decorators/user.decorator";
import { ProductFilterDTO } from './dto/get-all-products.dto';

@Controller('products')
export class ProductController {
    constructor(
        private productService: ProductsService
    ){}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles('ADMIN')
    async createProduct(@Body() dto: CreateProductDTO) {
        return await this.productService.create(dto);
    }

    @Put(':id')
    @HttpCode(200)
    @Roles('ADMIN')
    async updateProduct(@Param('id') productId: string, @Body() dto: UpdateProductDTO){
        return await this.productService.update(productId,dto);
    }

    @Delete(':id')
    @HttpCode(200)
    @Roles('ADMIN')
    async deleteProduct(@Param('id') productId: string){
        await this.productService.delete(productId) 
        return {
            message: "Product deleted successfully"
        }
    }

    @Get(':id')
    @Public()
    @HttpCode(200)
    async getProductById(@Param('id') productId: string){
        return await this.productService.getSingleProduct(productId);
    }

    @Get()
    @Public()
    async getAllProductWithFilter(@Query() dto: ProductFilterDTO){
        return await this.productService.getAllProduct(dto);
    }
}
