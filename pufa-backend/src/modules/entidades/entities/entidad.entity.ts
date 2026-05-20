import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { TipoEntidadRevision } from '../../catalogos/entities/tipo-entidad-revision.entity';
import { Municipio } from '../../catalogos/entities/municipio.entity';

@Entity('entidades')
export class Entidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ nullable: true })
  tipo_entidad_revision_id: number;

  @Column({ nullable: true })
  municipio_id: number;

  @Column({ length: 255, nullable: true })
  correo_contacto: string;

  @Column({ length: 30, nullable: true })
  telefono_contacto: string;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => TipoEntidadRevision)
  @JoinColumn({ name: 'tipo_entidad_revision_id' })
  tipo_entidad_revision: TipoEntidadRevision;

  @ManyToOne(() => Municipio)
  @JoinColumn({ name: 'municipio_id' })
  municipio: Municipio;
}
