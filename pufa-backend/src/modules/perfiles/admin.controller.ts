import {
  Controller, Get, Post, Param, Body,
  ParseIntPipe, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PerfilesService } from './perfiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin-verificacion')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('portal/admin/verificacion')
export class AdminController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar perfiles pendientes de verificación',
    description: 'Retorna todos los perfiles de proveedores pendientes de verificación.',
  })
  @ApiResponse({ status: 200, description: 'Listado de perfiles para verificar.' })
  async listarVerificacion() {
    return this.perfilesService.listarPerfilesVerificacion();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalles de un perfil',
    description: 'Retorna los detalles completos de un perfil específico.',
  })
  @ApiParam({ name: 'id', description: 'ID del perfil' })
  @ApiResponse({ status: 200, description: 'Detalles del perfil.' })
  async obtenerDetalles(@Param('id', ParseIntPipe) id: number) {
    return this.perfilesService.obtenerDetallesVerificacion(id);
  }

  @Post(':id/aprobar')
  @ApiOperation({
    summary: 'Aprobar un perfil',
    description: 'Marca un perfil como aprobado y verificado.',
  })
  @ApiParam({ name: 'id', description: 'ID del perfil' })
  @ApiResponse({ status: 200, description: 'Perfil aprobado.' })
  async aprobarPerfil(@Param('id', ParseIntPipe) id: number) {
    return this.perfilesService.aprobarPerfil(id);
  }

  @Post(':id/rechazar')
  @ApiOperation({
    summary: 'Rechazar un perfil',
    description: 'Marca un perfil como rechazado.',
  })
  @ApiParam({ name: 'id', description: 'ID del perfil' })
  @ApiResponse({ status: 200, description: 'Perfil rechazado.' })
  async rechazarPerfil(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { motivo?: string },
  ) {
    return this.perfilesService.rechazarPerfil(id, data?.motivo);
  }

  @Post(':id/eliminar')
  @ApiOperation({
    summary: 'Eliminar un perfil',
    description: 'Elimina completamente un perfil de la base de datos.',
  })
  @ApiParam({ name: 'id', description: 'ID del perfil' })
  @ApiResponse({ status: 200, description: 'Perfil eliminado.' })
  async eliminarPerfil(@Param('id', ParseIntPipe) id: number) {
    return this.perfilesService.eliminarPerfil(id);
  }

  @Post('perfiles')
  @ApiOperation({
    summary: 'Crear un perfil de proveedor para un usuario existente',
    description: 'Admin crea un perfil de proveedor para un usuario existente que se verá en el sistema.',
  })
  @ApiResponse({ status: 201, description: 'Perfil creado exitosamente.' })
  async crearPerfilProveedor(
    @Body() data: { email: string; telefono?: string; sitio_web?: string; descripcion?: string },
  ) {
    return this.perfilesService.crearPerfilProveedorAdmin(data);
  }
}
