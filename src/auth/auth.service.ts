import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDTO } from './dto/register.dto';
import bcrypt from 'bcryptjs'
import { LoginDTO, LogoutDTO } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService
    ) { }

    private generateTokens(userId: string, role: string) {
        const accessToken = this.jwtService.sign({
            userId, role
        }, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: this.config.get('JWT_EXPIRES_IN') || '1H'
        })

        const refreshToken = this.jwtService.sign({
            userId, role
        }, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN')
        })

        return { accessToken, refreshToken }
    }

    async register(registerDto: RegisterDTO) {

        const existEmail = await this.prisma.user.findUnique({
            where: {
                email: registerDto.email
            }
        })

        if (existEmail) {
            throw new ConflictException('Email has been used')
        }

        const hashPassword = await bcrypt.hash(registerDto.password, 10)

        const user = await this.prisma.user.create({
            data: {
                name: registerDto.name,
                email: registerDto.email,
                password: hashPassword
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                role: true
            }
        })

        const tokens = this.generateTokens(user.id, user.role)

        await this.prisma.user.update({
            where: {
                email: user.email
            },
            data: {
                refreshToken: tokens.refreshToken
            }
        })

        return { user, ...tokens }
    }

    async login(loginDto: LoginDTO) {
        const existUser = await this.prisma.user.findUnique({
            where: {
                email: loginDto.email
            }
        })

        if (!existUser) {
            throw new BadRequestException(`Authentication Error: Email or Password invalid`)
        }

        if (!existUser.isActive) {
            throw new UnauthorizedException('Account has been deactivated')
        }

        const hashCompare = bcrypt.compare(loginDto.password, existUser.password)

        if (!hashCompare) {
            throw new BadRequestException(`Authentication Error: Email or Password invalid`)
        }

        const generateTokens = this.generateTokens(existUser.id, existUser.role);

        await this.prisma.user.update({
            where: {
                email: existUser.email
            },
            data: {
                refreshToken: generateTokens.refreshToken
            }
        })

        const { password, refreshToken, ...safeUser } = existUser
        return { user: safeUser, accessToken: generateTokens.accessToken }
    }

    async logout(logoutDto: LogoutDTO) {
        const existUser = await this.prisma.user.findUnique({
            where: {
                id: logoutDto.userId
            }
        })

        if (!existUser) {
            throw new BadRequestException(`User not found`)
        }

        await this.prisma.user.update({
            where: {
                id: logoutDto.userId
            }, data: {
                refreshToken: null
            }
        })
    }
}
