import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

@Entity('metas')
export class Meta {
    @PrimaryGeneratedColumn()
    metaID: number;

    @Column({ type: 'enum', enum: ['diaria', 'mensal', 'semanal', 'semestral', 'anual'] })
    tipoMeta: string;

    @Column({ type: 'text', nullable: true })
    comentario: string;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'usuarioID' })
    usuario: Usuario;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'adminID' })
    admin: Usuario;

    @Column({ nullable: true })
    horas: number;

    @Column()
    dataCriacao: Date;

    @Column({ nullable: true })
    dataExpiracao: Date;

    @Column({ nullable: true })
    dataAtualizacao: Date;

    @Column({ nullable: true })
    metaCumprida?: boolean;
}
