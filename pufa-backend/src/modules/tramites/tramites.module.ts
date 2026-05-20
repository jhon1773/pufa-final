import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TramitesController } from './tramites.controller';
import { TramitesService } from './tramites.service';
import { Tramite } from './entities/tramite.entity';
import { TramiteLocacion } from './entities/tramite-locacion.entity';
import { TramiteEquipoTecnico } from './entities/tramite-equipo-tecnico.entity';
import { TramiteEntidad } from './entities/tramite-entidad.entity';
import { HistorialTramite } from './entities/historial-tramite.entity';
import { EstadoTramite } from '../catalogos/entities/estado-tramite.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Proyecto } from '../proyectos/entities/proyecto.entity';
import { DocumentosModule } from '../documentos/documentos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tramite,
      TramiteLocacion,
      TramiteEquipoTecnico,
      TramiteEntidad,
      HistorialTramite,
      EstadoTramite,
      Usuario,
      Proyecto,
    ]),
    DocumentosModule,
  ],
  controllers: [TramitesController],
  providers: [TramitesService],
  exports: [TramitesService],
})
export class TramitesModule {}
