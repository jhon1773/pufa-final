import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('estados_tramite')
export class EstadoTramite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: 0 })
  orden: number;

  @Column({ length: 20, nullable: true })
  color_semaforo: string;

  @Column({ default: true })
  activo: boolean;
}
