import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registro } from './registro.entity';
import { Usuario } from '../usuario/usuario.entity';

@Injectable()
export class RegistroService {
    constructor(
        @InjectRepository(Registro)
        private registroRepository: Repository<Registro>,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
    ) { }

    async registrarPresenca(cartaoID: string): Promise<string> {
        const usuario = await this.usuarioRepository.findOne({ where: { cartaoID } });
        if (!usuario) {
            return 'Usuário não encontrado 😢';
        }

        const ultimoRegistro = await this.registroRepository.findOne({
            where: { usuario: usuario, dataHoraSaida: null },
            order: { dataHoraEntrada: 'DESC' },
        });

        if (!ultimoRegistro) {
            const novoRegistro = this.registroRepository.create({
                usuario: usuario,
                dataHoraEntrada: new Date(),
            });
            await this.registroRepository.save(novoRegistro);
            return 'Entrada registrada com sucesso! 👋';
        } else {
            ultimoRegistro.dataHoraSaida = new Date();
            await this.registroRepository.save(ultimoRegistro);
            return 'Saída registrada com sucesso! 👋';
        }
    }

    async listarRegistros(): Promise<Registro[]> {
        return await this.registroRepository.find();
    }

    async calcularTempoTotal(usuarioID: number): Promise<number> {
        const registros = await this.registroRepository.find({ where: { usuario: { usuarioID } } });
        let totalMinutos = 0;

        registros.forEach(registro => {
            const entrada = new Date(registro.dataHoraEntrada);
            const saida = registro.dataHoraSaida ? new Date(registro.dataHoraSaida) : new Date();
            const diferenca = (saida.getTime() - entrada.getTime()) / (1000 * 60); // Diferença em minutos
            totalMinutos += diferenca];
        });

        return totalMinutos;
    }
}
