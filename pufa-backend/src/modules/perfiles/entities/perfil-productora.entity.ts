import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RangoExperienciaSector } from '../../catalogos/entities/rango-experiencia-sector.entity';

@Entity('perfiles_productora')
export class PerfilProductora {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario_id: number;

  @Column({ length: 255, nullable: true })
  nombre_publico: string;

  @Column({ nullable: true })
  experiencia_sector_id: number;

  @Column({ type: 'text', nullable: true })
  descripcion_empresa: string;

  @Column({ length: 255, nullable: true })
  sitio_web: string;

  @Column({ default: true })
  visible_directorio: boolean;

  @Column({ default: false })
  verificado: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => RangoExperienciaSector)
  @JoinColumn({ name: 'experiencia_sector_id' })
  experiencia_sector: RangoExperienciaSector;
}
