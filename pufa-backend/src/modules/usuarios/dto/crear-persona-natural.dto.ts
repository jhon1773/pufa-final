import {
  IsString, IsOptional, IsNumber, IsBoolean,
  IsDateString, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearPersonaNaturalDto {
  @ApiProperty({ example: 'María', description: 'Primer nombre' })
  @IsString({ message: 'El primer nombre debe ser un texto válido' })
  primer_nombre: string;

  @ApiPropertyOptional({ example: 'Fernanda' })
  @IsOptional()
  @IsString({ message: 'El segundo nombre debe ser un texto válido' })
  segundo_nombre?: string;

  @ApiProperty({ example: 'González' })
  @IsString({ message: 'El primer apellido debe ser un texto válido' })
  primer_apellido: string;

  @ApiPropertyOptional({ example: 'Torres' })
  @IsOptional()
  @IsString({ message: 'El segundo apellido debe ser un texto válido' })
  segundo_apellido?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de identificación (ver /catalogos/tipos-identificacion)' })
  @IsOptional()
  @IsNumber({}, { message: 'El tipo de identificación debe ser un número válido' })
  tipo_identificacion_id?: number;

  @ApiProperty({ example: '1012345678', description: 'Número de documento de identidad' })
  @IsString({ message: 'El número de documento debe ser un texto válido' })
  numero_documento: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del municipio de residencia (ver /catalogos/municipios)' })
  @IsOptional()
  @IsNumber({}, { message: 'El municipio debe ser un número válido' })
  municipio_residencia_id?: number;

  @ApiPropertyOptional({ example: 'Calle 10 # 5-30, Tunja' })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser un texto válido' })
  direccion?: string;

  @ApiPropertyOptional({ example: 'Tunja', description: 'Lugar de nacimiento' })
  @IsOptional()
  @IsString({ message: 'El lugar de nacimiento debe ser un texto válido' })
  lugar_nacimiento?: string;

  @ApiPropertyOptional({ example: '1995-06-15', description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_nacimiento?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del sexo al nacer (ver /catalogos/sexos-nacer)' })
  @IsOptional()
  @IsNumber({}, { message: 'El sexo debe ser un número válido' })
  sexo_nacer_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de identidad de género (ver /catalogos/identidades-genero)' })
  @IsOptional()
  @IsNumber({}, { message: 'La identidad de género debe ser un número válido' })
  identidad_genero_id?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si pertenece a grupo étnico (sí o no)' })
  pertenece_grupo_etnico?: boolean;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsNumber({}, { message: 'El grupo étnico debe ser un número válido' })
  grupo_etnico_id?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si tiene discapacidad (sí o no)' })
  tiene_discapacidad?: boolean;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsNumber({}, { message: 'El tipo de discapacidad debe ser un número válido' })
  tipo_discapacidad_id?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si vive en zona rural (sí o no)' })
  vive_zona_rural?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si se considera campesino (sí o no)' })
  se_considera_campesino?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si es víctima del conflicto armado (sí o no)' })
  victima_conflicto_armado?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si es migrante o refugiado (sí o no)' })
  migrante_refugiado?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'ID del nivel educativo (ver /catalogos/niveles-educativos)' })
  @IsOptional()
  @IsNumber({}, { message: 'El nivel educativo debe ser un número válido' })
  nivel_educativo_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del tiempo de dedicación al sector' })
  @IsOptional()
  @IsNumber({}, { message: 'El tiempo de dedicación debe ser un número válido' })
  tiempo_dedicacion_sector_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de ingresos provenientes del sector' })
  @IsOptional()
  @IsNumber({}, { message: 'El tipo de ingresos debe ser un número válido' })
  ingresos_provienen_sector_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de propiedad de equipos' })
  @IsOptional()
  @IsNumber({}, { message: 'El tipo de propiedad de equipos debe ser un número válido' })
  equipos_propios_tipo_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de la gama de equipos' })
  @IsOptional()
  @IsNumber({}, { message: 'La gama de equipos debe ser un número válido' })
  gama_equipos_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del rango de experiencia en el sector' })
  @IsOptional()
  @IsNumber({}, { message: 'El rango de experiencia debe ser un número válido' })
  tiempo_experiencia_sector_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de producción en la que participa' })
  @IsOptional()
  @IsNumber({}, { message: 'El tipo de producción debe ser un número válido' })
  produccion_participa_id?: number;

  @ApiPropertyOptional({ example: 3, description: 'Nivel de inglés hablado del 0 (ninguno) al 5 (nativo)' })
  @IsOptional()
  @IsNumber({}, { message: 'El nivel de inglés (habla) debe ser un número entre 0 y 5' })
  @Min(0, { message: 'El nivel de inglés (habla) debe ser como mínimo 0' })
  @Max(5, { message: 'El nivel de inglés (habla) debe ser como máximo 5' })
  ingles_habla?: number;

  @ApiPropertyOptional({ example: 4, description: 'Nivel de inglés de lectura del 0 al 5' })
  @IsOptional()
  @IsNumber({}, { message: 'El nivel de inglés (lectura) debe ser un número entre 0 y 5' })
  @Min(0, { message: 'El nivel de inglés (lectura) debe ser como mínimo 0' })
  @Max(5, { message: 'El nivel de inglés (lectura) debe ser como máximo 5' })
  ingles_lee?: number;

  @ApiPropertyOptional({ example: 2, description: 'Nivel de inglés escrito del 0 al 5' })
  @ApiPropertyOptional({ example: 2, description: 'Nivel de inglés de escritura del 0 al 5' })
  @IsOptional()
  @IsNumber({}, { message: 'El nivel de inglés (escritura) debe ser un número entre 0 y 5' })
  @Min(0, { message: 'El nivel de inglés (escritura) debe ser como mínimo 0' })
  @Max(5, { message: 'El nivel de inglés (escritura) debe ser como máximo 5' })
  ingles_escribe?: number;
}
