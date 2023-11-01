export interface JwtPayload {
    sub: number;
    nome: string;
    email: string;
    cargo: 'user' | 'admin';
}