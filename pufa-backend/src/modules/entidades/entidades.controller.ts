import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { EntidadesService } from './entidades.service';
import { CrearEntidadDto } from './dto/crear-entidad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('entidades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('entidades')
export class EntidadesController {
  constructor(private readonly entidadesService: EntidadesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar entidades revisoras', description: 'Retorna las entidades externas que participan en la revisión de trámites. Público.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'Listado de entidades activas.' })
  listar(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return this.entidadesService.listar(page, limit);
  }

  @ApiBearerAuth('JWT')
  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Crear entidad revisora' })
  @ApiResponse({ status: 201, description: 'Entidad creada.' })
  crear(@Body() dto: CrearEntidadDto) {
    return this.entidadesService.crear(dto);
  }

  @ApiBearerAuth('JWT')
  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar entidad revisora' })
  @ApiParam({ name: 'id', description: 'ID de la entidad' })
  @ApiResponse({ status: 200, description: 'Entidad actualizada.' })
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CrearEntidadDto>) {
    return this.entidadesService.actualizar(id, dto);
  }

  @ApiBearerAuth('JWT')
  @Roles('admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar entidad revisora' })
  @ApiParam({ name: 'id', description: 'ID de la entidad' })
  @ApiResponse({ status: 200, description: 'Entidad desactivada.' })
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.entidadesService.desactivar(id);
  }
}
