import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { Usuario } from './usuario.entity';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('usuario')
export class UsuarioController {
    constructor(private usuarioService: UsuarioService) { }

    @Get('listar-bolsistas')
    @UseGuards(JwtAuthGuard, AdminAuthGuard)
    async listarBolsistas(): Promise<Usuario[]> {
        return this.usuarioService.listarBolsistas();
    }
}
