import { Module, forwardRef } from '@nestjs/common';
import { MetaService } from './meta.service';
import { MetaController } from './meta.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meta } from './meta.entity';
import { UsuarioModule } from '../usuario/usuarios.module';
import { EmailModule } from 'src/email/email.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Meta]),
        UsuarioModule,
        forwardRef(() => EmailModule),
    ],
    providers: [MetaService],
    controllers: [MetaController],
    exports: [MetaService],
})
export class MetaModule { }
