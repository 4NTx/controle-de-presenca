import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { UsuarioModule } from '../usuario/usuarios.module';

@Module({
    providers: [EmailService],
    imports: [forwardRef(() => UsuarioModule)],
    exports: [EmailService],
})
export class EmailModule { }
