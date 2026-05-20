import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Injectable()
export class CuentaAprobadaGuard implements CanActivate {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    const usuario = await this.usuariosRepository.findOne({
      where: { id: user.id },
      relations: ['estado_cuenta'],
    });
    if (!usuario || usuario.estado_cuenta?.codigo !== 'activo') {
      throw new ForbiddenException('La cuenta no está activa o no ha sido aprobada');
    }
    return true;
  }
}
