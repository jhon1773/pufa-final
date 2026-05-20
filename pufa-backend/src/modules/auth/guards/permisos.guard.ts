import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_KEY } from '../decorators/requiere-permisos.decorator';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permisosRequeridos = this.reflector.getAllAndOverride<string[]>(PERMISOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permisosRequeridos || permisosRequeridos.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    // Verifica que el usuario tenga TODOS los permisos requeridos
    return permisosRequeridos.every((permiso) => user?.permisos?.includes(permiso));
  }
}
