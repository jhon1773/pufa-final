import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PersonaNatural } from '../usuarios/entities/persona-natural.entity';
import { PersonaJuridica } from '../usuarios/entities/persona-juridica.entity';
import { Rol } from './entities/rol.entity';
import { Permiso } from './entities/permiso.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { RolPermiso } from './entities/rol-permiso.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';
import { TipoPerfil } from '../catalogos/entities/tipo-perfil.entity';
import { LoginDto } from './dto/login.dto';
import { RegistroUsuarioDto } from './dto/registro-usuario.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { JwtPayload } from './strategies/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    @InjectRepository(Rol)
    private rolesRepo: Repository<Rol>,
    @InjectRepository(Permiso)
    private permisosRepo: Repository<Permiso>,
    @InjectRepository(UsuarioRol)
    private usuarioRolesRepo: Repository<UsuarioRol>,
    @InjectRepository(RolPermiso)
    private rolPermisosRepo: Repository<RolPermiso>,
    @InjectRepository(EstadoCuenta)
    private estadosCuentaRepo: Repository<EstadoCuenta>,
    @InjectRepository(TipoPerfil)
    private tiposPerfilRepo: Repository<TipoPerfil>,
    @InjectRepository(PersonaNatural)
    private personasNaturalesRepo: Repository<PersonaNatural>,
    @InjectRepository(PersonaJuridica)
    private personasJuridicasRepo: Repository<PersonaJuridica>,
    private jwtService: JwtService,
  ) {}

  private construirNombrePerfil(usuario: Usuario, perfilNatural?: PersonaNatural | null, perfilJuridica?: PersonaJuridica | null) {
    if (usuario.tipo_persona === 'juridica' && perfilJuridica) {
      return perfilJuridica.razon_social || usuario.email;
    }

    if (perfilNatural) {
      return [
        perfilNatural.primer_nombre,
        perfilNatural.segundo_nombre,
        perfilNatural.primer_apellido,
        perfilNatural.segundo_apellido,
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || usuario.email;
    }

    return usuario.email;
  }

  private async cargarPerfilCompleto(usuarioId: number) {
    const usuario = await this.usuariosRepo.findOne({
      where: { id: usuarioId },
      relations: ['estado_cuenta', 'tipo_perfil'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const [perfilNatural, perfilJuridica] = await Promise.all([
      this.personasNaturalesRepo.findOne({ where: { usuario_id: usuarioId } }),
      this.personasJuridicasRepo.findOne({ where: { usuario_id: usuarioId } }),
    ]);

    return { usuario, perfilNatural, perfilJuridica };
  }

  // Registra un nuevo usuario en estado PENDIENTE hasta que un admin lo apruebe
  async registrar(dto: RegistroUsuarioDto) {
    const existe = await this.usuariosRepo.findOne({ where: { email: dto.email } });
    if (existe) {
      throw new ConflictException('Ya existe un usuario registrado con ese correo electrónico');
    }

    let estadoPendiente = await this.estadosCuentaRepo.findOne({
      where: { codigo: 'pendiente' },
    });
    if (!estadoPendiente) {
      estadoPendiente = await this.estadosCuentaRepo.save(
        this.estadosCuentaRepo.create({
          codigo: 'pendiente',
          nombre: 'Pendiente de aprobación',
          activo: true,
        }),
      );
    }

    // Asegura que existe el estado 'activo'
    let estadoActivo = await this.estadosCuentaRepo.findOne({
      where: { codigo: 'activo' },
    });
    if (!estadoActivo) {
      estadoActivo = await this.estadosCuentaRepo.save(
        this.estadosCuentaRepo.create({
          codigo: 'activo',
          nombre: 'Cuenta activa',
          activo: true,
        }),
      );
    }

    const rolRegistro = dto.rolSolicitado || 'productora';
    const tipoPerfil = await this.tiposPerfilRepo.findOne({
      where: { codigo: rolRegistro, activo: true },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const nuevoUsuario = this.usuariosRepo.create({
      email: dto.email,
      password_hash: passwordHash,
      tipo_persona: dto.tipo_persona || 'natural',
      telefono: dto.telefono,
      estado_cuenta_id: estadoPendiente.id,
      tipo_perfil_id: tipoPerfil?.id ?? undefined,
      activo: false,
    });

    const usuarioGuardado = await this.usuariosRepo.save(nuevoUsuario);

    if (dto.tipo_persona === 'juridica' && dto.perfilJuridica) {
      await this.personasJuridicasRepo.save(
        this.personasJuridicasRepo.create({
          usuario_id: usuarioGuardado.id,
          ...dto.perfilJuridica,
        }),
      );
    }

    if (dto.tipo_persona !== 'juridica' && dto.perfilNatural) {
      await this.personasNaturalesRepo.save(
        this.personasNaturalesRepo.create({
          usuario_id: usuarioGuardado.id,
          ...dto.perfilNatural,
        }),
      );
    }

    return {
      mensaje: 'Registro exitoso. Tu cuenta quedó pendiente de aprobación.',
      usuario_id: usuarioGuardado.id,
      email: usuarioGuardado.email,
      estado: 'pendiente',
    };
  }

  // Valida credenciales y retorna token JWT con roles y permisos embebidos
  async login(dto: LoginDto) {
    const usuario = await this.usuariosRepo.findOne({
      where: { email: dto.email },
      relations: ['estado_cuenta', 'tipo_perfil'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Valida que el usuario esté activo y en estado 'activo'
    if (!usuario.activo) {
      throw new UnauthorizedException(
        `Su cuenta se encuentra inactiva. Estado actual: ${usuario.estado_cuenta?.nombre ?? 'pendiente de aprobación'}. Contacte al administrador.`,
      );
    }

    if (usuario.estado_cuenta?.codigo !== 'activo') {
      throw new UnauthorizedException(
        `Su cuenta se encuentra en estado: ${usuario.estado_cuenta?.nombre ?? 'pendiente de aprobación'}. Contacte al administrador.`,
      );
    }

    // Valida que el rol solicitado coincida con el tipo_perfil del usuario
    if (dto.rolSolicitado && usuario.tipo_perfil?.codigo !== dto.rolSolicitado) {
      throw new UnauthorizedException(
        `Este usuario no pertenece al rol "${dto.rolSolicitado}". Su perfil es: ${usuario.tipo_perfil?.nombre ?? 'desconocido'}.`,
      );
    }

    const [perfilNatural, perfilJuridica] = await Promise.all([
      this.personasNaturalesRepo.findOne({ where: { usuario_id: usuario.id } }),
      this.personasJuridicasRepo.findOne({ where: { usuario_id: usuario.id } }),
    ]);

    const nombreCompleto = this.construirNombrePerfil(usuario, perfilNatural, perfilJuridica);

    // Carga roles y permisos del usuario para embeber en el JWT
    const rolesPermisos = await this.obtenerRolesYPermisos(usuario.id);

    // Actualiza último login
    await this.usuariosRepo.update(usuario.id, { ultimo_login: new Date() });

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      roles: rolesPermisos.roles,
      permisos: rolesPermisos.permisos,
      tipoPerfil: usuario.tipo_perfil?.codigo ?? '',
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        tipo_persona: usuario.tipo_persona,
        nombre: nombreCompleto,
        avatar_url: usuario.avatar_url,
        bio: usuario.bio,
        estado_cuenta: usuario.estado_cuenta?.nombre,
        roles: rolesPermisos.roles,
        tipo_perfil: usuario.tipo_perfil?.codigo,
      },
    };
  }

  // Retorna información del usuario autenticado
  async obtenerPerfil(usuarioId: number) {
    const { usuario, perfilNatural, perfilJuridica } = await this.cargarPerfilCompleto(usuarioId);

    const rolesPermisos = await this.obtenerRolesYPermisos(usuarioId);
    const nombreCompleto = this.construirNombrePerfil(usuario, perfilNatural, perfilJuridica);

    return {
      id: usuario.id,
      email: usuario.email,
      tipo_persona: usuario.tipo_persona,
      telefono: usuario.telefono,
      avatar_url: usuario.avatar_url,
      bio: usuario.bio,
      nombre: nombreCompleto,
      estado_cuenta: usuario.estado_cuenta?.nombre,
      estado_cuenta_codigo: usuario.estado_cuenta?.codigo,
      tipo_perfil: usuario.tipo_perfil?.nombre,
      tipo_perfil_codigo: usuario.tipo_perfil?.codigo,
      roles: rolesPermisos.roles,
      permisos: rolesPermisos.permisos,
      ultimo_login: usuario.ultimo_login,
      fecha_registro: usuario.fecha_registro,
      perfil_natural: perfilNatural,
      perfil_juridico: perfilJuridica,
    };
  }

  async actualizarPerfil(usuarioId: number, dto: ActualizarPerfilDto) {
    const usuario = await this.usuariosRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const updates: Partial<Usuario> = {};

    if (dto.telefono !== undefined) {
      updates.telefono = dto.telefono?.trim() || undefined;
    }

    if (dto.bio !== undefined) {
      updates.bio = dto.bio?.trim() || undefined;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No se enviaron cambios válidos para actualizar');
    }

    await this.usuariosRepo.update(usuarioId, updates);
    return this.obtenerPerfil(usuarioId);
  }

  async actualizarFotoPerfil(usuarioId: number, avatarUrl: string) {
    const usuario = await this.usuariosRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    await this.usuariosRepo.update(usuarioId, { avatar_url: avatarUrl });
    return this.obtenerPerfil(usuarioId);
  }

  // Permite al usuario cambiar su propia contraseña
  async cambiarPassword(usuarioId: number, dto: CambiarPasswordDto) {
    const usuario = await this.usuariosRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const passwordValido = await bcrypt.compare(dto.password_actual, usuario.password_hash);
    if (!passwordValido) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const nuevoHash = await bcrypt.hash(dto.password_nuevo, 10);
    await this.usuariosRepo.update(usuarioId, { password_hash: nuevoHash });

    return { mensaje: 'Contraseña actualizada exitosamente' };
  }

  // Obtiene los códigos de roles y permisos de un usuario (para JWT)
  private async obtenerRolesYPermisos(usuarioId: number) {
    const usuarioRoles = await this.usuarioRolesRepo.find({
      where: { usuario_id: usuarioId, activo: true },
      relations: ['rol'],
    });

    const roles = usuarioRoles
      .filter((ur) => ur.rol?.activo)
      .map((ur) => ur.rol.codigo);

    const rolIds = usuarioRoles.map((ur) => ur.rol_id);
    if (rolIds.length === 0) return { roles, permisos: [] };

    const rolPermisos = await this.rolPermisosRepo.find({
      where: rolIds.map((id) => ({ rol_id: id, activo: true })),
      relations: ['permiso'],
    });

    const permisos = [
      ...new Set(
        rolPermisos
          .filter((rp) => rp.permiso?.activo)
          .map((rp) => rp.permiso.codigo),
      ),
    ];

    return { roles, permisos };
  }
}
