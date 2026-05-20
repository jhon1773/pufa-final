import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Abono } from './entities/abono.entity';
import { EstadoPago } from '../catalogos/entities/estado-pago.entity';
import { EstadoAbono } from '../catalogos/entities/estado-abono.entity';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago) private pagosRepo: Repository<Pago>,
    @InjectRepository(Abono) private abonosRepo: Repository<Abono>,
    @InjectRepository(EstadoPago) private estadosPagoRepo: Repository<EstadoPago>,
    @InjectRepository(EstadoAbono) private estadosAbonoRepo: Repository<EstadoAbono>,
  ) {}

  // Registra un pago para un trámite
  async registrarPago(usuarioId: number, dto: RegistrarPagoDto) {
    const estadoPendiente = await this.estadosPagoRepo.findOne({
      where: { codigo: 'pendiente' },
    });

    const pago = this.pagosRepo.create({
      tramite_id: dto.tramite_id,
      usuario_id: usuarioId,
      tipo_pago_id: dto.tipo_pago_id,
      estado_pago_id: estadoPendiente?.id,
      monto: dto.monto,
      referencia_pago: dto.referencia_pago,
      soporte_pago_documento_id: dto.soporte_pago_documento_id,
      fecha_pago: dto.fecha_pago ? new Date(dto.fecha_pago) : new Date(),
    });

    return this.pagosRepo.save(pago);
  }

  // Lista pagos de un trámite
  async listarPorTramite(tramiteId: number) {
    return this.pagosRepo.find({
      where: { tramite_id: tramiteId },
      relations: ['tipo_pago', 'estado_pago'],
      order: { fecha_registro: 'DESC' },
    });
  }

  // Confirma o rechaza un pago (admin)
  async actualizarEstadoPago(pagoId: number, estadoCodigo: string) {
    const pago = await this.pagosRepo.findOne({ where: { id: pagoId } });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    const estado = await this.estadosPagoRepo.findOne({ where: { codigo: estadoCodigo } });
    if (!estado) throw new NotFoundException('Estado de pago no válido');

    await this.pagosRepo.update(pagoId, { estado_pago_id: estado.id });
    return { mensaje: `Pago actualizado a estado: ${estado.nombre}` };
  }

  // Crea el registro de abono requerido para un trámite
  async crearAbono(tramiteId: number, porcentaje: number, montoRequerido: number, fechaLimite: Date) {
    const estadoPendiente = await this.estadosAbonoRepo.findOne({ where: { codigo: 'pendiente' } });

    const abono = this.abonosRepo.create({
      tramite_id: tramiteId,
      porcentaje_abono: porcentaje,
      monto_requerido: montoRequerido,
      estado_abono_id: estadoPendiente?.id,
      fecha_limite: fechaLimite,
    });

    return this.abonosRepo.save(abono);
  }

  // Obtiene el abono de un trámite
  async obtenerAbonoPorTramite(tramiteId: number) {
    return this.abonosRepo.findOne({
      where: { tramite_id: tramiteId },
      relations: ['estado_abono', 'pago'],
    });
  }

  // Obtiene un pago por su ID
  async obtenerPorId(pagoId: number) {
    return this.pagosRepo.findOne({
      where: { id: pagoId },
      relations: ['tipo_pago', 'estado_pago'],
    });
  }
}
