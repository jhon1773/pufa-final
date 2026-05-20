import { registerAs } from '@nestjs/config';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value.trim();
}

// Configuración de conexión a PostgreSQL vía TypeORM
export default registerAs('database', () => {
  const env = process.env.NODE_ENV ?? process.env.APP_ENV ?? 'development';
  const database = process.env.DB_DATABASE?.trim() || process.env.DB_NAME?.trim();
  if (!database) {
    throw new Error('Falta la variable de entorno requerida: DB_DATABASE o DB_NAME');
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    const parsed = new URL(databaseUrl);
    const databaseFromUrl = parsed.pathname.replace(/^\//, '');
    return {
      type: 'postgres',
      url: databaseUrl,
      database: databaseFromUrl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: env === 'development',
      logging: env === 'development',
      autoLoadEntities: true,
    };
  }

  return {
    type: 'postgres',
    host: requireEnv('DB_HOST'),
    port: parseInt(requireEnv('DB_PORT'), 10),
    username: requireEnv('DB_USERNAME'),
    password: requireEnv('DB_PASSWORD'),
    database,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: env === 'development',
    logging: env === 'development',
    autoLoadEntities: true,
  };
});
