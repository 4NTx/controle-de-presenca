import { Controller, Get, UseGuards, Post, Body, Query } from '@nestjs/common';
import { RegistroService } from './registro.service';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Registro } from './registro.entity';

@Controller('registro')
export class RegistroController {
    constructor(private readonly registroService: RegistroService) { }

    @Post('presenca')
    async registrarPresenca(@Body('cartaoID') cartaoID: string): Promise<string> {
        return await this.registroService.registrarPresenca(cartaoID);
    }

    @UseGuards(JwtAuthGuard, AdminAuthGuard)
    @Get('calcular-tempo-total')
    async calcularTempoTotal(
        @Query('usuarioID') usuarioID: number = 0,
        @Query('periodo') periodo: string = 'day',
        @Query('dataInicio') dataInicio?: string,
        @Query('dataFim') dataFim?: string
    ): Promise<{ usuario: string, email: string, rfid: string, totalMinutos: number, totalHoras: number }> {
        return await this.registroService.calcularTempoTotal(usuarioID, periodo, dataInicio, dataFim);
    }

    @UseGuards(JwtAuthGuard, AdminAuthGuard)
    @Get('buscar-registros')
    async buscarRegistros(
        @Query('pagina') pagina: number = 1,
        @Query('itensPorPagina') itensPorPagina: number = 50,
        @Query('email') email?: string
    ): Promise<{ registros: Registro[], total: number }> {
        return await this.registroService.buscarRegistros(pagina, itensPorPagina, email);
    }

}