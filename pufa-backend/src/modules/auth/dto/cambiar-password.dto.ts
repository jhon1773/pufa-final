import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CambiarPasswordDto {
  @ApiProperty({ example: 'Admin2024!', description: 'Contraseña actual del usuario' })
  @IsString()
  password_actual: string;

  @ApiProperty({ example: 'NuevoPassword456!', description: 'Nueva contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  password_nuevo: string;
}
