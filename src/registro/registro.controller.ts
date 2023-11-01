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

    @Get('calcular-tempo-total')
    @UseGuards(JwtAuthGuard, AdminAuthGuard)
    async calcularTempoTotal(@Query('usuarioID') usuarioID: number): Promise<{ totalMinutos: number }> {
        const totalMinutos = await this.registroService.calcularTempoTotal(usuarioID);
        return { totalMinutos };
    }

    @Get('buscar-registros')
    async buscarRegistros(
        @Query('pagina') pagina: number = 1, //registro/buscar-registros?pagina=1&itensPorPagina=1&email=EMAIl
        @Query('itensPorPagina') itensPorPagina: number = 50,
        @Query('email') email?: string
    ): Promise<{ registros: Registro[], total: number }> {
        return await this.registroService.buscarRegistros(pagina, itensPorPagina, email);
    }
}