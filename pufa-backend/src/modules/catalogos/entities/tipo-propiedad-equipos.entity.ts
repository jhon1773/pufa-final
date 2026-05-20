import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipos_propiedad_equipos')
export class TipoPropiedadEquipos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;
}
