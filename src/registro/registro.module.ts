import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroService } from './registro.service';
import { RegistroController } from './registro.controller';
import { Registro } from './registro.entity';
import { UsuarioModule } from '../usuario/usuarios.module';
import { MetaModule } from 'src/meta/meta.modules';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registro]),
    UsuarioModule,
    MetaModule,
  ],
  providers: [RegistroService],
  controllers: [RegistroController],
  exports: [RegistroService],
})
export class RegistroModule { }
