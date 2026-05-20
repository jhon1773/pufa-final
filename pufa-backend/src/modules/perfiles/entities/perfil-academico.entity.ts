import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('perfiles_academico')
export class PerfilAcademico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario_id: number;

  @Column({ length: 255, nullable: true })
  institucion_educativa: string;

  @Column({ type: 'date', nullable: true })
  fecha_fin_estimada: Date;

  @Column({ default: false })
  tiene_aval_institucional: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
