const fs = require('fs');
const path = require('path');
const net = require('net');
const dotenv = require('dotenv');
const { Client } = require('pg');

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function ok(message) {
  console.log(`${COLORS.green}[OK]${COLORS.reset} ${message}`);
}

function warn(message) {
  console.log(`${COLORS.yellow}[WARN]${COLORS.reset} ${message}`);
}

function fail(message) {
  console.log(`${COLORS.red}[FAIL]${COLORS.reset} ${message}`);
}

function info(message) {
  console.log(`${COLORS.cyan}[INFO]${COLORS.reset} ${message}`);
}

function parsePort(value, fallback) {
  const port = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isFinite(port) || port <= 0) return fallback;
  return port;
}

function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, '0.0.0.0');
  });
}

async function checkDatabaseConnection(config) {
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 4000,
    statement_timeout: 4000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1 AS ok');
    return true;
  } catch (error) {
    return error;
  } finally {
    try {
      await client.end();
    } catch {
      // no-op
    }
  }
}

async function run() {
  console.log('');
  console.log('PUFA Doctor');
  console.log('===========');

  let failures = 0;

  const nodeVersion = process.versions.node;
  const nodeMajor = Number.parseInt(nodeVersion.split('.')[0] || '0', 10);
  if ([20, 22].includes(nodeMajor)) {
    ok(`Node v${nodeVersion} (LTS recomendado)`);
  } else {
    warn(`Node v${nodeVersion}. Recomendado usar Node 20 o 22 LTS.`);
  }

  if (fs.existsSync(envPath)) {
    ok('Archivo .env encontrado');
    dotenv.config({ path: envPath });
  } else {
    warn('No se encontró .env. Crea este archivo antes de iniciar el backend.');
  }

  const appPort = parsePort(process.env.PORT ?? process.env.APP_PORT, 3000);
  const appPortFree = await checkPortAvailability(appPort);
  if (appPortFree) {
    ok(`Puerto de app ${appPort} disponible`);
  } else {
    warn(`Puerto de app ${appPort} ya está en uso`);
  }

  const dbConfig = {
    host: process.env.DB_HOST,
    port: parsePort(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
  };

  if (!dbConfig.host || !dbConfig.username || !dbConfig.database) {
    fail('Faltan variables de entorno de base de datos en .env: DB_HOST, DB_USERNAME y DB_DATABASE o DB_NAME.');
    process.exitCode = 1;
    return;
  }

  info(`Probando PostgreSQL en ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} ...`);
  const dbResult = await checkDatabaseConnection(dbConfig);
  if (dbResult === true) {
    ok('Conexión a PostgreSQL correcta');
  } else {
    failures += 1;
    fail(`No se pudo conectar a PostgreSQL: ${dbResult.message || String(dbResult)}`);
  }

  console.log('');
  if (failures === 0) {
    ok('Diagnóstico completado sin fallas críticas.');
    process.exitCode = 0;
  } else {
    fail(`Diagnóstico completado con ${failures} falla(s) crítica(s).`);
    process.exitCode = 1;
  }
}

run().catch((error) => {
  fail(`Error ejecutando doctor: ${error.message || String(error)}`);
  process.exitCode = 1;
});
