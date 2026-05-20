# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

**PUFA-Backend** — API REST del sistema P.U.F.A.B. (Permiso Único de Filmación Audiovisual de Boyacá). Plataforma digital de la Secretaría de Cultura y Patrimonio y la Comisión Fílmica de Boyacá para gestionar permisos de rodaje audiovisual en el departamento.

## Frontend Status ✅ COMPLETO

El frontend ha sido completamente desarrollado con **11 vistas principales**:

### Vistas Creadas:
1. ✅ **Home** (`/index.html`) - Landing page
2. ✅ **Sign Up/Registro** (`/registro/index.html`) - Registro de nuevos usuarios
3. ✅ **Completar Perfil** (`/completar-perfil/index.html`) - Perfil natural/jurídica
4. ✅ **Dashboard** (`/dashboard/index.html`) - Panel de control principal
5. ✅ **Crear Proyecto** (`/crear-proyecto/index.html`) - Formulario de proyecto
6. ✅ **Detalle Proyecto** (`/detalle-proyecto/?id=X`) - Vista detallada proyecto
7. ✅ **Crear Trámite** (`/crear-tramite/index.html`) - Solicitud PUFAB compl
8. ✅ **Detalle Trámite** (`/detalle-tramite/?id=X`) - Vista detallada trámite
9. ✅ **Subir Documentos** (`/subir-documentos/index.html`) - Carga de archivos
10. ✅ **Registrar Pago** (`/registrar-pago/index.html`) - Registro de abonos
11. ✅ **Admin Dashboard** (`/admin-dashboard.html`) - Panel administrativo
12. ✅ **Test Operations** (`/test-operations.html`) - Centro de pruebas API

### Funcionalidades:
- ✅ Autenticación JWT + Session management (localStorage)
- ✅ Sistema de rutas protegidas
- ✅ Formularios validados con feedback
- ✅ Drag & drop para archivos
- ✅ Tablas interactivas con modales
- ✅ 36 endpoints conectados y funcionales
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Error handling user-friendly
- ✅ Google Maps integrado

📚 **Documentación completa:** Ver [FRONTEND-GUIDE.md](FRONTEND-GUIDE.md)

## Convenciones

- Todos los comentarios en código y mensajes de respuesta en **español**
- Ejecutar comandos de instalación sin pedir confirmación
- Nunca exponer la entidad directamente al cliente — usar DTOs de respuesta o mapear manualmente
- Paginación obligatoria en todos los endpoints de listado: parámetros `page`, `limit`; respuesta con `data`, `total`, `page`, `lastPage`
- Todas las rutas bajo `/api/v1/`

## Stack

- **Framework:** NestJS con TypeScript
- **ORM:** TypeORM
- **Base de datos:** PostgreSQL
- **Autenticación:** JWT + Passport con RBAC (roles y permisos embebidos en el token)
- **Validación:** class-validator + class-transformer
- **Archivos:** Multer (uploads en `./uploads/`, máx 10 MB)
- **Frontend:** Vanilla HTML/CSS/JavaScript (sin frameworks)

## Comandos

```bash
# Desarrollo con recarga automática
npm run start:dev

# Build de producción
npm run build

# Tests
npm run test
npm run test:e2e
npm run test:cov
```

## Variables de entorno

Crear `.env` en la raíz y configurar antes de iniciar:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET` (mínimo 32 caracteres en producción), `JWT_EXPIRATION` (default: `1d`)
- `APP_PORT` (default: `3000`), `APP_ENV` (`development` activa `synchronize: true`)
- `PORCENTAJE_ABONO_DEFAULT` (default: `30`)

## Arquitectura

### RBAC
- Los roles y permisos se embeben en el JWT al hacer login — no se consulta la BD en cada request
- Guards aplicados en orden: `JwtAuthGuard` → `RolesGuard` → `PermisosGuard`
- `@Public()` omite autenticación; `@Roles('admin')` restringe por rol; `@RequierePermisos('tramites.aprobar')` por permiso granular
- `CuentaAprobadaGuard` verifica que `estado_cuenta.codigo === 'activo'`

### Flujo de registro de usuarios
1. `POST /api/v1/auth/register` → usuario en estado `pendiente`
2. Usuario completa perfil: `PATCH /api/v1/usuarios/perfil/natural` o `/perfil/juridica`
3. Envía solicitud: `POST /api/v1/registro/solicitudes`
4. Admin aprueba: `PATCH /api/v1/registro/solicitudes/:id/revisar`
5. Al aprobar, el sistema activa la cuenta automáticamente y asigna el rol correspondiente

### Flujo de trámite PUFA
1. Productora crea proyecto → `POST /api/v1/proyectos`
2. Crea trámite con locaciones, equipo y compromisos éticos → `POST /api/v1/tramites`
3. Sube documentos con hash SHA256 → `POST /api/v1/documentos/subir`
4. Registra pago de abono con soporte → `POST /api/v1/pagos`
5. Admin/revisor cambia estado → `PATCH /api/v1/tramites/:id/estado`
6. Entidades externas emiten concepto técnico
7. Tiempo de aprobación: 5 a 15 días hábiles (configurable por env)

### Estructura de módulos
```
src/
├── common/
│   ├── filters/http-exception.filter.ts     # Formato estándar de errores
│   └── interceptors/respuesta.interceptor.ts # Formato estándar de respuestas exitosas
├── config/
│   ├── app.config.ts
│   └── database.config.ts
└── modules/
    ├── auth/           # JWT, RBAC, guards, decoradores, estrategia Passport
    ├── usuarios/       # Usuario, PersonaNatural, PersonaJuridica, VigenciaEstimulo
    ├── catalogos/      # Tablas de referencia (solo lectura en runtime)
    ├── registro/       # Flujo de aprobación de nuevos usuarios con historial
    ├── perfiles/       # PerfilProveedor (categorías/subcategorías/especialidades), PerfilProductora, PerfilAcademico
    ├── proyectos/      # Proyecto audiovisual base del trámite
    ├── tramites/       # Trámite PUFA + locaciones + equipo técnico + entidades + historial
    ├── documentos/     # Archivos con hash SHA256 y versionado por tipo
    ├── pagos/          # Pagos y abonos de trámites
    └── entidades/      # Entidades revisoras externas (alcaldías, aeronáutica, etc.)
```

### Jerarquía de proveedores
`CategoriaProveedor` → `SubcategoriaProveedor` → `EspecialidadProveedor` (3 niveles).
Un proveedor puede tener múltiples subcategorías y especialidades vía ManyToMany con `@JoinTable`.

### Número de radicado
Autogenerado al crear trámite con formato `PUFA-YYYYMMDD-XXXXXX`.

### Documentos
Se guardan con hash SHA256 calculado del buffer del archivo. El campo `version` incrementa por tipo de documento por trámite, permitiendo re-subir documentos corregidos.

## Usuario administrador inicial (seed)
- Email: `admin@pufa.gov.co`
- Password: `Admin2024!`
