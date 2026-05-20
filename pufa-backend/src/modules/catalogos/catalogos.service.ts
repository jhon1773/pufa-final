import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

// Servicio de catálogos — datos de referencia sin lógica de negocio compleja
@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Municipio) private municipiosRepo: Repository<Municipio>,
    @InjectRepository(TipoProduccion) private tiposProduccionRepo: Repository<TipoProduccion>,
    @InjectRepository(EstadoTramite) private estadosTramiteRepo: Repository<EstadoTramite>,
    @InjectRepository(TipoEspacio) private tiposEspacioRepo: Repository<TipoEspacio>,
    @InjectRepository(RolEquipoTecnico) private rolesEquipoRepo: Repository<RolEquipoTecnico>,
    @InjectRepository(TipoIdentificacion) private tiposIdRepo: Repository<TipoIdentificacion>,
    @InjectRepository(IdentidadGenero) private identidadesGeneroRepo: Repository<IdentidadGenero>,
    @InjectRepository(NivelEducativo) private nivelesEducativosRepo: Repository<NivelEducativo>,
    @InjectRepository(TipoTramite) private tiposTramiteRepo: Repository<TipoTramite>,
    @InjectRepository(TipoPago) private tiposPagoRepo: Repository<TipoPago>,
    @InjectRepository(EstadoPago) private estadosPagoRepo: Repository<EstadoPago>,
    @InjectRepository(TipoEntidad) private tiposEntidadRepo: Repository<TipoEntidad>,
    @InjectRepository(GrupoEtnico) private gruposEtnicosRepo: Repository<GrupoEtnico>,
    @InjectRepository(SexoNacer) private sexosNacerRepo: Repository<SexoNacer>,
    @InjectRepository(TipoDiscapacidad) private tiposDiscapacidadRepo: Repository<TipoDiscapacidad>,
    @InjectRepository(TiempoDedicacionSector) private tiemposDedicacionSectorRepo: Repository<TiempoDedicacionSector>,
    @InjectRepository(TipoIngresosSector) private tiposIngresosSectorRepo: Repository<TipoIngresosSector>,
    @InjectRepository(TipoPropiedadEquipos) private tiposPropiedadEquiposRepo: Repository<TipoPropiedadEquipos>,
    @InjectRepository(GamaEquipos) private gamasEquiposRepo: Repository<GamaEquipos>,
    @InjectRepository(RangoExperienciaSector) private rangosExperienciaSectorRepo: Repository<RangoExperienciaSector>,
    @InjectRepository(TipoProduccionParticipa) private tiposProduccionParticipaRepo: Repository<TipoProduccionParticipa>,
  ) {}

  private async semillarSiVacio<T extends { nombre: string; activo?: boolean }>(
    repo: Repository<T>,
    semillas: Array<Partial<T>>,
    orden: keyof T = 'nombre' as keyof T,
  ) {
    const existentes = await repo.find({ order: { [orden]: 'ASC' as const } as any });
    if (existentes.length > 0) return existentes;

    await repo.save(repo.create(semillas as any));
    return repo.find({ order: { [orden]: 'ASC' as const } as any });
  }

  async obtenerMunicipios() {
    const municipios = await this.municipiosRepo.find({ order: { nombre: 'ASC' } });
    if (municipios.length > 0) return municipios;

    await this.municipiosRepo.save(
      this.municipiosRepo.create([
        { nombre: 'Tunja', departamento: 'Boyacá' },
        { nombre: 'Duitama', departamento: 'Boyacá' },
        { nombre: 'Sogamoso', departamento: 'Boyacá' },
        { nombre: 'Chiquinquirá', departamento: 'Boyacá' },
        { nombre: 'Paipa', departamento: 'Boyacá' },
        { nombre: 'Villa de Leyva', departamento: 'Boyacá' },
        { nombre: 'Samacá', departamento: 'Boyacá' },
        { nombre: 'Moniquirá', departamento: 'Boyacá' },
        { nombre: 'Soatá', departamento: 'Boyacá' },
        { nombre: 'Garagoa', departamento: 'Boyacá' },
        { nombre: 'Aquitania', departamento: 'Boyacá' },
        { nombre: 'Nobsa', departamento: 'Boyacá' },
        { nombre: 'Tibasosa', departamento: 'Boyacá' },
        { nombre: 'Ráquira', departamento: 'Boyacá' },
        { nombre: 'Tenza', departamento: 'Boyacá' },
      ]),
    );

    return this.municipiosRepo.find({ order: { nombre: 'ASC' } });
  }

  async obtenerTiposProduccion() {
    const tipos = await this.tiposProduccionRepo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
    if (tipos.length > 0) return tipos;

    await this.tiposProduccionRepo.save(
      this.tiposProduccionRepo.create([
        { nombre: 'Largometraje', descripcion: 'Producción cinematográfica de larga duración', activo: true },
        { nombre: 'Cortometraje', descripcion: 'Producción audiovisual de corta duración', activo: true },
        { nombre: 'Serie', descripcion: 'Serie para televisión o plataformas digitales', activo: true },
        { nombre: 'Documental', descripcion: 'Producción documental', activo: true },
        { nombre: 'Comercial', descripcion: 'Pieza publicitaria audiovisual', activo: true },
        { nombre: 'Videoclip', descripcion: 'Producción musical audiovisual', activo: true },
        { nombre: 'Institucional', descripcion: 'Contenido institucional', activo: true },
        { nombre: 'Académico', descripcion: 'Proyecto audiovisual de formación', activo: true },
        { nombre: 'Otro', descripcion: 'Otro tipo de producción', activo: true },
      ]),
    );

    return this.tiposProduccionRepo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
  }

  obtenerEstadosTramite() {
    return this.estadosTramiteRepo.find({ where: { activo: true }, order: { orden: 'ASC' } });
  }

  obtenerTiposEspacio() {
    return this.tiposEspacioRepo.find({ where: { activo: true } });
  }

  obtenerRolesEquipoTecnico() {
    return this.rolesEquipoRepo.find({ where: { activo: true }, order: { nombre: 'ASC' } }).then(async (roles) => {
      if (roles.length > 0) return roles;

      await this.rolesEquipoRepo.save(
        this.rolesEquipoRepo.create([
          { nombre: 'Director/a', descripcion: 'Dirección general del proyecto', activo: true },
          { nombre: 'Productor/a', descripcion: 'Gestión de recursos y ejecución', activo: true },
          { nombre: 'Director/a de Fotografía', descripcion: 'Diseño visual y cámara', activo: true },
          { nombre: 'Sonidista', descripcion: 'Captura y control de sonido', activo: true },
          { nombre: 'Gaffer', descripcion: 'Iluminación técnica del set', activo: true },
          { nombre: 'Arte / Escenografía', descripcion: 'Dirección de arte y ambientación', activo: true },
          { nombre: 'Maquillaje y Vestuario', descripcion: 'Caracterización y vestuario', activo: true },
          { nombre: 'Asistente de Producción', descripcion: 'Apoyo logístico en rodaje', activo: true },
        ]),
      );

      return this.rolesEquipoRepo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
    });
  }

  obtenerTiposIdentificacion() {
    return this.semillarSiVacio(this.tiposIdRepo, [
      { nombre: 'Cédula de ciudadanía' } as any,
      { nombre: 'Tarjeta de identidad' } as any,
      { nombre: 'Cédula de extranjería' } as any,
      { nombre: 'Pasaporte' } as any,
      { nombre: 'NIT' } as any,
      { nombre: 'Otro' } as any,
    ]);
  }

  obtenerTiposEntidad() {
    return this.semillarSiVacio(this.tiposEntidadRepo, [
      { nombre: 'Asociación', descripcion: 'Organización asociativa sin ánimo de lucro', activo: true },
      { nombre: 'Corporación', descripcion: 'Entidad sin ánimo de lucro', activo: true },
      { nombre: 'Fundación', descripcion: 'Entidad orientada a fines de interés general', activo: true },
      { nombre: 'Empresa privada', descripcion: 'Sociedad o empresa comercial', activo: true },
      { nombre: 'Entidad pública', descripcion: 'Institución del sector público', activo: true },
      { nombre: 'Cooperativa', descripcion: 'Organización cooperativa', activo: true },
      { nombre: 'Colectivo', descripcion: 'Agrupación cultural o creativa', activo: true },
      { nombre: 'Otro', descripcion: 'Otra tipología de entidad', activo: true },
    ]);
  }

  async obtenerGruposEtnicos() {
    return this.semillarSiVacio(this.gruposEtnicosRepo, [
      { nombre: 'Indígena' },
      { nombre: 'Afrodescendiente' },
      { nombre: 'Raizal' },
      { nombre: 'Palenquero' },
      { nombre: 'Rrom' },
      { nombre: 'Ninguno' },
      { nombre: 'Otro' },
    ]);
  }

  async obtenerSexosNacer() {
    return this.semillarSiVacio(this.sexosNacerRepo, [
      { nombre: 'Femenino' },
      { nombre: 'Masculino' },
      { nombre: 'Intersexual' },
      { nombre: 'Prefiere no decir' },
    ]);
  }

  async obtenerTiposDiscapacidad() {
    return this.semillarSiVacio(this.tiposDiscapacidadRepo, [
      { nombre: 'Física' },
      { nombre: 'Visual' },
      { nombre: 'Auditiva' },
      { nombre: 'Intelectual' },
      { nombre: 'Psicosocial' },
      { nombre: 'Múltiple' },
      { nombre: 'Otra' },
    ]);
  }

  async obtenerTiemposDedicacionSector() {
    return this.semillarSiVacio(this.tiemposDedicacionSectorRepo, [
      { nombre: 'Menos de 1 año' },
      { nombre: '1 a 3 años' },
      { nombre: '4 a 7 años' },
      { nombre: '8 a 15 años' },
      { nombre: 'Más de 15 años' },
    ]);
  }

  async obtenerTiposIngresosSector() {
    return this.semillarSiVacio(this.tiposIngresosSectorRepo, [
      { nombre: 'Principal' },
      { nombre: 'Complementario' },
      { nombre: 'Ocasional' },
      { nombre: 'Sin ingresos directos' },
    ]);
  }

  async obtenerTiposPropiedadEquipos() {
    return this.semillarSiVacio(this.tiposPropiedadEquiposRepo, [
      { nombre: 'Propios' },
      { nombre: 'Alquilados' },
      { nombre: 'Compartidos' },
      { nombre: 'No tiene' },
    ]);
  }

  async obtenerGamasEquipos() {
    return this.semillarSiVacio(this.gamasEquiposRepo, [
      { nombre: 'Básica' },
      { nombre: 'Media' },
      { nombre: 'Profesional' },
      { nombre: 'Alta gama' },
    ]);
  }

  async obtenerRangosExperienciaSector() {
    return this.semillarSiVacio(this.rangosExperienciaSectorRepo, [
      { nombre: 'Menos de 1 año' },
      { nombre: '1 a 3 años' },
      { nombre: '4 a 7 años' },
      { nombre: 'Más de 8 años' },
    ]);
  }

  async obtenerTiposProduccionParticipa() {
    return this.semillarSiVacio(this.tiposProduccionParticipaRepo, [
      { nombre: 'Cine' },
      { nombre: 'Televisión' },
      { nombre: 'Publicidad' },
      { nombre: 'Documental' },
      { nombre: 'Video musical' },
      { nombre: 'Contenido digital' },
      { nombre: 'Otro' },
    ]);
  }

  obtenerIdentidadesGenero() {
    return this.semillarSiVacio(this.identidadesGeneroRepo, [
      { nombre: 'Mujer' } as any,
      { nombre: 'Hombre' } as any,
      { nombre: 'No binario' } as any,
      { nombre: 'Otro' } as any,
      { nombre: 'Prefiere no decir' } as any,
    ]);
  }

  obtenerNivelesEducativos() {
    return this.semillarSiVacio(this.nivelesEducativosRepo, [
      { nombre: 'Sin escolaridad' } as any,
      { nombre: 'Primaria' } as any,
      { nombre: 'Secundaria' } as any,
      { nombre: 'Técnica / Tecnológica' } as any,
      { nombre: 'Profesional' } as any,
      { nombre: 'Posgrado' } as any,
    ]);
  }

  obtenerTiposTramite() {
    return this.tiposTramiteRepo.find({ where: { activo: true } });
  }

  obtenerTiposPago() {
    return this.tiposPagoRepo.find({ where: { activo: true } });
  }

  obtenerEstadosPago() {
    return this.estadosPagoRepo.find({ where: { activo: true } });
  }
}
