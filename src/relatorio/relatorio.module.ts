import { Module } from '@nestjs/common';
import { RelatorioService } from './relatorio.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { UsuarioModule } from '../usuario/usuarios.module';
import { RegistroModule } from '../registro/registro.module';
import { Registro } from '../registro/registro.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registro]),
    RegistroModule,
    EmailModule,
    UsuarioModule,
  ],
  providers: [RelatorioService],
  controllers: [],
})
export class RelatorioModule { }
