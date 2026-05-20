import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Tramite } from './tramite.entity';
import { RolEquipoTecnico } from '../../catalogos/entities/rol-equipo-tecnico.entity';

@Entity('tramite_equipo_tecnico')
export class TramiteEquipoTecnico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tramite_id: number;

  @Column({ nullable: true })
  rol_equipo_tecnico_id: number;

  @Column({ length: 255 })
  nombre_completo: string;

  @Column({ length: 30, nullable: true })
  identificacion: string;

  @Column({ length: 30, nullable: true })
  telefono: string;

  @Column({ length: 255, nullable: true })
  email: string;

  // Indicador de fomento al talento local boyacense
  @Column({ default: false })
  es_talento_local: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @ManyToOne(() => Tramite, (t) => t.equipo_tecnico)
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite;

  @ManyToOne(() => RolEquipoTecnico)
  @JoinColumn({ name: 'rol_equipo_tecnico_id' })
  rol_equipo_tecnico: RolEquipoTecnico;
}
