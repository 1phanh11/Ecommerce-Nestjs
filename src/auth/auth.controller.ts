import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { RegisterDTO } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDTO, LogoutDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ){}

    @Post('register')
    @HttpCode(201)
    async register(@Body() registerDto: RegisterDTO): Promise<void>{
        await this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() loginDto: LoginDTO): Promise<{user: object, accessToken: string}>{
        return await this.authService.login(loginDto);
    }

    @Post('logout')
    @HttpCode(200)
    async logout(@Body() userId: LogoutDTO): Promise<void>{
        await this.authService.logout(userId);
    }
}
