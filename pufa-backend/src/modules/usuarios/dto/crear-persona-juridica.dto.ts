import {
  IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsEmail,
} from 'class-validator';

export class CrearPersonaJuridicaDto {
  @IsString({ message: 'La razón social debe ser un texto válido' })
  razon_social: string;

  @IsString({ message: 'El NIT debe ser un texto válido' })
  nit: string;

  @IsOptional()
  @IsNumber({}, { message: 'El tipo de entidad debe ser un número válido' })
  tipo_entidad_id?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de constitución debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_constitucion?: string;

  @IsOptional()
  @IsString({ message: 'El objeto social debe ser un texto válido' })
  objeto_social?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El municipio debe ser un número válido' })
  municipio_id?: number;

  @IsOptional()
  @IsString({ message: 'La dirección física debe ser un texto válido' })
  direccion_fisica?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto válido' })
  telefono_contacto?: string;

  @IsOptional()
  @IsString({ message: 'El correo institucional debe ser un texto válido' })
  correo_institucional?: string;

  @IsOptional()
  @IsString({ message: 'La página web debe ser un texto válido' })
  pagina_web?: string;

  @IsString({ message: 'El nombre del representante legal debe ser un texto válido' })
  nombre_representante_legal: string;

  @IsOptional()
  @IsNumber({}, { message: 'El tipo de documento debe ser un número válido' })
  tipo_documento_representante_id?: number;

  @IsString({ message: 'El número de documento del representante debe ser un texto válido' })
  numero_documento_representante: string;

  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si está registrado en Soy Cultura (sí o no)' })
  registro_soy_cultura?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si está en el Observatorio Cultural de Boyacá (sí o no)' })
  registro_observatorio_cultural_boyaca?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si ha recibido estímulos o apoyos públicos (sí o no)' })
  ha_recibido_estimulos_apoyos_publicos?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Debe indicar si participa en redes o asociaciones (sí o no)' })
  participa_redes_asociaciones?: boolean;

  @IsOptional()
  @IsString({ message: 'Las redes o asociaciones deben ser un texto válido' })
  cuales_redes_asociaciones?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de inicio del nombramiento debe ser válida' })
  fecha_inicio_nombramiento?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de fin del nombramiento debe ser válida' })
  fecha_fin_nombramiento?: string;

  @IsOptional()
  @IsString({ message: 'Las áreas de trabajo deben ser un texto válido' })
  areas_trabajo?: string;

  @IsOptional()
  @IsString({ message: 'Los proyectos realizados deben ser un texto válido' })
  proyectos_realizados?: string;

  @IsOptional()
  @IsString({ message: 'Los proyectos en curso deben ser un texto válido' })
  proyectos_en_curso?: string;

  @IsOptional()
  @IsString({ message: 'El público objetivo y beneficiarios deben ser un texto válido' })
  publico_objetivo_beneficiarios?: string;
}
