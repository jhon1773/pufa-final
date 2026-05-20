import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogosController } from './catalogos.controller';
import { CatalogosService } from './catalogos.service';
import { Municipio } from './entities/municipio.entity';
import { TipoProduccion } from './entities/tipo-produccion.entity';
import { EstadoTramite } from './entities/estado-tramite.entity';
import { TipoEspacio } from './entities/tipo-espacio.entity';
import { RolEquipoTecnico } from './entities/rol-equipo-tecnico.entity';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity';
import { IdentidadGenero } from './entities/identidad-genero.entity';
import { NivelEducativo } from './entities/nivel-educativo.entity';
import { TipoTramite } from './entities/tipo-tramite.entity';
import { TipoPago } from './entities/tipo-pago.entity';
import { EstadoPago } from './entities/estado-pago.entity';
import { EstadoAbono } from './entities/estado-abono.entity';
import { EstadoCuenta } from './entities/estado-cuenta.entity';
import { TipoPerfil } from './entities/tipo-perfil.entity';
import { TipoEntidad } from './entities/tipo-entidad.entity';
import { GrupoEtnico } from './entities/grupo-etnico.entity';
import { SexoNacer } from './entities/sexo-nacer.entity';
import { TipoDiscapacidad } from './entities/tipo-discapacidad.entity';
import { TiempoDedicacionSector } from './entities/tiempo-dedicacion-sector.entity';
import { TipoIngresosSector } from './entities/tipo-ingresos-sector.entity';
import { TipoPropiedadEquipos } from './entities/tipo-propiedad-equipos.entity';
import { GamaEquipos } from './entities/gama-equipos.entity';
import { RangoExperienciaSector } from './entities/rango-experiencia-sector.entity';
import { TipoProduccionParticipa } from './entities/tipo-produccion-participa.entity';
import { TipoDocumento } from './entities/tipo-documento.entity';
import { TipoEntidadRevision } from './entities/tipo-entidad-revision.entity';
import { EstadoRevisionEntidad } from './entities/estado-revision-entidad.entity';
import { TipoConvocatoria } from './entities/tipo-convocatoria.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Municipio, TipoProduccion, EstadoTramite, TipoEspacio,
      RolEquipoTecnico, TipoIdentificacion, IdentidadGenero,
      NivelEducativo, TipoTramite, TipoPago, EstadoPago, EstadoAbono,
      EstadoCuenta, TipoPerfil, TipoEntidad, GrupoEtnico, SexoNacer,
      TipoDiscapacidad, TiempoDedicacionSector, TipoIngresosSector,
      TipoPropiedadEquipos, GamaEquipos, RangoExperienciaSector,
      TipoProduccionParticipa, TipoDocumento, TipoEntidadRevision,
      EstadoRevisionEntidad, TipoConvocatoria,
    ]),
  ],
  controllers: [CatalogosController],
  providers: [CatalogosService],
  exports: [CatalogosService, TypeOrmModule],
})
export class CatalogosModule {}
