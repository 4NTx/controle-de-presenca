import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Registro } from './registro.entity';
import { Usuario } from '../usuario/usuario.entity';
import * as moment from 'moment';
moment.locale('pt-br');

@Injectable()
export class RegistroService {
    constructor(
        @InjectRepository(Registro)
        private registroRepository: Repository<Registro>,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>
    ) { }

    async registrarPresenca(cartaoID: string): Promise<string> {
        const usuario = await this.usuarioRepository.findOne({ where: { cartaoID } });
        if (!usuario) {
            return 'Usuário não encontrado neste Cartão RFID.';
        }

        const ultimoRegistro = await this.registroRepository.findOne({
            where: { usuario: usuario },
            order: { dataHoraEntrada: 'DESC' },
        });

        const agora = new Date();
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        const dataUltimoRegistro = ultimoRegistro ? new Date(ultimoRegistro.dataHoraEntrada) : null;
        let respostaMensagem = '';

        if (!ultimoRegistro || dataUltimoRegistro < hoje) {
            const novoRegistro = this.registroRepository.create({
                usuario: usuario,
                dataHoraEntrada: agora,
            });
            await this.registroRepository.save(novoRegistro);
            respostaMensagem = 'Entrada registrada com sucesso!';
        } else if (ultimoRegistro.dataHoraSaida) {
            const umaHora = 60 * 60 * 1000;
            const diferenca = agora.getTime() - new Date(ultimoRegistro.dataHoraSaida).getTime();

            if (diferenca >= umaHora) {
                const novoRegistro = this.registroRepository.create({
                    usuario: usuario,
                    dataHoraEntrada: agora,
                });
                await this.registroRepository.save(novoRegistro);
                respostaMensagem = 'Entrada registrada com sucesso!';
            } else {
                respostaMensagem = 'Aguarde 1 hora após a última saída para registrar uma nova entrada.';
            }
        } else {
            ultimoRegistro.dataHoraSaida = agora;
            await this.registroRepository.save(ultimoRegistro);
            respostaMensagem = 'Saída registrada com sucesso!';
        }
        return respostaMensagem;
    }


    async calcularTempoTotal(usuarioID: number, periodo: string, dataInicio?: string, dataFim?: string): Promise<{ usuario: string, email: string, rfid: string, totalMinutos: number, totalHoras: number, ultimaEntrada: Date, ultimaSaida: Date }> {
        const usuario = await this.usuarioRepository.findOne({ where: { usuarioID } });
        if (!usuario) {
            throw new NotFoundException('Usuário não encontrado');
        }

        const periodosValidos: Array<moment.unitOfTime.StartOf> = ['day', 'week', 'month', 'quarter', 'year'];
        if (!periodosValidos.includes(periodo as moment.unitOfTime.StartOf)) {
            throw new BadRequestException('Período inválido\n Períodos válidos: day, week, month, quarter, year');
        }

        let inicioPeriodo = moment().startOf(periodo as moment.unitOfTime.StartOf);
        let fimPeriodo = moment().endOf(periodo as moment.unitOfTime.StartOf);

        if (dataInicio && dataFim) {
            inicioPeriodo = moment(dataInicio);
            fimPeriodo = moment(dataFim);
        }

        const registros = await this.registroRepository.find({
            where: {
                usuario: { usuarioID },
                dataHoraEntrada: Between(inicioPeriodo.toDate(), fimPeriodo.toDate())
            }
        });

        let totalMinutos = 0;
        registros.forEach(registro => {
            const entrada = new Date(registro.dataHoraEntrada);
            const saida = registro.dataHoraSaida ? new Date(registro.dataHoraSaida) : new Date();
            const diferenca = (saida.getTime() - entrada.getTime()) / (1000 * 60);
            totalMinutos += diferenca;
        });

        const totalHoras = totalMinutos / 60;

        const ultimaEntrada = registros.length > 0 ? registros[0].dataHoraEntrada : null;
        const ultimaSaida = registros.length > 0 ? registros[0].dataHoraSaida : null;

        return {
            usuario: usuario.nome,
            email: usuario.email,
            rfid: usuario.cartaoID,
            totalMinutos,
            totalHoras,
            ultimaEntrada,
            ultimaSaida
        };
    }

    private readonly LIMITE_MAX_DE_PAG = 50;
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
    async calcularTempoTotalEmMinutos(usuarioID: number, dataInicio: Date, dataFim: Date): Promise<number> {
        const registros = await this.registroRepository.find({
            where: {
                usuario: { usuarioID },
                dataHoraEntrada: Between(dataInicio, dataFim)
            }
        });

        let totalMinutos = 0;
        registros.forEach(registro => {
            const entrada = new Date(registro.dataHoraEntrada);
            const saida = registro.dataHoraSaida ? new Date(registro.dataHoraSaida) : new Date();
            const diferenca = (saida.getTime() - entrada.getTime()) / (1000 * 60);
            totalMinutos += diferenca;
        });

        return totalMinutos;
    }

}