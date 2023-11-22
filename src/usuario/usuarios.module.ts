import { Module, forwardRef } from "@nestjs/common";
import { UsuarioService } from "./usuario.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "./usuario.entity";
import { UsuarioController } from "./usuarios.controller";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [TypeOrmModule.forFeature([Usuario]), forwardRef(() => EmailModule)],
  providers: [UsuarioService],
  controllers: [UsuarioController],
  exports: [UsuarioService, TypeOrmModule],
})
export class UsuarioModule {}
