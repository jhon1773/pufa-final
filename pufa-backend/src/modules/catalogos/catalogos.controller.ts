import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('catalogos')
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Public()
  @Get('municipios')
  @ApiOperation({ summary: 'Listar municipios de Boyacá' })
  @ApiResponse({ status: 200, description: 'Lista de municipios.' })
  municipios() { return this.catalogosService.obtenerMunicipios(); }

  @Public()
  @Get('tipos-produccion')
  @ApiOperation({ summary: 'Tipos de producción audiovisual' })
  tiposProduccion() { return this.catalogosService.obtenerTiposProduccion(); }

  @Public()
  @Get('estados-tramite')
  @ApiOperation({ summary: 'Estados posibles de un trámite PUFA' })
  estadosTramite() { return this.catalogosService.obtenerEstadosTramite(); }

  @Public()
  @Get('tipos-espacio')
  @ApiOperation({ summary: 'Tipos de espacio para locaciones' })
  tiposEspacio() { return this.catalogosService.obtenerTiposEspacio(); }

  @Public()
  @Get('roles-equipo-tecnico')
  @ApiOperation({ summary: 'Roles del equipo técnico de producción' })
  rolesEquipoTecnico() { return this.catalogosService.obtenerRolesEquipoTecnico(); }

  @Public()
  @Get('tipos-identificacion')
  @ApiOperation({ summary: 'Tipos de documento de identidad' })
  tiposIdentificacion() { return this.catalogosService.obtenerTiposIdentificacion(); }

  @Public()
  @Get('tipos-entidad')
  @ApiOperation({ summary: 'Tipos de entidad jurídica' })
  tiposEntidad() { return this.catalogosService.obtenerTiposEntidad(); }

  @Public()
  @Get('grupos-etnicos')
  @ApiOperation({ summary: 'Grupos étnicos' })
  gruposEtnicos() { return this.catalogosService.obtenerGruposEtnicos(); }

  @Public()
  @Get('sexos-nacer')
  @ApiOperation({ summary: 'Sexos al nacer' })
  sexosNacer() { return this.catalogosService.obtenerSexosNacer(); }

  @Public()
  @Get('tipos-discapacidad')
  @ApiOperation({ summary: 'Tipos de discapacidad' })
  tiposDiscapacidad() { return this.catalogosService.obtenerTiposDiscapacidad(); }

  @Public()
  @Get('tiempos-dedicacion-sector')
  @ApiOperation({ summary: 'Tiempos de dedicación al sector' })
  tiemposDedicacionSector() { return this.catalogosService.obtenerTiemposDedicacionSector(); }

  @Public()
  @Get('tipos-ingresos-sector')
  @ApiOperation({ summary: 'Tipos de ingresos provenientes del sector' })
  tiposIngresosSector() { return this.catalogosService.obtenerTiposIngresosSector(); }

  @Public()
  @Get('tipos-propiedad-equipos')
  @ApiOperation({ summary: 'Tipos de propiedad de equipos' })
  tiposPropiedadEquipos() { return this.catalogosService.obtenerTiposPropiedadEquipos(); }

  @Public()
  @Get('gamas-equipos')
  @ApiOperation({ summary: 'Gamas de equipos' })
  gamasEquipos() { return this.catalogosService.obtenerGamasEquipos(); }

  @Public()
  @Get('rangos-experiencia-sector')
  @ApiOperation({ summary: 'Rangos de experiencia en el sector' })
  rangosExperienciaSector() { return this.catalogosService.obtenerRangosExperienciaSector(); }

  @Public()
  @Get('tipos-produccion-participa')
  @ApiOperation({ summary: 'Tipos de producción en los que participa' })
  tiposProduccionParticipa() { return this.catalogosService.obtenerTiposProduccionParticipa(); }

  @Public()
  @Get('identidades-genero')
  @ApiOperation({ summary: 'Opciones de identidad de género' })
  identidadesGenero() { return this.catalogosService.obtenerIdentidadesGenero(); }

  @Public()
  @Get('niveles-educativos')
  @ApiOperation({ summary: 'Niveles de educación formal' })
  nivelesEducativos() { return this.catalogosService.obtenerNivelesEducativos(); }

  @Public()
  @Get('tipos-tramite')
  @ApiOperation({ summary: 'Tipos de trámite PUFA disponibles' })
  tiposTramite() { return this.catalogosService.obtenerTiposTramite(); }

  @Public()
  @Get('tipos-pago')
  @ApiOperation({ summary: 'Tipos de pago aceptados' })
  tiposPago() { return this.catalogosService.obtenerTiposPago(); }

  @Public()
  @Get('estados-pago')
  @ApiOperation({ summary: 'Estados posibles de un pago' })
  estadosPago() { return this.catalogosService.obtenerEstadosPago(); }
}
