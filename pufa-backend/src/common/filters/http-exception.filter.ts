import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Filtro global que estandariza el formato de errores HTTP
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const mensaje =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as any).message
        : exceptionResponse;

    const respuesta = {
      statusCode: status,
      mensaje,
      ruta: request.url,
      timestamp: new Date().toISOString(),
    };

    // Registra errores del servidor (5xx) en el log
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Error ${status} en ${request.url}`, exception.stack);
    }

    response.status(status).json(respuesta);
  }
}
