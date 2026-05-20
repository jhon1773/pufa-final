import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipos_discapacidad')
export class TipoDiscapacidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;
}
