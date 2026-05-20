import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
} from 'typeorm';
import { SubcategoriaProveedor } from './subcategoria-proveedor.entity';

@Entity('categorias_proveedor')
export class CategoriaProveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => SubcategoriaProveedor, (s) => s.categoria)
  subcategorias: SubcategoriaProveedor[];
}
