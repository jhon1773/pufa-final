import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { Documento } from './entities/documento.entity';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private documentosRepo: Repository<Documento>,
  ) {}

  // Registra un archivo subido con su hash SHA256
  async registrarDocumento(
    usuarioId: number,
    archivo: Express.Multer.File,
    tipoDocumentoId?: number,
    tramiteId?: number,
    proyectoId?: number,
    solicitudRegistroId?: number,
  ) {
    // Calcula hash SHA256 para verificar integridad del archivo
    const buffer = fs.readFileSync(archivo.path);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Obtiene la versión más reciente para este tipo de documento y contexto
    const versionActual = await this.documentosRepo.count({
      where: {
        usuario_id: usuarioId,
        tipo_documento_id: tipoDocumentoId,
        tramite_id: tramiteId,
        proyecto_id: proyectoId,
        activo: true,
      },
    });

    const documento = this.documentosRepo.create({
      usuario_id: usuarioId,
      tramite_id: tramiteId,
      proyecto_id: proyectoId,
      solicitud_registro_id: solicitudRegistroId,
      tipo_documento_id: tipoDocumentoId,
      version: versionActual + 1,
      nombre_original: archivo.originalname,
      nombre_guardado: archivo.filename,
      ruta_archivo: archivo.path,
      mime_type: archivo.mimetype,
      tamano_bytes: archivo.size,
      hash_sha256: hash,
      estado_validacion: 'pendiente',
    });

    return this.documentosRepo.save(documento);
  }

  // Lista documentos de un trámite
  async listarPorTramite(tramiteId: number) {
    return this.documentosRepo.find({
      where: { tramite_id: tramiteId, activo: true },
      relations: ['tipo_documento'],
      order: { fecha_subida: 'DESC' },
    });
  }

  // Lista documentos de un proyecto
  async listarPorProyecto(proyectoId: number) {
    return this.documentosRepo.find({
      where: { proyecto_id: proyectoId, activo: true },
      relations: ['tipo_documento'],
      order: { fecha_subida: 'DESC' },
    });
  }

  // Valida o rechaza un documento (admin)
  async validarDocumento(
    documentoId: number,
    adminId: number,
    estadoValidacion: 'aprobado' | 'rechazado',
    observaciones?: string,
  ) {
    const documento = await this.documentosRepo.findOne({ where: { id: documentoId } });
    if (!documento) throw new NotFoundException('Documento no encontrado');

    await this.documentosRepo.update(documentoId, {
      estado_validacion: estadoValidacion,
      observaciones_validacion: observaciones,
      validado_por_usuario_id: adminId,
      fecha_validacion: new Date(),
    });

    return { mensaje: `Documento ${estadoValidacion} exitosamente` };
  }

  // Descarga un documento
  async descargarDocumento(documentoId: number, res: Response) {
    const documento = await this.documentosRepo.findOne({ where: { id: documentoId, activo: true } });
    if (!documento) throw new NotFoundException('Documento no encontrado');

    const filePath = documento.ruta_archivo;
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado en servidor');
    }

    res.setHeader('Content-Type', documento.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_original}"`);

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }
}
