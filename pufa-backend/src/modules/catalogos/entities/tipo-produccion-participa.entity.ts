import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipos_produccion_participa')
export class TipoProduccionParticipa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;
}
