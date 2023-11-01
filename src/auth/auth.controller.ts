import { Controller, UseGuards, Post, Body, UnauthorizedException } from '@nestjs/common';
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
}
