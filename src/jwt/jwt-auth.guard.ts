import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Usuario } from '../usuario/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const tokenValido = await super.canActivate(context);
        if (!tokenValido) {
            throw new UnauthorizedException('JWT inválido.');
        }
        const req = context.switchToHttp().getRequest();
        const { email } = req.user;
        const usuario = await this.usuarioRepository.findOne({ where: { email } });
        if (!usuario) {
            throw new UnauthorizedException('Usuário não encontrado.');
        }
        return true;
    }
}
