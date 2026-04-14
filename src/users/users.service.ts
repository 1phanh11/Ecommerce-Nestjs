import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdatePasswordDto, UpdateProfileDto } from './dto/update-profile.dto'
import { AdminUpdateUserDto } from './dto/admin-update-user.dto'
import bcrypt from 'bcryptjs'
import { FilterUserDTO } from './dto/get-all-users.dto'





@Injectable()
export class UsersService {
    constructor(private prismaService: PrismaService) {

    }

    // ─── USER profile ───────────────────────

    async getProfile(userId: string) {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    // ─── USER TỰ UPDATE PROFILE ──────────────────────────────

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return await this.prismaService.user.update({
            where: {
                id: user.id
            },
            data: {
                name: dto.name
            }, select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        })
    }

    async updatePassword(userId: string, dto: UpdatePasswordDto) {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                password: true
            }
        })

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const checkPass = await bcrypt.compare(dto.currentPassword, user.password)
        
        if (!checkPass) {
            throw new UnauthorizedException('Current password not correct')
        }


        const newPasswordHash = await bcrypt.hash(dto.newPassword, 10)
        const userUpdate = await this.prismaService.user.update({
            where: {
                id: user.id
            },
            data: {
                password: newPasswordHash
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            }
        })

        return userUpdate;
    }

    // ─── ADMIN: LIST USERS ─────────────────────────────

    async findAll(dto: FilterUserDTO) {

        const { page, limit } = dto

        const skip = (page - 1) * limit;

        const where: any = {
        };


        const [users, totals] = await Promise.all([
            this.prismaService.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true,
                    isActive: true,
                    deactivatedAt: true
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prismaService.user.count()
        ])

        return {
            users, pagination: {
                totals,
                page,
                limit,
                totalPages: Math.ceil(totals / limit)
            }
        }
    }

    // ─── ADMIN: XEM 1 USER ───────────────────────────────────

    async findOne(userId: string) {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;

    }

    // ─── ADMIN: UPDATE ROLE CỦA USER ─────────────────────────

    async adminUpdate(userId: string, dto: AdminUpdateUserDto, adminId: string) {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role === 'ADMIN' && adminId === userId) {
            throw new ForbiddenException();
        }

        return await this.prismaService.user.update({
            where: {
                id: userId
            }, data: {
                role: dto.role
            }, select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        })


    }

    // ─── ADMIN: XÓA USER ─────────────────────────────────────

    // Deactive user by admin
    async deactivate(targetUserId: string, requestingAdminId: string) {
        if (targetUserId === requestingAdminId) {
            throw new BadRequestException('Admin cannot deactivate their own account')
        }

        const user = await this.prismaService.user.findUnique({
            where: { id: targetUserId }
        })
        if (!user) throw new NotFoundException('User not found')

        if (!user.isActive) {
            throw new BadRequestException('User is already deactivated')
        }

        return await this.prismaService.user.update({
            where: { id: targetUserId },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                deactivatedAt: true
            }
        })
    }

    // Reactive user by admin
    async activate(targetUserId: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id: targetUserId }
        })
        if (!user) throw new NotFoundException('User not found')

        if (user.isActive) {
            throw new BadRequestException('User is already active')
        }

        return await this.prismaService.user.update({
            where: { id: targetUserId },
            data: {
                isActive: true,
                deactivatedAt: null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                deactivatedAt: true
            }
        })
    }
}