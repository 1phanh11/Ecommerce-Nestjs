import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from 'src/generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding database....");
    
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    console.log(typeof adminPassword, adminPassword);

    const admin = await prisma.user.create({
        data:{
            name: "Admin",
            role: "ADMIN",
            email: "admin@shop.com",
            password: adminPassword
        }
    })

    const user = await prisma.user.create({
        data: {
            name: "Anh Nguyen",
            role: "USER",
            email: "anh.nguyen@shop.com",
            password: userPassword
        }
    })

    // Tạo Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Áo', slug: 'ao' }
    }),
    prisma.category.create({
      data: { name: 'Quần', slug: 'quan' }
    }),
    prisma.category.create({
      data: { name: 'Giày', slug: 'giay' }
    })
  ])

  // Tạo Products
  await Promise.all([
    prisma.product.create({
      data: {
        name: 'Áo Thun Nam Basic',
        slug: 'ao-thun-nam-basic',
        description: 'Áo thun cotton 100%',
        price: 199000,
        stock: 100,
        categoryId: categories[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Quần Jean Slim',
        slug: 'quan-jean-slim',
        price: 450000,
        stock: 50,
        categoryId: categories[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Giày Sneaker Trắng',
        slug: 'giay-sneaker-trang',
        price: 850000,
        stock: 30,
        categoryId: categories[2].id
      }
    })
  ])
}

main().catch(console.error).finally(() => prisma.$disconnect());