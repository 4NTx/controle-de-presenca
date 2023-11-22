import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { Usuario } from "../usuario/usuario.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../jwt/jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { EmailModule } from "../email/email.module";
import * as config from "dotenv";
import { UsuarioModule } from "../usuario/usuarios.module";
import { EmailService } from "../email/email.service";
config.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    PassportModule,
    EmailModule,
    UsuarioModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "7d" },
    }),
  ],
  providers: [AuthService, JwtStrategy, EmailService],
  controllers: [AuthController],
})
export class AuthModule {}
