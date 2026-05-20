import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { SubcategoriaProveedor } from './subcategoria-proveedor.entity';

@Entity('especialidades_proveedor')
export class EspecialidadProveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subcategoria_proveedor_id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => SubcategoriaProveedor, (s) => s.especialidades)
  @JoinColumn({ name: 'subcategoria_proveedor_id' })
  subcategoria: SubcategoriaProveedor;
}
