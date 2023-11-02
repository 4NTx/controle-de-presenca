import { Injectable, InternalServerErrorException, forwardRef, Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioService } from 'src/usuario/usuario.service';
import { Usuario } from 'src/usuario/usuario.entity';
import { v4 as uuidv4 } from 'uuid';
import * as config from 'dotenv';
import { AuthService } from 'src/auth/auth.service';

config.config();

@Injectable()
export class EmailService {
    private transporte;

    constructor(
        @Inject(forwardRef(() => UsuarioService))  // Corrigido aqui
        private usuarioService: UsuarioService
    ) {
        this.transporte = nodemailer.createTransport({
            host: process.env.EMAIL_SMTP,
            port: process.env.EMAIL_PORTA,
            secure: true,
            auth: {
                user: process.env.EMAIL_EMAIL,
                pass: process.env.EMAIL_SENHA
            }
        });
    }

    async enviarEmail(para: string, assunto: string, conteudoOriginal: string, incluirLinkCancelamento: boolean = true) {
        const usuario = await this.usuarioService.procurarUsuarioPorEmail(para);
        if (usuario && !usuario.aceitaEmails) {
            return 'Usuário optou por não receber emails 🚫';
        }

        let conteudo = conteudoOriginal;

        if (incluirLinkCancelamento) {
            const linkCancelamento = `${process.env.LINK_CANCELAR_INSCRICAO}${usuario.hashEmail}`;
            conteudo = `${conteudoOriginal}<br/><br/><a href="${linkCancelamento}">Clique aqui para cancelar a inscrição de e-mails 🚫</a>`;
        }
        const opcoesDeEmail = {
            from: (process.env.EMAIL_EMAIL),
            to: para,
            subject: assunto,
            html: conteudo
        };
        try {
            const resultado = await this.transporte.sendMail(opcoesDeEmail);
        } catch (error) {
            throw new InternalServerErrorException(`[🚫] Falha ao enviar o e-mail. Erro: ${error.message}`);
        }
    }

    async enviarEmailparaReativar(email: string, novoHashEmail: string): Promise<void> {
        const linkReativacao = process.env.LINK_REATIVAR_EMAIL + novoHashEmail;

        const assunto = 'Reative o Recebimento de E-mails 💌';
        const conteudo = `
            <p>Olá,</p>
            <p>Percebemos que você cancelou o recebimento de nossos e-mails. 😢</p>
            <p>Se deseja voltar a receber nossas novidades, por favor, clique no link abaixo:</p>
            <a href="${linkReativacao}">${linkReativacao}</a>
            <p>Caso não queira reativar, por favor, ignore este e-mail. 🛑</p>
        `;
        await this.enviarEmail(email, assunto, conteudo, false);

        const atualizacoes = {
            novoHashEmail: null,
            hashEmail: uuidv4(),
        };
        await this.usuarioService.buscarEAtualizarUsuario(email, atualizacoes);
    }

    async enviarEmailRecuperacaoSenha(email: string, tokenRecuperacaoSenha: string): Promise<void> {
        const linkRedefinicao = process.env.LINK_REDEFINIR_SENHA + tokenRecuperacaoSenha; //`LINK_REDEFINIR_SENHA${token}`;

        const assunto = 'Recuperação de Senha 🔒';
        const conteudo = `
            <p>Olá,</p>
            <p>Recebemos um pedido para redefinir sua senha. 🔄</p>
            <p>Por favor, clique no link abaixo para continuar:</p>
            <a href="${linkRedefinicao}">${linkRedefinicao}</a>
            <p>Se você não solicitou a redefinição de senha, ignore este e-mail. 🛑</p>
        `;
        await this.enviarEmail(email, assunto, conteudo, false);
    }


    async enviarEmailBoasVindas(email: string, nome: string) {
        const assunto = 'Bem-vindo(a) à nossa plataforma!';
        const conteudo = `<p>Olá ${nome},</p><p>Seja bem-vindo(a) à nossa plataforma. Estamos felizes por ter você conosco.</p>`;
        await this.enviarEmail(email, assunto, conteudo);
    }

    async enviarRelatorioSemanal(adminEmail: string, usuarios: any[]) {
        const assunto = 'Relatório Semanal de Presença 📊';
        let conteudo = '<p>Relatório Semanal de Presença:</p><ul>';

        for (const usuario of usuarios) {
            const horas = Math.floor(Number(usuario.totalMinutos) / 60);
            const minutos = Math.round(Number(usuario.totalMinutos) % 60);
            const ultimaEntrada = usuario.ultimaEntrada ? new Date(usuario.ultimaEntrada).toLocaleString() : 'N/A';
            const ultimaSaida = usuario.ultimaSaida ? new Date(usuario.ultimaSaida).toLocaleString() : 'N/A';

            conteudo += `<li>
                            <strong>${usuario.usuario}</strong> (${usuario.email}):<br>
                            - Tempo total: ${horas} horas e ${minutos} minutos<br>
                            - Última entrada: ${ultimaEntrada}<br>
                            - Última saída: ${ultimaSaida}
                         </li>`;
        }

        conteudo += '</ul><p>Atenciosamente,</p><p>Equipe</p>';

        await this.enviarEmail(adminEmail, assunto, conteudo);
    }
}