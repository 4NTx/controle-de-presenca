import { Injectable, Logger } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { RegistroService } from '../registro/registro.service';
import { EmailService } from '../email/email.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RelatorioService {
    private readonly logger = new Logger(RelatorioService.name);

    constructor(
        private usuarioService: UsuarioService,
        private registroService: RegistroService,
        private emailService: EmailService,
    ) { }

    @Cron('0 19 * * 5', {
        timeZone: 'America/Sao_Paulo',
    })
    async enviarRelatorioSemanal(): Promise<void> {
        this.logger.log('Iniciando o envio do relatório semanal...');
        const usuarios = await this.usuarioService.listarBolsistas();
        let mensagemRelatorio = 'Relatório Semanal de Presença:\n\n';

        for (const usuario of usuarios) {
            const totalMinutos = await this.registroService.calcularTempoTotal(usuario.usuarioID);
            const horas = Math.floor(totalMinutos / 60);
            const minutos = totalMinutos % 60;

            mensagemRelatorio += `${usuario.nome}: ${horas} horas e ${minutos} minutos\n`;
        }

        for (const admin of usuarios.filter(u => u.cargo === 'admin')) {
            await this.emailService.enviarEmail(admin.email, 'Relatório Semanal de Presença', mensagemRelatorio);
        }

        this.logger.log('Relatório semanal enviado com sucesso.');
    }
}
