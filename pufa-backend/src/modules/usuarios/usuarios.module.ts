import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './entities/usuario.entity';
import { PersonaNatural } from './entities/persona-natural.entity';
import { PersonaJuridica } from './entities/persona-juridica.entity';
import { VigenciaEstimulo } from './entities/vigencia-estimulo.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';
import { TipoPerfil } from '../catalogos/entities/tipo-perfil.entity';
import { UsuarioRol } from '../auth/entities/usuario-rol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      PersonaNatural,
      PersonaJuridica,
      VigenciaEstimulo,
      EstadoCuenta,
      TipoPerfil,
      UsuarioRol,
    ]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService, TypeOrmModule],
})
export class UsuariosModule {}
