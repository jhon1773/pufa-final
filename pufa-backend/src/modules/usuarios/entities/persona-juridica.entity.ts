import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { TipoEntidad } from '../../catalogos/entities/tipo-entidad.entity';
import { Municipio } from '../../catalogos/entities/municipio.entity';
import { TipoIdentificacion } from '../../catalogos/entities/tipo-identificacion.entity';
import { VigenciaEstimulo } from './vigencia-estimulo.entity';

@Entity('personas_juridicas')
export class PersonaJuridica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario_id: number;

  @Column({ length: 255 })
  razon_social: string;

  @Column({ length: 20, unique: true })
  nit: string;

  @Column({ nullable: true })
  tipo_entidad_id: number;

  @Column({ type: 'date', nullable: true })
  fecha_constitucion: Date;

  @Column({ type: 'text', nullable: true })
  objeto_social: string;

  @Column({ nullable: true })
  municipio_id: number;

  @Column({ length: 255, nullable: true })
  direccion_fisica: string;

  @Column({ length: 30, nullable: true })
  telefono_contacto: string;

  @Column({ length: 255, nullable: true })
  correo_institucional: string;

  @Column({ length: 255, nullable: true })
  pagina_web: string;

  @Column({ length: 255 })
  nombre_representante_legal: string;

  @Column({ nullable: true })
  tipo_documento_representante_id: number;

  @Column({ length: 30 })
  numero_documento_representante: string;

  @Column({ type: 'date', nullable: true })
  fecha_inicio_nombramiento: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin_nombramiento: Date;

  @Column({ type: 'text', nullable: true })
  areas_trabajo: string;

  @Column({ type: 'text', nullable: true })
  proyectos_realizados: string;

  @Column({ type: 'text', nullable: true })
  proyectos_en_curso: string;

  @Column({ type: 'text', nullable: true })
  publico_objetivo_beneficiarios: string;

  @Column({ default: false })
  registro_soy_cultura: boolean;

  @Column({ default: false })
  registro_observatorio_cultural_boyaca: boolean;

  @Column({ default: false })
  ha_recibido_estimulos_apoyos_publicos: boolean;

  @Column({ default: false })
  participa_redes_asociaciones: boolean;

  @Column({ type: 'text', nullable: true })
  cuales_redes_asociaciones: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => TipoEntidad)
  @JoinColumn({ name: 'tipo_entidad_id' })
  tipo_entidad: TipoEntidad;

  @ManyToOne(() => Municipio)
  @JoinColumn({ name: 'municipio_id' })
  municipio: Municipio;

  @ManyToOne(() => TipoIdentificacion)
  @JoinColumn({ name: 'tipo_documento_representante_id' })
  tipo_documento_representante: TipoIdentificacion;

  @OneToMany(() => VigenciaEstimulo, (v) => v.persona_juridica)
  vigencias_estimulos: VigenciaEstimulo[];
}
