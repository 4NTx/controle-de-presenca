import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { Repository } from 'typeorm';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UsuarioService {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
        private emailService: EmailService,
    ) { }

    async listarBolsistas(): Promise<Usuario[]> {
        return await this.usuarioRepository.find();
    }

    async cancelarRecebimentoEmail(hashEmail: string): Promise<string> {
        const usuario = await this.usuarioRepository.findOne({ where: { hashEmail } });
        if (!usuario) {
            return 'Usuário não encontrado 🤷‍♂️';
        }
        usuario.aceitaEmails = false;
        await this.usuarioRepository.save(usuario);
        await this.emailService.enviarEmailparaReativar(usuario.email, usuario.novoHashEmail);
        return 'Recebimento de emails cancelado com sucesso 🚫';
    }

    async reativarRecebimentoEmail(novoHashEmail: string): Promise<string> {
        const usuario = await this.usuarioRepository.findOne({ where: { novoHashEmail } });
        if (!usuario) {
            return 'Usuário não encontrado 🤷‍♂️';
        }
        usuario.aceitaEmails = true;
        await this.usuarioRepository.save(usuario);
        return 'Recebimento de emails reativado com sucesso ✅';
    }

    async buscarUsuarioPorID(usuarioID: number): Promise<Usuario> {
        return await this.usuarioRepository.findOne({ where: { usuarioID } });
    }
}