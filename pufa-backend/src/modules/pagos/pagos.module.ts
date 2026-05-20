import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { Pago } from './entities/pago.entity';
import { Abono } from './entities/abono.entity';
import { EstadoPago } from '../catalogos/entities/estado-pago.entity';
import { EstadoAbono } from '../catalogos/entities/estado-abono.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, Abono, EstadoPago, EstadoAbono]),
  ],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
