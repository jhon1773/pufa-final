import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { PersonaJuridica } from './persona-juridica.entity';

@Entity('persona_juridica_vigencias_estimulos')
export class VigenciaEstimulo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  persona_juridica_id: number;

  @Column({ type: 'int', comment: 'Año de la vigencia del estímulo' })
  vigencia: number;

  @Column({ type: 'text' })
  descripcion: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @ManyToOne(() => PersonaJuridica, (pj) => pj.vigencias_estimulos)
  @JoinColumn({ name: 'persona_juridica_id' })
  persona_juridica: PersonaJuridica;
}
