import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { UsuarioRol } from './usuario-rol.entity';
import { RolPermiso } from './rol-permiso.entity';

@Entity('roles')
export class Rol {
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

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToMany(() => UsuarioRol, (ur) => ur.rol)
  usuario_roles: UsuarioRol[];

  @OneToMany(() => RolPermiso, (rp) => rp.rol)
  rol_permisos: RolPermiso[];
}
