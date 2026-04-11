

// { name: string, price: number, stock: number, categoryId: string, description ?: string }

import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateProductDTO {
    @IsString()
    name: string

    @IsNumber({}, { message: "Field price must be number" })
    @IsPositive({ message: "Price must be positive value" })
    price: number;

    @IsInt({ message: "Stock must be integer number" })
    @IsPositive({ message: "Stock must be positive value" })
    stock: number

    @IsString()
    @IsNotEmpty()
    categoryId: string

    @IsOptional()
    @IsString()
    description: string

}