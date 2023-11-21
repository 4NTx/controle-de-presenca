import { Injectable, ExecutionContext, UnauthorizedException, } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminAuthGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      throw new UnauthorizedException(
        'Acesso negado: JWT inválido ou ausente.',
      );
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.cargo === 'admin') {
      return true;
    } else {
      throw new UnauthorizedException(
        'Acesso negado: apenas administradores podem acessar esta rota.',
      );
    }
  }
}
