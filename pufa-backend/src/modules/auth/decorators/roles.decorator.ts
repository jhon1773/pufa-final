import { SetMetadata } from '@nestjs/common';

// Especifica los roles requeridos para acceder a un endpoint
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
