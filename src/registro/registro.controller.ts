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

    @Get('listar-registros')
    @UseGuards(JwtAuthGuard, AdminAuthGuard)
    async listarRegistros(): Promise<Registro[]> {
        return this.registroService.listarRegistros();
    }

    @Get('calcular-tempo-total')
    @UseGuards(JwtAuthGuard, AdminAuthGuard)
    async calcularTempoTotal(@Query('usuarioID') usuarioID: number): Promise<{ totalMinutos: number }> {
        const totalMinutos = await this.registroService.calcularTempoTotal(usuarioID);
        return { totalMinutos };
    }
}