import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Tramite } from './entities/tramite.entity';
import { TramiteLocacion } from './entities/tramite-locacion.entity';
import { TramiteEquipoTecnico } from './entities/tramite-equipo-tecnico.entity';
import { HistorialTramite } from './entities/historial-tramite.entity';
import { EstadoTramite } from '../catalogos/entities/estado-tramite.entity';
import { CrearTramiteDto } from './dto/crear-tramite.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Proyecto } from '../proyectos/entities/proyecto.entity';

@Injectable()
export class TramitesService {
  private readonly logger = new Logger(TramitesService.name);

  constructor(
    @InjectRepository(Tramite) private tramitesRepo: Repository<Tramite>,
    @InjectRepository(TramiteLocacion) private locacionesRepo: Repository<TramiteLocacion>,
    @InjectRepository(TramiteEquipoTecnico) private equipoRepo: Repository<TramiteEquipoTecnico>,
    @InjectRepository(HistorialTramite) private historialRepo: Repository<HistorialTramite>,
    @InjectRepository(EstadoTramite) private estadosTramiteRepo: Repository<EstadoTramite>,
    @InjectRepository(Usuario) private usuariosRepo: Repository<Usuario>,
    @InjectRepository(Proyecto) private proyectosRepo: Repository<Proyecto>,
    private configService: ConfigService,
  ) {}

  // Lista trámites con paginación — admin ve todos, solicitante solo los suyos
  async listar(usuarioId: number, roles: string[], page = 1, limit = 20, estadoId?: number) {
    const esAdmin = roles.includes('admin') || roles.includes('revisor');
    const query = this.tramitesRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.estado_tramite', 'estado')
      .leftJoinAndSelect('t.tipo_tramite', 'tipo')
      .leftJoinAndSelect('t.proyecto', 'proyecto');

    if (!esAdmin) {
      query.where('t.usuario_solicitante_id = :usuarioId', { usuarioId });
    }

    if (estadoId) {
      query.andWhere('t.estado_tramite_id = :estadoId', { estadoId });
    }

    const [data, total] = await query
      .orderBy('t.fecha_solicitud', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // Obtiene trámite completo con todas sus relaciones
  async obtenerPorId(id: number, usuarioId: number, roles: string[]) {
    const tramite = await this.tramitesRepo.findOne({
      where: { id },
      relations: [
        'estado_tramite', 'tipo_tramite', 'proyecto',
        'usuario_solicitante',
        'locaciones', 'locaciones.tipo_espacio', 'locaciones.municipio',
        'equipo_tecnico', 'equipo_tecnico.rol_equipo_tecnico',
        'historial', 'historial.estado_anterior', 'historial.estado_nuevo', 'historial.usuario_actor',
      ],
    });
    if (!tramite) throw new NotFoundException(`Trámite #${id} no encontrado`);

    const esAdmin = roles.includes('admin') || roles.includes('revisor');
    if (!esAdmin && tramite.usuario_solicitante_id !== usuarioId) {
      throw new ForbiddenException('No tiene permiso para ver este trámite');
    }

    return tramite;
  }

  // Crea un nuevo trámite y genera número de radicado único
  async crear(usuarioId: number, dto: CrearTramiteDto) {
    if (!dto.compromiso_etico_aceptado || !dto.manejo_residuos_aceptado) {
      throw new BadRequestException('Debe aceptar todos los compromisos éticos obligatorios');
    }

    const estadoInicial = await this.estadosTramiteRepo.findOne({
      where: { nombre: 'Recibido' },
    });

    const numeroRadicado = this.generarNumeroRadicado();
    const porcentajeAbono = this.configService.get<number>('app.porcentajeAbonoDefault', 30);

    const tramite = this.tramitesRepo.create({
      proyecto_id: dto.proyecto_id,
      usuario_solicitante_id: usuarioId,
      tipo_tramite_id: dto.tipo_tramite_id,
      estado_tramite_id: estadoInicial?.id,
      numero_radicado: numeroRadicado,
      requiere_seguro_rc: dto.requiere_seguro_rc ?? false,
      requiere_aval_institucional: dto.requiere_aval_institucional ?? false,
      usa_drones: dto.usa_drones ?? false,
      requiere_permiso_aeronautica: dto.usa_drones ?? false,
      requiere_cierre_vias: dto.requiere_cierre_vias ?? false,
      requiere_plan_manejo_transito: dto.requiere_cierre_vias ?? false,
      compromiso_etico_aceptado: dto.compromiso_etico_aceptado,
      manejo_residuos_aceptado: dto.manejo_residuos_aceptado,
      consentimiento_comunidades_aplica: dto.consentimiento_comunidades_aplica ?? false,
      observaciones_generales: dto.observaciones_generales,
      porcentaje_abono: porcentajeAbono,
    });

    const tramiteGuardado = await this.tramitesRepo.save(tramite);

    // Guarda las locaciones del trámite
    if (dto.locaciones?.length) {
      const locaciones = dto.locaciones.map((l) =>
        this.locacionesRepo.create({ tramite_id: tramiteGuardado.id, ...l }),
      );
      await this.locacionesRepo.save(locaciones);
    }

    // Guarda el equipo técnico del trámite
    if (dto.equipo_tecnico?.length) {
      const equipo = dto.equipo_tecnico.map((e) =>
        this.equipoRepo.create({ tramite_id: tramiteGuardado.id, ...e }),
      );
      await this.equipoRepo.save(equipo);
    }

    // Registra el evento de creación en el historial
    await this.historialRepo.save(
      this.historialRepo.create({
        tramite_id: tramiteGuardado.id,
        estado_nuevo_id: estadoInicial?.id,
        usuario_actor_id: usuarioId,
        accion: 'CREACION_TRAMITE',
        observacion: `Trámite creado con radicado ${numeroRadicado}`,
      }),
    );

    await this.enviarNotificacionCreacionTramite(usuarioId, dto.proyecto_id, numeroRadicado);

    return tramiteGuardado;
  }

  private async enviarNotificacionCreacionTramite(
    usuarioId: number,
    proyectoId: number,
    numeroRadicado: string,
  ) {
    const smtpHost = this.configService.get<string>('app.smtpHost');
    const smtpPort = this.configService.get<number>('app.smtpPort', 587);
    const smtpSecure = this.configService.get<boolean>('app.smtpSecure', false);
    const smtpUser = this.configService.get<string>('app.smtpUser');
    const smtpPass = this.configService.get<string>('app.smtpPass');
    const smtpFrom = this.configService.get<string>('app.smtpFrom');
    const smtpAdminTo = this.configService.get<string>('app.smtpAdminTo');

    if (!smtpHost || !smtpFrom || !smtpUser || !smtpPass) {
      return;
    }

    try {
      const [usuario, proyecto] = await Promise.all([
        this.usuariosRepo.findOne({ where: { id: usuarioId } }),
        this.proyectosRepo.findOne({ where: { id: proyectoId } }),
      ]);

      if (!usuario?.email) {
        return;
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const nombreProyecto = proyecto?.nombre_proyecto ?? `Proyecto #${proyectoId}`;

      await transporter.sendMail({
        from: smtpFrom,
        to: usuario.email,
        subject: `PUFAB: Tu permiso está en trámite de aprobación (${numeroRadicado})`,
        html: `
          <h2>Tu permiso está en trámite de aprobación</h2>
          <p>Recibimos tu solicitud de permiso y ya está en proceso de revisión.</p>
          <p><strong>Radicado:</strong> ${numeroRadicado}</p>
          <p><strong>Proyecto:</strong> ${nombreProyecto}</p>
          <p>Te notificaremos cuando cambie de estado. Conserva este número para el seguimiento.</p>
        `,
      });

      if (smtpAdminTo && smtpAdminTo !== usuario.email) {
        await transporter.sendMail({
          from: smtpFrom,
          to: smtpAdminTo,
          subject: `PUFAB: nuevo trámite pendiente de revisión (${numeroRadicado})`,
          html: `
            <h2>Nuevo trámite pendiente de revisión</h2>
            <p>Un usuario envió un trámite que requiere validación.</p>
            <p><strong>Radicado:</strong> ${numeroRadicado}</p>
            <p><strong>Proyecto:</strong> ${nombreProyecto}</p>
            <p><strong>Solicitante:</strong> ${usuario.email}</p>
          `,
        });
      }
    } catch (error: any) {
      this.logger.warn(`No se pudo enviar correo de confirmación del trámite ${numeroRadicado}: ${error?.message ?? error}`);
    }
  }

  // Cambia el estado de un trámite (admin/revisor)
  async cambiarEstado(
    tramiteId: number,
    adminId: number,
    nuevoEstadoId: number,
    observacion: string,
  ) {
    const tramite = await this.tramitesRepo.findOne({ where: { id: tramiteId } });
    if (!tramite) throw new NotFoundException('Trámite no encontrado');

    const estadoAnteriorId = tramite.estado_tramite_id;
    await this.tramitesRepo.update(tramiteId, { estado_tramite_id: nuevoEstadoId });

    await this.historialRepo.save(
      this.historialRepo.create({
        tramite_id: tramiteId,
        estado_anterior_id: estadoAnteriorId,
        estado_nuevo_id: nuevoEstadoId,
        usuario_actor_id: adminId,
        accion: 'CAMBIO_ESTADO',
        observacion,
      }),
    );

    return { mensaje: 'Estado del trámite actualizado exitosamente' };
  }

  // Genera número de radicado único con formato PUFA-YYYYMMDD-XXXXXX
  private generarNumeroRadicado(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PUFA-${año}${mes}${dia}-${aleatorio}`;
  }
}
