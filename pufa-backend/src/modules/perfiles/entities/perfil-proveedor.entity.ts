import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RangoExperienciaSector } from '../../catalogos/entities/rango-experiencia-sector.entity';
import { SubcategoriaProveedor } from './subcategoria-proveedor.entity';
import { EspecialidadProveedor } from './especialidad-proveedor.entity';

@Entity('perfiles_proveedor')
export class PerfilProveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario_id: number;

  @Column({ type: 'text', nullable: true })
  descripcion_perfil: string;

  @Column({ nullable: true })
  experiencia_sector_id: number;

  @Column({ length: 255, nullable: true })
  sitio_web: string;

  @Column({ default: true })
  visible_directorio: boolean;

  @Column({ default: false })
  verificado: boolean;

  @Column({ type: 'varchar', length: 50, default: 'pendiente' })
  estado: string; // 'pendiente', 'aprobado', 'rechazado'

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  motivo_rechazo: string | null;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => RangoExperienciaSector)
  @JoinColumn({ name: 'experiencia_sector_id' })
  experiencia_sector: RangoExperienciaSector;

  // Relación many-to-many con subcategorías
  @ManyToMany(() => SubcategoriaProveedor)
  @JoinTable({
    name: 'perfil_proveedor_subcategorias',
    joinColumn: { name: 'perfil_proveedor_id' },
    inverseJoinColumn: { name: 'subcategoria_proveedor_id' },
  })
  subcategorias: SubcategoriaProveedor[];

  // Relación many-to-many con especialidades
  @ManyToMany(() => EspecialidadProveedor)
  @JoinTable({
    name: 'perfil_proveedor_especialidades',
    joinColumn: { name: 'perfil_proveedor_id' },
    inverseJoinColumn: { name: 'especialidad_proveedor_id' },
  })
  especialidades: EspecialidadProveedor[];
}
