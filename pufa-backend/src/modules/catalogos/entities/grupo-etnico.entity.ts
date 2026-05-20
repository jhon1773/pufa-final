import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('grupos_etnicos')
export class GrupoEtnico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;
}
