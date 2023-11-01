import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { UsuarioController } from './usuarios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [UsuarioService],
  controllers: [UsuarioController],
  exports: [UsuarioService, TypeOrmModule],  // Certifique-se de exportar o UsuarioService e TypeOrmModule
})
export class UsuarioModule { }