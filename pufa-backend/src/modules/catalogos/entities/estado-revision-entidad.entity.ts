import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('estados_revision_entidad')
export class EstadoRevisionEntidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: 0 })
  orden: number;

  @Column({ length: 20, nullable: true })
  color_semaforo: string;

  @Column({ default: true })
  activo: boolean;
}
