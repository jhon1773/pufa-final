import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Rol } from './entities/rol.entity';
import { Permiso } from './entities/permiso.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { RolPermiso } from './entities/rol-permiso.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PersonaNatural } from '../usuarios/entities/persona-natural.entity';
import { PersonaJuridica } from '../usuarios/entities/persona-juridica.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';
import { TipoPerfil } from '../catalogos/entities/tipo-perfil.entity';

@Module({
  imports: [
    PassportModule,
    // Configuración de JWT con secreto desde variables de entorno
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Acepta JWT_EXPIRES_IN o JWT_EXPIRATION
        const expiracion = configService.get<string>('JWT_EXPIRES_IN') ?? configService.get<string>('JWT_EXPIRATION') ?? '1d';
        return {
          secret: configService.get<string>('app.jwtSecret') ?? 'dev-jwt-secret-change-me',
          // Expiracion configurada desde variable de entorno JWT_EXPIRATION
          signOptions: { expiresIn: expiracion as any },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Rol,
      Permiso,
      UsuarioRol,
      RolPermiso,
      Usuario,
      PersonaNatural,
      PersonaJuridica,
      EstadoCuenta,
      TipoPerfil,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
