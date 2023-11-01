import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsuarioService {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async listarBolsistas(): Promise<Usuario[]> {
        return await this.usuarioRepository.find();
    }

    async buscarUsuarioPorID(usuarioID: number): Promise<Usuario> {
        return await this.usuarioRepository.findOne({ where: { usuarioID } });
    }
}