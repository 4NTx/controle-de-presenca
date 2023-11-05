import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { UsuarioController } from './usuarios.controller';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [UsuarioService, EmailService],
  controllers: [UsuarioController],
  exports: [UsuarioService, TypeOrmModule],
})
export class UsuarioModule { }
