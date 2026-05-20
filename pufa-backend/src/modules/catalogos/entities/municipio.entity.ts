import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('municipios')
export class Municipio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 150, default: 'Boyacá' })
  departamento: string;
}
