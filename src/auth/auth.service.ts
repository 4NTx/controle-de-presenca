// auth.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
