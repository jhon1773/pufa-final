import { Type } from 'class-transformer';
import {
  IsEmail, IsString, MinLength, IsIn, IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrearPersonaNaturalDto } from '../../usuarios/dto/crear-persona-natural.dto';
import { CrearPersonaJuridicaDto } from '../../usuarios/dto/crear-persona-juridica.dto';

export class RegistroUsuarioDto {
  @ApiProperty({ example: 'productora@email.com', description: 'Correo electrónico único del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'MiPassword123!', description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiPropertyOptional({ example: 'Juan Pérez García', description: 'Nombre completo del usuario' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ enum: ['natural', 'juridica'], example: 'natural', description: 'Tipo de persona del usuario' })
  @IsIn(['natural', 'juridica'], { message: 'El tipo de persona debe ser natural o juridica' })
  @IsOptional()
  tipo_persona?: 'natural' | 'juridica';

  @ApiPropertyOptional({ example: '3101234567', description: 'Número de teléfono de contacto' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Datos completos de perfil para persona natural',
    type: () => CrearPersonaNaturalDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CrearPersonaNaturalDto)
  perfilNatural?: CrearPersonaNaturalDto;

  @ApiPropertyOptional({
    description: 'Datos completos de perfil para persona jurídica',
    type: () => CrearPersonaJuridicaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CrearPersonaJuridicaDto)
  perfilJuridica?: CrearPersonaJuridicaDto;

  @ApiPropertyOptional({
    enum: ['productora', 'proveedor', 'academico'],
    example: 'productora',
    description: 'Rol inicial de registro (admin no permitido en registro público)',
  })
  @IsOptional()
  @IsIn(['productora', 'proveedor', 'academico'], {
    message: 'El rol inicial debe ser productora, proveedor o academico',
  })
  rolSolicitado?: 'productora' | 'proveedor' | 'academico';
}
