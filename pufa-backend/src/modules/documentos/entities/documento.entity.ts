import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { TipoDocumento } from '../../catalogos/entities/tipo-documento.entity';

@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  usuario_id: number;

  // Documento puede pertenecer a solicitud de registro o a trámite
  @Column({ nullable: true })
  solicitud_registro_id: number;

  @Column({ nullable: true })
  tramite_id: number;

  @Column({ nullable: true })
  proyecto_id: number;

  @Column({ nullable: true })
  tipo_documento_id: number;

  // Versioning: permite subir nueva versión del mismo documento
  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ length: 255 })
  nombre_original: string;

  @Column({ length: 255 })
  nombre_guardado: string;

  @Column({ length: 500 })
  ruta_archivo: string;

  @Column({ length: 100, nullable: true })
  mime_type: string;

  @Column({ type: 'bigint', nullable: true })
  tamano_bytes: number;

  // Hash SHA256 para verificación de integridad del archivo
  @Column({ length: 64, nullable: true })
  hash_sha256: string;

  @Column({ length: 50, default: 'pendiente' })
  estado_validacion: string;

  @Column({ type: 'text', nullable: true })
  observaciones_validacion: string;

  @Column({ nullable: true })
  validado_por_usuario_id: number;

  @Column({ type: 'timestamp', nullable: true })
  fecha_validacion: Date;

  @CreateDateColumn()
  fecha_subida: Date;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => TipoDocumento)
  @JoinColumn({ name: 'tipo_documento_id' })
  tipo_documento: TipoDocumento;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'validado_por_usuario_id' })
  validado_por: Usuario;
}
