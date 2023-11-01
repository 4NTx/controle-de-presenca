import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Meta } from './meta.entity';
import { Repository } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

@Injectable()
export class MetaService {
    constructor(
        @InjectRepository(Meta)
        private metaRepository: Repository<Meta>,
    ) { }

    async listarMetas(): Promise<Meta[]> {
        return await this.metaRepository.find({
            relations: ['usuario', 'admin']
        });
    }

    async criarOuAtualizarMeta(usuario: Usuario, horas: number, admin: Usuario): Promise<Meta> {
        let meta = await this.metaRepository.findOne({ where: { usuario } });

        if (!meta) {
            meta = new Meta();
            meta.usuario = usuario;
            meta.dataCriacao = new Date();
        }
        meta.horas = horas;
        meta.admin = admin;
        meta.dataAtualizacao = new Date();
        meta.dataExpiracao = new Date();
        return await this.metaRepository.save(meta);
    }

}
