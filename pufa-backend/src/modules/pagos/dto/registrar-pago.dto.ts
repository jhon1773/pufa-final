import { IsNumber, IsOptional, IsString, IsDateString, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarPagoDto {
  @ApiProperty({ example: 1, description: 'ID del trámite al que corresponde el pago' })
  @IsNumber()
  tramite_id: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de pago (ver /catalogos/tipos-pago)' })
  @IsOptional()
  @IsNumber()
  tipo_pago_id?: number;

  @ApiProperty({ example: 750000, description: 'Monto pagado en pesos colombianos (COP)' })
  @IsNumber()
  @IsPositive()
  monto: number;

  @ApiPropertyOptional({ example: 'REF-2026-001234', description: 'Referencia o número de comprobante del pago' })
  @IsOptional()
  @IsString()
  referencia_pago?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del documento soporte del pago (subido previamente)' })
  @IsOptional()
  @IsNumber()
  soporte_pago_documento_id?: number;

  @ApiPropertyOptional({ example: '2026-03-14', description: 'Fecha en que se realizó el pago (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fecha_pago?: string;
}
