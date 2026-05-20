import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tiempos_dedicacion_sector')
export class TiempoDedicacionSector {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;
}
