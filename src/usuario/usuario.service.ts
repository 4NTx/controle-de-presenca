import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { Repository } from 'typeorm';
import { EmailService } from 'src/email/email.service';
import { AuthService } from 'src/auth/auth.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsuarioService {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
        @Inject(forwardRef(() => EmailService))
        private emailService: EmailService,
    ) { }

    async listarBolsistas(): Promise<Usuario[]> {
        return await this.usuarioRepository.find();
    }

    async cancelarRecebimentoEmail(hashEmail: string): Promise<string> {
        const usuario = await this.usuarioRepository.findOne({ where: { hashEmail } });
        if (!usuario) {
            return 'Usuário não encontrado';
        }
        usuario.aceitaEmails = false;
        usuario.novoHashEmail = uuidv4();
        usuario.hashEmail = null;
        await this.usuarioRepository.save(usuario);
        await this.emailService.enviarEmailparaReativar(usuario.email, usuario.novoHashEmail);
        return 'Recebimento de emails cancelado com sucesso';
    }

    async reativarRecebimentoEmail(novoHashEmail: string): Promise<string> {
        const usuario = await this.usuarioRepository.findOne({ where: { novoHashEmail } });
        if (!usuario) {
            return 'Usuário não encontrado';
        }
        usuario.aceitaEmails = true;
        usuario.hashEmail = uuidv4();
        usuario.novoHashEmail = null;
        await this.usuarioRepository.save(usuario);
        return 'Recebimento de emails reativado com sucesso';
    }

    async buscarUsuarioPorID(usuarioID: number): Promise<Usuario> {
        return await this.usuarioRepository.findOne({ where: { usuarioID } });
    }

    async buscarEAtualizarUsuario(email: string, atualizacoes: Partial<Usuario>): Promise<Usuario> {
        const usuario = await this.usuarioRepository.findOne({ where: { email } });
        if (!usuario) {
            throw new NotFoundException('Usuário não encontrado 🤷‍♂️');
        }
        Object.assign(usuario, atualizacoes);
        await this.usuarioRepository.save(usuario);
        return usuario;
    }

    async procurarUsuarioPorEmail(email: string) {
        return this.usuarioRepository.findOne({ where: { email } });
    }
}