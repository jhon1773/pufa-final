import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntidadesController } from './entidades.controller';
import { EntidadesService } from './entidades.service';
import { Entidad } from './entities/entidad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Entidad])],
  controllers: [EntidadesController],
  providers: [EntidadesService],
  exports: [EntidadesService],
})
export class EntidadesModule {}
