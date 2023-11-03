import { Injectable, InternalServerErrorException, forwardRef, Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { UsuarioService } from 'src/usuario/usuario.service';
import * as config from 'dotenv';

config.config();

@Injectable()
export class EmailService {
    private transporte;

    constructor(
        @Inject(forwardRef(() => UsuarioService))
        private usuarioService: UsuarioService,
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

    async enviarEmail(para: string, assunto: string, conteudoOriginal: string, incluirLinkCancelamento: boolean = true, forcarEnvio: boolean = false) {
        const usuario = await this.usuarioService.procurarUsuarioPorEmail(para);
        if (usuario && !usuario.aceitaEmails && !forcarEnvio) {
            console.log(`Usuário ${usuario.email} optou por não receber emails, pulando envio de email`);
            return 'Usuário optou por não receber emails';
        }
        let conteudo = conteudoOriginal;
        if (incluirLinkCancelamento) {
            const linkCancelamento = `${process.env.LINK_CANCELAR_INSCRICAO}${usuario.hashEmail}`;
            const rodapeEmail = `
            <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; text-align: center;">
                <p style="margin: 0; font-size: 12px;">Deseja parar de receber nossos e-mails?</p>
                <a href="${linkCancelamento}" style="font-size: 12px; color: #007bff; text-decoration: none;">Clique aqui para cancelar a inscrição</a>
            </div>
        `;
            conteudo = `${conteudoOriginal}${rodapeEmail}`;
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
            throw new InternalServerErrorException(`Falha ao enviar o e-mail. Erro: ${error.message}`);
        }
    }

    async enviarEmailparaReativar(email: string, novoHashEmail: string): Promise<void> {
        const linkReativacao = process.env.LINK_REATIVAR_EMAIL + novoHashEmail;
        const assunto = '[REXLAB] 💌Reative o Recebimento de E-mails';
        const conteudo = `
        <div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; text-align:center; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.15);">
                <h2 style="color: #007bff;">Reative o Recebimento de E-mails 💌</h2>
                <p>Olá,</p>
                <p>Percebemos que você cancelou o recebimento de nossos e-mails. 😢</p>
                <p>Se deseja voltar a receber nossas novidades, por favor, clique no botão abaixo:</p>
                <a href="${linkReativacao}" style="display: inline-block; padding: 10px 20px; color: #ffffff; background-color: #007bff; border-radius: 4px; text-decoration: none;">Reativar E-mails</a>
                <p style="margin-top: 20px;">Caso não queira reativar, por favor, ignore este e-mail. 🛑</p>
            </div>
        </div>
    `;
        await this.enviarEmail(email, assunto, conteudo, false, true);
        const atualizacoes = {
            novoHashEmail: novoHashEmail
        };
        await this.usuarioService.buscarEAtualizarUsuario(email, atualizacoes);
    }

    async enviarEmailRecuperacaoSenha(email: string, tokenRecuperacaoSenha: string): Promise<void> {
        const linkRedefinicao = process.env.LINK_REDEFINIR_SENHA + tokenRecuperacaoSenha;

        const assunto = '[REXLAB] 🔒Recuperação de Senha';
        const conteudo = `
        <div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; text-align:center; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.15);">
                <h2 style="color: #007bff;">Recuperação de Senha</h2>
                <p>Olá, Bolsista</p>
                <p>Recebemos um pedido para redefinir sua senha.</p>
                <p>Por favor, clique no botão abaixo para continuar:</p>
                <a href="${linkRedefinicao}" style="display: inline-block; padding: 10px 20px; color: #ffffff; background-color: #007bff; border-radius: 4px; text-decoration: none;">Redefinir Senha</a>
                <p style="margin-top: 20px;">Se você não solicitou a redefinição de senha, ignore este e-mail. 🛑</p>
            </div>
        </div>
    `;
        await this.enviarEmail(email, assunto, conteudo, false, true);
    }


    async enviarEmailBoasVindas(email: string, nome: string) {
        const assunto = '[REXLAB] 🤝Bem-vindo(a) à nossa plataforma!';
        const conteudo = `
    <div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: auto; text-align:center;background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.15);">
            <h2 style="color: #007bff;">Bem-vindo(a), ${nome}!</h2>
            <p>Seja bem-vindo(a) à nossa plataforma. Estamos felizes por ter você conosco.</p>
            <p>Explore, aprenda e nos ajude a melhorar!</p>
        </div>
    </div>
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
            let metasInfo = '';
            if (usuario.metasInfo && usuario.metasInfo.length > 0) {
                metasInfo += '<ul>';
                for (const meta of usuario.metasInfo) {
                    const cumpriuMeta = meta.cumpriuMeta ? 'Cumprida' : 'Não cumprida, ou ainda não finalizada';
                    const tipoMeta = meta.tipoMeta || 'Tipo não especificado';
                    const dataInicioMeta = new Date(meta.dataInicioMeta).toLocaleDateString();
                    const dataFimMeta = new Date(meta.dataFimMeta).toLocaleDateString();
                    metasInfo += `<li>
                                    Tipo: ${tipoMeta}
                                    Status: ${cumpriuMeta}<br>
                                    Data de Início: ${dataInicioMeta}
                                    Data de Fim: ${dataFimMeta}
                                  </li>`;
                }
                metasInfo += '</ul>';
            } else {
                metasInfo = 'Nenhuma meta definida.';
            }

            conteudo += `<li>
                            <strong>${usuario.nome}</strong> (${usuario.email}):<br>
                            - Tempo total: ${horas} horas e ${minutos} minutos<br>
                            - Última entrada: ${ultimaEntrada}<br>
                            - Última saída: ${ultimaSaida}<br>
                            - Metas: ${metasInfo}
                         </li>`;
        }
        conteudo += '</ul><p>Atenciosamente,</p><p>Equipe</p>';
        await this.enviarEmail(adminEmail, assunto, conteudo);
    }

    async enviarEmailNovaMeta(emailUsuario: string, tipoMeta: string, horas: number, comentario?: string, dataExpiracao?: Date) {
        const diaHoje = new Date().toLocaleDateString();
        const diasRestantes = Math.floor((dataExpiracao.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        const assunto = '[REXLAB] 🎯Nova Meta Definida';
        const conteudo = `
        <div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; text-align:center;background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.15);">
                <h2 style="color: #007bff;">Nova Meta Definida 🎯</h2>
                <p>Olá,</p>
                <p>Uma nova meta foi definida para você:</p>
            <ul style="list-style-type: none;">
                <li><strong>Tipo Meta:</strong> ${tipoMeta}</li>
                <li><strong>Horas:</strong> ${horas}</li>
                <li><strong>Comentário:</strong> ${comentario || 'Nenhum'}</li>
                <li><strong>Você tem:</strong> ${diasRestantes} dias a partir de ${diaHoje} para cumprir a meta</li>
                <li><strong>Você deve cumprir a meta até o dia:</strong> ${dataExpiracao.toLocaleDateString()}</li>
            </ul>
                <p>Por favor, certifique-se de cumprir a meta dentro do prazo estabelecido.</p>
                <p>Atenciosamente,</p>
                <p>Equipe</p>
            </div>
        </div>
        `;
        await this.enviarEmail(emailUsuario, assunto, conteudo);
    }

}