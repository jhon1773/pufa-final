import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { TipoPago } from '../../catalogos/entities/tipo-pago.entity';
import { EstadoPago } from '../../catalogos/entities/estado-pago.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tramite_id: number;

  @Column()
  usuario_id: number;

  @Column({ nullable: true })
  tipo_pago_id: number;

  @Column({ nullable: true })
  estado_pago_id: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  monto: number;

  @Column({ length: 10, default: 'COP' })
  moneda: string;

  @Column({ length: 100, nullable: true })
  referencia_pago: string;

  // ID del documento que es el soporte/comprobante del pago
  @Column({ nullable: true })
  soporte_pago_documento_id: number;

  @Column({ type: 'date', nullable: true })
  fecha_pago: Date;

  @CreateDateColumn()
  fecha_registro: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => TipoPago)
  @JoinColumn({ name: 'tipo_pago_id' })
  tipo_pago: TipoPago;

  @ManyToOne(() => EstadoPago)
  @JoinColumn({ name: 'estado_pago_id' })
  estado_pago: EstadoPago;
}
