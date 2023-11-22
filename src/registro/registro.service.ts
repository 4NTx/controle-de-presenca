import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, IsNull } from "typeorm";
import { Registro } from "./registro.entity";
import { Usuario } from "../usuario/usuario.entity";
import * as moment from "moment";
import { RFIDRevisar } from "./rfid_revisar.entity";

@Injectable()
export class RegistroService {
  constructor(
    @InjectRepository(Registro)
    private registroRepository: Repository<Registro>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(RFIDRevisar)
    private RFIDRevisarRepository: Repository<RFIDRevisar>
  ) {}

  async registrarPresenca(RFID: string): Promise<string> {
    let usuario = await this.usuarioRepository.findOne({
      where: { cartaoID: RFID },
    });

    if (usuario) {
      return this.processarEntradaSaida(usuario);
    } else {
      const rfidEmRevisao = await this.RFIDRevisarRepository.findOne({
        where: { RFID },
      });

      if (rfidEmRevisao) {
        return "Este RFID está na lista de revisão manual.";
      }
      usuario = await this.usuarioRepository.findOne({
        where: { cartaoID: IsNull() },
        order: { dataDeRegistroUsuario: "DESC" },
      });

      if (usuario) {
        usuario.cartaoID = RFID;
        await this.usuarioRepository.save(usuario);
        return `RFID associado ao usuário ${usuario.nome}.`;
      } else {
        const RFIDRevisar = this.RFIDRevisarRepository.create({ RFID });
        await this.RFIDRevisarRepository.save(RFIDRevisar);
        return "Não encontramos ninguém para associar o RFID, armazenado para revisão manual.";
      }
    }
  }

  private async processarEntradaSaida(usuario: Usuario): Promise<string> {
    const ultimoRegistroEntrada = await this.registroRepository.findOne({
      where: {
        usuario: { usuarioID: usuario.usuarioID },
        dataHoraSaida: IsNull(),
      },
      order: { dataHoraEntrada: "DESC" },
    });

    const agora = new Date();
    const hoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    );

    let respostaMensagem = "";

    if (ultimoRegistroEntrada) {
      const dataUltimoRegistroSemHora = new Date(
        ultimoRegistroEntrada.dataHoraEntrada.getFullYear(),
        ultimoRegistroEntrada.dataHoraEntrada.getMonth(),
        ultimoRegistroEntrada.dataHoraEntrada.getDate()
      );

      const intervaloMinimo = 15000; // 15 segundos

      const tempoDesdeUltimaEntrada =
        agora.getTime() -
        new Date(ultimoRegistroEntrada.dataHoraEntrada).getTime();

      if (dataUltimoRegistroSemHora < hoje) {
        ultimoRegistroEntrada.dataHoraSaida = new Date(
          ultimoRegistroEntrada.dataHoraEntrada.getTime() + 4 * 60 * 60 * 1000 //Caso o usuario n registrou saida no dia anterior, na proxima entrada (data entrada + 4 horas = datasaida)
        );
        await this.registroRepository.save(ultimoRegistroEntrada);
        respostaMensagem = `Saída do dia anterior registrada automaticamente para ${usuario.nome}.`;

        const novoRegistro = this.registroRepository.create({
          usuario: usuario,
          dataHoraEntrada: agora,
        });
        await this.registroRepository.save(novoRegistro);
        respostaMensagem += ` Nova entrada registrada com sucesso para ${usuario.nome}!`;
      } else if (tempoDesdeUltimaEntrada >= intervaloMinimo) {
        ultimoRegistroEntrada.dataHoraSaida = agora;
        await this.registroRepository.save(ultimoRegistroEntrada);
        respostaMensagem = `Saída registrada com sucesso para ${usuario.nome}!`;
      } else {
        throw new BadRequestException(
          `${usuario.nome}, aguarde ao menos 15 segundos para registrar uma saída após a entrada.`
        );
      }
    } else {
      const novoRegistro = this.registroRepository.create({
        usuario: usuario,
        dataHoraEntrada: agora,
      });
      await this.registroRepository.save(novoRegistro);
      respostaMensagem = `Entrada registrada com sucesso para ${usuario.nome}!`;
    }

    return respostaMensagem;
  }

  async calcularTempoTotal(
    usuarioID: number,
    periodo: string,
    dataInicio?: string,
    dataFim?: string
  ): Promise<{
    usuario: string;
    email: string;
    rfid: string;
    totalMinutos: number;
    totalHoras: number;
    ultimaEntrada: Date;
    ultimaSaida: Date;
  }> {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuarioID },
    });
    if (!usuario) {
      throw new NotFoundException("Usuário não encontrado");
    }

    const periodosValidos: Array<moment.unitOfTime.StartOf> = [
      "day",
      "week",
      "month",
      "quarter",
      "year",
    ];
    if (!periodosValidos.includes(periodo as moment.unitOfTime.StartOf)) {
      throw new BadRequestException(
        `Período inválido\n Períodos válidos: day, week, month, quarter, year`
      );
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
        dataHoraEntrada: Between(inicioPeriodo.toDate(), fimPeriodo.toDate()),
      },
    });

    let totalMinutos = 0;
    registros.forEach((registro) => {
      const entrada = new Date(registro.dataHoraEntrada);
      const saida = registro.dataHoraSaida
        ? new Date(registro.dataHoraSaida)
        : new Date();
      const diferenca = (saida.getTime() - entrada.getTime()) / (1000 * 60);
      totalMinutos += diferenca;
    });

    const totalHoras = totalMinutos / 60;

    const ultimaEntrada =
      registros.length > 0 ? registros[0].dataHoraEntrada : null;
    const ultimaSaida =
      registros.length > 0 ? registros[0].dataHoraSaida : null;

    return {
      usuario: usuario.nome,
      email: usuario.email,
      rfid: usuario.cartaoID,
      totalMinutos,
      totalHoras,
      ultimaEntrada,
      ultimaSaida,
    };
  }

  private readonly LIMITE_MAX_DE_PAG = 50;
  async buscarRegistros(
    pagina: number = 1,
    qntPorPag: number = 10,
    email?: string
  ): Promise<{
    registros: Registro[];
    total: number;
    pagina: number;
    quantidadeMaxPorPag: number;
    totalDePaginasPossiveis: number;
  }> {
    if (qntPorPag > this.LIMITE_MAX_DE_PAG) {
      qntPorPag = this.LIMITE_MAX_DE_PAG;
    }
    const query = this.registroRepository
      .createQueryBuilder("registro")
      .leftJoinAndSelect("registro.usuario", "usuario")
      .orderBy("registro.dataHoraEntrada", "DESC")
      .skip((pagina - 1) * qntPorPag)
      .take(qntPorPag);

    if (email) {
      query.andWhere("usuario.email = :email", { email });
    }

    const [registros, total] = await query.getManyAndCount();
    const totalDePaginasPossiveis = Math.ceil(total / qntPorPag);

    return {
      registros,
      total,
      pagina,
      quantidadeMaxPorPag: this.LIMITE_MAX_DE_PAG,
      totalDePaginasPossiveis,
    };
  }
  async calcularTempoTotalEmMinutos(
    usuarioID: number,
    dataInicio: Date,
    dataFim: Date
  ): Promise<number> {
    const registros = await this.registroRepository.find({
      where: {
        usuario: { usuarioID },
        dataHoraEntrada: Between(dataInicio, dataFim),
      },
    });

    let totalMinutos = 0;
    registros.forEach((registro) => {
      const entrada = new Date(registro.dataHoraEntrada);
      const saida = registro.dataHoraSaida
        ? new Date(registro.dataHoraSaida)
        : new Date();
      const diferenca = (saida.getTime() - entrada.getTime()) / (1000 * 60);
      totalMinutos += diferenca;
    });
    return totalMinutos;
  }
}
