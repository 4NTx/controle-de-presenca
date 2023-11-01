import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from 'src/auth/auth.service';
import * as config from 'dotenv';
config.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: any) {
        const usuario = await this.authService.procurarUsuarioPorEmail(payload.email);
        if (!usuario) {
            throw new UnauthorizedException('Acesso não autorizado 🚫');
        }
        return usuario;
    }
}
