import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Tramite } from './tramite.entity';
import { EstadoTramite } from '../../catalogos/entities/estado-tramite.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('historial_tramite')
export class HistorialTramite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tramite_id: number;

  @Column({ nullable: true })
  estado_anterior_id: number;

  @Column({ nullable: true })
  estado_nuevo_id: number;

  @Column({ nullable: true })
  usuario_actor_id: number;

  @Column({ length: 100 })
  accion: string;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_cambio: Date;

  @ManyToOne(() => Tramite, (t) => t.historial)
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite;

  @ManyToOne(() => EstadoTramite)
  @JoinColumn({ name: 'estado_anterior_id' })
  estado_anterior: EstadoTramite;

  @ManyToOne(() => EstadoTramite)
  @JoinColumn({ name: 'estado_nuevo_id' })
  estado_nuevo: EstadoTramite;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_actor_id' })
  usuario_actor: Usuario;
}
