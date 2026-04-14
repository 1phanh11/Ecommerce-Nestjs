import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { FilterUserDTO } from './dto/get-all-users.dto';


const mockUser = {
  id: 'user-1',
  email: 'user@email.com',
  password: 'password',
  role: 'USER',
  name: 'alex',
  isActive: true,
  deactivatedAt: null,
  createdAt: new Date()
}

const mockAdmin = {
  id: 'admin-1',
  role: 'ADMIN'
}

describe('UsersService', () => {
  let userService: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn()
            }
          }
        },

      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);


  });

  afterEach(() => jest.clearAllMocks())

  describe('profile', () => {
    it('Should throw not found exception', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(userService.getProfile('user-1')).rejects.toThrow(NotFoundException)
    })

    it('Return User', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(userService.getProfile('user-1')).resolves.toBeDefined()
    })
  })

  describe('update profile', () => {
    it('Should throw not found exception', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(userService.updateProfile('user-1', { name: 'abc' })).rejects.toThrow(NotFoundException)
    })

    it('Update success', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({} as any)
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      await expect(userService.updateProfile('user-1', { name: 'alex' })).resolves.toBeDefined()
    })
  })

  describe(('Update password'), () => {
    it('Should throw not found exception', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(userService.updatePassword('user-1', { currentPassword: 'abc', newPassword: 'aaa' })).rejects.toThrow(NotFoundException)
    })

    it('Should throw unauthorize exception', async () => {
      // mockUser.password = await bcrypt.hash(mockUser.password, 10)
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any)
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => {
        return false
      })

      await expect(userService.updatePassword('user-1',
        { currentPassword: "wrongpassword", newPassword: "newPass" })).rejects.toThrow(UnauthorizedException)
    })

    it('Should hash password before save', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any)
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => {
        return true
      })
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => 'Hash_password')
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({
        ...mockUser,
        password: 'Hash_password'
      } as any)

      await userService.updatePassword('user-1',
        { currentPassword: "password", newPassword: "newPass" })

      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            password: 'Hash_password'
          }
        })
      )
    })

  })

  describe('Get all user', () => {
    it('Return Users with right pagination', async () => {
      const mockUsers = [mockUser]
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(mockUser as any)
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(1)

      const result = await userService.findAll({
        page: 1,
        limit: 10,
      } as FilterUserDTO)

      expect(result.pagination).toEqual({
        totals: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    })

    it('findMany and count parallely (Promise.all)', async () => {
      const findManySpy = jest
        .spyOn(prismaService.user, 'findMany')
        .mockResolvedValue([])
      const countSpy = jest
        .spyOn(prismaService.user, 'count')
        .mockResolvedValue(0)

      await userService.findAll({ page: 1, limit: 10 } as FilterUserDTO)

      // Cả 2 phải được gọi
      expect(findManySpy).toHaveBeenCalledTimes(1)
      expect(countSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Admin update user role', () => {
    it('Should throw not found exception if user not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(userService.adminUpdate('user-1', { role: 'USER' }, 'admin-1')).rejects.toThrow(NotFoundException)
    })

    it ('Should throw forbiden exception if admin try to update self role', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdmin as any);

      await expect(userService.adminUpdate('admin-1', {role: 'USER'}, 'admin-1')).rejects.toThrow(ForbiddenException)
    })
  })

});
