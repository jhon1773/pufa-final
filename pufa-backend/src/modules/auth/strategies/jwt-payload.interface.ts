// Estructura del payload embebido en el token JWT
export interface JwtPayload {
  sub: number;        // ID del usuario
  email: string;
  roles: string[];    // Códigos de roles asignados
  permisos: string[]; // Códigos de permisos (para no consultar BD en cada request)
  tipoPerfil: string;
}
