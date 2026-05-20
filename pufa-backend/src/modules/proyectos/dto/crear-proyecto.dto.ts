import { IsString, IsOptional, IsNumber, IsDateString, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearProyectoDto {
  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de producción (ver /catalogos/tipos-produccion)' })
  @IsOptional()
  @IsNumber()
  tipo_produccion_id?: number;

  @ApiProperty({ example: 'Las Montañas de Boyacá', description: 'Nombre del proyecto audiovisual' })
  @IsString()
  nombre_proyecto: string;

  @ApiPropertyOptional({ example: 'Documental sobre el páramo de Ocetá y sus comunidades campesinas.' })
  @IsOptional()
  @IsString()
  sinopsis?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del municipio principal de rodaje (ver /catalogos/municipios)' })
  @IsOptional()
  @IsNumber()
  municipio_principal_id?: number;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Fecha prevista de inicio de rodaje (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fecha_inicio_prevista?: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  fecha_fin_prevista?: string;

  @ApiPropertyOptional({ example: 50000000, description: 'Presupuesto total del proyecto en pesos colombianos' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  presupuesto_total?: number;

  @ApiPropertyOptional({ example: 'mediano', description: 'Tamaño del equipo de producción' })
  @IsOptional()
  @IsString()
  tamano_equipo?: string;

  @ApiPropertyOptional({ example: 'María Rodríguez', description: 'Nombre del contacto principal del proyecto' })
  @IsOptional()
  @IsString()
  contacto_principal?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del servicio seleccionado desde el portafolio de proveedor' })
  @IsOptional()
  @IsNumber()
  servicio_requerido_id?: number;

  @ApiPropertyOptional({ example: '+57 300 123 4567', description: 'Teléfono de contacto principal' })
  @IsOptional()
  @IsString()
  telefono_contacto?: string;
}
