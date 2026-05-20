import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { PersonaNatural } from './entities/persona-natural.entity';
import { PersonaJuridica } from './entities/persona-juridica.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';
import { UsuarioRol } from '../auth/entities/usuario-rol.entity';
import { TipoPerfil } from '../catalogos/entities/tipo-perfil.entity';
import { CrearPersonaNaturalDto } from './dto/crear-persona-natural.dto';
import { CrearPersonaJuridicaDto } from './dto/crear-persona-juridica.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    @InjectRepository(PersonaNatural)
    private personasNaturalesRepo: Repository<PersonaNatural>,
    @InjectRepository(PersonaJuridica)
    private personasJuridicasRepo: Repository<PersonaJuridica>,
    @InjectRepository(EstadoCuenta)
    private estadosCuentaRepo: Repository<EstadoCuenta>,
    @InjectRepository(UsuarioRol)
    private usuarioRolesRepo: Repository<UsuarioRol>,
    @InjectRepository(TipoPerfil)
    private tiposPerfilRepo: Repository<TipoPerfil>,
  ) {}

  // Lista usuarios con paginación
  async listar(page = 1, limit = 20) {
    const [data, total] = await this.usuariosRepo.findAndCount({
      relations: ['estado_cuenta', 'tipo_perfil'],
      skip: (page - 1) * limit,
      take: limit,
      order: { fecha_registro: 'DESC' },
    });

    return {
      data: data.map((u) => this.mapearUsuario(u)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // Obtiene un usuario por ID
  async obtenerPorId(id: number) {
    const usuario = await this.usuariosRepo.findOne({
      where: { id },
      relations: ['estado_cuenta', 'tipo_perfil'],
    });
    if (!usuario) throw new NotFoundException(`Usuario #${id} no encontrado`);
    return this.mapearUsuario(usuario);
  }

  // Completa el perfil de persona natural
  async completarPerfilNatural(usuarioId: number, dto: CrearPersonaNaturalDto) {
    const usuario = await this.usuariosRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (usuario.tipo_persona !== 'natural') {
      throw new BadRequestException('Este usuario no es de tipo persona natural');
    }

    const existente = await this.personasNaturalesRepo.findOne({
      where: { usuario_id: usuarioId },
    });

    if (existente) {
      // Actualiza el perfil existente
      await this.personasNaturalesRepo.update(existente.id, { ...dto });
      return this.personasNaturalesRepo.findOne({ where: { id: existente.id } });
    }

    const nuevo = this.personasNaturalesRepo.create({ usuario_id: usuarioId, ...dto });
    return this.personasNaturalesRepo.save(nuevo);
  }

  // Completa el perfil de persona jurídica
  async completarPerfilJuridica(usuarioId: number, dto: CrearPersonaJuridicaDto) {
    const usuario = await this.usuariosRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (usuario.tipo_persona !== 'juridica') {
      throw new BadRequestException('Este usuario no es de tipo persona jurídica');
    }

    const existente = await this.personasJuridicasRepo.findOne({
      where: { usuario_id: usuarioId },
    });

    if (existente) {
      await this.personasJuridicasRepo.update(existente.id, { ...dto });
      return this.personasJuridicasRepo.findOne({ where: { id: existente.id } });
    }

    const nuevo = this.personasJuridicasRepo.create({ usuario_id: usuarioId, ...dto });
    return this.personasJuridicasRepo.save(nuevo);
  }

  // Aprueba o rechaza un usuario (solo admin)
  async cambiarEstado(
    usuarioId: number,
    nuevoEstadoCodigo: string,
    adminId: number,
    observaciones?: string,
  ) {
    const usuario = await this.usuariosRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const nuevoEstado = await this.estadosCuentaRepo.findOne({
      where: { codigo: nuevoEstadoCodigo },
    });
    if (!nuevoEstado) throw new BadRequestException('Estado de cuenta no válido');

    await this.usuariosRepo.update(usuarioId, {
      estado_cuenta_id: nuevoEstado.id,
      activo: nuevoEstadoCodigo === 'activo',
      fecha_aprobacion: nuevoEstadoCodigo === 'activo' ? new Date() : undefined,
    });

    return { mensaje: `Estado del usuario actualizado a: ${nuevoEstado.nombre}` };
  }

  // Asigna un rol a un usuario
  async asignarRol(usuarioId: number, rolId: number, adminId: number) {
    const existente = await this.usuarioRolesRepo.findOne({
      where: { usuario_id: usuarioId, rol_id: rolId },
    });

    if (existente) {
      if (!existente.activo) {
        await this.usuarioRolesRepo.update(existente.id, { activo: true, asignado_por: adminId });
        return { mensaje: 'Rol reactivado exitosamente' };
      }
      throw new BadRequestException('El usuario ya tiene este rol asignado');
    }

    const nuevoRol = this.usuarioRolesRepo.create({
      usuario_id: usuarioId,
      rol_id: rolId,
      asignado_por: adminId,
    });
    await this.usuarioRolesRepo.save(nuevoRol);
    return { mensaje: 'Rol asignado exitosamente' };
  }

  // Mapea entidad a DTO de respuesta (nunca expone password_hash)
  private mapearUsuario(usuario: Usuario) {
    return {
      id: usuario.id,
      email: usuario.email,
      tipo_persona: usuario.tipo_persona,
      telefono: usuario.telefono,
      estado_cuenta: usuario.estado_cuenta?.nombre,
      tipo_perfil: usuario.tipo_perfil?.nombre,
      ultimo_login: usuario.ultimo_login,
      fecha_registro: usuario.fecha_registro,
      activo: usuario.activo,
    };
  }
}
