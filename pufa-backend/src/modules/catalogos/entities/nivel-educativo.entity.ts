import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('niveles_educativos')
export class NivelEducativo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;
}
