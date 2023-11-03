import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioModule } from './usuario/usuarios.module';
import { RegistroModule } from './registro/registro.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import * as config from 'dotenv';
config.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as any,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true, // Alterar em Produção
      logger: "advanced-console",
      timezone: '-03:00',
      logging: false
    }),
    UsuarioModule,
    RegistroModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
