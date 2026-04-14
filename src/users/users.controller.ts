import {
    Controller, Get, Put, Delete,
    Body, Param, Query,
    UseGuards, ParseIntPipe, DefaultValuePipe,
    Patch
} from '@nestjs/common'
import { UsersService } from './users.service'
import { UpdatePasswordDto, UpdateProfileDto } from './dto/update-profile.dto'
import { AdminUpdateUserDto } from './dto/admin-update-user.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'
import { GetUser } from '../auth/decorators/user.decorator'
import { FilterUserDTO } from './dto/get-all-users.dto'

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    // ─── USER ROUTES ──────────────────────────────────────────

    // GET /api/users/me
    @Get('me')
    async getProfile(@GetUser('id') userId: string) {
        return await this.usersService.getProfile(userId)
    }

    // PUT /api/users/me
    @Put('me')
    async updateProfile(
        @GetUser('id') userId: string,
        @Body() dto: UpdateProfileDto,
    ) {
        return await this.usersService.updateProfile(userId, dto)
    }

    @Patch('me')
    async updatePassword(
        @GetUser('id') userId: string,
        @Body() dto: UpdatePasswordDto,
    ) {
        return await this.usersService.updatePassword(userId, dto)
    }

    // ─── ADMIN ROUTES ─────────────────────────────────────────

    // GET /api/users
    @Get()
    @Roles('ADMIN')
    async findAll(
        @Query() dto: FilterUserDTO
    ) {
        return await this.usersService.findAll(dto)
    }

    // GET /api/users/:id
    @Get(':id')
    @Roles('ADMIN')
    async findOne(@Param('id') userId: string) {
        // TODO: Gọi usersService.findOne(userId)
        return await this.usersService.findOne(userId)
    }

    // PUT /api/users/:id
    @Put(':id')
    @Roles('ADMIN')
    async adminUpdate(
        @Param('id') userId: string,
        @Body() dto: AdminUpdateUserDto,
        @GetUser('id') adminId: string
    ) {
        const result = await this.usersService.adminUpdate(userId, dto, adminId);
        return {
            result
        }
    }

    @Patch(':id/deactivate')
    @Roles('ADMIN')
    async deactivate(
        @Param('id') targetUserId: string,
        @GetUser('id') adminId: string
    ) {
        return await this.usersService.deactivate(targetUserId, adminId);
    }

    @Patch(':id/activate')
    @Roles('ADMIN')
    async activate(@Param('id') targetUserId: string) {
        return await this.usersService.activate(targetUserId);
    }
}