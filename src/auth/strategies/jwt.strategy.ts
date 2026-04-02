import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {

    constructor(
        private config: ConfigService,
        private prisma: PrismaService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_SECRET') as string
        });
    }

    async validate(payload: {userId: string, role: string}) {
        const user = this.prisma.user.findUnique({
            where: {
                id: payload.userId
            },
            select: {
                id: true, 
                role: true,
                name: true,
                email: true,
            }
        })

        if(!user){
            throw new UnauthorizedException()
        }

        return user;
    }
}