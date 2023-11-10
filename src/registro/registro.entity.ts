import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

@Entity('registros')
export class Registro {
  @PrimaryGeneratedColumn()
  registroID: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioID)
  @JoinColumn({ name: 'usuarioID' })
  usuario: Usuario;

  @Column()
  dataHoraEntrada: Date;

  @Column({ nullable: true })
  dataHoraSaida: Date;
}
