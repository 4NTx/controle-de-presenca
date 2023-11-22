import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegistroService } from "./registro.service";
import { RegistroController } from "./registro.controller";
import { Registro } from "./registro.entity";
import { UsuarioModule } from "../usuario/usuarios.module";
import { RFIDRevisar } from "./rfid_revisar.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Registro, RFIDRevisar]), UsuarioModule],
  providers: [RegistroService],
  controllers: [RegistroController],
  exports: [RegistroService],
})
export class RegistroModule {}
