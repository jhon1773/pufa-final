import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { SolicitudRegistro } from './solicitud-registro.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('historial_solicitudes_registro')
export class HistorialSolicitudRegistro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  solicitud_registro_id: number;

  @Column({ length: 50, nullable: true })
  estado_anterior: string;

  @Column({ length: 50 })
  estado_nuevo: string;

  @Column({ nullable: true })
  usuario_actor_id: number;

  @Column({ length: 100 })
  accion: string;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_cambio: Date;

  @ManyToOne(() => SolicitudRegistro, (s) => s.historial)
  @JoinColumn({ name: 'solicitud_registro_id' })
  solicitud_registro: SolicitudRegistro;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_actor_id' })
  usuario_actor: Usuario;
}
