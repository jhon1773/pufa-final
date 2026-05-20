import {
  Body,
  Controller,
  BadRequestException,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Logger,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { extname, join } from 'path';
import PDFDocument from 'pdfkit';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SVGtoPDF = require('svg-to-pdfkit');
import { AppService } from './app.service';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from './modules/auth/decorators/current-user.decorator';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private async enviarCorreoSiConfig(to: string, subject: string, html: string) {
    const smtpHost = this.configService.get<string>('app.smtpHost');
    const smtpPort = this.configService.get<number>('app.smtpPort', 587);
    const smtpSecure = this.configService.get<boolean>('app.smtpSecure', false);
    const smtpUser = this.configService.get<string>('app.smtpUser');
    const smtpPass = this.configService.get<string>('app.smtpPass');
    const smtpFrom = this.configService.get<string>('app.smtpFrom');

    if (!smtpHost || !smtpFrom || !smtpUser || !smtpPass || !to) {
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
      });
    } catch (error: any) {
      this.logger.warn(`No se pudo enviar correo a ${to}: ${error?.message ?? error}`);
    }
  }

  private async getPrimaryPerfilProveedorId() {
    const [perfil] = await this.dataSource.query(`
      SELECT p.id
      FROM perfiles_proveedor p
      WHERE p.visible_directorio = true
      ORDER BY p.id ASC
      LIMIT 1
    `);
    return perfil?.id ?? null;
  }

  private async getPerfilProveedorPorUsuario(usuarioId: number) {
    const [perfil] = await this.dataSource.query(
      `
      SELECT
        p.id,
        p.usuario_id,
        p.descripcion_perfil,
        p.sitio_web,
        p.verificado,
        p.visible_directorio,
        p.telefono,
        p.estado,
        p.activo,
        u.email,
        u.telefono AS usuario_telefono
      FROM perfiles_proveedor p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.usuario_id = $1::int
      LIMIT 1
    `,
      [usuarioId],
    );

    return perfil ?? null;
  }

  private async getOrCreatePerfilProveedorPorUsuario(usuarioId: number) {
    const perfilExistente = await this.getPerfilProveedorPorUsuario(usuarioId);
    if (perfilExistente) {
      return perfilExistente;
    }

    const [usuario] = await this.dataSource.query(
      `SELECT id, telefono FROM usuarios WHERE id = $1::int LIMIT 1`,
      [usuarioId],
    );

    if (!usuario) {
      throw new BadRequestException('No se encontró el usuario autenticado');
    }

    const [perfilNuevo] = await this.dataSource.query(
      `
      INSERT INTO perfiles_proveedor (usuario_id, telefono, visible_directorio, verificado, estado, activo)
      VALUES ($1::int, $2, true, false, 'pendiente', true)
      RETURNING id, usuario_id, descripcion_perfil, sitio_web, verificado, visible_directorio, telefono, estado, activo
    `,
      [usuarioId, usuario.telefono ?? null],
    );

    return perfilNuevo ?? null;
  }

  private async ensureProveedorPortalTables(perfilId: number) {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS proveedor_disponibilidad (
        id SERIAL PRIMARY KEY,
        perfil_proveedor_id INTEGER NOT NULL,
        dia_semana VARCHAR(20) NOT NULL,
        estado VARCHAR(30) NOT NULL,
        horas VARCHAR(80) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (perfil_proveedor_id, dia_semana)
      )
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS proveedor_mensajes (
        id SERIAL PRIMARY KEY,
        perfil_proveedor_id INTEGER NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        fecha DATE NOT NULL,
        texto TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS proveedor_servicios (
        id SERIAL PRIMARY KEY,
        perfil_proveedor_id INTEGER NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(120),
        precio NUMERIC(15,2) DEFAULT 0,
        imagen VARCHAR(255),
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS proveedor_galeria_trabajos (
        id SERIAL PRIMARY KEY,
        perfil_proveedor_id INTEGER NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(120),
        imagen VARCHAR(255) NOT NULL,
        orden INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const [dispCount] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM proveedor_disponibilidad WHERE perfil_proveedor_id = $1`,
      [perfilId],
    );

    if ((dispCount?.total ?? 0) === 0) {
      await this.dataSource.query(
        `
        INSERT INTO proveedor_disponibilidad (perfil_proveedor_id, dia_semana, estado, horas)
        VALUES
          ($1, 'Lunes', 'Disponible', '08:00 - 18:00'),
          ($1, 'Martes', 'Disponible', '08:00 - 18:00'),
          ($1, 'Miércoles', 'Reservado', 'Rodaje en campo'),
          ($1, 'Jueves', 'Disponible', '10:00 - 18:00'),
          ($1, 'Viernes', 'Disponible', '08:00 - 16:00')
      `,
        [perfilId],
      );
    }
  }

  private async resolveEstadoTramiteId(keywords: string[]) {
    const likePatterns = keywords.map((k) => `%${k.toLowerCase()}%`);
    const [estado] = await this.dataSource.query(
      `
      SELECT id
      FROM estados_tramite
      WHERE LOWER(nombre) LIKE ANY($1)
      ORDER BY id ASC
      LIMIT 1
    `,
      [likePatterns],
    );
    return estado?.id ?? null;
  }

  private async ensureAdminLocacionesTable() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS admin_locaciones (
        id SERIAL PRIMARY KEY,
        nombre_lugar VARCHAR(255) NOT NULL,
        municipio_id INTEGER NULL,
        tipo_espacio_id INTEGER NULL,
        observaciones TEXT NULL,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  private async ensureAdminLocacionesImagenesTable() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS admin_locaciones_imagenes (
        id SERIAL PRIMARY KEY,
        locacion_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        nombre_archivo VARCHAR(255) NULL,
        orden INTEGER NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.dataSource.query(`
      ALTER TABLE admin_locaciones_imagenes
      ADD COLUMN IF NOT EXISTS orden INTEGER
    `);

    await this.dataSource.query(`
      UPDATE admin_locaciones_imagenes
      SET orden = id
      WHERE orden IS NULL
    `);
  }

  private async ensureReportesTable() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS admin_reportes_generados (
        id SERIAL PRIMARY KEY,
        seccion VARCHAR(60) NOT NULL,
        archivo_url TEXT NOT NULL,
        archivo_nombre VARCHAR(255) NOT NULL,
        parametros JSONB NULL,
        resumen JSONB NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  private formatSummaryLabel(key: string) {
    return String(key || '')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private getColumnsForSection(seccion: string, headers: string[]) {
    const columnsBySection: Record<string, Array<{ key: string; label: string; width: number }>> = {
      usuarios: [
        { key: 'nombre', label: 'Nombre', width: 0.18 },
        { key: 'email', label: 'Correo', width: 0.33 },
        { key: 'rol', label: 'Rol', width: 0.15 },
        { key: 'estado', label: 'Estado', width: 0.12 },
        { key: 'ultimo_acceso', label: 'Último acceso', width: 0.22 },
      ],
      verificacion: [
        { key: 'id', label: 'ID', width: 0.1 },
        { key: 'nombre', label: 'Nombre', width: 0.32 },
        { key: 'tipo', label: 'Tipo', width: 0.2 },
        { key: 'estado', label: 'Estado', width: 0.16 },
        { key: 'fecha', label: 'Fecha', width: 0.22 },
      ],
      locaciones: [
        { key: 'locacion', label: 'Locación', width: 0.3 },
        { key: 'ubicacion', label: 'Ubicación', width: 0.24 },
        { key: 'estado', label: 'Estado', width: 0.14 },
        { key: 'reservas', label: 'Reservas', width: 0.12 },
        { key: 'imagenes', label: 'Imágenes', width: 0.1 },
        { key: 'origen', label: 'Origen', width: 0.1 },
      ],
      permisos: [
        { key: 'radicado', label: 'Radicado', width: 0.17 },
        { key: 'proyecto', label: 'Proyecto', width: 0.28 },
        { key: 'productora', label: 'Productora', width: 0.2 },
        { key: 'ciudad', label: 'Ciudad', width: 0.12 },
        { key: 'estado', label: 'Estado', width: 0.11 },
        { key: 'fecha', label: 'Fecha', width: 0.12 },
      ],
      comites: [
        { key: 'id', label: 'ID', width: 0.08 },
        { key: 'nombre', label: 'Nombre', width: 0.3 },
        { key: 'cargo', label: 'Cargo', width: 0.2 },
        { key: 'especialidad', label: 'Especialidad', width: 0.26 },
        { key: 'estado', label: 'Estado', width: 0.16 },
      ],
      finanzas: [
        { key: 'id', label: 'Radicado', width: 0.18 },
        { key: 'cliente', label: 'Cliente', width: 0.25 },
        { key: 'servicio', label: 'Servicio', width: 0.22 },
        { key: 'monto', label: 'Monto', width: 0.2 },
        { key: 'estado', label: 'Estado', width: 0.15 },
      ],
      kpis: [
        { key: 'dia', label: 'Día', width: 0.2 },
        { key: 'registros', label: 'Registros', width: 0.2 },
        { key: 'tramites', label: 'Trámites', width: 0.2 },
        { key: 'costo_total', label: 'Costo Total', width: 0.2 },
        { key: 'abono_total', label: 'Abono Total', width: 0.2 },
      ],
      comunicaciones: [
        { key: 'id', label: 'ID', width: 0.08 },
        { key: 'campaña', label: 'Campaña', width: 0.28 },
        { key: 'canal', label: 'Canal', width: 0.2 },
        { key: 'alcance', label: 'Alcance', width: 0.24 },
        { key: 'estado', label: 'Estado', width: 0.2 },
      ],
    };

    const configured = columnsBySection[seccion] ?? [];
    if (configured.length) return configured;

    const width = headers.length ? 1 / headers.length : 1;
    return headers.map((h) => ({ key: h, label: this.formatSummaryLabel(h), width }));
  }

  private buildPdfBuffer(
    seccion: string,
    title: string,
    rows: Array<Record<string, any>>,
    summary: Record<string, any> = {},
  ) {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const logoPath = join(process.cwd(), 'public', 'assets', 'logos', 'logo-pufab.svg');
      const govPath = join(process.cwd(), 'public', 'assets', 'logos', 'govco.svg');

      const drawHeader = () => {
        const topY = 24;
        doc.rect(20, 20, 555, 38).fill('#f3fdf6');
        doc.fillColor('#14532d');
        doc.fontSize(11).text('Comisión Fílmica de Boyacá', 90, topY + 4);
        doc.fontSize(9).fillColor('#4b5563').text('Reporte oficial PUFAB', 90, topY + 18);

        if (existsSync(logoPath)) {
          const svg = readFileSync(logoPath, 'utf8');
          SVGtoPDF(doc, svg, 36, 24, { width: 42, height: 30 });
        }

        if (existsSync(govPath)) {
          const svgGov = readFileSync(govPath, 'utf8');
          SVGtoPDF(doc, svgGov, 474, 24, { width: 85, height: 24 });
        }

        doc.moveDown(1.6);
      };

      drawHeader();
      doc.fontSize(17).fillColor('#111827').text(title, { align: 'left' });
      doc.moveDown(0.2);
      doc.fontSize(9).fillColor('#6b7280').text(`Generado: ${new Date().toLocaleString('es-CO')}`);
      doc.moveDown(0.7);

      const summaryEntries = Object.entries(summary || {});
      if (summaryEntries.length) {
        doc.fontSize(11).fillColor('#111827').text('Resumen');
        doc.moveDown(0.25);
        summaryEntries.forEach(([k, v]) => {
          doc
            .fontSize(10)
            .fillColor('#111827')
            .text(`- ${this.formatSummaryLabel(k)}: ${v}`);
        });
        doc.moveDown(0.6);
      }

      if (!rows.length) {
        doc.fontSize(10).fillColor('#111827').text('No hay datos para este reporte.');
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i += 1) {
          doc.switchToPage(range.start + i);
          doc.fontSize(8).fillColor('#6b7280').text(
            `Página ${i + 1} de ${range.count}`,
            0,
            815,
            { align: 'center' },
          );
        }
        doc.end();
        return;
      }

      const headers = Object.keys(rows[0]);
      const columns = this.getColumnsForSection(seccion, headers);
      const tableX = 36;
      const tableWidth = 523;
      const rowBasePadding = 6;

      const drawTableHeader = () => {
        let x = tableX;
        const y = doc.y;
        doc.rect(tableX, y, tableWidth, 20).fill('#ecfdf3');
        columns.forEach((col) => {
          const colWidth = tableWidth * col.width;
          doc
            .fillColor('#14532d')
            .fontSize(9)
            .text(col.label, x + 4, y + 5, { width: colWidth - 8, align: 'left' });
          x += colWidth;
        });
        doc.y = y + 24;
      };

      drawTableHeader();

      rows.forEach((row, index) => {
        const cellHeights = columns.map((col) => {
          const text = row[col.key] === null || row[col.key] === undefined
            ? ''
            : String(row[col.key]).replace(/\s+/g, ' ').trim();
          return doc.heightOfString(text, {
            width: tableWidth * col.width - 8,
            align: 'left',
          });
        });
        const contentHeight = Math.max(...cellHeights, 12);
        const rowHeight = contentHeight + rowBasePadding * 2;

        if (doc.y + rowHeight > 760) {
          doc.addPage();
          drawHeader();
          drawTableHeader();
        }

        const y = doc.y;
        doc.rect(tableX, y, tableWidth, rowHeight).fill(index % 2 === 0 ? '#ffffff' : '#f9fafb');

        let x = tableX;
        columns.forEach((col) => {
          const colWidth = tableWidth * col.width;
          const text = row[col.key] === null || row[col.key] === undefined
            ? ''
            : String(row[col.key]).replace(/\s+/g, ' ').trim();

          doc
            .fillColor('#111827')
            .fontSize(8.5)
            .text(text, x + 4, y + rowBasePadding, {
              width: colWidth - 8,
              align: 'left',
            });

          doc
            .strokeColor('#e5e7eb')
            .lineWidth(0.5)
            .moveTo(x, y)
            .lineTo(x, y + rowHeight)
            .stroke();
          x += colWidth;
        });

        doc
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .moveTo(tableX + tableWidth, y)
          .lineTo(tableX + tableWidth, y + rowHeight)
          .stroke();

        doc
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .moveTo(tableX, y + rowHeight)
          .lineTo(tableX + tableWidth, y + rowHeight)
          .stroke();

        doc.y = y + rowHeight;
      });

      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i += 1) {
        doc.switchToPage(range.start + i);
        doc.fontSize(8).fillColor('#6b7280').text(
          `Página ${i + 1} de ${range.count}`,
          0,
          815,
          { align: 'center' },
        );
      }

      doc.end();
    });
  }

  private async getReportDataBySeccion(seccion: string) {
    switch (seccion) {
      case 'usuarios': {
        const usuarios = await this.getPortalAdminUsuarios('');
        const data = Array.isArray((usuarios as any)?.data) ? (usuarios as any).data : [];
        return {
          title: 'Usuarios y Accesos',
          summary: { total_usuarios: data.length },
          rows: data.map((u: any) => ({
            nombre: u.nombre,
            email: u.email,
            rol: u.rol,
            estado: u.estado,
            ultimo_acceso: u.ultimo_acceso,
          })),
        };
      }
      case 'verificacion': {
        const perfiles = await this.getPortalAdminVerificacion();
        const data = Array.isArray((perfiles as any)?.data) ? (perfiles as any).data : [];
        return {
          title: 'Verificación de Perfiles',
          summary: { total_perfiles: data.length },
          rows: data.map((p: any) => ({
            id: p.id,
            nombre: p.nombre,
            tipo: p.tipo,
            estado: p.estado,
            fecha: p.fecha,
          })),
        };
      }
      case 'locaciones': {
        const activos = await this.getPortalAdminActivos();
        const data = Array.isArray((activos as any)?.data) ? (activos as any).data : [];
        return {
          title: 'Gestión de Locaciones',
          summary: { total_locaciones: data.length },
          rows: data.map((l: any) => ({
            origen: l.origen,
            id: l.id,
            locacion: l.locacion,
            ubicacion: l.ubicacion,
            estado: l.estado,
            reservas: l.reservas,
            imagenes: l.total_imagenes ?? 0,
          })),
        };
      }
      case 'permisos': {
        const permisos = await this.getPortalAdminFlujoPermisos('');
        const data = Array.isArray((permisos as any)?.data) ? (permisos as any).data : [];
        const resumen = (permisos as any)?.resumen ?? {};
        return {
          title: 'Flujo de Permisos',
          summary: resumen,
          rows: data.map((p: any) => ({
            radicado: p.numero_radicado,
            proyecto: p.proyecto,
            productora: p.productora,
            ciudad: p.ciudad,
            estado: p.estado_ui,
            fecha: p.fecha,
          })),
        };
      }
      case 'comites': {
        const comites = await this.getPortalAdminComites();
        const data = Array.isArray((comites as any)?.data) ? (comites as any).data : [];
        return {
          title: 'Comités Técnicos',
          summary: { total_comites: data.length },
          rows: data.map((c: any) => ({
            id: c.id,
            nombre: c.nombre,
            cargo: c.cargo,
            especialidad: c.especialidad,
            estado: c.estado,
          })),
        };
      }
      case 'finanzas': {
        const finanzas = await this.getPortalAdminFinanzas();
        const reservas = Array.isArray((finanzas as any)?.reservas) ? (finanzas as any).reservas : [];
        const metrics = (finanzas as any)?.metrics ?? {};
        return {
          title: 'Finanzas y Reservas',
          summary: metrics,
          rows: reservas.map((r: any) => ({
            id: r.id,
            cliente: r.cliente,
            servicio: r.servicio,
            monto: r.monto,
            estado: r.estado,
          })),
        };
      }
      case 'kpis': {
        const kpis = await this.getPortalAdminKpis('30');
        const diarios = Array.isArray((kpis as any)?.trazabilidadDiaria) ? (kpis as any).trazabilidadDiaria : [];
        return {
          title: 'Estadísticas y KPIs',
          summary: {
            rango_dias: (kpis as any)?.rangoDias,
            tiempo_respuesta: (kpis as any)?.stats?.tiempo_respuesta,
            satisfaccion: (kpis as any)?.stats?.satisfaccion,
          },
          rows: diarios.map((d: any) => ({
            dia: d.dia,
            registros: d.registros,
            tramites: d.tramites,
            costo_total: d.costo_total,
            abono_total: d.abono_total,
          })),
        };
      }
      case 'comunicaciones': {
        const comunicaciones = await this.getPortalAdminComunicaciones();
        const data = Array.isArray((comunicaciones as any)?.data) ? (comunicaciones as any).data : [];
        return {
          title: 'Comunicaciones',
          summary: { total: data.length },
          rows: data.map((c: any) => ({
            id: c.id,
            campaña: c.campana,
            canal: c.canal,
            alcance: c.alcance,
            estado: c.estado,
          })),
        };
      }
      default:
        return null;
    }
  }

  private async ensureAdminComitesTable() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS admin_comites_tecnicos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        cargo VARCHAR(80) NOT NULL,
        especialidad VARCHAR(120) NOT NULL,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  @Get()
  @Redirect('/', 302)
  getHello() {
    return { url: '/' };
  }

  @Get('directorio')
  @Redirect('/directorio/', 302)
  getDirectorio() {
    return { url: '/directorio/' };
  }

  @Get('contacto')
  @Redirect('/contacto/', 302)
  getContacto() {
    return { url: '/contacto/' };
  }

  @Get('iniciar-sesion')
  @Redirect('/iniciar-sesion/', 302)
  getIniciarSesion() {
    return { url: '/iniciar-sesion/' };
  }

  @Get('registro')
  @Redirect('/registro/', 302)
  getRegistro() {
    return { url: '/registro/' };
  }

  @Get('tramites')
  @Redirect('/tramites/', 302)
  getTramites() {
    return { url: '/tramites/' };
  }

  @Get('proveedor')
  @Redirect('/proveedor/', 302)
  getProveedor() {
    return { url: '/proveedor/' };
  }

  @Get('academico')
  @Redirect('/academico/', 302)
  getAcademico() {
    return { url: '/academico/' };
  }

  @Get('admin')
  @Redirect('/admin/', 302)
  getAdmin() {
    return { url: '/admin/' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal/productor/permisos')
  async getPortalPermisos(
    @CurrentUser('id') usuarioId: number,
    @CurrentUser('roles') roles: string[],
    @Query('estado') estado?: string,
  ) {
    // Solo admin puede ver todos los permisos; usuarios normales ven solo los suyos
    const esAdmin = roles.includes('admin') || roles.includes('revisor');
    const filtroUsuario = esAdmin ? '' : `WHERE t.usuario_solicitante_id = $1::int`;
    const params = esAdmin ? [] : [usuarioId];

    const query = `
      SELECT
        t.id,
        t.numero_radicado,
        COALESCE(p.nombre_proyecto, 'Proyecto sin nombre') AS proyecto,
        COALESCE(m.nombre, tl.nombre_lugar, 'Sin locación') AS locacion,
        COALESCE(e.nombre, 'Pendiente') AS estado_label,
        CASE
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%aprob%' THEN 'aprobado'
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%subsan%' OR LOWER(COALESCE(e.nombre, '')) LIKE '%corre%' THEN 'subsanacion'
          ELSE 'pendiente'
        END AS estado,
        t.fecha_solicitud::date AS fecha,
        COALESCE(t.fecha_respuesta::date, (t.fecha_solicitud + INTERVAL '7 day')::date) AS respuesta,
        CASE
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%aprob%' THEN 100
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%subsan%' THEN 75
          ELSE 55
        END AS progreso
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      LEFT JOIN LATERAL (
        SELECT l.*
        FROM tramite_locaciones l
        WHERE l.tramite_id = t.id
        ORDER BY l.id ASC
        LIMIT 1
      ) tl ON true
      LEFT JOIN municipios m ON m.id = tl.municipio_id
      ${filtroUsuario}
      ORDER BY t.fecha_solicitud DESC
      LIMIT 50
    `;

    const permisos = await this.dataSource.query(query, params);

    const correccionesRaw = await this.dataSource.query(`
      SELECT h.tramite_id, h.observacion
      FROM historial_tramite h
      WHERE h.observacion IS NOT NULL
        AND (LOWER(h.accion) LIKE '%subsan%' OR LOWER(h.observacion) LIKE '%corre%')
      ORDER BY h.fecha_cambio DESC
    `);

    const mapCorrecciones: Record<number, string[]> = {};
    for (const row of correccionesRaw) {
      if (!mapCorrecciones[row.tramite_id]) {
        mapCorrecciones[row.tramite_id] = [];
      }
      mapCorrecciones[row.tramite_id].push(row.observacion);
    }

    const data = permisos.map((item: any) => ({
      ...item,
      correcciones: mapCorrecciones[item.id] ?? [],
    }));

    const filtered = estado && estado !== 'todos'
      ? data.filter((item: any) => item.estado === estado)
      : data;

    return { data: filtered, total: filtered.length };
  }

  @Get('portal/productor/proyectos-menu')
  async getPortalProductorProyectosMenu() {
    const rows = await this.dataSource.query(`
      SELECT
        p.id,
        p.nombre_proyecto,
        COALESCE(tp.nombre, 'Sin tipo') AS tipo_produccion,
        COALESCE(p.fecha_creacion::date, CURRENT_DATE) AS fecha
      FROM proyectos p
      LEFT JOIN tipos_produccion tp ON tp.id = p.tipo_produccion_id
      ORDER BY p.fecha_creacion DESC, p.id DESC
      LIMIT 300
    `);

    return { data: rows, total: rows.length };
  }

  @Get('portal/productor/locaciones-menu')
  async getPortalProductorLocacionesMenu() {
    await this.ensureAdminLocacionesTable();

    const tramiteRows = await this.dataSource.query(`
      SELECT
        CONCAT('tramite-', tl.id) AS id_unico,
        tl.id AS id_origen,
        'tramite'::text AS origen,
        tl.nombre_lugar,
        tl.municipio_id,
        COALESCE(m.nombre, 'Sin municipio') AS municipio_nombre,
        tl.tipo_espacio_id,
        COALESCE(te.nombre, 'Sin tipo') AS tipo_espacio_nombre,
        tl.observaciones
      FROM tramite_locaciones tl
      LEFT JOIN municipios m ON m.id = tl.municipio_id
      LEFT JOIN tipos_espacio te ON te.id = tl.tipo_espacio_id
      WHERE NULLIF(TRIM(COALESCE(tl.nombre_lugar, '')), '') IS NOT NULL
      ORDER BY tl.id DESC
      LIMIT 300
    `);

    const manualRows = await this.dataSource.query(`
      SELECT
        CONCAT('manual-', l.id) AS id_unico,
        l.id AS id_origen,
        'manual'::text AS origen,
        l.nombre_lugar,
        l.municipio_id,
        COALESCE(m.nombre, 'Sin municipio') AS municipio_nombre,
        l.tipo_espacio_id,
        COALESCE(te.nombre, 'Sin tipo') AS tipo_espacio_nombre,
        l.observaciones
      FROM admin_locaciones l
      LEFT JOIN municipios m ON m.id = l.municipio_id
      LEFT JOIN tipos_espacio te ON te.id = l.tipo_espacio_id
      WHERE l.activo = true
        AND NULLIF(TRIM(COALESCE(l.nombre_lugar, '')), '') IS NOT NULL
      ORDER BY l.id DESC
      LIMIT 300
    `);

    const dedup = new Map<string, any>();
    for (const row of [...manualRows, ...tramiteRows]) {
      const key = `${String(row.nombre_lugar).toLowerCase()}|${row.municipio_id ?? ''}|${row.tipo_espacio_id ?? ''}`;
      if (!dedup.has(key)) {
        dedup.set(key, row);
      }
    }

    const data = Array.from(dedup.values());
    return { data, total: data.length };
  }

  @Get('portal/productor/locaciones')
  async getPortalLocaciones(
    @Query('buscar') buscar?: string,
    @Query('tipo') tipo?: string,
    @Query('provincia') provincia?: string,
  ) {
    await this.ensureAdminLocacionesTable();
    await this.ensureAdminLocacionesImagenesTable();

    const rows = await this.dataSource.query(`
      SELECT
        CONCAT('tramite-', tl.id) AS id_unico,
        tl.id AS id_origen,
        'tramite'::text AS origen,
        tl.id,
        tl.nombre_lugar AS nombre,
        COALESCE(LOWER(te.nombre), 'natural') AS tipo,
        COALESCE(m.nombre, 'Boyacá') AS provincia,
        CASE
          WHEN LOWER(COALESCE(te.nombre, '')) LIKE '%patr%' THEN 300000
          WHEN LOWER(COALESCE(te.nombre, '')) LIKE '%interior%' THEN 250000
          WHEN LOWER(COALESCE(te.nombre, '')) LIKE '%urban%' THEN 320000
          ELSE 400000
        END AS precio
      FROM tramite_locaciones tl
      LEFT JOIN tipos_espacio te ON te.id = tl.tipo_espacio_id
      LEFT JOIN municipios m ON m.id = tl.municipio_id
      ORDER BY tl.id DESC
      LIMIT 60
    `);

    const manualRows = await this.dataSource.query(`
      SELECT
        CONCAT('manual-', l.id) AS id_unico,
        l.id AS id_origen,
        'manual'::text AS origen,
        l.id,
        l.nombre_lugar AS nombre,
        COALESCE(LOWER(te.nombre), 'natural') AS tipo,
        COALESCE(m.nombre, 'Boyacá') AS provincia,
        li.url AS imagen,
        CASE
          WHEN LOWER(COALESCE(te.nombre, '')) LIKE '%patr%' THEN 300000
          WHEN LOWER(COALESCE(te.nombre, '')) LIKE '%interior%' THEN 250000
          WHEN LOWER(COALESCE(te.nombre, '')) LIKE '%urban%' THEN 320000
          ELSE 400000
        END AS precio
      FROM admin_locaciones l
      LEFT JOIN tipos_espacio te ON te.id = l.tipo_espacio_id
      LEFT JOIN municipios m ON m.id = l.municipio_id
      LEFT JOIN LATERAL (
        SELECT i.url
        FROM admin_locaciones_imagenes i
        WHERE i.locacion_id = l.id
        ORDER BY i.id DESC
        LIMIT 1
      ) li ON true
      WHERE l.activo = true
      ORDER BY l.id DESC
      LIMIT 60
    `);

    const images = [
      '/assets/location-placeholder.svg',
      '/assets/location-placeholder.svg',
      '/assets/location-placeholder.svg',
      '/assets/location-placeholder.svg',
      '/assets/location-placeholder.svg',
      '/assets/location-placeholder.svg',
    ];

    const mixedRows = [...manualRows, ...rows];
    const locaciones = mixedRows.map((item: any, index: number) => ({
      ...item,
      imagen: item.imagen || images[index % images.length],
    }));

    const query = (buscar ?? '').toLowerCase().trim();
    const data = locaciones.filter((item: any) => {
      const byName = !query || item.nombre.toLowerCase().includes(query);
      const byTipo = !tipo || tipo === 'todos' || item.tipo.includes(tipo);
      const byProvincia = !provincia || provincia === 'todas' || item.provincia.toLowerCase() === provincia.toLowerCase();
      return byName && byTipo && byProvincia;
    });

    return { data, total: data.length };
  }

  @Get('portal/productor/evaluaciones')
  async getPortalEvaluaciones() {
    const [latest] = await this.dataSource.query(`
      SELECT
        h.tramite_id,
        h.observacion,
        h.fecha_cambio::date AS fecha_cambio,
        t.numero_radicado,
        p.nombre_proyecto,
        t.requiere_plan_manejo_transito,
        t.requiere_seguro_rc,
        t.consentimiento_comunidades_aplica
      FROM historial_tramite h
      LEFT JOIN tramites t ON t.id = h.tramite_id
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      WHERE h.observacion IS NOT NULL
      ORDER BY h.fecha_cambio DESC
      LIMIT 1
    `);

    const observaciones = latest?.observacion
      ? [latest.observacion]
      : ['No hay observaciones pendientes del comité por ahora.'];

    const docs = [] as string[];
    if (latest?.requiere_seguro_rc) docs.push('Certificado de Seguro Actualizado');
    if (latest?.requiere_plan_manejo_transito) docs.push('Plan de Manejo de Tránsito');
    if (latest?.consentimiento_comunidades_aplica) docs.push('Consentimiento de Comunidades');
    if (!docs.length) docs.push('Plan de Manejo Ambiental');

    return {
      codigo: latest?.numero_radicado ?? 'EVAL-SIN-DATOS',
      permiso: latest?.numero_radicado ?? 'N/A',
      proyecto: latest?.nombre_proyecto ?? 'Sin proyecto asociado',
      comite: 'Comité Técnico de Locaciones',
      fecha_limite: latest?.fecha_cambio ?? null,
      observaciones,
      documentos_requeridos: docs,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal/proveedor/panel')
  async getPortalProveedorPanel(@CurrentUser('id') usuarioId: number) {
    const perfil = await this.getOrCreatePerfilProveedorPorUsuario(usuarioId);
    const perfilPublico = perfil ?? (await this.dataSource.query(`
      SELECT
        p.id,
        p.descripcion_perfil,
        p.sitio_web,
        p.verificado,
        p.visible_directorio,
        p.telefono,
        p.estado,
        p.activo,
        u.email,
        u.telefono AS usuario_telefono
      FROM perfiles_proveedor p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.visible_directorio = true
      ORDER BY p.id ASC
      LIMIT 1
    `))[0];

    const perfilId = perfil?.id ?? perfilPublico?.id ?? 0;
    await this.ensureProveedorPortalTables(perfilId);

    const serviciosDirectos = await this.dataSource.query(`
      SELECT id, nombre, descripcion, categoria, precio, imagen, activo
      FROM proveedor_servicios
      WHERE perfil_proveedor_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 12
    `, [perfilId]);

    const servicios = serviciosDirectos.length
      ? serviciosDirectos
      : await this.dataSource.query(`
        SELECT e.nombre
        FROM perfil_proveedor_especialidades pe
        INNER JOIN especialidades_proveedor e ON e.id = pe.especialidad_proveedor_id
        WHERE pe.perfil_proveedor_id = $1
        ORDER BY e.nombre ASC
        LIMIT 6
      `, [perfilId]);

    const galeria = await this.dataSource.query(`
      SELECT id, titulo, descripcion, categoria, imagen, orden
      FROM proveedor_galeria_trabajos
      WHERE perfil_proveedor_id = $1
      ORDER BY orden ASC, created_at DESC, id DESC
      LIMIT 12
    `, [perfilId]);

    const solicitudesRaw = await this.dataSource.query(`
      SELECT
        t.numero_radicado AS codigo,
        COALESCE(e.nombre, 'Pendiente') AS estado,
        COALESCE(p.nombre_proyecto, 'Proyecto') AS proyecto,
        COALESCE(t.fecha_solicitud::date, CURRENT_DATE) AS fecha,
        COALESCE(p.presupuesto_total, 750000)::numeric AS valor
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      ORDER BY t.fecha_solicitud DESC
      LIMIT 4
    `);

    const solicitudes = solicitudesRaw.map((row: any) => ({
      ...row,
      cliente: 'Productora Asociada',
      dias: 3,
    }));

    const metricas = {
      proyectos: solicitudes.length,
      solicitudes: solicitudes.filter((s: any) => String(s.estado).toLowerCase().includes('pend')).length,
      reseñas: 47,
      tarifaBase: 180000,
    };

    const nombreBase = perfil?.email ?? perfilPublico?.email ?? 'proveedor';

    return {
      perfil_id: perfil?.id ?? perfilPublico?.id ?? null,
      nombre: String(nombreBase).split('@')[0].replaceAll('.', ' '),
      rol: 'Proveedor Audiovisual',
      ciudad: 'Boyacá, Colombia',
      rating: (perfil?.verificado ?? perfilPublico?.verificado) ? 4.9 : 4.5,
      resenas: metricas.reseñas,
      descripcion:
        perfil?.descripcion_perfil ?? perfilPublico?.descripcion_perfil ?? 'Perfil profesional para servicios audiovisuales en Boyacá.',
      metricas,
      servicios: servicios.length
        ? servicios.map((s: any, idx: number) => ({
          id: s.id ?? idx + 1,
          nombre: s.nombre,
          descripcion: s.descripcion ?? null,
          categoria: s.categoria ?? null,
          precio: Number(s.precio ?? 150000 + idx * 50000),
          imagen: s.imagen ?? null,
          activo: s.activo ?? true,
        }))
        : [
          { nombre: 'Servicio audiovisual', precio: 180000 },
          { nombre: 'Soporte técnico', precio: 220000 },
        ],
      galeria: galeria.length
        ? galeria.map((g: any) => ({
          id: g.id,
          titulo: g.titulo,
          descripcion: g.descripcion ?? null,
          categoria: g.categoria ?? null,
          imagen: g.imagen,
          orden: g.orden ?? 1,
        }))
        : [
          { titulo: 'Rodaje documental en Villa de Leyva', imagen: '/assets/location-placeholder.svg', categoria: 'Documental' },
          { titulo: 'Scouting de locaciones rurales', imagen: '/assets/location-placeholder.svg', categoria: 'Locaciones' },
          { titulo: 'Producción en centro histórico', imagen: '/assets/location-placeholder.svg', categoria: 'Producción' },
        ],
      solicitudes,
      contacto: {
        email: perfil?.email ?? perfilPublico?.email ?? 'proveedor@pufab.gov.co',
        telefono: perfil?.telefono ?? perfilPublico?.telefono ?? perfil?.usuario_telefono ?? perfilPublico?.usuario_telefono ?? '3000000000',
        sitio_web: perfil?.sitio_web ?? perfilPublico?.sitio_web,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal/proveedor/portafolio')
  async getPortalProveedorPortafolio(@CurrentUser('id') usuarioId: number) {
    const panel = await this.getPortalProveedorPanel(usuarioId);

    return {
      nombre: panel.nombre,
      rol: panel.rol,
      descripcion: panel.descripcion,
      servicios: panel.servicios,
      galeria: panel.galeria,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal/proveedor/servicios')
  async getPortalProveedorServicios(@CurrentUser('id') usuarioId: number) {
    const perfil = await this.getPerfilProveedorPorUsuario(usuarioId);
    const perfilId = perfil?.id ?? 0;
    await this.ensureProveedorPortalTables(perfilId);

    const servicios = await this.dataSource.query(`
      SELECT id, nombre, descripcion, categoria, precio, imagen, activo, created_at
      FROM proveedor_servicios
      WHERE perfil_proveedor_id = $1
      ORDER BY created_at DESC, id DESC
    `, [perfilId]);

    return { data: servicios, total: servicios.length };
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal/proveedor/servicios')
  async crearPortalProveedorServicio(
    @CurrentUser('id') usuarioId: number,
    @Body('nombre') nombre?: string,
    @Body('descripcion') descripcion?: string,
    @Body('categoria') categoria?: string,
    @Body('precio') precio?: string | number,
  ) {
    const perfil = await this.getOrCreatePerfilProveedorPorUsuario(usuarioId);

    if (!nombre?.trim()) {
      throw new BadRequestException('El nombre del servicio es obligatorio');
    }

    await this.ensureProveedorPortalTables(perfil.id);
    const [saved] = await this.dataSource.query(
      `
      INSERT INTO proveedor_servicios (perfil_proveedor_id, nombre, descripcion, categoria, precio, activo)
      VALUES ($1::int, $2, $3, $4, $5::numeric, true)
      RETURNING id, nombre, descripcion, categoria, precio, imagen, activo, created_at
    `,
      [perfil.id, nombre.trim(), descripcion?.trim() || null, categoria?.trim() || null, Number(precio ?? 0) || 0],
    );

    return { ok: true, data: saved };
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal/proveedor/galeria')
  async getPortalProveedorGaleria(@CurrentUser('id') usuarioId: number) {
    const perfil = await this.getOrCreatePerfilProveedorPorUsuario(usuarioId);
    const perfilId = perfil?.id ?? 0;
    await this.ensureProveedorPortalTables(perfilId);

    const galeria = await this.dataSource.query(`
      SELECT id, titulo, descripcion, categoria, imagen, orden, created_at
      FROM proveedor_galeria_trabajos
      WHERE perfil_proveedor_id = $1
      ORDER BY orden ASC, created_at DESC, id DESC
    `, [perfilId]);

    return { data: galeria, total: galeria.length };
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal/proveedor/galeria')
  @UseInterceptors(FileInterceptor('imagen', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'proveedor');
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const safeExt = extname(file.originalname || '').toLowerCase() || '.jpg';
        cb(null, `${Date.now()}-${randomUUID()}${safeExt}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      cb(null, allowed.includes(file.mimetype));
    },
    limits: { fileSize: 8 * 1024 * 1024 },
  }))
  async crearPortalProveedorGaleria(
    @CurrentUser('id') usuarioId: number,
    @UploadedFile() imagen?: Express.Multer.File,
    @Body('titulo') titulo?: string,
    @Body('descripcion') descripcion?: string,
    @Body('categoria') categoria?: string,
  ) {
    const perfil = await this.getOrCreatePerfilProveedorPorUsuario(usuarioId);

    if (!imagen) {
      throw new BadRequestException('Debes adjuntar una imagen válida');
    }

    if (!titulo?.trim()) {
      throw new BadRequestException('El título de la imagen es obligatorio');
    }

    await this.ensureProveedorPortalTables(perfil.id);
    const [count] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM proveedor_galeria_trabajos WHERE perfil_proveedor_id = $1`,
      [perfil.id],
    );

    const publicUrl = `/uploads/proveedor/${imagen.filename}`;
    const [saved] = await this.dataSource.query(
      `
      INSERT INTO proveedor_galeria_trabajos (perfil_proveedor_id, titulo, descripcion, categoria, imagen, orden)
      VALUES ($1::int, $2, $3, $4, $5, $6)
      RETURNING id, titulo, descripcion, categoria, imagen, orden, created_at
    `,
      [perfil.id, titulo.trim(), descripcion?.trim() || null, categoria?.trim() || null, publicUrl, (count?.total ?? 0) + 1],
    );

    return { ok: true, data: saved };
  }

  @Public()
  @Get('portal/proveedor/servicios-publicos')
  async getPortalProveedorServiciosPublicos() {
    const servicios = await this.dataSource.query(`
      SELECT
        s.id,
        s.nombre,
        s.descripcion,
        s.categoria,
        s.precio,
        s.imagen,
        s.activo,
        p.id AS perfil_id,
        COALESCE(u.email, 'proveedor') AS proveedor_nombre
      FROM proveedor_servicios s
      INNER JOIN perfiles_proveedor p ON p.id = s.perfil_proveedor_id
      INNER JOIN usuarios u ON u.id = p.usuario_id
      WHERE s.activo = true
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT 200
    `);

    return { data: servicios, total: servicios.length };
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal/proveedor/disponibilidad')
  async getPortalProveedorDisponibilidad(@CurrentUser('id') usuarioId: number) {
    const panel = await this.getPortalProveedorPanel(usuarioId);
    const perfil = await this.getPerfilProveedorPorUsuario(usuarioId);
    const perfilId = perfil?.id ?? (await this.getPrimaryPerfilProveedorId());
    if (!perfilId) {
      return { nombre: panel.nombre, ciudad: panel.ciudad, semana: [] };
    }

    await this.ensureProveedorPortalTables(perfilId);
    const semana = await this.dataSource.query(
      `
      SELECT dia_semana AS dia, estado, horas
      FROM proveedor_disponibilidad
      WHERE perfil_proveedor_id = $1
      ORDER BY CASE dia_semana
        WHEN 'Lunes' THEN 1
        WHEN 'Martes' THEN 2
        WHEN 'Miércoles' THEN 3
        WHEN 'Jueves' THEN 4
        WHEN 'Viernes' THEN 5
        WHEN 'Sábado' THEN 6
        WHEN 'Domingo' THEN 7
        ELSE 8
      END
    `,
      [perfilId],
    );

    return {
      nombre: panel.nombre,
      ciudad: panel.ciudad,
      semana,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal/proveedor/solicitudes')
  async getPortalProveedorSolicitudes(@CurrentUser('id') usuarioId: number) {
    const panel = await this.getPortalProveedorPanel(usuarioId);
    return {
      total: panel.solicitudes.length,
      solicitudes: panel.solicitudes,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal/proveedor/mensajes')
  async getPortalProveedorMensajes(@CurrentUser('id') usuarioId: number) {
    const panel = await this.getPortalProveedorPanel(usuarioId);
    const perfil = await this.getPerfilProveedorPorUsuario(usuarioId);
    const perfilId = perfil?.id ?? (await this.getPrimaryPerfilProveedorId());
    if (!perfilId) {
      return { total: 0, mensajes: [] };
    }

    await this.ensureProveedorPortalTables(perfilId);

    const [msgCount] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM proveedor_mensajes WHERE perfil_proveedor_id = $1`,
      [perfilId],
    );

    if ((msgCount?.total ?? 0) === 0) {
      for (const [idx, item] of panel.solicitudes.entries()) {
        await this.dataSource.query(
          `
          INSERT INTO proveedor_mensajes (perfil_proveedor_id, titulo, fecha, texto)
          VALUES ($1, $2, $3, $4)
        `,
          [
            perfilId,
            item.proyecto,
            item.fecha,
            idx % 2 === 0
              ? `Hola ${panel.nombre}, queremos confirmar tu disponibilidad para el servicio solicitado.`
              : `Gracias por tu respuesta. Adjuntamos detalles adicionales del rodaje para ${item.proyecto}.`,
          ],
        );
      }
    }

    const mensajes = await this.dataSource.query(
      `
      SELECT titulo, fecha, texto
      FROM proveedor_mensajes
      WHERE perfil_proveedor_id = $1
      ORDER BY fecha DESC, id DESC
      LIMIT 20
    `,
      [perfilId],
    );

    return {
      total: mensajes.length,
      mensajes,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal/proveedor/disponibilidad')
  async guardarPortalProveedorDisponibilidad(
    @CurrentUser('id') usuarioId: number,
    @Body() body?: { dia_semana?: string; estado?: string; horas?: string },
  ) {
    const perfil = await this.getPerfilProveedorPorUsuario(usuarioId);
    if (!perfil?.id) {
      return { ok: false, message: 'No se encontró un perfil de proveedor asociado al usuario.' };
    }

    const dia = String(body?.dia_semana ?? '').trim();
    const estado = String(body?.estado ?? '').trim();
    const horas = String(body?.horas ?? '').trim();

    if (!dia || !estado || !horas) {
      return { ok: false, message: 'Debes enviar dia_semana, estado y horas.' };
    }

    await this.ensureProveedorPortalTables(perfil.id);
    await this.dataSource.query(
      `
      INSERT INTO proveedor_disponibilidad (perfil_proveedor_id, dia_semana, estado, horas)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (perfil_proveedor_id, dia_semana)
      DO UPDATE SET estado = EXCLUDED.estado, horas = EXCLUDED.horas, updated_at = NOW()
    `,
      [perfil.id, dia, estado, horas],
    );

    return { ok: true, message: 'Disponibilidad guardada correctamente.' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal/proveedor/mensajes')
  async guardarPortalProveedorMensaje(
    @CurrentUser('id') usuarioId: number,
    @Body() body?: { titulo?: string; texto?: string },
  ) {
    const perfil = await this.getPerfilProveedorPorUsuario(usuarioId);
    if (!perfil?.id) {
      return { ok: false, message: 'No se encontró un perfil de proveedor asociado al usuario.' };
    }

    const titulo = String(body?.titulo ?? '').trim();
    const texto = String(body?.texto ?? '').trim();
    if (!titulo || !texto) {
      return { ok: false, message: 'Debes enviar titulo y texto.' };
    }

    await this.ensureProveedorPortalTables(perfil.id);
    await this.dataSource.query(
      `
      INSERT INTO proveedor_mensajes (perfil_proveedor_id, titulo, fecha, texto)
      VALUES ($1, $2, CURRENT_DATE, $3)
    `,
      [perfil.id, titulo, texto],
    );

    return { ok: true, message: 'Mensaje enviado correctamente.' };
  }

  @Get('portal/admin/resumen')
  async getPortalAdminResumen() {
    const [stats] = await this.dataSource.query(`
      SELECT
        (SELECT COUNT(*)::int FROM usuarios WHERE activo = true) AS usuarios,
        (
          SELECT COUNT(*)::int
          FROM tramites t
          LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
          WHERE LOWER(COALESCE(e.nombre, '')) NOT LIKE '%aprob%'
            AND LOWER(COALESCE(e.nombre, '')) NOT LIKE '%rech%'
        ) AS permisos_pendientes,
        (
          SELECT COALESCE(SUM(COALESCE(p.presupuesto_total, 0))::numeric, 0)
          FROM proyectos p
          WHERE date_trunc('month', p.fecha_creacion) = date_trunc('month', CURRENT_DATE)
        ) AS reservas,
        (
          SELECT
            CASE
              WHEN COUNT(*) = 0 THEN 100
              ELSE ROUND((COUNT(*) FILTER (WHERE verificado = true) * 100.0) / COUNT(*))::int
            END
          FROM perfiles_proveedor
        ) AS satisfaccion,
        (SELECT COUNT(*)::int FROM perfiles_proveedor WHERE verificado = false) AS perfiles_por_revisar,
        (
          SELECT COUNT(*)::int
          FROM pagos pg
          LEFT JOIN estados_pago ep ON ep.id = pg.estado_pago_id
          WHERE ep.id IS NULL
             OR LOWER(COALESCE(ep.nombre, '')) LIKE '%pend%'
             OR LOWER(COALESCE(ep.nombre, '')) LIKE '%revision%'
        ) AS pagos_por_confirmar
    `);

    const notificaciones = await this.dataSource.query(`
      SELECT
        CONCAT('Trámite ', t.numero_radicado, ' actualizado') AS texto,
        COALESCE(t.fecha_solicitud::text, CURRENT_DATE::text) AS fecha
      FROM tramites t
      ORDER BY t.fecha_solicitud DESC
      LIMIT 3
    `);

    return {
      stats: {
        usuarios: stats?.usuarios ?? 0,
        permisos_pendientes: stats?.permisos_pendientes ?? 0,
        reservas: Number(stats?.reservas ?? 0),
        satisfaccion: stats?.satisfaccion ?? 94,
      },
      acciones: [
        { titulo: 'Revisar Permisos', detalle: `${stats?.permisos_pendientes ?? 0} pendientes` },
        { titulo: 'Verificar Perfiles', detalle: `${stats?.perfiles_por_revisar ?? 0} por revisar` },
        { titulo: 'Pagos', detalle: `${stats?.pagos_por_confirmar ?? 0} por confirmar` },
        { titulo: 'Notificaciones', detalle: `${notificaciones.length} recientes` },
      ],
      notificaciones,
    };
  }

  @Get('portal/admin/usuarios')
  async getPortalAdminUsuarios(@Query('q') q?: string) {
    const search = `%${(q ?? '').trim().toLowerCase()}%`;
    const rows = await this.dataSource.query(
      `
      SELECT
        u.id,
        split_part(u.email, '@', 1) AS nombre,
        u.email,
        COALESCE(tp.nombre, 'Sin rol') AS rol,
        CASE WHEN u.activo THEN 'Activo' ELSE 'Inactivo' END AS estado,
        COALESCE(u.fecha_actualizacion::text, CURRENT_DATE::text) AS ultimo_acceso
      FROM usuarios u
      LEFT JOIN tipos_perfil tp ON tp.id = u.tipo_perfil_id
      WHERE ($1 = '%%' OR LOWER(u.email) LIKE $1)
      ORDER BY u.id DESC
      LIMIT 20
    `,
      [search],
    );

    return { data: rows, total: rows.length };
  }

  @Get('portal/admin/roles')
  async getPortalAdminRoles() {
    const data = await this.dataSource.query(`
      SELECT id, codigo, nombre
      FROM tipos_perfil
      WHERE activo = true
      ORDER BY CASE codigo
        WHEN 'productora' THEN 1
        WHEN 'proveedor' THEN 2
        WHEN 'academico' THEN 3
        WHEN 'admin' THEN 4
        ELSE 10
      END, nombre ASC
    `);

    return { data, total: data.length };
  }

  @Post('portal/admin/usuarios/:id/rol')
  async actualizarPortalAdminUsuarioRol(
    @Param('id') id: string,
    @Body() body?: { tipo_perfil_codigo?: string },
  ) {
    const codigo = String(body?.tipo_perfil_codigo ?? '').trim().toLowerCase();
    if (!codigo) {
      return { ok: false, message: 'Debes enviar tipo_perfil_codigo.' };
    }

    const [perfil] = await this.dataSource.query(
      `SELECT id, codigo, nombre FROM tipos_perfil WHERE LOWER(codigo) = $1 LIMIT 1`,
      [codigo],
    );

    if (!perfil) {
      return { ok: false, message: 'El rol solicitado no existe.' };
    }

    await this.dataSource.query(
      `
      UPDATE usuarios
      SET tipo_perfil_id = $2::int,
          fecha_actualizacion = NOW()
      WHERE id = $1::int
    `,
      [id, perfil.id],
    );

    return {
      ok: true,
      data: {
        usuario_id: Number(id),
        tipo_perfil_id: perfil.id,
        tipo_perfil_codigo: perfil.codigo,
        tipo_perfil_nombre: perfil.nombre,
      },
    };
  }

  @Post('portal/admin/usuarios/:id/toggle')
  async togglePortalAdminUsuarioEstado(@Param('id') id: string) {
    const userId = Number(id);

    // Obtiene el usuario actual
    const [usuarioActual] = await this.dataSource.query(
      `SELECT id, activo FROM usuarios WHERE id = $1::int LIMIT 1`,
      [userId],
    );

    if (!usuarioActual) {
      return { ok: false, error: 'Usuario no encontrado' };
    }

    // Determina el nuevo estado
    const nuevoActivo = !usuarioActual.activo;
    let estadoId: number | null = null;

    if (nuevoActivo) {
      // Al activar, usa el estado 'activo'
      const [estadoActivo] = await this.dataSource.query(
        `SELECT id FROM estados_cuenta WHERE codigo = $1 LIMIT 1`,
        ['activo'],
      );
      estadoId = estadoActivo?.id ?? null;
    } else {
      // Al desactivar, usa el estado 'pendiente'
      const [estadoPendiente] = await this.dataSource.query(
        `SELECT id FROM estados_cuenta WHERE codigo = $1 LIMIT 1`,
        ['pendiente'],
      );
      estadoId = estadoPendiente?.id ?? null;
    }

    // Actualiza el usuario
    const fechaAprobacion = nuevoActivo ? new Date().toISOString() : null;
    await this.dataSource.query(
      `
      UPDATE usuarios
      SET activo = $1,
          estado_cuenta_id = $2,
          fecha_actualizacion = NOW(),
          fecha_aprobacion = $3::timestamp
      WHERE id = $4::int
    `,
      [
        nuevoActivo,
        estadoId,
        fechaAprobacion,
        userId,
      ],
    );

    const [usuarioActualizado] = await this.dataSource.query(
      `SELECT id, activo FROM usuarios WHERE id = $1::int LIMIT 1`,
      [userId],
    );

    return {
      ok: true,
      id: usuarioActualizado?.id ?? userId,
      estado: usuarioActualizado?.activo ? 'Activo' : 'Inactivo',
    };
  }

  @Post('portal/admin/usuarios/:id/eliminar')
  async eliminarPortalAdminUsuario(@Param('id') id: string) {
    const userId = Number(id);
    const [usuarioObjetivo] = await this.dataSource.query(
      `SELECT id, email FROM usuarios WHERE id = $1::int LIMIT 1`,
      [userId],
    );

    if (!usuarioObjetivo) {
      return { ok: false, error: 'Usuario no encontrado' };
    }

    // Si el usuario tiene actividad operativa, no se elimina físicamente para no romper trazabilidad.
    const [actividad] = await this.dataSource.query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM proyectos p WHERE p.usuario_id = $1::int) AS proyectos,
        (SELECT COUNT(*)::int FROM tramites t WHERE t.usuario_solicitante_id = $1::int) AS tramites,
        (SELECT COUNT(*)::int FROM pagos pg WHERE pg.usuario_id = $1::int) AS pagos
    `,
      [userId],
    );

    const totalActividad =
      Number(actividad?.proyectos ?? 0) +
      Number(actividad?.tramites ?? 0) +
      Number(actividad?.pagos ?? 0);

    if (totalActividad > 0) {
      await this.dataSource.query(
        `
        UPDATE usuarios
        SET activo = false,
            fecha_actualizacion = NOW()
        WHERE id = $1::int
      `,
        [userId],
      );

      return {
        ok: true,
        id: userId,
        accion: 'desactivado',
        mensaje:
          'El usuario tiene actividad (proyectos, tramites o pagos). Se desactivo en lugar de eliminarlo para conservar integridad.',
      };
    }

    try {
      await this.dataSource.query('BEGIN');

      await this.dataSource.query(
        `UPDATE solicitudes_registro SET admin_revisor_id = NULL WHERE admin_revisor_id = $1::int`,
        [userId],
      );
      await this.dataSource.query(
        `UPDATE historial_solicitudes_registro SET usuario_actor_id = NULL WHERE usuario_actor_id = $1::int`,
        [userId],
      );
      await this.dataSource.query(
        `UPDATE historial_tramite SET usuario_actor_id = NULL WHERE usuario_actor_id = $1::int`,
        [userId],
      );
      await this.dataSource.query(
        `UPDATE tramite_entidades SET usuario_revisor_id = NULL WHERE usuario_revisor_id = $1::int`,
        [userId],
      );
      await this.dataSource.query(
        `UPDATE documentos SET validado_por_usuario_id = NULL WHERE validado_por_usuario_id = $1::int`,
        [userId],
      );
      await this.dataSource.query(
        `UPDATE documentos SET usuario_id = NULL WHERE usuario_id = $1::int`,
        [userId],
      );
      await this.dataSource.query(
        `UPDATE usuario_roles SET asignado_por = NULL WHERE asignado_por = $1::int`,
        [userId],
      );

      await this.dataSource.query(`DELETE FROM usuario_roles WHERE usuario_id = $1::int`, [userId]);
      await this.dataSource.query(`DELETE FROM historial_solicitudes_registro WHERE solicitud_registro_id IN (SELECT id FROM solicitudes_registro WHERE usuario_id = $1::int)`, [userId]);
      await this.dataSource.query(`DELETE FROM solicitudes_registro WHERE usuario_id = $1::int`, [userId]);

      await this.dataSource.query(`DELETE FROM perfil_proveedor_especialidades WHERE perfil_proveedor_id IN (SELECT id FROM perfiles_proveedor WHERE usuario_id = $1::int)`, [userId]);
      await this.dataSource.query(`DELETE FROM perfil_proveedor_subcategorias WHERE perfil_proveedor_id IN (SELECT id FROM perfiles_proveedor WHERE usuario_id = $1::int)`, [userId]);
      await this.dataSource.query(`DELETE FROM perfiles_proveedor WHERE usuario_id = $1::int`, [userId]);
      await this.dataSource.query(`DELETE FROM perfiles_productora WHERE usuario_id = $1::int`, [userId]);
      await this.dataSource.query(`DELETE FROM perfiles_academico WHERE usuario_id = $1::int`, [userId]);
      await this.dataSource.query(`DELETE FROM personas_naturales WHERE usuario_id = $1::int`, [userId]);
      await this.dataSource.query(`DELETE FROM personas_juridicas WHERE usuario_id = $1::int`, [userId]);

      await this.dataSource.query(`DELETE FROM usuarios WHERE id = $1::int`, [userId]);

      await this.dataSource.query('COMMIT');

      return {
        ok: true,
        id: userId,
        accion: 'eliminado',
        mensaje: 'Usuario eliminado definitivamente.',
      };
    } catch (error) {
      await this.dataSource.query('ROLLBACK');
      return {
        ok: false,
        error: 'No se pudo eliminar el usuario: ' + error.message,
      };
    }
  }

  @Get('portal/admin/verificacion')
  async getPortalAdminVerificacion() {
    const rows = await this.dataSource.query(`
      SELECT
        p.id,
        split_part(u.email, '@', 1) AS nombre,
        COALESCE(tp.nombre, 'Proveedor') AS tipo,
        COALESCE(p.fecha_actualizacion::date, CURRENT_DATE) AS fecha,
        CASE WHEN p.verificado THEN 'Aprobado' ELSE 'Pendiente' END AS estado
      FROM perfiles_proveedor p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN tipos_perfil tp ON tp.id = u.tipo_perfil_id
      ORDER BY p.id DESC
      LIMIT 12
    `);

    return { data: rows, total: rows.length };
  }

  @Post('portal/admin/verificacion/perfiles')
  async crearPortalAdminPerfilVerificacion(
    @Body() body?: {
      email?: string;
      descripcion?: string;
      sitio_web?: string;
      telefono?: string;
    },
  ) {
    const email = (body?.email ?? '').trim().toLowerCase();
    const telefono = (body?.telefono ?? '').trim();
    if (!email) {
      return { ok: false, error: 'El email es obligatorio.' };
    }

    const [usuario] = await this.dataSource.query(
      `SELECT id, email FROM usuarios WHERE LOWER(email) = $1 LIMIT 1`,
      [email],
    );

    if (!usuario) {
      return { ok: false, error: 'No existe un usuario con ese email.' };
    }

    if (telefono) {
      await this.dataSource.query(
        `
        UPDATE usuarios
        SET telefono = $2,
            fecha_actualizacion = NOW()
        WHERE id = $1::int
      `,
        [usuario.id, telefono],
      );
    }

    const [existente] = await this.dataSource.query(
      `SELECT id FROM perfiles_proveedor WHERE usuario_id = $1::int LIMIT 1`,
      [usuario.id],
    );

    if (existente) {
      return {
        ok: true,
        ya_existia: true,
        id: existente.id,
        mensaje: 'El usuario ya tiene perfil de proveedor para verificación.',
      };
    }

    const [perfil] = await this.dataSource.query(
      `
      INSERT INTO perfiles_proveedor (usuario_id, descripcion_perfil, sitio_web, visible_directorio, verificado, fecha_creacion, fecha_actualizacion)
      VALUES ($1::int, $2, $3, true, false, NOW(), NOW())
      RETURNING id, usuario_id, verificado
    `,
      [usuario.id, body?.descripcion ?? null, body?.sitio_web ?? null],
    );

    return {
      ok: true,
      data: perfil,
      mensaje: 'Perfil creado correctamente y listo para verificación.',
    };
  }

  @Post('portal/admin/verificacion/:id/eliminar')
  async eliminarPortalAdminPerfilVerificacion(@Param('id') id: string) {
    const perfilId = Number(id);
    const [perfil] = await this.dataSource.query(
      `SELECT id FROM perfiles_proveedor WHERE id = $1::int LIMIT 1`,
      [perfilId],
    );

    if (!perfil) {
      return { ok: false, error: 'Perfil no encontrado.' };
    }

    await this.dataSource.query(
      `DELETE FROM perfil_proveedor_especialidades WHERE perfil_proveedor_id = $1::int`,
      [perfilId],
    );
    await this.dataSource.query(
      `DELETE FROM perfil_proveedor_subcategorias WHERE perfil_proveedor_id = $1::int`,
      [perfilId],
    );
    await this.dataSource.query(`DELETE FROM perfiles_proveedor WHERE id = $1::int`, [perfilId]);

    return {
      ok: true,
      id: perfilId,
      mensaje: 'Perfil eliminado correctamente.',
    };
  }

  @Get('portal/admin/verificacion/:id')
  async getPortalAdminVerificacionDetalle(@Param('id') id: string) {
    const [perfil] = await this.dataSource.query(`
      SELECT
        p.id,
        u.email,
        split_part(u.email, '@', 1) AS nombre,
        COALESCE(tp.nombre, 'Proveedor') AS tipo,
        COALESCE(p.descripcion_perfil, 'Sin descripción') AS descripcion,
        COALESCE(p.sitio_web, 'N/A') AS sitio_web,
        COALESCE(NULLIF(TRIM(COALESCE(u.telefono, '')), ''), 'N/A') AS telefono,
        CASE WHEN p.verificado THEN 'Aprobado' ELSE 'Pendiente' END AS estado,
        COALESCE(p.fecha_actualizacion::date, CURRENT_DATE) AS fecha_actualizacion,
        u.activo,
        COALESCE(u.fecha_registro::date, CURRENT_DATE) AS fecha_registro
      FROM perfiles_proveedor p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN tipos_perfil tp ON tp.id = u.tipo_perfil_id
      WHERE p.id = $1::int
      LIMIT 1
    `, [id]);

    if (!perfil) {
      return { ok: false, error: 'Perfil no encontrado' };
    }

    return { ok: true, data: perfil };
  }

  @Post('portal/admin/verificacion/:id/aprobar')
  async aprobarPortalAdminVerificacion(@Param('id') id: string) {
    await this.dataSource.query(
      `
      UPDATE perfiles_proveedor
      SET verificado = true,
          fecha_actualizacion = NOW()
      WHERE id = $1::int
    `,
      [id],
    );

    return { ok: true, id: Number(id), estado: 'Aprobado' };
  }

  @Post('portal/admin/verificacion/:id/rechazar')
  async rechazarPortalAdminVerificacion(@Param('id') id: string) {
    await this.dataSource.query(
      `
      UPDATE perfiles_proveedor
      SET verificado = false,
          fecha_actualizacion = NOW()
      WHERE id = $1::int
    `,
      [id],
    );

    return { ok: true, id: Number(id), estado: 'Pendiente' };
  }

  @Get('portal/admin/activos')
  async getPortalAdminActivos() {
    await this.ensureAdminLocacionesTable();
    await this.ensureAdminLocacionesImagenesTable();

    const tramiteRows = await this.dataSource.query(`
      SELECT
        'tramite'::text AS origen,
        tl.id,
        tl.nombre_lugar AS locacion,
        COALESCE(m.nombre, 'Sin ubicación') AS ubicacion,
        CASE
          WHEN COALESCE(tl.observaciones, '') ILIKE '%[mantenimiento]%' THEN 'En mantenimiento'
          WHEN COUNT(t.id) > 0 THEN 'Activo'
          ELSE 'Activo'
        END AS estado,
        COUNT(t.id)::int AS reservas
      FROM tramite_locaciones tl
      LEFT JOIN municipios m ON m.id = tl.municipio_id
      LEFT JOIN tramites t ON t.id = tl.tramite_id
      GROUP BY tl.id, tl.nombre_lugar, m.nombre, tl.observaciones
      ORDER BY tl.id DESC
      LIMIT 15
    `);

    const manualRows = await this.dataSource.query(`
      SELECT
        'manual'::text AS origen,
        l.id,
        l.nombre_lugar AS locacion,
        COALESCE(m.nombre, 'Sin ubicación') AS ubicacion,
        li.url AS imagen_principal,
        COALESCE(img.total, 0)::int AS total_imagenes,
        CASE WHEN l.activo THEN 'Activo' ELSE 'Inactivo' END AS estado,
        0::int AS reservas
      FROM admin_locaciones l
      LEFT JOIN municipios m ON m.id = l.municipio_id
      LEFT JOIN LATERAL (
        SELECT i.url
        FROM admin_locaciones_imagenes i
        WHERE i.locacion_id = l.id
        ORDER BY COALESCE(i.orden, i.id) ASC
        LIMIT 1
      ) li ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS total
        FROM admin_locaciones_imagenes i
        WHERE i.locacion_id = l.id
      ) img ON true
      ORDER BY l.id DESC
      LIMIT 30
    `);

    const rows = [...manualRows, ...tramiteRows];

    return { data: rows, total: rows.length };
  }

  @Post('portal/admin/activos/:id/toggle-mantenimiento')
  async togglePortalAdminActivo(@Param('id') id: string, @Body() body?: { origen?: 'tramite' | 'manual' }) {
    const origen = body?.origen ?? 'tramite';

    if (origen === 'manual') {
      const [manual] = await this.dataSource.query(
        `SELECT id, activo FROM admin_locaciones WHERE id = $1::int LIMIT 1`,
        [id],
      );

      if (!manual?.id) {
        return { ok: false, message: 'Locación manual no encontrada' };
      }

      await this.dataSource.query(
        `
        UPDATE admin_locaciones
        SET activo = NOT activo,
            updated_at = NOW()
        WHERE id = $1::int
      `,
        [id],
      );

      return {
        ok: true,
        id: Number(id),
        estado: manual.activo ? 'Inactivo' : 'Activo',
      };
    }

    const [loc] = await this.dataSource.query(
      `SELECT id, COALESCE(observaciones, '') AS observaciones FROM tramite_locaciones WHERE id = $1::int LIMIT 1`,
      [id],
    );

    if (!loc?.id) {
      return { ok: false, message: 'Activo no encontrado' };
    }

    const current = String(loc.observaciones || '');
    const inMaintenance = current.toLowerCase().includes('[mantenimiento]');
    const updated = inMaintenance
      ? current.replace(/\[mantenimiento\]\s*/gi, '').trim()
      : `[mantenimiento] ${current}`.trim();

    await this.dataSource.query(
      `
      UPDATE tramite_locaciones
      SET observaciones = $2,
          fecha_actualizacion = NOW()
      WHERE id = $1::int
    `,
      [id, updated],
    );

    return {
      ok: true,
      id: Number(id),
      estado: inMaintenance ? 'Activo' : 'En mantenimiento',
    };
  }

  @Post('portal/admin/locaciones')
  async crearPortalAdminLocacion(
    @Body()
    body?: {
      nombre_lugar?: string;
      municipio_id?: number;
      tipo_espacio_id?: number;
      observaciones?: string;
      requester_email?: string;
    },
  ) {
    await this.ensureAdminLocacionesTable();
    await this.ensureAdminLocacionesImagenesTable();

    const nombre = String(body?.nombre_lugar ?? '').trim();
    if (!nombre) {
      return { ok: false, message: 'El nombre de la locación es obligatorio' };
    }

    const [inserted] = await this.dataSource.query(
      `
      INSERT INTO admin_locaciones (nombre_lugar, municipio_id, tipo_espacio_id, observaciones, activo)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, nombre_lugar
    `,
      [
        nombre,
        body?.municipio_id ?? null,
        body?.tipo_espacio_id ?? null,
        body?.observaciones ?? null,
      ],
    );

    const correoSolicitante = String(body?.requester_email ?? '').trim().toLowerCase();
    if (correoSolicitante) {
      await this.enviarCorreoSiConfig(
        correoSolicitante,
        'PUFAB: locación registrada correctamente',
        `
          <h2>Locación registrada</h2>
          <p>La locación fue creada exitosamente en el sistema.</p>
          <p><strong>Locación:</strong> ${inserted?.nombre_lugar ?? nombre}</p>
          <p><strong>ID:</strong> ${inserted?.id ?? 'N/A'}</p>
          <p>Ya puedes seleccionarla en el trámite de permiso.</p>
        `,
      );
    }

    return { ok: true, data: inserted };
  }

  @Post('portal/admin/locaciones/:id/imagenes')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'locaciones');
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const safeExt = extname(file.originalname || '').toLowerCase() || '.jpg';
          cb(null, `${Date.now()}-${randomUUID()}${safeExt}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        cb(null, allowed.includes(file.mimetype));
      },
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async subirImagenLocacion(
    @Param('id') id: string,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    await this.ensureAdminLocacionesTable();
    await this.ensureAdminLocacionesImagenesTable();

    if (!imagen) {
      return { ok: false, message: 'Debes adjuntar una imagen válida (JPG, PNG o WEBP).' };
    }

    const [locacion] = await this.dataSource.query(
      `SELECT id FROM admin_locaciones WHERE id = $1::int LIMIT 1`,
      [id],
    );

    if (!locacion) {
      return { ok: false, message: 'Locación no encontrada.' };
    }

    const [count] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM admin_locaciones_imagenes WHERE locacion_id = $1::int`,
      [id],
    );

    if ((count?.total ?? 0) >= 10) {
      return { ok: false, message: 'Esta locación ya tiene el máximo de 10 imágenes.' };
    }

    const publicUrl = `/uploads/locaciones/${imagen.filename}`;
    const [saved] = await this.dataSource.query(
      `
      INSERT INTO admin_locaciones_imagenes (locacion_id, url, nombre_archivo, orden)
      VALUES ($1::int, $2, $3, $4)
      RETURNING id, locacion_id, url, nombre_archivo, created_at
    `,
      [id, publicUrl, imagen.originalname || imagen.filename, (count?.total ?? 0) + 1],
    );

    return { ok: true, data: saved };
  }

  @Get('portal/admin/locaciones/:id/imagenes')
  async listarImagenesLocacion(@Param('id') id: string) {
    await this.ensureAdminLocacionesImagenesTable();
    const data = await this.dataSource.query(
      `
      SELECT id, locacion_id, url, nombre_archivo, COALESCE(orden, id) AS orden, created_at
      FROM admin_locaciones_imagenes
      WHERE locacion_id = $1::int
      ORDER BY COALESCE(orden, id) ASC
    `,
      [id],
    );

    return { ok: true, data };
  }

  @Post('portal/admin/locaciones/:id/imagenes/reordenar')
  async reordenarImagenesLocacion(
    @Param('id') id: string,
    @Body() body?: { imagen_ids?: number[] },
  ) {
    await this.ensureAdminLocacionesImagenesTable();

    const ids = Array.isArray(body?.imagen_ids)
      ? body?.imagen_ids.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value))
      : [];

    if (!ids.length) {
      return { ok: false, message: 'Debes enviar imagen_ids para reordenar.' };
    }

    const existentes = await this.dataSource.query(
      `
      SELECT id
      FROM admin_locaciones_imagenes
      WHERE locacion_id = $1::int
    `,
      [id],
    );

    const existentesSet = new Set((existentes || []).map((item: any) => Number(item.id)));
    const validos = ids.filter((imagenId) => existentesSet.has(imagenId));

    if (!validos.length) {
      return { ok: false, message: 'No se encontraron imágenes válidas para esta locación.' };
    }

    for (let i = 0; i < validos.length; i += 1) {
      await this.dataSource.query(
        `
        UPDATE admin_locaciones_imagenes
        SET orden = $2
        WHERE id = $1::int
      `,
        [validos[i], i + 1],
      );
    }

    return { ok: true, total: validos.length };
  }

  @Post('portal/admin/locaciones/:id/imagenes/:imagenId/eliminar')
  async eliminarImagenLocacion(
    @Param('id') id: string,
    @Param('imagenId') imagenId: string,
  ) {
    await this.ensureAdminLocacionesImagenesTable();

    await this.dataSource.query(
      `
      DELETE FROM admin_locaciones_imagenes
      WHERE id = $1::int
        AND locacion_id = $2::int
    `,
      [imagenId, id],
    );

    const restantes = await this.dataSource.query(
      `
      SELECT id
      FROM admin_locaciones_imagenes
      WHERE locacion_id = $1::int
      ORDER BY COALESCE(orden, id) ASC
    `,
      [id],
    );

    for (let i = 0; i < restantes.length; i += 1) {
      await this.dataSource.query(
        `UPDATE admin_locaciones_imagenes SET orden = $2 WHERE id = $1::int`,
        [restantes[i].id, i + 1],
      );
    }

    return { ok: true };
  }

  @Post('reportes/admin/:seccion')
  async generarReporteAdmin(
    @Param('seccion') seccion: string,
    @Body() body?: { parametros?: Record<string, any> },
  ) {
    const normalized = String(seccion || '').toLowerCase();
    const data = await this.getReportDataBySeccion(normalized);

    if (!data) {
      return { ok: false, message: `Sección de reporte no soportada: ${seccion}` };
    }

    await this.ensureReportesTable();

    const reportsDir = join(process.cwd(), 'uploads', 'reportes');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const buffer = await this.buildPdfBuffer(normalized, data.title, data.rows, data.summary);
    const fileName = `reporte-${normalized}-${Date.now()}.pdf`;
    const absoluteFile = join(reportsDir, fileName);
    await writeFile(absoluteFile, buffer);

    const publicUrl = `/uploads/reportes/${fileName}`;
    const [saved] = await this.dataSource.query(
      `
      INSERT INTO admin_reportes_generados (seccion, archivo_url, archivo_nombre, parametros, resumen)
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
      RETURNING id, seccion, archivo_url, archivo_nombre, created_at
    `,
      [
        normalized,
        publicUrl,
        fileName,
        JSON.stringify(body?.parametros ?? {}),
        JSON.stringify(data.summary ?? {}),
      ],
    );

    return {
      ok: true,
      data: {
        ...saved,
        total_filas: data.rows.length,
        title: data.title,
      },
    };
  }

  @Get('portal/admin/flujo-permisos')
  async getPortalAdminFlujoPermisos(@Query('q') q?: string) {
    const base = await this.dataSource.query(`
      SELECT
        t.id,
        t.numero_radicado,
        COALESCE(p.nombre_proyecto, 'Proyecto sin nombre') AS proyecto,
        COALESCE(split_part(us.email, '@', 1), 'Productora') AS productora,
        COALESCE(m.nombre, 'Boyacá') AS ciudad,
        COALESCE(e.nombre, 'Pendiente') AS estado,
        COALESCE(t.fecha_solicitud::date, CURRENT_DATE) AS fecha
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      LEFT JOIN usuarios us ON us.id = p.usuario_id
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      LEFT JOIN LATERAL (
        SELECT l.*
        FROM tramite_locaciones l
        WHERE l.tramite_id = t.id
        ORDER BY l.id ASC
        LIMIT 1
      ) tl ON true
      LEFT JOIN municipios m ON m.id = tl.municipio_id
      ORDER BY t.fecha_solicitud DESC
      LIMIT 30
    `);

    const query = (q ?? '').toLowerCase().trim();
    const data = query
      ? base.filter((item: any) => `${item.numero_radicado} ${item.proyecto}`.toLowerCase().includes(query))
      : base;

    const normalize = (value: string) => {
      const n = String(value || '').toLowerCase();
      if (n.includes('aprob')) return 'Aprobado';
      if (n.includes('rech')) return 'Rechazado';
      if (n.includes('subsan') || n.includes('corre')) return 'En corrección';
      return 'Pendiente';
    };

    const resumen = {
      pendientes: data.filter((i: any) => normalize(i.estado) === 'Pendiente').length,
      revision: data.filter((i: any) => normalize(i.estado) === 'En corrección').length,
      aprobados: data.filter((i: any) => normalize(i.estado) === 'Aprobado').length,
      rechazados: data.filter((i: any) => normalize(i.estado) === 'Rechazado').length,
    };

    return {
      resumen,
      data: data.map((item: any) => ({ ...item, estado_ui: normalize(item.estado) })),
      total: data.length,
    };
  }

  @Get('portal/admin/flujo-permisos/:id')
  async getPortalAdminFlujoPermisoDetalle(@Param('id') id: string) {
    const [tramite] = await this.dataSource.query(`
      SELECT
        t.id,
        t.numero_radicado,
        COALESCE(p.nombre_proyecto, 'Proyecto sin nombre') AS proyecto,
        COALESCE(p.sinopsis, '') AS descripcion_proyecto,
        COALESCE(split_part(us.email, '@', 1), 'Productora') AS productora,
        0::int AS duracion_minutos,
        COALESCE(p.presupuesto_total, 0) AS presupuesto_total,
        'N/A'::text AS director,
        COALESCE(m.nombre, 'Boyacá') AS ciudad,
        COALESCE(e.nombre, 'Pendiente') AS estado,
        COALESCE(t.fecha_solicitud::date, CURRENT_DATE) AS fecha_solicitud,
        COALESCE(t.fecha_respuesta::date, null) AS fecha_respuesta,
        t.requiere_seguro_rc,
        t.requiere_plan_manejo_transito,
        t.consentimiento_comunidades_aplica
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      LEFT JOIN usuarios us ON us.id = p.usuario_id
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      LEFT JOIN LATERAL (
        SELECT l.*
        FROM tramite_locaciones l
        WHERE l.tramite_id = t.id
        ORDER BY l.id ASC
        LIMIT 1
      ) tl ON true
      LEFT JOIN municipios m ON m.id = tl.municipio_id
      WHERE t.id = $1::int
      LIMIT 1
    `, [id]);

    if (!tramite) {
      return { ok: false, error: 'Permiso no encontrado' };
    }

    const normalize = (value: string) => {
      const n = String(value || '').toLowerCase();
      if (n.includes('aprob')) return 'Aprobado';
      if (n.includes('rech')) return 'Rechazado';
      if (n.includes('subsan') || n.includes('corre')) return 'En corrección';
      return 'Pendiente';
    };

    return { 
      ok: true, 
      data: { 
        ...tramite, 
        estado_ui: normalize(tramite.estado),
        requiere_documentos: [
          tramite.requiere_seguro_rc && 'Certificado de Seguro RC',
          tramite.requiere_plan_manejo_transito && 'Plan de Manejo de Tránsito',
          tramite.consentimiento_comunidades_aplica && 'Consentimiento de Comunidades'
        ].filter(Boolean)
      } 
    };
  }

  @Post('portal/admin/flujo-permisos/:id/estado')
  async actualizarPortalAdminFlujoPermiso(
    @Param('id') id: string,
    @Body() body?: { accion?: 'aprobar' | 'rechazar' | 'correccion' },
  ) {
    const accion = body?.accion ?? 'correccion';
    const estadoActual = await this.dataSource.query(
      `SELECT estado_tramite_id FROM tramites WHERE id = $1::int LIMIT 1`,
      [id],
    );

    const estadoAnteriorId = estadoActual?.[0]?.estado_tramite_id ?? null;
    let estadoNuevoId: number | null = null;

    if (accion === 'aprobar') {
      estadoNuevoId = await this.resolveEstadoTramiteId(['aprob']);
    } else if (accion === 'rechazar') {
      estadoNuevoId = await this.resolveEstadoTramiteId(['rech']);
    } else {
      estadoNuevoId = await this.resolveEstadoTramiteId(['subsan', 'corre']);
    }

    if (!estadoNuevoId) {
      return { ok: false, message: 'No se encontró estado de trámite compatible para la acción.' };
    }

    await this.dataSource.query(
      `
      UPDATE tramites
      SET estado_tramite_id = $2::int,
          fecha_actualizacion = NOW()
      WHERE id = $1::int
    `,
      [id, estadoNuevoId],
    );

    await this.dataSource.query(
      `
      INSERT INTO historial_tramite (tramite_id, estado_anterior_id, estado_nuevo_id, accion, observacion)
      VALUES ($1::int, $2::int, $3::int, $4, $5)
    `,
      [
        id,
        estadoAnteriorId,
        estadoNuevoId,
        `admin_${accion}`,
        `Actualización administrativa de estado: ${accion}`,
      ],
    );

    return { ok: true, id: Number(id), accion };
  }

  @Get('portal/admin/comites')
  async getPortalAdminComites() {
    await this.ensureAdminComitesTable();

    const [count] = await this.dataSource.query(`SELECT COUNT(*)::int AS total FROM admin_comites_tecnicos`);
    if ((count?.total ?? 0) === 0) {
      await this.dataSource.query(`
        INSERT INTO admin_comites_tecnicos (nombre, cargo, especialidad, activo)
        VALUES
          ('Dr. Fernando Ruiz', 'Presidente', 'Derecho Cinematográfico', true),
          ('Dra. Carmen Vargas', 'Vocal', 'Medio Ambiente', true),
          ('Ing. Miguel Torres', 'Vocal', 'Infraestructura', false)
      `);
    }

    const data = await this.dataSource.query(`
      SELECT id, nombre, cargo, especialidad,
      CASE WHEN activo THEN 'Activo' ELSE 'Inactivo' END AS estado
      FROM admin_comites_tecnicos
      ORDER BY id ASC
    `);

    return { data, total: data.length };
  }

  @Post('portal/admin/comites')
  async crearPortalAdminComite(
    @Body()
    body?: {
      nombre?: string;
      cargo?: string;
      especialidad?: string;
      estado?: string;
    },
  ) {
    await this.ensureAdminComitesTable();

    const nombre = String(body?.nombre ?? '').trim();
    const cargo = String(body?.cargo ?? '').trim();
    const especialidad = String(body?.especialidad ?? '').trim();
    const estado = String(body?.estado ?? 'Activo').trim().toLowerCase();

    if (!nombre || !cargo || !especialidad) {
      return { ok: false, message: 'Nombre, cargo y especialidad son obligatorios.' };
    }

    const [inserted] = await this.dataSource.query(
      `
      INSERT INTO admin_comites_tecnicos (nombre, cargo, especialidad, activo)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, cargo, especialidad,
      CASE WHEN activo THEN 'Activo' ELSE 'Inactivo' END AS estado
    `,
      [nombre, cargo, especialidad, estado !== 'inactivo'],
    );

    return { ok: true, data: inserted };
  }

  @Post('portal/admin/comites/:id/toggle')
  async togglePortalAdminComite(@Param('id') id: string) {
    await this.ensureAdminComitesTable();

    await this.dataSource.query(`
      UPDATE admin_comites_tecnicos
      SET activo = NOT activo,
          updated_at = NOW()
      WHERE id = $1::int
    `, [id]);

    return { ok: true, id: Number(id) };
  }

  @Post('portal/admin/comites/:id/eliminar')
  async eliminarPortalAdminComite(@Param('id') id: string) {
    await this.ensureAdminComitesTable();

    const [existing] = await this.dataSource.query(
      `SELECT id FROM admin_comites_tecnicos WHERE id = $1::int LIMIT 1`,
      [id],
    );

    if (!existing?.id) {
      return { ok: false, message: 'No se encontró el miembro del comité.' };
    }

    await this.dataSource.query(
      `DELETE FROM admin_comites_tecnicos WHERE id = $1::int`,
      [id],
    );

    return { ok: true, id: Number(id) };
  }

  @Get('portal/admin/finanzas')
  async getPortalAdminFinanzas() {
    const [metrics] = await this.dataSource.query(`
      SELECT
        COALESCE(SUM(COALESCE(p.presupuesto_total, 0)), 0)::numeric AS ingresos_mes,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%pend%' THEN COALESCE(p.presupuesto_total, 0) ELSE 0 END), 0)::numeric AS pendientes,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%rech%' THEN COALESCE(p.presupuesto_total, 0) ELSE 0 END), 0)::numeric AS reembolsos,
        COUNT(DISTINCT t.id)::int AS reservas_activas
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      WHERE t.fecha_solicitud >= (CURRENT_DATE - INTERVAL '90 days')
    `);

    const reservas = await this.dataSource.query(`
      SELECT
        t.numero_radicado AS id,
        COALESCE(p.productora, 'Productora') AS cliente,
        COALESCE(l.nombre_lugar, 'Locación por definir') AS servicio,
        COALESCE(p.presupuesto_total, 0)::numeric AS monto,
        CASE
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%aprob%' THEN 'Pagado'
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%rech%' THEN 'Reembolsado'
          ELSE 'Pendiente'
        END AS estado
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      LEFT JOIN LATERAL (
        SELECT tl.nombre_lugar
        FROM tramite_locaciones tl
        WHERE tl.tramite_id = t.id
        ORDER BY tl.id ASC
        LIMIT 1
      ) l ON true
      ORDER BY t.fecha_solicitud DESC
      LIMIT 8
    `);

    return {
      metrics: {
        ingresos_mes: Number(metrics?.ingresos_mes ?? 0),
        pendientes: Number(metrics?.pendientes ?? 0),
        reembolsos: Number(metrics?.reembolsos ?? 0),
        reservas_activas: metrics?.reservas_activas ?? 0,
      },
      reservas,
    };
  }

  @Get('portal/admin/kpis')
  async getPortalAdminKpis(@Query('dias') dias?: string) {
    const rangoDiasSolicitado = Number.parseInt(dias ?? '30', 10);
    const rangoDias = [7, 30, 90].includes(rangoDiasSolicitado) ? rangoDiasSolicitado : 30;

    const [stats] = await this.dataSource.query(`
      SELECT
        COALESCE(ROUND(AVG(EXTRACT(DAY FROM (COALESCE(t.fecha_respuesta, CURRENT_DATE) - t.fecha_solicitud))), 1), 0) AS tiempo_respuesta,
        COALESCE(ROUND(AVG(CASE WHEN p.verificado THEN 100 ELSE 88 END), 0), 0) AS satisfaccion,
        COALESCE(ROUND(100.0 * SUM(CASE WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%aprob%' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0), 0), 0) AS permisos_aprobados,
        COALESCE(ROUND(100.0 * SUM(CASE WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%cancel%' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0), 0), 0) AS tasa_cancelacion
      FROM tramites t
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      LEFT JOIN perfiles_proveedor p ON p.visible_directorio = true
    `);

    const permisosProcesados = await this.dataSource.query(`
      SELECT TO_CHAR(date_trunc('month', t.fecha_solicitud), 'Mon') AS mes, COUNT(*)::int AS total
      FROM tramites t
      WHERE t.fecha_solicitud >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY date_trunc('month', t.fecha_solicitud)
      ORDER BY date_trunc('month', t.fecha_solicitud)
      LIMIT 6
    `);

    const ingresosMensuales = await this.dataSource.query(`
      SELECT TO_CHAR(date_trunc('month', t.fecha_solicitud), 'Mon') AS mes,
      COALESCE(SUM(COALESCE(p.presupuesto_total, 0)), 0)::numeric AS total
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      WHERE t.fecha_solicitud >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY date_trunc('month', t.fecha_solicitud)
      ORDER BY date_trunc('month', t.fecha_solicitud)
      LIMIT 6
    `);

    const trazabilidadDiaria = await this.dataSource.query(`
      WITH dias AS (
        SELECT generate_series((CURRENT_DATE - ($1 * INTERVAL '1 day'))::date, CURRENT_DATE::date, INTERVAL '1 day')::date AS fecha
      ),
      registros AS (
        SELECT fecha_registro::date AS fecha, COUNT(*)::int AS total
        FROM usuarios
        WHERE fecha_registro >= (CURRENT_DATE - ($1 * INTERVAL '1 day'))
        GROUP BY fecha_registro::date
      ),
      tramites_dia AS (
        SELECT
          fecha_solicitud::date AS fecha,
          COUNT(*)::int AS total,
          COALESCE(SUM(COALESCE(costo_proyecto_base, 0)), 0)::numeric AS costo_total,
          COALESCE(SUM(COALESCE(valor_abono_requerido, 0)), 0)::numeric AS abono_total
        FROM tramites
        WHERE fecha_solicitud >= (CURRENT_DATE - ($1 * INTERVAL '1 day'))
        GROUP BY fecha_solicitud::date
      )
      SELECT
        TO_CHAR(d.fecha, 'DD Mon') AS dia,
        d.fecha,
        COALESCE(r.total, 0)::int AS registros,
        COALESCE(t.total, 0)::int AS tramites,
        COALESCE(t.costo_total, 0)::numeric AS costo_total,
        COALESCE(t.abono_total, 0)::numeric AS abono_total
      FROM dias d
      LEFT JOIN registros r ON r.fecha = d.fecha
      LEFT JOIN tramites_dia t ON t.fecha = d.fecha
      ORDER BY d.fecha ASC
    `, [rangoDias]);

    const costosRecientes = await this.dataSource.query(`
      SELECT
        t.numero_radicado AS radicado,
        COALESCE(p.nombre_proyecto, 'Proyecto sin nombre') AS proyecto,
        COALESCE(u.email, 'Sin solicitante') AS solicitante,
        TO_CHAR(t.fecha_solicitud, 'DD Mon YYYY') AS fecha,
        COALESCE(p.presupuesto_total, 0)::numeric AS presupuesto_total,
        COALESCE(t.costo_proyecto_base, 0)::numeric AS costo_base,
        COALESCE(t.valor_abono_requerido, 0)::numeric AS abono_requerido,
        COALESCE((t.porcentaje_abono)::numeric, 0)::numeric AS porcentaje_abono,
        CASE
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%aprob%' THEN 'Aprobado'
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%rech%' THEN 'Rechazado'
          ELSE 'En trámite'
        END AS estado
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      LEFT JOIN usuarios u ON u.id = t.usuario_solicitante_id
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      ORDER BY t.fecha_solicitud DESC
      LIMIT 10
    `);

    const estadosTramite = await this.dataSource.query(`
      SELECT
        COALESCE(e.nombre, 'Sin estado') AS estado,
        COUNT(t.id)::int AS total
      FROM tramites t
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      GROUP BY COALESCE(e.nombre, 'Sin estado')
      ORDER BY COUNT(t.id) DESC, COALESCE(e.nombre, 'Sin estado') ASC
    `);

    const actividadUsuarios = await this.dataSource.query(`
      SELECT
        u.id,
        u.email,
        u.tipo_persona,
        COUNT(DISTINCT t.id)::int AS tramites,
        COUNT(DISTINCT sr.id)::int AS solicitudes_registro,
        COALESCE(MAX(GREATEST(COALESCE(t.fecha_solicitud, '1970-01-01'::timestamp), COALESCE(sr.fecha_envio, '1970-01-01'::timestamp))), CURRENT_TIMESTAMP) AS ultimo_movimiento
      FROM usuarios u
      LEFT JOIN tramites t ON t.usuario_solicitante_id = u.id
      LEFT JOIN solicitudes_registro sr ON sr.usuario_id = u.id
      WHERE t.id IS NOT NULL OR sr.id IS NOT NULL
      GROUP BY u.id, u.email, u.tipo_persona
      ORDER BY COUNT(DISTINCT t.id) DESC, COUNT(DISTINCT sr.id) DESC, u.email ASC
      LIMIT 10
    `);

    const rankingDias = [...trazabilidadDiaria]
      .sort((a: any, b: any) => (Number(b.tramites || 0) + Number(b.registros || 0)) - (Number(a.tramites || 0) + Number(a.registros || 0)))
      .slice(0, 7);

    return {
      rangoDias,
      permisosProcesados,
      ingresosMensuales: ingresosMensuales.map((i: any) => ({ ...i, total: Number(i.total) })),
      trazabilidadDiaria: trazabilidadDiaria.map((i: any) => ({
        ...i,
        registros: Number(i.registros ?? 0),
        tramites: Number(i.tramites ?? 0),
        costo_total: Number(i.costo_total ?? 0),
        abono_total: Number(i.abono_total ?? 0),
      })),
      costosRecientes: costosRecientes.map((i: any) => ({
        ...i,
        presupuesto_total: Number(i.presupuesto_total ?? 0),
        costo_base: Number(i.costo_base ?? 0),
        abono_requerido: Number(i.abono_requerido ?? 0),
        porcentaje_abono: Number(i.porcentaje_abono ?? 0),
      })),
      estadosTramite: estadosTramite.map((i: any) => ({
        ...i,
        total: Number(i.total ?? 0),
      })),
      actividadUsuarios: actividadUsuarios.map((i: any) => ({
        ...i,
        tramites: Number(i.tramites ?? 0),
        solicitudes_registro: Number(i.solicitudes_registro ?? 0),
      })),
      rankingDias: rankingDias.map((i: any) => ({
        ...i,
        registros: Number(i.registros ?? 0),
        tramites: Number(i.tramites ?? 0),
        costo_total: Number(i.costo_total ?? 0),
        abono_total: Number(i.abono_total ?? 0),
      })),
      indicadores: {
        tiempo_respuesta: Number(stats?.tiempo_respuesta ?? 0),
        satisfaccion: Number(stats?.satisfaccion ?? 0),
        permisos_aprobados: Number(stats?.permisos_aprobados ?? 0),
        tasa_cancelacion: Number(stats?.tasa_cancelacion ?? 0),
      },
    };
  }

  @Get('portal/admin/comunicaciones')
  async getPortalAdminComunicaciones() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS admin_config_notificaciones (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(80) UNIQUE NOT NULL,
        nombre VARCHAR(160) NOT NULL,
        activo BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const defaults = [
      ['nuevo_usuario', 'Nuevo registro de usuario', true],
      ['solicitud_permiso', 'Solicitud de permiso P.U.F.A.B.', true],
      ['pago_confirmado', 'Pago confirmado', true],
      ['perfil_pendiente', 'Perfil pendiente de verificación', false],
      ['reserva_cancelada', 'Reserva cancelada', true],
    ];

    for (const item of defaults) {
      await this.dataSource.query(
        `
        INSERT INTO admin_config_notificaciones (codigo, nombre, activo)
        VALUES ($1, $2, $3)
        ON CONFLICT (codigo) DO NOTHING
      `,
        item,
      );
    }

    const data = await this.dataSource.query(`
      SELECT id, codigo, nombre, activo
      FROM admin_config_notificaciones
      ORDER BY id ASC
    `);

    return { data, total: data.length };
  }

  @Post('portal/admin/comunicaciones/:id/toggle')
  async togglePortalAdminComunicaciones(@Param('id') id: string) {
    await this.dataSource.query(`
      UPDATE admin_config_notificaciones
      SET activo = NOT activo,
          updated_at = NOW()
      WHERE id = $1::int
    `, [id]);

    return { ok: true, id: Number(id) };
  }

  @Get('portal/academico/panel')
  async getPortalAcademicoPanel() {
    const [stats] = await this.dataSource.query(`
      SELECT
        (SELECT COUNT(*)::int FROM proyectos) AS producciones,
        (SELECT COUNT(*)::int FROM perfiles_proveedor WHERE visible_directorio = true) AS tutoriales,
        (SELECT COUNT(*)::int FROM tramites WHERE fecha_solicitud >= (CURRENT_DATE - INTERVAL '90 days')) AS pasantias,
        (SELECT COUNT(*)::int FROM historial_tramite WHERE observacion IS NOT NULL) AS documentos
    `);

    const aplicaciones = await this.dataSource.query(`
      SELECT
        COALESCE(p.nombre_proyecto, 'Proyecto sin nombre') AS titulo,
        CASE
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%aprob%' THEN 'Aceptada'
          WHEN LOWER(COALESCE(e.nombre, '')) LIKE '%subsan%' THEN 'En revisión'
          ELSE 'En revisión'
        END AS estado
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      ORDER BY t.fecha_solicitud DESC
      LIMIT 3
    `);

    return {
      stats: {
        producciones: stats?.producciones ?? 0,
        tutoriales: stats?.tutoriales ?? 0,
        pasantias: stats?.pasantias ?? 0,
        documentos: stats?.documentos ?? 0,
      },
      acciones: [
        'Ver Estadísticas del Sector',
        'Acceder a Tutoriales',
        'Buscar Pasantías',
      ],
      aplicaciones,
    };
  }

  @Get('portal/academico/observatorio')
  async getPortalAcademicoObservatorio() {
    const [metrics] = await this.dataSource.query(`
      SELECT
        COALESCE(SUM(COALESCE(p.presupuesto_total, 0)), 0)::numeric AS inversion,
        (SELECT COUNT(*)::int FROM tramites) AS tramites,
        (SELECT COUNT(*)::int FROM perfiles_proveedor WHERE visible_directorio = true) AS equipos,
        (SELECT ROUND(AVG(EXTRACT(DAY FROM (COALESCE(t.fecha_respuesta, CURRENT_DATE) - t.fecha_solicitud))), 1)
         FROM tramites t
         WHERE t.fecha_solicitud IS NOT NULL) AS respuesta_promedio
      FROM proyectos p
    `);

    const porTipo = await this.dataSource.query(`
      SELECT
        COALESCE(LOWER(te.nombre), 'natural') AS tipo,
        COUNT(*)::int AS total
      FROM tramite_locaciones tl
      LEFT JOIN tipos_espacio te ON te.id = tl.tipo_espacio_id
      GROUP BY COALESCE(LOWER(te.nombre), 'natural')
      ORDER BY total DESC
      LIMIT 5
    `);

    const porProvincia = await this.dataSource.query(`
      SELECT
        COALESCE(m.nombre, 'Sin municipio') AS provincia,
        COUNT(*)::int AS total
      FROM tramite_locaciones tl
      LEFT JOIN municipios m ON m.id = tl.municipio_id
      GROUP BY COALESCE(m.nombre, 'Sin municipio')
      ORDER BY total DESC
      LIMIT 5
    `);

    return {
      metrics: {
        inversion: Number(metrics?.inversion ?? 0),
        tramites: metrics?.tramites ?? 0,
        equipos: metrics?.equipos ?? 0,
        respuesta_promedio: Number(metrics?.respuesta_promedio ?? 0),
      },
      porTipo,
      porProvincia,
      tendencia: [12, 15, 18, 22, 28, 24],
      documentos: [
        { titulo: 'Ley de Cine 814 de 2003', tipo: 'Normativa' },
        { titulo: 'Decreto 392 de 2018', tipo: 'Incentivos' },
        { titulo: 'Guía PUFAB 2024', tipo: 'Trámites' },
      ],
    };
  }

  @Get('portal/academico/capacitacion')
  async getPortalAcademicoCapacitacion(@Query('q') q?: string) {
    const cursos = [
      {
        titulo: 'Introducción al P.U.F.A.B.',
        nivel: 'Básico',
        duracion: '15 min',
        rating: 4.8,
        imagen: 'https://www.figma.com/api/mcp/asset/4715cfab-dc09-4f64-aeae-b1bc228dc5f4',
      },
      {
        titulo: 'Scouting de Locaciones en Boyacá',
        nivel: 'Intermedio',
        duracion: '28 min',
        rating: 4.9,
        imagen: 'https://www.figma.com/api/mcp/asset/b76e7138-8273-4407-97de-35e83a360c53',
      },
      {
        titulo: 'Gestión de Permisos Ambientales',
        nivel: 'Avanzado',
        duracion: '22 min',
        rating: 4.7,
        imagen: 'https://www.figma.com/api/mcp/asset/9f93a85f-ea22-4330-97cf-0c1fafa30488',
      },
      {
        titulo: 'Producción Sostenible',
        nivel: 'Intermedio',
        duracion: '18 min',
        rating: 4.6,
        imagen: 'https://www.figma.com/api/mcp/asset/8257c48e-90f6-4530-902f-9b452baf5417',
      },
    ];

    const search = (q ?? '').toLowerCase().trim();
    const data = search
      ? cursos.filter((c) => c.titulo.toLowerCase().includes(search))
      : cursos;

    return { data, total: data.length };
  }

  @Get('portal/academico/pasantias')
  async getPortalAcademicoPasantias() {
    const vacantes = await this.dataSource.query(`
      SELECT
        t.numero_radicado AS codigo,
        COALESCE(p.nombre_proyecto, 'Proyecto sin nombre') AS proyecto,
        COALESCE(m.nombre, 'Boyacá') AS ciudad,
        COALESCE(t.fecha_solicitud::date, CURRENT_DATE) AS inicio,
        COALESCE((t.fecha_solicitud + INTERVAL '45 days')::date, CURRENT_DATE) AS cierre,
        COALESCE(e.nombre, 'En revisión') AS estado
      FROM tramites t
      LEFT JOIN proyectos p ON p.id = t.proyecto_id
      LEFT JOIN estados_tramite e ON e.id = t.estado_tramite_id
      LEFT JOIN LATERAL (
        SELECT l.*
        FROM tramite_locaciones l
        WHERE l.tramite_id = t.id
        ORDER BY l.id ASC
        LIMIT 1
      ) tl ON true
      LEFT JOIN municipios m ON m.id = tl.municipio_id
      ORDER BY t.fecha_solicitud DESC
      LIMIT 5
    `);

    return { data: vacantes, total: vacantes.length };
  }

  @Get('portal/academico/recursos')
  async getPortalAcademicoRecursos() {
    const [stats] = await this.dataSource.query(`
      SELECT
        (SELECT COUNT(*)::int FROM historial_tramite WHERE observacion IS NOT NULL) AS documentos,
        (SELECT COUNT(*)::int FROM perfiles_proveedor WHERE visible_directorio = true) AS tutoriales,
        (SELECT COUNT(*)::int FROM tramites) AS estadisticas
    `);

    return {
      documentos: {
        total: stats?.documentos ?? 0,
        descripcion: 'Accede a leyes, decretos y reglamentos del sector cinematográfico.',
      },
      tutoriales: {
        total: stats?.tutoriales ?? 0,
        descripcion: 'Aprende con nuestros tutoriales sobre trámites y producción.',
      },
      estadisticas: {
        total: stats?.estadisticas ?? 0,
        descripcion: 'Datos actualizados sobre la industria cinematográfica en Boyacá.',
      },
    };
  }
}
