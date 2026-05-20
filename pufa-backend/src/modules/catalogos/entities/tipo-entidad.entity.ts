import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipos_entidad')
export class TipoEntidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;
}
