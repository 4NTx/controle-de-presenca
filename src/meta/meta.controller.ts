import { Controller, Body, Post, Req, Get, UseGuards } from '@nestjs/common';
import { MetaService } from './meta.service';
import { Meta } from './meta.entity';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { Request } from 'express';
import { UsuarioService } from '../usuario/usuario.service';
import { Usuario } from 'src/usuario/usuario.entity';

@Controller('meta')
export class MetaController {
    constructor(private metaService: MetaService, private usuarioService: UsuarioService) { }

    @Get('listar-metas')
    @UseGuards(JwtAuthGuard, AdminAuthGuard)
    async listarMetas() {
        const metas = await this.metaService.listarMetas();
        return metas.map(meta => ({
            usuarioID: meta.usuario.usuarioID,
            nome: meta.usuario.nome,
            email: meta.usuario.email,
            metaID: meta.metaID,
            horas: meta.horas,
            dataCriacao: meta.dataCriacao,
            dataExpiracao: meta.dataExpiracao,
            dataAtualizacao: meta.dataAtualizacao
        }));
    }

    @Post('definir-meta')
    @UseGuards(JwtAuthGuard, AdminAuthGuard)
    async definirMeta(
        @Req() req: Request,
        @Body('usuarioID') usuarioID: number,
        @Body('horas') horas: number
    ): Promise<Meta> {
        const admin = (req as any).user as Usuario;
        const usuario = await this.usuarioService.buscarUsuarioPorID(usuarioID);
        return this.metaService.criarOuAtualizarMeta(usuario, horas, admin);
    }
}
