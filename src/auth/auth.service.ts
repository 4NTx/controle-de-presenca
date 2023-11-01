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
        usuario.dataExpiracaoToken = dataExpiracao;
        await this.usuarioRepository.save(usuario);
        await this.emailService.enviarEmailRecuperacaoSenha(email, token);
    }


    async validarTokenRecuperacaoSenha(email: string, token: string): Promise<boolean> {
        const usuario = await this.usuarioRepository.findOne({ where: { tokenRecuperacaoSenha: token } });
        if (!usuario || !usuario.dataExpiracaoToken || new Date() > usuario.dataExpiracaoToken) {
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
        usuario.dataExpiracaoToken = null;

        await this.usuarioRepository.save(usuario);
    }
}