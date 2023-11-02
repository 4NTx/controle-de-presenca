// auth.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Usuario } from '../usuario/usuario.entity';
import * as bcrypt from 'bcryptjs';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
        private emailService: EmailService,
    ) { }

    async registrarUsuario(dadosUsuario: { email: string, senha: string, nome: string, cartaoID: string, whats: string }): Promise<Usuario> {
        const hashedSenha = await bcrypt.hash(dadosUsuario.senha, 12);
        const hashEmail = uuidv4();
        const novoHashEmail = uuidv4();
        const novoUsuario = this.usuarioRepository.create({
            nome: dadosUsuario.nome,
            email: dadosUsuario.email,
            whats: dadosUsuario.whats,
            senha: hashedSenha,
            cartaoID: dadosUsuario.cartaoID,
            cargo: 'user',
            hashEmail: hashEmail,
            novoHashEmail: novoHashEmail,
        });
        await this.usuarioRepository.save(novoUsuario);
        return novoUsuario;
    }

    async validarSenhaUsuario(email: string, senha: string): Promise<any> {
        const usuario = await this.usuarioRepository.findOne({ where: { email } });
        if (usuario && senha && await bcrypt.compare(senha, usuario.senha)) {
            const { senha, ...result } = usuario;
            return result;
        }
        return null;
    }

    async procurarUsuarioPorEmail(email: string) {
        return this.usuarioRepository.findOne({ where: { email } });
    }

    async verificarUsuarioOuCartaoExistente(email: string, cartaoID: string) {
        const usuarioEmail = await this.usuarioRepository.findOne({ where: { email } });
        const usuarioCartaoID = await this.usuarioRepository.findOne({ where: { cartaoID } });

        if (usuarioEmail) {
            throw new ConflictException('Já existe um usuário com esse e-mail.');
        }

        if (usuarioCartaoID) {
            throw new ConflictException('Já existe um usuário com esse ID de cartão.');
        }
    }

    async gerarTokenRecuperacaoSenha(email: string): Promise<void> {
        const usuario = await this.procurarUsuarioPorEmail(email);
        if (!usuario) {
            throw new ConflictException('Não existe uma conta com esse e-mail. 🚫');
        }
        const token = uuidv4();
        usuario.tokenRecuperacaoSenha = token;
        const dataExpiracao = new Date();
        dataExpiracao.setHours(dataExpiracao.getHours() + 1);
        usuario.dataExpiracaoTokenRecuperacao = dataExpiracao;
        await this.usuarioRepository.save(usuario);
        await this.emailService.enviarEmailRecuperacaoSenha(email, token);
    }


    async validarTokenRecuperacaoSenha(email: string, token: string): Promise<boolean> {
        const usuario = await this.usuarioRepository.findOne({ where: { tokenRecuperacaoSenha: token } });
        if (!usuario || !usuario.dataExpiracaoTokenRecuperacao || new Date() > usuario.dataExpiracaoTokenRecuperacao) {
            throw new NotFoundException('Token inválido ou expirado. 🕰️');
        }
        if (usuario.email !== email) {
            throw new BadRequestException('E-mail não corresponde ao que solicitou a recuperação. 🚫');
        }

        return true;
    }

    async redefinirSenha(email: string, novaSenha: string, token: string): Promise<void> {
        await this.validarTokenRecuperacaoSenha(email, token);
        const usuario = await this.procurarUsuarioPorEmail(email);

        usuario.senha = await bcrypt.hash(novaSenha, 12);
        usuario.tokenRecuperacaoSenha = null;
        usuario.dataExpiracaoTokenRecuperacao = null;

        await this.usuarioRepository.save(usuario);
    }
}