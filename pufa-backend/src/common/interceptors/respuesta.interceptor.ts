import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Envuelve todas las respuestas exitosas en un formato estándar
@Injectable()
export class RespuestaInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        exitoso: true,
        datos: data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
