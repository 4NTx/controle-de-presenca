import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as config from 'dotenv';
config.config();

@Injectable()
export class EmailService {
    private transporte;

    constructor() {
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

    async enviarEmail(para: string, assunto: string, conteudo: string) {
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

    async enviarEmailBoasVindas(email: string, nome: string) {
        const assunto = 'Bem-vindo(a) à nossa plataforma!';
        const conteudo = `<p>Olá ${nome},</p><p>Seja bem-vindo(a) à nossa plataforma. Estamos felizes por ter você conosco.</p>`;
        await this.enviarEmail(email, assunto, conteudo);
    }


    async enviarEmailRecuperacaoSenha(email: string, token: string): Promise<void> {
        const linkRedefinicao = process.env.LINK_REDEFINIR_SENHA + token; //`LINK_REDEFINIR_SENHA${token}`;

        const assunto = 'Recuperação de Senha 🔒';
        const conteudo = `
            <p>Olá,</p>
            <p>Recebemos um pedido para redefinir sua senha. 🔄</p>
            <p>Por favor, clique no link abaixo para continuar:</p>
            <a href="${linkRedefinicao}">${linkRedefinicao}</a>
            <p>Se você não solicitou a redefinição de senha, ignore este e-mail. 🛑</p>
        `;
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