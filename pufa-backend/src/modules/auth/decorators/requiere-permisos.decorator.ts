import { SetMetadata } from '@nestjs/common';

// Especifica los permisos granulares requeridos para acceder a un endpoint
export const PERMISOS_KEY = 'permisos';
export const RequierePermisos = (...permisos: string[]) => SetMetadata(PERMISOS_KEY, permisos);
