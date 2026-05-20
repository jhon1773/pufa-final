import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rangos_experiencia_sector')
export class RangoExperienciaSector {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;
}
