import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Token extraído del header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // El operador ! garantiza que JWT_SECRET esté definido antes de iniciar
      secretOrKey: configService.get<string>('app.jwtSecret') ?? 'dev-jwt-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido');
    }
    // El payload ya contiene roles y permisos — no se consulta la BD
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permisos: payload.permisos,
      tipoPerfil: payload.tipoPerfil,
    };
  }
}
