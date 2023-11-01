import { Controller, UseGuards, Post, Body, Query, UnauthorizedException, BadRequestException, HttpCode, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Usuario } from '../usuario/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { EmailService } from 'src/email/email.service';

@Controller('autenticacao')
export class AuthController {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
        private emailService: EmailService,
    ) { }

    @Post('login')
    async login(@Body() body: { email: string, senha: string }) {
        const usuario = await this.authService.validarSenhaUsuario(body.email, body.senha);
        if (!usuario) {
            throw new UnauthorizedException('Credenciais inválidas 😢');
        }

        const payload = {
            email: usuario.email,
            sub: usuario.usuarioID,
            nome: usuario.nome,
            cargo: usuario.cargo
        };
        const token = this.jwtService.sign(payload);

        return { message: 'Login bem-sucedido! 🎉', token };
    }


    @UseGuards(AdminAuthGuard)
    @Post('registro')
    async registrar(@Body() body: { email: string, senha: string, nome: string, cartaoID: string, whats: string }) {
        await this.authService.verificarUsuarioOuCartaoExistente(body.email, body.cartaoID);
        const hashedSenha = await bcrypt.hash(body.senha, 12);
        const novoUsuario = this.usuarioRepository.create({
            nome: body.nome,
            email: body.email,
            whats: body.whats,
            senha: hashedSenha,
            cartaoID: body.cartaoID,
            cargo: 'user',
        });
        await this.usuarioRepository.save(novoUsuario);
        this.emailService.enviarEmailBoasVindas(body.email, body.nome);
        return { message: 'Registro bem-sucedido! 🎉' };
    }

    @Post('solicitar-recuperacao-senha')
    @HttpCode(204) // retornando 204 caso dê bom, depois ele cria o token e envia por email pros cara (pra n retornar nada além do código 204)
    async solicitarRecuperacaoSenha(@Body('email') email: string): Promise<void> {
        await this.authService.gerarTokenRecuperacaoSenha(email);
    }

    @Post('redefinir-senha')
    async redefinirSenha(
        @Body('email') email: string,
        @Body('novaSenha') novaSenha: string,
        @Body('confirmacaoSenha') confirmacaoSenha: string,
        @Query('token') queryToken: string,
        //@Body('token') bodyToken: string,
    ): Promise<{ mensagem: string }> {
        if (novaSenha !== confirmacaoSenha) {
            throw new ConflictException('As senhas não coincidem. 🔐');
        }
        const token = queryToken; //|| bodyToken;
        if (!token) {
            throw new BadRequestException('Token de recuperação de senha não fornecido. 🔑');
        }
        await this.authService.redefinirSenha(email, novaSenha, token);
        return { mensagem: `Senha redefinida com sucesso para o e-mail: ${email}` };
    }
}
