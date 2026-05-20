import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { EstadoAbono } from '../../catalogos/entities/estado-abono.entity';
import { Pago } from './pago.entity';

@Entity('abonos')
export class Abono {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tramite_id: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  porcentaje_abono: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  monto_requerido: number;

  @Column({ nullable: true })
  estado_abono_id: number;

  @Column({ nullable: true })
  pago_id: number;

  @Column({ type: 'date', nullable: true })
  fecha_limite: Date;

  @Column({ type: 'date', nullable: true })
  fecha_pago_confirmado: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @ManyToOne(() => EstadoAbono)
  @JoinColumn({ name: 'estado_abono_id' })
  estado_abono: EstadoAbono;

  @ManyToOne(() => Pago)
  @JoinColumn({ name: 'pago_id' })
  pago: Pago;
}
