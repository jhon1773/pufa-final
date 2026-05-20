import {
  Controller, Get, Post, Patch, Param, Body,
  Query, ParseIntPipe, UseGuards, UseInterceptors, UploadedFiles,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiQuery, ApiBody, ApiConsumes,
} from '@nestjs/swagger';
import { TramitesService } from './tramites.service';
import { DocumentosService } from '../documentos/documentos.service';
import { Documento } from '../documentos/entities/documento.entity';
import { CrearTramiteDto } from './dto/crear-tramite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('tramites')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tramites')
export class TramitesController {
  constructor(
    private readonly tramitesService: TramitesService,
    private readonly documentosService: DocumentosService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar trámites', description: 'Solicitante ve sus propios trámites. Admin y revisor ven todos.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por ID de estado del trámite' })
  @ApiResponse({ status: 200, description: 'Listado paginado de trámites.' })
  listar(
    @CurrentUser('id') usuarioId: number,
    @CurrentUser('roles') roles: string[],
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('estado', new ParseIntPipe({ optional: true })) estadoId?: number,
  ) {
    return this.tramitesService.listar(usuarioId, roles, page, limit, estadoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener trámite completo', description: 'Retorna el trámite con locaciones, equipo técnico e historial de estados.' })
  @ApiParam({ name: 'id', description: 'ID del trámite' })
  @ApiResponse({ status: 200, description: 'Trámite con todas sus relaciones.' })
  @ApiResponse({ status: 404, description: 'Trámite no encontrado.' })
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') usuarioId: number,
    @CurrentUser('roles') roles: string[],
  ) {
    return this.tramitesService.obtenerPorId(id, usuarioId, roles);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear trámite PUFA',
    description: 'Crea una solicitud de permiso de rodaje. Genera número de radicado automático con formato PUFA-YYYYMMDD-XXXXXX. Los compromisos éticos son obligatorios.',
  })
  @ApiResponse({ status: 201, description: 'Trámite creado con número de radicado.' })
  @ApiResponse({ status: 400, description: 'Compromisos éticos no aceptados o datos inválidos.' })
  crear(
    @CurrentUser('id') usuarioId: number,
    @Body() dto: CrearTramiteDto,
  ) {
    return this.tramitesService.crear(usuarioId, dto);
  }

  @Post(':id/documentos')
  @ApiOperation({
    summary: 'Subir documentos a un trámite',
    description: 'Carga múltiples archivos a un trámite. Máximo 10 MB por archivo.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID del trámite' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Archivos a subir (máx. 10 MB cada uno)',
        },
      },
      required: ['archivos'],
    },
  })
  @ApiResponse({ status: 201, description: 'Documentos cargados exitosamente.' })
  @UseInterceptors(
    FilesInterceptor('archivos', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, nombre);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async subirDocumentos(
    @Param('id', ParseIntPipe) tramiteId: number,
    @CurrentUser('id') usuarioId: number,
    @UploadedFiles() archivos: Express.Multer.File[],
  ) {
    const resultados: Documento[] = [];
    for (const archivo of archivos || []) {
      const doc = await this.documentosService.registrarDocumento(
        usuarioId, archivo, undefined, tramiteId,
      );
      resultados.push(doc);
    }
    return { mensaje: `${resultados.length} documentos cargados exitosamente`, documentos: resultados };
  }

  @Get(':id/recibo-banco')
  @ApiOperation({
    summary: 'Generar recibo bancario del trámite',
    description: 'Genera un PDF de referencia para pago en banco con los datos del trámite.',
  })
  @ApiParam({ name: 'id', description: 'ID del trámite' })
  @ApiResponse({ status: 200, description: 'PDF del recibo generado.' })
  async reciboBanco(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') usuarioId: number,
    @CurrentUser('roles') roles: string[],
    @Res() res: Response,
  ) {
    const tramite = await this.tramitesService.obtenerPorId(id, usuarioId, roles);
    const valor = Number(tramite.valor_abono_requerido || 0);

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=recibo-tramite-${id}.pdf`);
      res.send(buffer);
    });

    doc.rect(36, 36, 522, 110).fill('#f7f7f9');
    doc.fillColor('#0b3d91').fontSize(16).text('RECIBO DE REFERENCIA DE PAGO', 48, 50);
    doc.fillColor('#111827').fontSize(10).text(`Trámite: ${tramite.numero_radicado || tramite.id}`, 48, 76);
    doc.fontSize(10).text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')}`, 48, 92);
    doc.text(`Proyecto: ${tramite.proyecto?.nombre_proyecto || 'N/A'}`, 48, 108);

    const startY = 160;
    doc.moveTo(36, startY - 8).lineTo(558, startY - 8).stroke('#e5e7eb');
    doc.fontSize(12).fillColor('#111827').text('Datos para validación', 48, startY);
    doc.fontSize(10).fillColor('#374151');
    doc.text(`Solicitante: ${tramite.usuario_solicitante?.email || 'N/A'}`, 48, startY + 22);
    doc.text(`Municipio principal: ${tramite.proyecto?.municipio_principal?.nombre || 'N/A'}`, 48, startY + 38);
    doc.text(`Estado actual: ${tramite.estado_tramite?.nombre || 'Pendiente'}`, 48, startY + 54);
    doc.fontSize(14).fillColor('#0b3d91').text(`Valor de referencia: $${valor.toLocaleString('es-CO')}`, 48, startY + 86);

    doc.fontSize(10).fillColor('#6b7280').text(
      'Este documento es una referencia para validar la solicitud y realizar el pago en banco. No reemplaza el comprobante oficial de pago.',
      48,
      420,
      { width: 480 },
    );

    doc.end();
  }

  @Roles('admin', 'revisor')
  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado del trámite', description: 'Solo admin y revisor. Registra el cambio en el historial del trámite.' })
  @ApiParam({ name: 'id', description: 'ID del trámite' })
  @ApiBody({
    schema: {
      properties: {
        estado_id: { type: 'number', example: 5, description: 'ID del nuevo estado (ver /catalogos/estados-tramite)' },
        observacion: { type: 'string', example: 'Documentación completa. Permiso aprobado.' },
      },
      required: ['estado_id', 'observacion'],
    },
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado y registrado en historial.' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') adminId: number,
    @Body('estado_id', ParseIntPipe) estadoId: number,
    @Body('observacion') observacion: string,
  ) {
    return this.tramitesService.cambiarEstado(id, adminId, estadoId, observacion);
  }
}
