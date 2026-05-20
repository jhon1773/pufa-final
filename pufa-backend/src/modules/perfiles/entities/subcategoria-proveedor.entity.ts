import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { CategoriaProveedor } from './categoria-proveedor.entity';
import { EspecialidadProveedor } from './especialidad-proveedor.entity';

@Entity('subcategorias_proveedor')
export class SubcategoriaProveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  categoria_proveedor_id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => CategoriaProveedor, (c) => c.subcategorias)
  @JoinColumn({ name: 'categoria_proveedor_id' })
  categoria: CategoriaProveedor;

  @OneToMany(() => EspecialidadProveedor, (e) => e.subcategoria)
  especialidades: EspecialidadProveedor[];
}
