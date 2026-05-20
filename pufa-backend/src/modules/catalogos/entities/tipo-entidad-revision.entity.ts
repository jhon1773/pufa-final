import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipos_entidad_revision')
export class TipoEntidadRevision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;
}
