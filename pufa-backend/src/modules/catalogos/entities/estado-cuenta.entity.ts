import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('estados_cuenta')
export class EstadoCuenta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ default: true })
  activo: boolean;
}
