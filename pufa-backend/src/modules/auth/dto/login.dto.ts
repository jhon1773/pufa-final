import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@pufa.gov.co', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'Admin2024!', description: 'Contraseña del usuario (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'admin', description: 'Rol solicitado: admin, productora, proveedor, academico', required: false })
  @IsOptional()
  @IsIn(['admin', 'productora', 'proveedor', 'academico'], { message: 'Rol inválido. Debe ser: admin, productora, proveedor o academico' })
  rolSolicitado?: string;
}
