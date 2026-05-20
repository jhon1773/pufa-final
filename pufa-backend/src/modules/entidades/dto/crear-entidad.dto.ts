import { IsString, IsOptional, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearEntidadDto {
  @ApiProperty({ example: 'Alcaldía de Villa de Leyva', description: 'Nombre de la entidad revisora' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de entidad revisora (ver /catalogos/tipos-entidad-revision)' })
  @IsOptional()
  @IsNumber()
  tipo_entidad_revision_id?: number;

  @ApiPropertyOptional({ example: 6, description: 'ID del municipio donde opera la entidad' })
  @IsOptional()
  @IsNumber()
  municipio_id?: number;

  @ApiPropertyOptional({ example: 'permisos@villadeleyva.gov.co' })
  @IsOptional()
  @IsEmail()
  correo_contacto?: string;

  @ApiPropertyOptional({ example: '3123456789' })
  @IsOptional()
  @IsString()
  telefono_contacto?: string;
}
