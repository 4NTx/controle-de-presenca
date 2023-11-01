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
            where: { usuario: usuario },
            order: { dataHoraEntrada: 'DESC' },
        });

        const agora = new Date();
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        const dataUltimoRegistro = ultimoRegistro ? new Date(ultimoRegistro.dataHoraEntrada) : null;

        if (!ultimoRegistro || dataUltimoRegistro < hoje) {
            const novoRegistro = this.registroRepository.create({
                usuario: usuario,
                dataHoraEntrada: agora,
            });
            await this.registroRepository.save(novoRegistro);
            return 'Entrada registrada com sucesso! 👋';
        } else if (ultimoRegistro.dataHoraSaida) {
            const umaHora = 60 * 60 * 1000;  // 1 hora em milissegundos  const umaHora = 60 * 60 * 1000;
            const diferenca = agora.getTime() - new Date(ultimoRegistro.dataHoraSaida).getTime();

            if (diferenca >= umaHora) {
                const novoRegistro = this.registroRepository.create({
                    usuario: usuario,
                    dataHoraEntrada: agora,
                });
                await this.registroRepository.save(novoRegistro);
                return 'Entrada registrada com sucesso! 👋';
            } else {
                return 'Aguarde 1 hora após a última saída para registrar uma nova entrada. ⏰';
            }
        } else {
            ultimoRegistro.dataHoraSaida = agora;
            await this.registroRepository.save(ultimoRegistro);
            return 'Saída registrada com sucesso! 👋';
        }
    }

    async calcularTempoTotal(usuarioID: number): Promise<number> {
        const registros = await this.registroRepository.find({ where: { usuario: { usuarioID } } });
        let totalMinutos = 0;

        registros.forEach(registro => {
            const entrada = new Date(registro.dataHoraEntrada);
            const saida = registro.dataHoraSaida ? new Date(registro.dataHoraSaida) : new Date();
            const diferenca = (saida.getTime() - entrada.getTime()) / (1000 * 60);
            totalMinutos += diferenca;
        });

        return totalMinutos;
    }

    private readonly LIMITE_MAX_DE_PAG = 50; // Alterar em Produção

    async buscarRegistros(pagina: number = 1, qntPorPag: number = 10, email?: string): Promise<{ registros: Registro[], total: number, pagina: number, quantidadeMaxPorPag: number, totalDePaginasPossiveis: number }> {
        if (qntPorPag > this.LIMITE_MAX_DE_PAG) {
            qntPorPag = this.LIMITE_MAX_DE_PAG;
        }
        const query = this.registroRepository.createQueryBuilder('registro')
            .leftJoinAndSelect('registro.usuario', 'usuario')
            .orderBy('registro.dataHoraEntrada', 'DESC')
            .skip((pagina - 1) * qntPorPag)
            .take(qntPorPag);

        if (email) {
            query.andWhere('usuario.email = :email', { email });
        }

        const [registros, total] = await query.getManyAndCount();
        const totalDePaginasPossiveis = Math.ceil(total / qntPorPag);

        return {
            registros,
            total,
            pagina,
            quantidadeMaxPorPag: this.LIMITE_MAX_DE_PAG,
            totalDePaginasPossiveis
        };
    }
}

