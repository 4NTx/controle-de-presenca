import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Meta } from './meta.entity';
import { Repository } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class MetaService {
    constructor(
        @InjectRepository(Meta)
        private metaRepository: Repository<Meta>,
        private readonly emailService: EmailService,
    ) { }

    async listarMetas(): Promise<Meta[]> {
        return await this.metaRepository.find({
            relations: ['usuario', 'admin']
        });
    }

    async criarOuAtualizarMeta(usuario: Usuario, horas: number, tipoMeta: string, comentario: string, admin: Usuario): Promise<Meta> {
        if (!usuario) {
            throw new NotFoundException(`Usuário não encontrado.`);
        }
        if (horas <= 0) {
            throw new BadRequestException('O número de horas deve ser positivo.');
        }

        let meta = await this.metaRepository.findOne({ where: { usuario } });

        if (!meta) {
            meta = new Meta();
            meta.usuario = usuario;
            meta.dataCriacao = new Date();
        }
        meta.horas = horas;
        meta.metaCumprida = null;
        meta.tipoMeta = tipoMeta;
        meta.comentario = comentario;
        meta.admin = admin;
        meta.dataAtualizacao = new Date();
        const agora = new Date();
        const dataExpiracao = await this.calcularDataExpiracao(tipoMeta);
        meta.dataExpiracao = dataExpiracao;
        meta.dataExpiracao = dataExpiracao;
        this.emailService.enviarEmailNovaMeta(usuario.email, tipoMeta, horas, comentario, dataExpiracao);
        return await this.metaRepository.save(meta);
    }


    async calcularDataExpiracao(tipoMeta: string): Promise<Date> {
        const agora = new Date();
        let dataExpiracao: Date = new Date(agora);
        switch (tipoMeta) {
            case 'diaria':
                dataExpiracao.setDate(agora.getDate() + 1);
                dataExpiracao.setHours(23, 59, 59, 999);
                break;
            case 'semanal':
                dataExpiracao.setDate(agora.getDate() + 7);
                dataExpiracao.setHours(23, 59, 59, 999);
                break;
            case 'mensal':
                dataExpiracao.setMonth(agora.getMonth() + 1);
                dataExpiracao.setDate(0);
                dataExpiracao.setHours(23, 59, 59, 999);
                break;
            case 'semestral':
                dataExpiracao.setMonth(agora.getMonth() + 6);
                dataExpiracao.setDate(0);
                dataExpiracao.setHours(23, 59, 59, 999);
                break;
            case 'anual':
                dataExpiracao.setFullYear(agora.getFullYear() + 1);
                dataExpiracao.setMonth(11);
                dataExpiracao.setDate(31);
                dataExpiracao.setHours(23, 59, 59, 999);
                break;
            default:
                throw new BadRequestException('Tipo de meta inválido.');
        }

        return dataExpiracao;
    }

    async buscarMetasUsuario(usuarioID: number): Promise<Meta[]> {
        return await this.metaRepository.find({ where: { usuario: { usuarioID: usuarioID } } });
    }

    async atualizarStatusMeta(metaID: number, status: boolean): Promise<void> {
        const meta = await this.metaRepository.findOne({ where: { metaID } });
        if (meta) {
            meta.metaCumprida = status;
            await this.metaRepository.save(meta);
        }
    }
}