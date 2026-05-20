import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Tramite } from './tramite.entity';
import { Municipio } from '../../catalogos/entities/municipio.entity';
import { TipoEspacio } from '../../catalogos/entities/tipo-espacio.entity';

@Entity('tramite_locaciones')
export class TramiteLocacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tramite_id: number;

  @Column({ nullable: true })
  municipio_id: number;

  @Column({ nullable: true })
  tipo_espacio_id: number;

  @Column({ length: 30, nullable: true })
  origen_tipo: string;

  @Column({ nullable: true })
  origen_id: number;

  @Column({ length: 255 })
  nombre_lugar: string;

  @Column({ length: 255, nullable: true })
  direccion: string;

  @Column({ default: false })
  requiere_permiso_especial: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @ManyToOne(() => Tramite, (t) => t.locaciones)
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite;

  @ManyToOne(() => Municipio)
  @JoinColumn({ name: 'municipio_id' })
  municipio: Municipio;

  @ManyToOne(() => TipoEspacio)
  @JoinColumn({ name: 'tipo_espacio_id' })
  tipo_espacio: TipoEspacio;
}
