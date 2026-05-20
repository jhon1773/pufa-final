import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilesController } from './perfiles.controller';
import { AdminController } from './admin.controller';
import { PerfilesService } from './perfiles.service';
import { PerfilProveedor } from './entities/perfil-proveedor.entity';
import { PerfilProductora } from './entities/perfil-productora.entity';
import { PerfilAcademico } from './entities/perfil-academico.entity';
import { CategoriaProveedor } from './entities/categoria-proveedor.entity';
import { SubcategoriaProveedor } from './entities/subcategoria-proveedor.entity';
import { EspecialidadProveedor } from './entities/especialidad-proveedor.entity';
import { PersonaNaturalConvocatoria } from './entities/persona-natural-convocatoria.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerfilProveedor,
      PerfilProductora,
      PerfilAcademico,
      CategoriaProveedor,
      SubcategoriaProveedor,
      EspecialidadProveedor,
      PersonaNaturalConvocatoria,
      Usuario,
    ]),
  ],
  controllers: [PerfilesController, AdminController],
  providers: [PerfilesService],
  exports: [PerfilesService, TypeOrmModule],
})
export class PerfilesModule {}
