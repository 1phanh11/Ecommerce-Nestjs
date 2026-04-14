import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GetUser, Public } from './decorators/user.decorator';
import { LoginDTO, LogoutDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }



    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @Public()
    async register(@Body() registerDto: RegisterDTO): Promise<void> {
        await this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Public()
    async login(@Body() loginDto: LoginDTO): Promise<{ user: object, accessToken: string }> {
        return await this.authService.login(loginDto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body() userId: LogoutDTO, @Res({ passthrough: true }) response: Response): Promise<void> {
        await this.authService.logout(userId);
    }

}
