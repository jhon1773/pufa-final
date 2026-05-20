import {
  Controller, Get, Post, Patch, Param, Body,
  Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { PerfilesService } from './perfiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('perfiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Public()
  @Get('categorias')
  @ApiOperation({
    summary: 'Catálogo de categorías de proveedores',
    description: 'Retorna las 4 categorías con sus subcategorías y especialidades. Público — no requiere autenticación.',
  })
  @ApiResponse({ status: 200, description: 'Árbol completo: Categoría → Subcategoría → Especialidad.' })
  obtenerCategorias() {
    return this.perfilesService.obtenerCatalogoCategorias();
  }

  @Public()
  @Get('proveedores/directorio')
  @ApiOperation({
    summary: 'Directorio público de proveedores',
    description: 'Lista proveedores verificados y visibles. Filtra por subcategoría. Público.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'subcategoria', required: false, description: 'ID de subcategoría para filtrar', example: 1 })
  @ApiResponse({ status: 200, description: 'Listado paginado de proveedores.' })
  directorio(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('subcategoria', new ParseIntPipe({ optional: true })) subcategoriaId?: number,
  ) {
    return this.perfilesService.listarDirectorioProveedores(page, limit, subcategoriaId);
  }

  @ApiBearerAuth('JWT')
  @Patch('proveedor')
  @ApiOperation({
    summary: 'Guardar perfil de proveedor',
    description: 'El proveedor autenticado crea o actualiza su perfil, seleccionando subcategorías y especialidades.',
  })
  @ApiResponse({ status: 200, description: 'Perfil de proveedor guardado.' })
  guardarPerfilProveedor(
    @CurrentUser('id') usuarioId: number,
    @Body() datos: any,
  ) {
    return this.perfilesService.guardarPerfilProveedor(usuarioId, datos);
  }

  @ApiBearerAuth('JWT')
  @Patch('productora')
  @ApiOperation({ summary: 'Guardar perfil de productora', description: 'La productora autenticada crea o actualiza su perfil público.' })
  @ApiResponse({ status: 200, description: 'Perfil de productora guardado.' })
  guardarPerfilProductora(
    @CurrentUser('id') usuarioId: number,
    @Body() datos: any,
  ) {
    return this.perfilesService.guardarPerfilProductora(usuarioId, datos);
  }

  @ApiBearerAuth('JWT')
  @Roles('admin')
  @Patch('proveedores/:id/verificar')
  @ApiOperation({ summary: 'Verificar proveedor', description: 'Admin marca un proveedor como verificado, habilitándolo en el directorio público.' })
  @ApiParam({ name: 'id', description: 'ID del perfil de proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor verificado.' })
  verificar(@Param('id', ParseIntPipe) id: number) {
    return this.perfilesService.verificarProveedor(id);
  }
}
