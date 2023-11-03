import { Injectable, Logger } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { RegistroService } from '../registro/registro.service';
import { MetaService } from '../meta/meta.service';  // Adicionado importação do MetaService
import { EmailService } from '../email/email.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RelatorioService {
    private readonly logger = new Logger(RelatorioService.name);

    constructor(
        private usuarioService: UsuarioService,
        private registroService: RegistroService,
        private metaService: MetaService,  // Adicionado MetaService como dependência
        private emailService: EmailService,
    ) { }

    @Cron('0 19 * * 5', {
        timeZone: 'America/Sao_Paulo',
    })
    async enviarRelatorioSemanal(): Promise<void> {
        this.logger.log('Iniciando o envio do relatório semanal...');
        const usuarios = await this.usuarioService.listarBolsistas();
        const dadosUsuarios = [];

        for (const usuario of usuarios) {
            const periodo = 'week';
            const tempoTotal = await this.registroService.calcularTempoTotal(usuario.usuarioID, periodo);
            const metas = await this.metaService.buscarMetasUsuario(usuario.usuarioID);

            const metasInfo = metas.map(meta => ({
                cumpriuMeta: meta.metaCumprida,
                tipoMeta: meta.tipoMeta,
                dataInicioMeta: meta.dataCriacao,
                dataFimMeta: meta.dataExpiracao
            }));

            dadosUsuarios.push({ nome: usuario.nome, ...tempoTotal, metasInfo });
        }

        for (const admin of usuarios.filter(u => u.cargo === 'admin')) {
            await this.emailService.enviarRelatorioSemanal(admin.email, dadosUsuarios);
        }

        this.logger.log('Relatório semanal enviado com sucesso.');
    }
}
