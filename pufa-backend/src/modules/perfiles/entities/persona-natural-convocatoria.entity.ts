import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { TipoConvocatoria } from '../../catalogos/entities/tipo-convocatoria.entity';

@Entity('persona_natural_convocatorias')
export class PersonaNaturalConvocatoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  persona_natural_id: number;

  @Column()
  tipo_convocatoria_id: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @ManyToOne(() => TipoConvocatoria)
  @JoinColumn({ name: 'tipo_convocatoria_id' })
  tipo_convocatoria: TipoConvocatoria;
}
