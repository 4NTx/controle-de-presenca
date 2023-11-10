import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { Usuario } from './usuario.entity';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('usuario')
export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Get('listar-bolsistas')
  async listarBolsistas(): Promise<Usuario[]> {
    return this.usuarioService.listarBolsistas();
  }

  @Get('cancelar-inscricao/:hashEmail')
  async cancelarInscricao(@Param('hashEmail') hashEmail: string) {
    const result =
      await this.usuarioService.cancelarRecebimentoEmail(hashEmail);
    if (result === 'Recebimento de emails cancelado com sucesso') {
      return 'Sua inscrição para receber e-mails foi cancelada com sucesso.';
    } else {
      throw new NotFoundException('Usuário não encontrado ou hash incorreto');
    }
  }

  @Get('reativar-inscricao/:novoHashEmail')
  async reativarInscricao(@Param('novoHashEmail') novoHashEmail: string) {
    const result =
      await this.usuarioService.reativarRecebimentoEmail(novoHashEmail);
    if (result === 'Recebimento de emails reativado com sucesso') {
      return 'Sua inscrição para receber e-mails foi reativada com sucesso.';
    } else {
      throw new NotFoundException('Usuário não encontrado');
    }
  }
}
