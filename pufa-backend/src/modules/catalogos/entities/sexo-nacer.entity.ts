import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sexos_nacer')
export class SexoNacer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;
}
