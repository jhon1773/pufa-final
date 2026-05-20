import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { TipoIdentificacion } from '../../catalogos/entities/tipo-identificacion.entity';
import { Municipio } from '../../catalogos/entities/municipio.entity';
import { SexoNacer } from '../../catalogos/entities/sexo-nacer.entity';
import { IdentidadGenero } from '../../catalogos/entities/identidad-genero.entity';
import { GrupoEtnico } from '../../catalogos/entities/grupo-etnico.entity';
import { TipoDiscapacidad } from '../../catalogos/entities/tipo-discapacidad.entity';
import { NivelEducativo } from '../../catalogos/entities/nivel-educativo.entity';
import { TiempoDedicacionSector } from '../../catalogos/entities/tiempo-dedicacion-sector.entity';
import { TipoIngresosSector } from '../../catalogos/entities/tipo-ingresos-sector.entity';
import { TipoPropiedadEquipos } from '../../catalogos/entities/tipo-propiedad-equipos.entity';
import { GamaEquipos } from '../../catalogos/entities/gama-equipos.entity';
import { RangoExperienciaSector } from '../../catalogos/entities/rango-experiencia-sector.entity';
import { TipoProduccionParticipa } from '../../catalogos/entities/tipo-produccion-participa.entity';

@Entity('personas_naturales')
export class PersonaNatural {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario_id: number;

  @Column({ length: 100 })
  primer_nombre: string;

  @Column({ length: 100, nullable: true })
  segundo_nombre: string;

  @Column({ length: 100 })
  primer_apellido: string;

  @Column({ length: 100, nullable: true })
  segundo_apellido: string;

  @Column({ nullable: true })
  tipo_identificacion_id: number;

  @Column({ length: 30 })
  numero_documento: string;

  @Column({ nullable: true })
  municipio_residencia_id: number;

  @Column({ length: 255, nullable: true })
  direccion: string;

  @Column({ length: 255, nullable: true })
  lugar_nacimiento: string;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: Date;

  @Column({ nullable: true })
  sexo_nacer_id: number;

  @Column({ nullable: true })
  identidad_genero_id: number;

  @Column({ default: false })
  pertenece_grupo_etnico: boolean;

  @Column({ nullable: true })
  grupo_etnico_id: number;

  @Column({ default: false })
  tiene_discapacidad: boolean;

  @Column({ nullable: true })
  tipo_discapacidad_id: number;

  @Column({ default: false })
  vive_zona_rural: boolean;

  @Column({ default: false })
  se_considera_campesino: boolean;

  @Column({ default: false })
  victima_conflicto_armado: boolean;

  @Column({ default: false })
  migrante_refugiado: boolean;

  @Column({ nullable: true })
  nivel_educativo_id: number;

  @Column({ nullable: true })
  tiempo_dedicacion_sector_id: number;

  @Column({ nullable: true })
  ingresos_provienen_sector_id: number;

  @Column({ nullable: true })
  equipos_propios_tipo_id: number;

  @Column({ nullable: true })
  gama_equipos_id: number;

  @Column({ nullable: true })
  tiempo_experiencia_sector_id: number;

  @Column({ nullable: true })
  produccion_participa_id: number;

  // Nivel de inglés del 0 al 5 en cada habilidad
  @Column({ type: 'smallint', default: 0 })
  ingles_habla: number;

  @Column({ type: 'smallint', default: 0 })
  ingles_lee: number;

  @Column({ type: 'smallint', default: 0 })
  ingles_escribe: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => TipoIdentificacion)
  @JoinColumn({ name: 'tipo_identificacion_id' })
  tipo_identificacion: TipoIdentificacion;

  @ManyToOne(() => Municipio)
  @JoinColumn({ name: 'municipio_residencia_id' })
  municipio_residencia: Municipio;

  @ManyToOne(() => SexoNacer)
  @JoinColumn({ name: 'sexo_nacer_id' })
  sexo_nacer: SexoNacer;

  @ManyToOne(() => IdentidadGenero)
  @JoinColumn({ name: 'identidad_genero_id' })
  identidad_genero: IdentidadGenero;

  @ManyToOne(() => GrupoEtnico)
  @JoinColumn({ name: 'grupo_etnico_id' })
  grupo_etnico: GrupoEtnico;

  @ManyToOne(() => TipoDiscapacidad)
  @JoinColumn({ name: 'tipo_discapacidad_id' })
  tipo_discapacidad: TipoDiscapacidad;

  @ManyToOne(() => NivelEducativo)
  @JoinColumn({ name: 'nivel_educativo_id' })
  nivel_educativo: NivelEducativo;

  @ManyToOne(() => TiempoDedicacionSector)
  @JoinColumn({ name: 'tiempo_dedicacion_sector_id' })
  tiempo_dedicacion_sector: TiempoDedicacionSector;

  @ManyToOne(() => TipoIngresosSector)
  @JoinColumn({ name: 'ingresos_provienen_sector_id' })
  ingresos_provienen_sector: TipoIngresosSector;

  @ManyToOne(() => TipoPropiedadEquipos)
  @JoinColumn({ name: 'equipos_propios_tipo_id' })
  equipos_propios_tipo: TipoPropiedadEquipos;

  @ManyToOne(() => GamaEquipos)
  @JoinColumn({ name: 'gama_equipos_id' })
  gama_equipos: GamaEquipos;

  @ManyToOne(() => RangoExperienciaSector)
  @JoinColumn({ name: 'tiempo_experiencia_sector_id' })
  tiempo_experiencia_sector: RangoExperienciaSector;

  @ManyToOne(() => TipoProduccionParticipa)
  @JoinColumn({ name: 'produccion_participa_id' })
  produccion_participa: TipoProduccionParticipa;
}
