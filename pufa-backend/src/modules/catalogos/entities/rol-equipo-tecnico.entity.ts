import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles_equipo_tecnico')
export class RolEquipoTecnico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;
}
