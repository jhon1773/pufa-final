import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { CrearProyectoDto } from './dto/crear-proyecto.dto';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto)
    private proyectosRepo: Repository<Proyecto>,
    private readonly dataSource: DataSource,
  ) {}

  // Lista proyectos del usuario autenticado con paginación
  async listar(usuarioId: number, roles: string[], page = 1, limit = 20) {
    const esAdmin = roles.includes('admin');
    const where = esAdmin ? {} : { usuario_id: usuarioId };

    const [data, total] = await this.proyectosRepo.findAndCount({
      where,
      relations: ['tipo_produccion', 'municipio_principal'],
      skip: (page - 1) * limit,
      take: limit,
      order: { fecha_creacion: 'DESC' },
    });

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // Obtiene un proyecto por ID verificando pertenencia
  async obtenerPorId(id: number, usuarioId: number, roles: string[]) {
    const proyecto = await this.proyectosRepo.findOne({
      where: { id },
      relations: ['tipo_produccion', 'municipio_principal', 'usuario'],
    });
    if (!proyecto) throw new NotFoundException(`Proyecto #${id} no encontrado`);

    const esAdmin = roles.includes('admin');
    if (!esAdmin && proyecto.usuario_id !== usuarioId) {
      throw new ForbiddenException('No tiene permiso para ver este proyecto');
    }

    const tramites = await this.dataSource.query(
      `
      SELECT
        t.id,
        t.numero_radicado AS radicado,
        t.fecha_creacion,
        COALESCE(e.nombre, 'Pendiente') AS estado,
        t.estado_tramite_id,
        t.proyecto_id
      FROM tramites t
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      WHERE t.proyecto_id = $1::int
      ORDER BY t.fecha_creacion DESC, t.id DESC
    `,
      [id],
    );

    return {
      ...proyecto,
      tramites,
    };
  }

  // Crea un nuevo proyecto para el usuario autenticado
  async crear(usuarioId: number, dto: CrearProyectoDto) {
    const proyecto = this.proyectosRepo.create({
      usuario_id: usuarioId,
      ...dto,
      estado_proyecto: 'borrador',
    });
    return this.proyectosRepo.save(proyecto);
  }

  // Actualiza un proyecto existente
  async actualizar(id: number, usuarioId: number, roles: string[], dto: Partial<CrearProyectoDto>) {
    const proyecto = await this.obtenerPorId(id, usuarioId, roles);
    await this.proyectosRepo.update(id, { ...dto });
    return this.proyectosRepo.findOne({ where: { id }, relations: ['tipo_produccion'] });
  }
}
