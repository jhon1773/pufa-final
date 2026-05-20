import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipos_perfil')
export class TipoPerfil {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;
}
