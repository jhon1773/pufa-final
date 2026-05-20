import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Tramite } from './tramite.entity';
import { EstadoRevisionEntidad } from '../../catalogos/entities/estado-revision-entidad.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Entidad } from '../../entidades/entities/entidad.entity';

@Entity('tramite_entidades')
export class TramiteEntidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tramite_id: number;

  @Column()
  entidad_id: number;

  @Column({ nullable: true })
  estado_revision_id: number;

  @Column({ type: 'timestamp', nullable: true })
  fecha_envio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_respuesta: Date;

  @Column({ nullable: true })
  usuario_revisor_id: number;

  @Column({ length: 50, nullable: true })
  concepto: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @ManyToOne(() => Tramite, (t) => t.entidades)
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite;

  @ManyToOne(() => Entidad)
  @JoinColumn({ name: 'entidad_id' })
  entidad: Entidad;

  @ManyToOne(() => EstadoRevisionEntidad)
  @JoinColumn({ name: 'estado_revision_id' })
  estado_revision: EstadoRevisionEntidad;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_revisor_id' })
  usuario_revisor: Usuario;
}
