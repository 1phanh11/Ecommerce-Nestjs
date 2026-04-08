import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {

  let prismaService: PrismaService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn()
            }
          }
        }, {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token')
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret')
          }
        }

      ]
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('register', () => {
    it('Should throw ConflictError if user email exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: '1',
        email: "anh.nguyen@test.com"
      } as any)

      await expect(authService.register({
        name: 'anh nguyen',
        email: 'anh.nguyen@test.com',
        password: 'temp'
      })).rejects.toThrow(ConflictException)
    })

    it('Should hash password before saving', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null)
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: '2',
        name: 'caxlord',
        email: 'test2@test.com',
        createdAt: new Date(),
        role: 'USER',
      } as any)

      await authService.register({
        name: 'caxlord',
        email: 'test2@test.com',
        password: 'OKconde'
      })

      const firstCreateCall = jest.mocked(prismaService.user.create).mock.calls[0][0];
      const passwordHash = firstCreateCall.data.password;

      expect(passwordHash).not.toBe('OKconde')
      expect(await bcrypt.compare('OKconde',passwordHash)).toBe(true)
    })
  })

  describe('login', () => {
    it('Should throw Unauthorized error when account not found', async() => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null)


      await expect(authService.login({
        email: 'someAccount@test.com',
        password: 'temp-password'
      })).rejects.toThrow(BadRequestException)
    })
  })
});
