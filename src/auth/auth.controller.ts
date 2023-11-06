import { Controller, UseGuards, Post, Get, NotFoundException, Body, Query, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { EmailService } from 'src/email/email.service';

@Controller('autenticacao')
export class AuthController {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService,
        private emailService: EmailService
    ) { }

    //@UseGuards(AdminAuthGuard)
    @Post('registro')
    async registrar(@Body() body: { email: string, senha: string, nome: string, cartaoID: string, whats: string, nomeUsuario: string }) {
        await this.authService.verificarUsuarioOuNomeOuCartaoExistente(body.email, body.cartaoID, body.nome);
        const novoUsuario = await this.authService.registrarUsuario(body);
        this.emailService.enviarEmailBoasVindas(body.email, body.nome);
        return { message: 'Registro bem-sucedido!' };
    }

    @Post('login')
    async login(@Body() body: { email: string, senha: string }) {
        const usuario = await this.authService.validarSenhaUsuario(body.email, body.senha);
        if (!usuario) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }
        const payload = {
            email: usuario.email,
            sub: usuario.usuarioID,
            nome: usuario.nome,
            cargo: usuario.cargo
        };
        const token = this.jwtService.sign(payload);
        return { message: 'Login bem-sucedido!', token };
    }

    @Post('solicitar-recuperacao-senha')
    async solicitarRecuperacaoSenha(@Body('email') email: string): Promise<{ message: string, email: string }> {
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
            throw new BadRequestException('Token de recuperação de senha não fornecido.');
        }
        await this.authService.redefinirSenha(email, novaSenha, token);
        return { mensagem: `Senha redefinida com sucesso para o e-mail: ${email}` };
    }

    @Get('obter-email')
    async pegarEmailPorToken(@Query('tokenRecuperacaoSenha') tokenRecuperacaoSenha: string): Promise<{ email: string }> {
        const email = await this.authService.pegarEmailPorTokenRecuperacao(tokenRecuperacaoSenha);
        if (!email) {
            throw new NotFoundException('E-mail não encontrado para o token fornecido.');
        }
        return { email };
    }
}
