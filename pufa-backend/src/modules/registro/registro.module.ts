import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroController } from './registro.controller';
import { RegistroService } from './registro.service';
import { SolicitudRegistro } from './entities/solicitud-registro.entity';
import { HistorialSolicitudRegistro } from './entities/historial-solicitud-registro.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { EstadoCuenta } from '../catalogos/entities/estado-cuenta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudRegistro,
      HistorialSolicitudRegistro,
      Usuario,
      EstadoCuenta,
    ]),
  ],
  controllers: [RegistroController],
  providers: [RegistroService],
  exports: [RegistroService],
})
export class RegistroModule {}
