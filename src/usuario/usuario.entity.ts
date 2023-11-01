import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn()
    usuarioID: number;

    @Column()
    nome: string;

    @Column({ unique: true })
    email: string;

    @Column()
    whats: string;

    @Column({ nullable: true })
    senha: string;

    @Column({ unique: true })
    cartaoID: string;

    @Column({ default: 'user' })
    cargo: 'user' | 'admin';
}