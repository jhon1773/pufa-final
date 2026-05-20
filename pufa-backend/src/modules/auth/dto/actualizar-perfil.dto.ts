import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto válido' })
  @MaxLength(30, { message: 'El teléfono no puede superar 30 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsString({ message: 'La biografía debe ser un texto válido' })
  @MaxLength(1000, { message: 'La biografía no puede superar 1000 caracteres' })
  bio?: string;
}