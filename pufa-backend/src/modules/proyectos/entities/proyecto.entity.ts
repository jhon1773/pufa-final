import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { TipoProduccion } from '../../catalogos/entities/tipo-produccion.entity';
import { Municipio } from '../../catalogos/entities/municipio.entity';

@Entity('proyectos')
export class Proyecto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuario_id: number;

  @Column({ nullable: true })
  tipo_produccion_id: number;

  @Column({ length: 255 })
  nombre_proyecto: string;

  @Column({ type: 'text', nullable: true })
  sinopsis: string;

  @Column({ nullable: true })
  municipio_principal_id: number;

  @Column({ type: 'date', nullable: true })
  fecha_inicio_prevista: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin_prevista: Date;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  presupuesto_total: number;

  @Column({ length: 50, nullable: true })
  tamano_equipo: string;

  @Column({ length: 255, nullable: true })
  contacto_principal: string;

  @Column({ nullable: true })
  servicio_requerido_id: number;

  @Column({ length: 30, nullable: true })
  telefono_contacto: string;

  @Column({ length: 50, default: 'borrador' })
  estado_proyecto: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => TipoProduccion)
  @JoinColumn({ name: 'tipo_produccion_id' })
  tipo_produccion: TipoProduccion;

  @ManyToOne(() => Municipio)
  @JoinColumn({ name: 'municipio_principal_id' })
  municipio_principal: Municipio;
}
