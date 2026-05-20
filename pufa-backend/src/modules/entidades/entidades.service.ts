import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entidad } from './entities/entidad.entity';
import { CrearEntidadDto } from './dto/crear-entidad.dto';

@Injectable()
export class EntidadesService {
  constructor(
    @InjectRepository(Entidad)
    private entidadesRepo: Repository<Entidad>,
  ) {}

  // Lista entidades revisoras activas
  async listar(page = 1, limit = 50) {
    const [data, total] = await this.entidadesRepo.findAndCount({
      where: { activo: true },
      relations: ['tipo_entidad_revision', 'municipio'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async crear(dto: CrearEntidadDto) {
    const entidad = this.entidadesRepo.create(dto);
    return this.entidadesRepo.save(entidad);
  }

  async actualizar(id: number, dto: Partial<CrearEntidadDto>) {
    const entidad = await this.entidadesRepo.findOne({ where: { id } });
    if (!entidad) throw new NotFoundException('Entidad no encontrada');
    await this.entidadesRepo.update(id, dto);
    return this.entidadesRepo.findOne({ where: { id } });
  }

  async desactivar(id: number) {
    await this.entidadesRepo.update(id, { activo: false });
    return { mensaje: 'Entidad desactivada' };
  }
}
