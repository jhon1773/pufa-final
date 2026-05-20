import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PerfilProveedor } from './entities/perfil-proveedor.entity';
import { PerfilProductora } from './entities/perfil-productora.entity';
import { PerfilAcademico } from './entities/perfil-academico.entity';
import { CategoriaProveedor } from './entities/categoria-proveedor.entity';
import { SubcategoriaProveedor } from './entities/subcategoria-proveedor.entity';
import { EspecialidadProveedor } from './entities/especialidad-proveedor.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class PerfilesService {
  constructor(
    @InjectRepository(PerfilProveedor) private perfilesProveedorRepo: Repository<PerfilProveedor>,
    @InjectRepository(PerfilProductora) private perfilesProductoraRepo: Repository<PerfilProductora>,
    @InjectRepository(PerfilAcademico) private perfilesAcademicoRepo: Repository<PerfilAcademico>,
    @InjectRepository(CategoriaProveedor) private categoriasRepo: Repository<CategoriaProveedor>,
    @InjectRepository(SubcategoriaProveedor) private subcategoriasRepo: Repository<SubcategoriaProveedor>,
    @InjectRepository(EspecialidadProveedor) private especialidadesRepo: Repository<EspecialidadProveedor>,
    @InjectRepository(Usuario) private usuariosRepo: Repository<Usuario>,
  ) {}

  // Obtiene el catálogo completo de categorías con subcategorías y especialidades
  async obtenerCatalogoCategorias() {
    return this.categoriasRepo.find({
      where: { activo: true },
      relations: ['subcategorias', 'subcategorias.especialidades'],
      order: { id: 'ASC' },
    });
  }

  // Crea o actualiza el perfil de proveedor
  async guardarPerfilProveedor(
    usuarioId: number,
    datos: Partial<PerfilProveedor> & { subcategoria_ids?: number[]; especialidad_ids?: number[] },
  ) {
    let perfil = await this.perfilesProveedorRepo.findOne({
      where: { usuario_id: usuarioId },
      relations: ['subcategorias', 'especialidades'],
    });

    if (!perfil) {
      perfil = this.perfilesProveedorRepo.create({ usuario_id: usuarioId });
    }

    // Actualiza campos básicos del perfil
    Object.assign(perfil, {
      descripcion_perfil: datos.descripcion_perfil,
      experiencia_sector_id: datos.experiencia_sector_id,
      sitio_web: datos.sitio_web,
      visible_directorio: datos.visible_directorio ?? true,
    });

    // Asigna subcategorías seleccionadas
    if (datos.subcategoria_ids?.length) {
      perfil.subcategorias = await this.subcategoriasRepo.find({
        where: { id: In(datos.subcategoria_ids) },
      });
    }

    // Asigna especialidades seleccionadas
    if (datos.especialidad_ids?.length) {
      perfil.especialidades = await this.especialidadesRepo.find({
        where: { id: In(datos.especialidad_ids) },
      });
    }

    return this.perfilesProveedorRepo.save(perfil);
  }

  // Crea o actualiza perfil de productora
  async guardarPerfilProductora(usuarioId: number, datos: Partial<PerfilProductora>) {
    let perfil = await this.perfilesProductoraRepo.findOne({ where: { usuario_id: usuarioId } });
    if (!perfil) {
      perfil = this.perfilesProductoraRepo.create({ usuario_id: usuarioId });
    }
    Object.assign(perfil, datos);
    return this.perfilesProductoraRepo.save(perfil);
  }

  // Lista proveedores en directorio con paginación
  async listarDirectorioProveedores(page = 1, limit = 20, subcategoriaId?: number) {
    const query = this.perfilesProveedorRepo
      .createQueryBuilder('perfil')
      .leftJoinAndSelect('perfil.usuario', 'usuario')
      .leftJoinAndSelect('perfil.subcategorias', 'subcategoria')
      .leftJoinAndSelect('perfil.especialidades', 'especialidad')
      .where('perfil.visible_directorio = true')
      .andWhere('perfil.verificado = true');

    if (subcategoriaId) {
      query.andWhere('subcategoria.id = :subcategoriaId', { subcategoriaId });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // Verifica un proveedor (solo admin)
  async verificarProveedor(perfilId: number) {
    const perfil = await this.perfilesProveedorRepo.findOne({ where: { id: perfilId } });
    if (!perfil) throw new NotFoundException('Perfil de proveedor no encontrado');
    await this.perfilesProveedorRepo.update(perfilId, { verificado: true });
    return { mensaje: 'Proveedor verificado exitosamente' };
  }

  // Lista todos los perfiles pendientes de verificación
  async listarPerfilesVerificacion() {
    const perfiles = await this.perfilesProveedorRepo.find({
      relations: ['usuario'],
      order: { fecha_creacion: 'DESC' },
    });

    return {
      ok: true,
      data: perfiles.map((p) => ({
        id: p.id,
        nombre: p.usuario?.email?.split('@')[0] || 'N/A',
        email: p.usuario?.email || 'N/A',
        tipo: 'Proveedor',
        estado: p.estado || 'pendiente',
        telefono: p.telefono || 'N/A',
        sitio_web: p.sitio_web || 'N/A',
        descripcion: p.descripcion_perfil || 'N/A',
        fecha: p.fecha_creacion?.toISOString().split('T')[0] || 'N/A',
        activo: p.activo,
        fecha_actualizacion: p.fecha_actualizacion?.toISOString().split('T')[0],
      })),
    };
  }

  // Obtiene los detalles de un perfil específico
  async obtenerDetallesVerificacion(perfilId: number) {
    const perfil = await this.perfilesProveedorRepo.findOne({
      where: { id: perfilId },
      relations: ['usuario'],
    });

    if (!perfil) {
      return {
        ok: false,
        error: 'Perfil no encontrado',
      };
    }

    return {
      ok: true,
      data: {
        id: perfil.id,
        nombre: perfil.usuario?.email?.split('@')[0] || 'N/A',
        email: perfil.usuario?.email || 'N/A',
        tipo: 'Proveedor',
        estado: perfil.estado || 'pendiente',
        telefono: perfil.telefono || 'N/A',
        sitio_web: perfil.sitio_web || 'N/A',
        descripcion: perfil.descripcion_perfil || 'N/A',
        fecha: perfil.fecha_creacion?.toISOString().split('T')[0] || 'N/A',
        activo: perfil.activo,
        fecha_actualizacion: perfil.fecha_actualizacion?.toISOString().split('T')[0],
        motivo_rechazo: perfil.motivo_rechazo || null,
      },
    };
  }

  // Aprueba un perfil de verificación
  async aprobarPerfil(perfilId: number) {
    const perfil = await this.perfilesProveedorRepo.findOne({ where: { id: perfilId } });

    if (!perfil) {
      return {
        ok: false,
        error: 'Perfil no encontrado',
      };
    }

    await this.perfilesProveedorRepo.update(perfilId, {
      estado: 'aprobado',
      verificado: true,
      activo: true,
      motivo_rechazo: null,
    });

    return {
      ok: true,
      mensaje: 'Perfil aprobado correctamente',
    };
  }

  // Rechaza un perfil de verificación
  async rechazarPerfil(perfilId: number, motivo: string = 'No especificado') {
    const perfil = await this.perfilesProveedorRepo.findOne({ where: { id: perfilId } });

    if (!perfil) {
      return {
        ok: false,
        error: 'Perfil no encontrado',
      };
    }

    await this.perfilesProveedorRepo.update(perfilId, {
      estado: 'rechazado',
      verificado: false,
      activo: false,
      motivo_rechazo: motivo,
    });

    return {
      ok: true,
      mensaje: 'Perfil rechazado correctamente',
    };
  }

  // Elimina un perfil de verificación
  async eliminarPerfil(perfilId: number) {
    const perfil = await this.perfilesProveedorRepo.findOne({ where: { id: perfilId } });

    if (!perfil) {
      return {
        ok: false,
        error: 'Perfil no encontrado',
      };
    }

    await this.perfilesProveedorRepo.remove(perfil);

    return {
      ok: true,
      mensaje: 'Perfil eliminado correctamente',
    };
  }

  // Crea un perfil de proveedor para un usuario existente (desde admin)
  async crearPerfilProveedorAdmin(data: {
    email: string;
    telefono?: string;
    sitio_web?: string;
    descripcion?: string;
  }) {
    const usuario = await this.usuariosRepo.findOne({
      where: { email: data.email },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con email ${data.email} no encontrado`);
    }

    // Verifica si el usuario ya tiene perfil
    const perfilExistente = await this.perfilesProveedorRepo.findOne({
      where: { usuario_id: usuario.id },
    });

    if (perfilExistente) {
      throw new BadRequestException(`El usuario ${data.email} ya tiene un perfil creado`);
    }

    // Crea el nuevo perfil
    const perfil = this.perfilesProveedorRepo.create();
    perfil.usuario_id = usuario.id;
    perfil.telefono = data.telefono || '';
    perfil.sitio_web = data.sitio_web || '';
    perfil.descripcion_perfil = data.descripcion || '';
    perfil.estado = 'pendiente';
    perfil.verificado = false;
    perfil.activo = true;

    await this.perfilesProveedorRepo.save(perfil);

    return {
      ok: true,
      data: {
        id: perfil.id,
        email: usuario.email,
        estado: perfil.estado,
        mensaje: `Perfil creado exitosamente para ${usuario.email}`,
      },
    };
  }
}
