import {
  Controller,
  Patch,
  UseGuards,
  Post,
  Get,
  NotFoundException,
  Body,
  Query,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { EmailService } from '../email/email.service';

@Controller('autenticacao')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  @Post('registro')
  async registrar(
    @Body()
    body: {
      email: string;
      senha: string;
      nome: string;
      cartaoID: string;
      whats: string;
      nomeUsuario: string;
    },
  ) {
    await this.authService.verificarEmailOuNomeOuCartaoExistente(
      body.email,
      body.cartaoID,
      body.nome,
    );
    const novoUsuario = await this.authService.registrarUsuario(body);
    return {
      message:
        'Pedido de registro bem-sucedido! Aguarde a aprovação do administrador, você receberá um email ao ser aprovado!',
    };
  }

  @Post('login')
  async login(@Body() body: { email: string; senha: string }) {
    const usuario = await this.authService.validarSenhaUsuario(
      body.email,
      body.senha,
    );
    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    if (usuario.statusRegistro !== 'ativo') {
      throw new UnauthorizedException(
        'Sua conta ainda não foi ativada. Aguarde a aprovação de um administrador, você receberá um email ao ser aprovado!',
      );
    }
    const payload = {
      email: usuario.email,
      sub: usuario.usuarioID,
      nome: usuario.nome,
      cargo: usuario.cargo,
    };
    const token = this.jwtService.sign(payload);
    return { message: 'Login bem-sucedido!', token };
  }

  @Post('solicitar-recuperacao-senha')
  async solicitarRecuperacaoSenha(
    @Body('email') email: string,
  ): Promise<{ message: string; email: string }> {
    await this.authService.gerarTokenRecuperacaoSenha(email);
    return { message: 'Solicitação enviada com sucesso para o email', email };
  }

  @Post('redefinir-senha')
  async redefinirSenha(
    @Body('email') email: string,
    @Body('novaSenha') novaSenha: string,
    @Body('confirmacaoSenha') confirmacaoSenha: string,
    @Query('tokenRecuperacaoSenha') queryTokenRecuperacaoSenha: string,
  ): Promise<{ mensagem: string }> {
    if (novaSenha !== confirmacaoSenha) {
      throw new ConflictException('As senhas não coincidem.');
    }
    const token = queryTokenRecuperacaoSenha;
    if (!token) {
      throw new BadRequestException(
        'Token de recuperação de senha não fornecido.',
      );
    }
    await this.authService.redefinirSenha(email, novaSenha, token);
    return { mensagem: `Senha redefinida com sucesso para o e-mail: ${email}` };
  }

  @Get('obter-email')
  async pegarEmailPorToken(
    @Query('tokenRecuperacaoSenha') tokenRecuperacaoSenha: string,
  ): Promise<{ email: string }> {
    const email = await this.authService.procurarEmailPorTokenRecuperacao(
      tokenRecuperacaoSenha,
    );
    if (!email) {
      throw new NotFoundException(
        'E-mail não encontrado para o token fornecido.',
      );
    }
    return { email };
  }

  //@UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Get('usuarios-pendentes')
  async listarPendentes() {
    return this.authService.listarUsuariosPendentes();
  }

  //@UseGuards(JwtAuthGuard, AdminAuthGuard)
  @Patch('administrar-registro')
  async administrarRegistro(
    @Body() body: { email: string; acao: 'aprovar' | 'negar' },
  ) {
    const usuario = await this.authService.procurarUsuarioPorEmail(body.email);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (body.acao === 'aprovar') {
      await this.authService.aprovarRegistro(usuario.usuarioID);
      this.emailService.enviarEmailBoasVindas(usuario.email, usuario.nome);
    } else {
      await this.authService.negarRegistro(usuario.usuarioID);
      this.emailService.enviarEmailNegacao(usuario.email);
    }
    return {
      mensagem: `Registro marcado como '${body.acao}' com sucesso.`,
      email: usuario.email,
    };
  }
}
