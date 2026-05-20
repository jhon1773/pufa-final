import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Rol } from './rol.entity';
import { Permiso } from './permiso.entity';

@Entity('rol_permisos')
export class RolPermiso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rol_id: number;

  @Column()
  permiso_id: number;

  @CreateDateColumn()
  fecha_asignacion: Date;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Rol, (rol) => rol.rol_permisos)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @ManyToOne(() => Permiso, (p) => p.rol_permisos)
  @JoinColumn({ name: 'permiso_id' })
  permiso: Permiso;
}
