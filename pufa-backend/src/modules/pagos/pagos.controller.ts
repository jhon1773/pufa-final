import {
  Controller, Get, Post, Patch, Param, Body,
  ParseIntPipe, UseGuards, Res,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiBody,
} from '@nestjs/swagger';
import { PagosService } from './pagos.service';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import PDFDocument from 'pdfkit';
import type { Response } from 'express';

@ApiTags('pagos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar pago',
    description: 'El solicitante registra un pago adjuntando el soporte. Queda en estado "pendiente de verificación" hasta que un admin lo confirme.',
  })
  @ApiResponse({ status: 201, description: 'Pago registrado. Pendiente de verificación.' })
  registrar(
    @CurrentUser('id') usuarioId: number,
    @Body() dto: RegistrarPagoDto,
  ) {
    return this.pagosService.registrarPago(usuarioId, dto);
  }

  @Get('tramite/:tramiteId')
  @ApiOperation({ summary: 'Listar pagos de un trámite' })
  @ApiParam({ name: 'tramiteId', description: 'ID del trámite' })
  @ApiResponse({ status: 200, description: 'Lista de pagos del trámite.' })
  listarPorTramite(@Param('tramiteId', ParseIntPipe) tramiteId: number) {
    return this.pagosService.listarPorTramite(tramiteId);
  }

  @Roles('admin')
  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar estado de un pago', description: 'Admin verifica o rechaza el soporte de pago.' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiBody({
    schema: {
      properties: {
        estado: { type: 'string', enum: ['verificado', 'rechazado'], example: 'verificado' },
      },
      required: ['estado'],
    },
  })
  @ApiResponse({ status: 200, description: 'Estado del pago actualizado.' })
  actualizarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ) {
    return this.pagosService.actualizarEstadoPago(id, estado);
  }

  @Get('tramite/:tramiteId/abono')
  @ApiOperation({ summary: 'Obtener abono de un trámite', description: 'Retorna el registro de abono inicial requerido para el trámite.' })
  @ApiParam({ name: 'tramiteId', description: 'ID del trámite' })
  @ApiResponse({ status: 200, description: 'Datos del abono.' })
  obtenerAbono(@Param('tramiteId', ParseIntPipe) tramiteId: number) {
    return this.pagosService.obtenerAbonoPorTramite(tramiteId);
  }

  @Get(':id/recibo-demo')
  @ApiOperation({ summary: 'Generar recibo PDF demo para un pago' })
  async reciboDemo(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pago = await this.pagosService.obtenerPorId(id);
    if (!pago) return res.status(404).json({ ok: false, error: 'Pago no encontrado' });

    // Generar PDF simple con estética de recibo bancario
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=recibo-${id}.pdf`);
      res.send(buffer);
    });

    // Header - bank style
    doc.rect(36, 36, 522, 110).fill('#f7f7f9');
    doc.fillColor('#0b3d91').fontSize(16).text('RECIBO DE PAGO - COMPROBANTE BANCARIO (DEMO)', 48, 50);
    doc.fillColor('#111827').fontSize(10).text(`Recibo No: ${id}`, 48, 76);
    doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 48, 92);

    // Pago details box
    const startY = 160;
    doc.moveTo(36, startY - 8).lineTo(558, startY - 8).stroke('#e5e7eb');
    doc.fontSize(12).fillColor('#111827').text('Detalles del Pago', 48, startY);
    doc.fontSize(10).fillColor('#374151').text(`Trámite ID: ${pago.tramite_id ?? 'N/A'}`, 48, startY + 22);
    doc.text(`Beneficiario (usuario): ${pago.usuario_id ?? 'N/A'}`, 48, startY + 38);
    doc.text(`Concepto / Referencia: ${pago.referencia_pago ?? 'N/A'}`, 48, startY + 54);
    doc.fontSize(14).fillColor('#0b3d91').text(`Valor: $${(pago.monto || 0).toLocaleString('es-CO')}`, 48, startY + 86);

    // Footer with bank instructions mock
    doc.fontSize(9).fillColor('#6b7280').text('Este es un recibo demostración con formato similar a los comprobantes que se expiden en entidades bancarias. No tiene validez legal.', 48, 420, { width: 480 });

    doc.end();
    return;
  }
}
