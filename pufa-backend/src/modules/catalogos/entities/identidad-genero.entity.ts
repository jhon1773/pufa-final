import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('identidades_genero')
export class IdentidadGenero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;
}
