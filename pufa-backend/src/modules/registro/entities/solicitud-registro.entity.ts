import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, OneToMany,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { HistorialSolicitudRegistro } from './historial-solicitud-registro.entity';

@Entity('solicitudes_registro')
export class SolicitudRegistro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuario_id: number;

  @Column({ length: 50, default: 'pendiente' })
  estado_solicitud: string;

  @CreateDateColumn()
  fecha_envio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_revision: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_respuesta: Date;

  @Column({ nullable: true })
  admin_revisor_id: number;

  @Column({ type: 'text', nullable: true })
  observaciones_admin: string;

  @Column({ default: 0 })
  numero_subsanaciones: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'admin_revisor_id' })
  admin_revisor: Usuario;

  @OneToMany(() => HistorialSolicitudRegistro, (h) => h.solicitud_registro)
  historial: HistorialSolicitudRegistro[];
}
