import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RespuestaInterceptor } from './common/interceptors/respuesta.interceptor';

function warnIfNodeVersionIsNotLts() {
  const current = process.versions.node;
  const major = Number(current.split('.')[0] ?? '0');
  const supportedLtsMajors = [20, 22];

  if (!supportedLtsMajors.includes(major)) {
    console.warn(
      `[Entorno] Versión de Node detectada: v${current}. ` +
        `Se recomienda usar Node LTS (${supportedLtsMajors.join(' o ')}) para evitar advertencias ` +
        `de compatibilidad con pg/TypeORM en desarrollo.`,
    );
  }
}

async function listenWithFallback(
  app: NestExpressApplication,
  preferredPort: number,
  maxTries = 20,
): Promise<number> {
  for (let i = 0; i < maxTries; i += 1) {
    const candidate = preferredPort + i;
    try {
      await app.listen(candidate, '0.0.0.0');
      return candidate;
    } catch (error: any) {
      if (error?.code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  throw new Error(`No fue posible iniciar la aplicación. Puertos ocupados desde ${preferredPort} hasta ${preferredPort + maxTries - 1}.`);
}

async function bootstrap() {
  warnIfNodeVersionIsNotLts();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const dataSource = app.get(DataSource);
  const configService = app.get(ConfigService);

  // Fail-fast: no iniciar API si PostgreSQL no está disponible o la BD no coincide.
  if (!dataSource.isInitialized) {
    throw new Error('No se pudo inicializar la conexión a PostgreSQL. Verifica que el servidor y la base de datos estén disponibles.');
  }

  const expectedDb = String(configService.get('database.database') || '').trim();
  const dbResult = await dataSource.query('SELECT current_database() AS db_name');
  const connectedDb = String(dbResult?.[0]?.db_name || '').trim();
  if (!connectedDb) {
    throw new Error('No se pudo detectar la base de datos activa en PostgreSQL.');
  }
  if (expectedDb && connectedDb !== expectedDb) {
    throw new Error(`Base de datos incorrecta: conectada a "${connectedDb}" pero se esperaba "${expectedDb}".`);
  }

  // Validación adicional: confirma que es la base operativa esperada (no una BD vacía).
  const requiredTables = ['usuarios', 'tramites', 'documentos'];
  const tablesResult = await dataSource.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `,
  );
  const existingTables = new Set((tablesResult || []).map((row: any) => String(row.table_name || '').trim()));
  const missingTables = requiredTables.filter((table) => !existingTables.has(table));

  if (missingTables.length > 0) {
    throw new Error(
      `La conexión a PostgreSQL existe, pero la BD "${connectedDb}" no tiene tablas requeridas: ${missingTables.join(', ')}.`,
    );
  }

  // Archivos estáticos para la landing pública
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // Prefijo global de la API versionada
  const prefix = configService.get<string>('app.prefix', 'api/v1');
  app.setGlobalPrefix(prefix);

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filtro global para formatear errores en español
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor global para envolver respuestas exitosas
  app.useGlobalInterceptors(new RespuestaInterceptor());

  // CORS habilitado para desarrollo
  app.enableCors();

  // Configuración de Swagger — disponible en /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('P.U.F.A.B. — API REST')
    .setDescription(
      `**Permiso Único de Filmación Audiovisual de Boyacá**\n\n` +
      `Plataforma digital de la Secretaría de Cultura y Patrimonio y la Comisión Fílmica de Boyacá ` +
      `para gestionar permisos de rodaje audiovisual en el departamento de Boyacá, Colombia.\n\n` +
      `## Autenticación\n` +
      `La mayoría de endpoints requieren un token JWT. Obtén el token con **POST /api/v1/auth/login** ` +
      `y haz clic en el botón **Authorize** (🔒) para ingresarlo.\n\n` +
      `## Usuario de prueba\n` +
      `- Email: \`admin@pufa.gov.co\`\n` +
      `- Password: \`Admin2024!\``,
    )
    .setVersion('1.0')
    .setContact(
      'Comisión Fílmica de Boyacá',
      'https://www.boyaca.gov.co',
      'cultura@boyaca.gov.co',
    )
    .setLicense('Uso Interno — Gobernación de Boyacá', '')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token JWT obtenido en /auth/login' },
      'JWT',
    )
    .addTag('auth', 'Autenticación y gestión de sesión')
    .addTag('usuarios', 'Gestión de usuarios y perfiles de persona natural/jurídica')
    .addTag('catalogos', 'Datos de referencia: municipios, tipos, estados')
    .addTag('registro', 'Flujo de aprobación de nuevos usuarios')
    .addTag('perfiles', 'Perfiles de proveedores, productoras y directorio')
    .addTag('proyectos', 'Proyectos audiovisuales')
    .addTag('tramites', 'Trámites PUFA — solicitudes de permiso de rodaje')
    .addTag('documentos', 'Carga y validación de documentos')
    .addTag('pagos', 'Pagos y abonos de trámites')
    .addTag('entidades', 'Entidades revisoras externas')
    .build();

  const documento = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, documento, {
    swaggerOptions: {
      persistAuthorization: true,          // Conserva el token entre recargas
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'PUFA-Backend — Documentación API',
  });

  const preferredPort = configService.get<number>('app.port', 3000);
  const port = await listenWithFallback(app, preferredPort);
  if (port !== preferredPort) {
    console.warn(`Puerto ${preferredPort} ocupado. Se inició en el puerto ${port}.`);
  }
  console.log('PUFA-Backend corriendo en: http://localhost:' + port + '/' + prefix);
  console.log('Documentación Swagger en:  http://localhost:' + port + '/api/docs');
}
bootstrap();
