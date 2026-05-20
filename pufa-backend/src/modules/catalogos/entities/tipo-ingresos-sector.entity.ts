import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipos_ingresos_sector')
export class TipoIngresosSector {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;
}
