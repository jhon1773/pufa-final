import {
  Controller, Get, Post, Patch, Param, Body,
  ParseIntPipe, UseGuards, UseInterceptors, UploadedFile, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('documentos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post('subir')
  @ApiOperation({
    summary: 'Subir documento',
    description: 'Carga un archivo y lo registra con hash SHA256 para verificación de integridad. Máximo 10 MB. Formatos aceptados: PDF, JPG, PNG, DOCX.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: { type: 'string', format: 'binary', description: 'Archivo a subir (máx. 10 MB)' },
        tipo_documento_id: { type: 'number', example: 1, description: 'ID del tipo de documento' },
        tramite_id: { type: 'number', example: 1, description: 'ID del trámite al que pertenece' },
        proyecto_id: { type: 'number', example: 1, description: 'ID del proyecto al que pertenece' },
        solicitud_registro_id: { type: 'number', description: 'ID de la solicitud de registro (alternativo a tramite_id)' },
      },
      required: ['archivo'],
    },
  })
  @ApiResponse({ status: 201, description: 'Documento registrado con hash SHA256.' })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, nombre);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
    }),
  )
  subirDocumento(
    @UploadedFile() archivo: Express.Multer.File,
    @CurrentUser('id') usuarioId: number,
    @Body('tipo_documento_id', new ParseIntPipe({ optional: true })) tipoDocumentoId?: number,
    @Body('tramite_id', new ParseIntPipe({ optional: true })) tramiteId?: number,
    @Body('proyecto_id', new ParseIntPipe({ optional: true })) proyectoId?: number,
    @Body('solicitud_registro_id', new ParseIntPipe({ optional: true })) solicitudId?: number,
  ) {
    return this.documentosService.registrarDocumento(
      usuarioId, archivo, tipoDocumentoId, tramiteId, proyectoId, solicitudId,
    );
  }

  @Get('tramite/:tramiteId')
  @ApiOperation({ summary: 'Listar documentos de un trámite' })
  @ApiParam({ name: 'tramiteId', description: 'ID del trámite' })
  @ApiResponse({ status: 200, description: 'Lista de documentos del trámite con su estado de validación.' })
  listarPorTramite(@Param('tramiteId', ParseIntPipe) tramiteId: number) {
    return this.documentosService.listarPorTramite(tramiteId);
  }

  @Get('proyecto/:proyectoId')
  @ApiOperation({ summary: 'Listar documentos de un proyecto' })
  @ApiParam({ name: 'proyectoId', description: 'ID del proyecto' })
  @ApiResponse({ status: 200, description: 'Lista de documentos del proyecto.' })
  listarPorProyecto(@Param('proyectoId', ParseIntPipe) proyectoId: number) {
    return this.documentosService.listarPorProyecto(proyectoId);
  }

  @Roles('admin')
  @Patch(':id/validar')
  @ApiOperation({ summary: 'Validar documento', description: 'Admin aprueba o rechaza un documento adjunto.' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiBody({
    schema: {
      properties: {
        estado: { type: 'string', enum: ['aprobado', 'rechazado'], example: 'aprobado' },
        observaciones: { type: 'string', example: 'Documento legible y vigente.' },
      },
      required: ['estado'],
    },
  })
  @ApiResponse({ status: 200, description: 'Documento validado.' })
  validar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') adminId: number,
    @Body('estado') estado: 'aprobado' | 'rechazado',
    @Body('observaciones') observaciones?: string,
  ) {
    return this.documentosService.validarDocumento(id, adminId, estado, observaciones);
  }

  @Get(':id/descargar')
  @ApiOperation({ summary: 'Descargar documento', description: 'Descarga el archivo del documento por su ID.' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({ status: 200, description: 'Archivo del documento descargado.' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async descargar(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.documentosService.descargarDocumento(id, res);
  }
}
