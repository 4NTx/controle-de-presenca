import { Controller, Get } from '@nestjs/common';
import { RelatorioService } from './relatorio.service';

@Controller('relatorio')
export class RelatorioController {
    constructor(private readonly relatorioService: RelatorioService) { }

    @Get('enviar-relatorio')
    async enviarRelatorioSemanal(): Promise<void> {
        return await this.relatorioService.enviarRelatorioSemanal();
    }
}

// APAGAR ISSO TUDO AQUI DEPOIS e retirar a importação no relatorio.module.ts