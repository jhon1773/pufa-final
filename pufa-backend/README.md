PUFA Backend

Backend de la plataforma PUFA (NestJS + TypeScript).

**Contenido**: instrucciones de instalación, ejecución en desarrollo, construcción para producción y despliegue mediante Docker.

**Requisitos**
- Node.js v18+ (recomendado)
- npm v9+ (incluido con Node 18+)
- Docker & Docker Compose (si vas a usar contenedores)

**Archivos clave**
- `package.json`: scripts y dependencias. ([package.json](package.json#L1))
- `.env`: variables de entorno usadas por la app. ([.env](.env#L1))
- `Dockerfile`: imagen multi-stage para producción. ([Dockerfile](Dockerfile#L1))
- `docker-compose.yml`: orquesta `app` y `db` (Postgres). ([docker-compose.yml](docker-compose.yml#L1))

## Instalación local

1. Clona el repositorio y entra al directorio:

```bash
git clone <tu-repo-url>
cd pufa-backend
```

2. Instala dependencias:

```bash
npm install
```

3. Crea (o revisa) el fichero de variables de entorno `.env` en la raíz del proyecto. Ejemplo de variables importantes:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=pufa_db
JWT_SECRET=tu_secreto_jwt
APP_PORT=3000
```

4. Ejecuta en modo desarrollo (hot-reload):

```bash
npm run start:dev
```

La API quedará accesible en `http://localhost:3000` (o el puerto definido en `APP_PORT`).

## Construir y ejecutar en producción (local)

```bash
npm run build
npm run start:prod
```

## Docker (desarrollo)

El repositorio incluye `docker-compose.yml` que levanta:
- `db`: Postgres
- `app`: NestJS en modo `start:dev` (monta el código para desarrollo)

Iniciar con:

```bash
docker-compose up --build
```

Notas:
- `DB_HOST` se sobreescribe a `db` dentro de `docker-compose.yml` para que la aplicación se conecte al servicio Postgres del mismo `compose`.
- El servicio `app` está configurado para usar `npm run start:dev` y monta el volumen del código fuente.

## Docker (producción)

Para construir una imagen optimizada y ejecutar en producción:

```bash
docker build -t pufa-backend:latest .
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name pufa-backend \
  pufa-backend:latest
```

Asegúrate de que tu `.env` contenga las variables correctas y que `DB_HOST` apunte a la base de datos accesible desde el contenedor.

## Scripts útiles
- `npm run start:dev` — desarrollo con hot reload
- `npm run start:prod` — build y ejecución desde `dist`
- `npm run build` — compilar TypeScript a `dist/`
- `npm run test` — ejecutar tests unitarios
- `npm run test:e2e` — tests end-to-end
- `npm run lint` — ejecutar eslint
- `npm run format` — aplicar prettier
- `node scripts/seed-demo-users.js` — ejecutar seeds de demostración (si existen)

## Base de datos y datos iniciales

El proyecto incluye scripts en `scripts/` y `src/database/seeds/`. Para cargar datos de demostración revisa y ejecuta los scripts correspondientes (ej. `node scripts/seed-demo-users.js`).

## Troubleshooting
- Si `nest` no se encuentra, instala dependencias con `npm install` y ejecuta desde la carpeta `pufa-backend`.
- Si usas Docker y la app no conecta a la BD, comprueba `DB_HOST` en `.env` o revisa que el servicio `db` esté listo. Puedes ver logs con `docker-compose logs -f db`.

## Contribuir
- Sigue las convenciones del proyecto y crea PRs claras. Añade tests para cambios lógicos.

---

Si quieres, puedo añadir un ejemplo de `.env.example` o ajustar la configuración de `docker-compose` para producción. ¿Quieres que agregue `.env.example` con valores por defecto seguros?

## `.env.example` y buenas prácticas de seguridad

Se incluye un archivo ` .env.example` como plantilla sin secretos. Su propósito es documentar las variables de entorno necesarias y facilitar la configuración local o en CI.

- Para usarla, copia y edita los valores sensibles:

```bash
cp .env.example .env
# luego edita .env con tus credenciales
```

- No subas el archivo ` .env` al repositorio: ya está listado en `.gitignore` y no debe contener secretos.
- El `Dockerfile` y `.dockerignore` están configurados para no copiar ni incluir el ` .env` en las imágenes construidas.

Mantén las credenciales y secretos en un gestor seguro (Vault, AWS Secrets Manager, GitHub Secrets, etc.) en entornos de producción.
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).



cd "pufa-backend"
docker-compose up --build
