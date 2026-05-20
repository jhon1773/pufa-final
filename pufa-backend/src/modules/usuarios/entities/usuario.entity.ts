import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne, JoinColumn,
} from 'typeorm';
import { EstadoCuenta } from '../../catalogos/entities/estado-cuenta.entity';
import { TipoPerfil } from '../../catalogos/entities/tipo-perfil.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  // Determina si es persona natural o jurídica
  @Column({ type: 'varchar', length: 20 })
  tipo_persona: 'natural' | 'juridica';

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 30, nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ length: 255 })
  password_hash: string;

  @Column({ nullable: true })
  estado_cuenta_id: number;

  @Column({ nullable: true })
  tipo_perfil_id: number;

  @Column({ type: 'timestamp', nullable: true })
  ultimo_login: Date;

  @CreateDateColumn()
  fecha_registro: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_aprobacion: Date;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => EstadoCuenta)
  @JoinColumn({ name: 'estado_cuenta_id' })
  estado_cuenta: EstadoCuenta;

  @ManyToOne(() => TipoPerfil)
  @JoinColumn({ name: 'tipo_perfil_id' })
  tipo_perfil: TipoPerfil;
}
