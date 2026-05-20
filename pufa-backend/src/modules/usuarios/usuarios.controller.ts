import {
  Controller, Get, Post, Patch, Param, Body,
  Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CrearPersonaNaturalDto } from './dto/crear-persona-natural.dto';
import { CrearPersonaJuridicaDto } from './dto/crear-persona-juridica.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('usuarios')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Listar usuarios', description: 'Requiere rol admin. Retorna listado paginado de todos los usuarios.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Listado paginado de usuarios.' })
  listar(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.usuariosService.listar(page, limit);
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Datos del usuario.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.obtenerPorId(id);
  }

  @Patch('perfil/natural')
  @ApiOperation({ summary: 'Completar perfil de persona natural', description: 'El usuario autenticado registra o actualiza sus datos como persona natural.' })
  @ApiResponse({ status: 200, description: 'Perfil de persona natural guardado.' })
  completarPerfilNatural(
    @CurrentUser('id') usuarioId: number,
    @Body() dto: CrearPersonaNaturalDto,
  ) {
    return this.usuariosService.completarPerfilNatural(usuarioId, dto);
  }

  @Patch('perfil/juridica')
  @ApiOperation({ summary: 'Completar perfil de persona jurídica', description: 'El usuario autenticado registra o actualiza sus datos como persona jurídica (empresa).' })
  @ApiResponse({ status: 200, description: 'Perfil de persona jurídica guardado.' })
  completarPerfilJuridica(
    @CurrentUser('id') usuarioId: number,
    @Body() dto: CrearPersonaJuridicaDto,
  ) {
    return this.usuariosService.completarPerfilJuridica(usuarioId, dto);
  }

  @Roles('admin')
  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado de cuenta de un usuario', description: 'Admin aprueba (activo), suspende o rechaza un usuario.' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Estado actualizado.' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
    @Body('observaciones') observaciones: string,
    @CurrentUser('id') adminId: number,
  ) {
    return this.usuariosService.cambiarEstado(id, estado, adminId, observaciones);
  }

  @Roles('admin')
  @Post(':id/roles/:rolId')
  @ApiOperation({ summary: 'Asignar rol a un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiParam({ name: 'rolId', description: 'ID del rol a asignar' })
  @ApiResponse({ status: 201, description: 'Rol asignado.' })
  asignarRol(
    @Param('id', ParseIntPipe) usuarioId: number,
    @Param('rolId', ParseIntPipe) rolId: number,
    @CurrentUser('id') adminId: number,
  ) {
    return this.usuariosService.asignarRol(usuarioId, rolId, adminId);
  }
}
