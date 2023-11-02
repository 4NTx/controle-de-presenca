import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

@Entity('metas')
export class Meta {
    @PrimaryGeneratedColumn()
    metaID: number;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'usuarioID' })
    usuario: Usuario;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'adminID' })
    admin: Usuario;

    @Column()
    horas: number;

    @Column()
    dataCriacao: Date;

    @Column()
    dataExpiracao: Date;

    @Column()
    dataAtualizacao: Date;

    @Column({ nullable: true })
    cumpriu?: boolean;
}
