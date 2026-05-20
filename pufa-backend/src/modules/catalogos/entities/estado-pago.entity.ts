import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('estados_pago')
export class EstadoPago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: 0 })
  orden: number;

  @Column({ default: true })
  activo: boolean;
}
