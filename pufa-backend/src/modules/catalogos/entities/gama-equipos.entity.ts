import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('gamas_equipos')
export class GamaEquipos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;
}
