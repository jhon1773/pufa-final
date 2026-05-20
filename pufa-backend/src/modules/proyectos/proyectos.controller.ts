import {
  Controller, Get, Post, Patch, Param, Body,
  Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { ProyectosService } from './proyectos.service';
import { CrearProyectoDto } from './dto/crear-proyecto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('proyectos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar proyectos', description: 'Productora ve sus propios proyectos. Admin ve todos.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Listado paginado de proyectos.' })
  listar(
    @CurrentUser('id') usuarioId: number,
    @CurrentUser('roles') roles: string[],
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.proyectosService.listar(usuarioId, roles, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener proyecto por ID' })
  @ApiParam({ name: 'id', description: 'ID del proyecto' })
  @ApiResponse({ status: 200, description: 'Datos del proyecto.' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') usuarioId: number,
    @CurrentUser('roles') roles: string[],
  ) {
    return this.proyectosService.obtenerPorId(id, usuarioId, roles);
  }

  @Post()
  @ApiOperation({ summary: 'Crear proyecto', description: 'Crea un nuevo proyecto audiovisual en estado borrador.' })
  @ApiResponse({ status: 201, description: 'Proyecto creado.' })
  crear(
    @CurrentUser('id') usuarioId: number,
    @Body() dto: CrearProyectoDto,
  ) {
    return this.proyectosService.crear(usuarioId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proyecto' })
  @ApiParam({ name: 'id', description: 'ID del proyecto' })
  @ApiResponse({ status: 200, description: 'Proyecto actualizado.' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') usuarioId: number,
    @CurrentUser('roles') roles: string[],
    @Body() dto: Partial<CrearProyectoDto>,
  ) {
    return this.proyectosService.actualizar(id, usuarioId, roles, dto);
  }
}
