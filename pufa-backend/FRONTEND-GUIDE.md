# 🎬 PUFAB - Manual de Vistas Frontend

## ✅ Estado del Proyecto

Todas las vistas del frontend han sido creadas y están **completamente funcionales**. El sistema está listo para **probar todos los endpoints del backend**.

---

## 📋 Vistas Implementadas

### 1. **Home** (`/index.html`)
**Descripción:** Landing page del sistema PUFAB con información general  
**Características:**
- Presentación de servicios
- Ubicación (Google Maps integrado)
- Información de contacto  
- Navegación a todas las secciones

---

### 2. **Autenticación**

#### Sign Up / Registro (`/registro/index.html`)
**Descripción:** Formulario de registro de nuevos usuarios  
**Campos:**
- Email
- Contraseña (con validación)
- Confirmar contraseña
- Términos y condiciones
**Endpoints:**
```
POST /api/v1/auth/register
```

#### Login (`/iniciar-sesion/`)
**Descripción:** Autenticación de usuarios existentes  
**Endpoints:**
```
POST /api/v1/auth/login
```

#### Completar Perfil (`/completar-perfil/index.html`)
**Descripción:** Post-registro - Perfil natural o jurídica  
**Características:**
- Selector de tipo de perfil (Natural / Jurídica)
- Carga dinámica de catálogos
- Validación de datos
**Endpoints:**
```
GET /api/v1/catalogos/estados_civiles
GET /api/v1/catalogos/generos
GET /api/v1/catalogos/especialidades
POST /api/v1/usuarios/perfil/natural
POST /api/v1/usuarios/perfil/juridica
```

---

### 3. **Dashboard Principal** (`/dashboard/index.html`)
**Descripción:** Panel de control central para productores  
**Vistas:**
1. **Mis Proyectos** - Lista de proyectos creados
2. **Mis Trámites** - Lista de solicitudes PUFAB
3. **Mis Documentos** - Documentos cargados
4. **Mis Pagos** - Registro de abonos

**Accesos Rápidos:**
- → Nuevo Proyecto
- → Nuevo Trámite
- → Subir Documentos
- → Registrar Pago
- → Panel Admin
- → Pruebas API

**Endpoints:**
```
GET /api/v1/proyectos
GET /api/v1/tramites
GET /api/v1/documentos/tramite/:id
GET /api/v1/pagos/tramite/:id
```

---

### 4. **Proyecto - Crear** (`/crear-proyecto/index.html`)
**Descripción:** Formulario para crear nuevos proyectos audiovisuales  
**Campos:**
- Título
- Descripción
- Tipo de Producción (dropdown - catálogo)
- Presupuesto (COP)
- Municipio Principal (dropdown)
- Fecha de Inicio
- Duración (días)
- Tamaño de Equipo
- Contacto
- Teléfono

**Validaciones:**
- campos obligatorios
- Presupuesto > 0
- Tipo de producción requerido

**Endpoints:**
```
GET /api/v1/catalogos/tipos-produccion
GET /api/v1/catalogos/municipios
POST /api/v1/proyectos
```

---

### 5. **Proyecto - Detalle** (`/detalle-proyecto/?id=X`)
**Descripción:** Vista completa de un proyecto  
**Información:**
- Datos del proyecto
- Director/Realizador
- Presupuesto
- Ubicación
- Equipo técnico
- Trámites asociados

**Acciones:**
- Ver trámites del proyecto
- Crear nuevo trámite
- Editar proyecto

**Endpoints:**
```
GET /api/v1/proyectos/:id
GET /api/v1/tramites (filtrado por proyecto)
```

---

### 6. **Trámite PUFAB - Crear** (`/crear-tramite/index.html`)
**Descripción:** Formulario complejo para crear solicitud de permiso  
**Secciones:**

#### A. Información General
- Proyecto (selector)
- Descripción adicional

#### B. Locaciones (Modal)
- Tipo de Espacio (dropdown)
- Dirección
- Municipio
- Departamento
- Agregar múltiples ubicaciones

#### C. Equipo Técnico (Modal)
- Rol (dropdown - Jefe, Asistente, etc.)
- Nombre del Profesional
- Cédula
- Especialidad
- Agregar múltiples roles

#### D. Compromisos Éticos
5 checkboxes obligatorios:
- Sobre espacios públicos
- Impacto ambiental
- Impacto social
- Impacto económico
- Seguridad y protección civil

**Endpoints:**
```
GET /api/v1/catalogos/tipos-espacio
GET /api/v1/catalogos/municipios
GET /api/v1/catalogos/departamentos
GET /api/v1/catalogos/roles-equipo-tecnico
GET /api/v1/catalogos/especialidades
GET /api/v1/proyectos (para selector)
POST /api/v1/tramites
```

---

### 7. **Trámite - Detalle** (`/detalle-tramite/?id=X`)
**Descripción:** Vista completa del trámite con todas sus relaciones  
**Tabs:**
1. **Locaciones** - Lugares de filmación
2. **Equipo Técnico** - Profesionales asignados
3. **Documentos** - Archivos cargados con estado
4. **Pagos** - Registro de abonos
5. **Compromisos** - Compromisos éticos

**Información General:**
- Radicado
- Estado
- Solicitante (email)
- Proyecto
- Fechas (creación, actualización)

**Sidebar:**
- Estado actual
- Datos del solicitante
- Datos del proyecto
- Botones de acción

**Endpoints:**
```
GET /api/v1/tramites/:id
GET /api/v1/documentos/tramite/:id
GET /api/v1/pagos/tramite/:id
PATCH /api/v1/tramites/:id/estado (cambiar estado)
```

---

### 8. **Documentos - Subir** (`/subir-documentos/index.html`)
**Descripción:** Interface para cargar documentos de un trámite  
**Características:**
- Selector de trámite
- Drag & drop de archivos
- Validación de tamaño (max 10MB)
- Vista previa de archivos
- Descripción (opcional)
- Barra de progreso

**Tipos Soportados:** `.pdf`, `.doc`, `.docx`, `.jpg`, `.png`, `.mp4`, `.mov`

**Endpoints:**
```
GET /api/v1/tramites (para selector)
POST /api/v1/documentos (subir archivo)
```

---

### 9. **Pagos - Registrar** (`/registrar-pago/index.html`)
**Descripción:** Formulario para registrar abonos o pagos de derechos  
**Campos:**

#### Información del Pago
- Trámite (selector)
- Monto (COP)
- Tipo de Pago:
  - Derechos de Trámite
  - Afianzamiento
  - Abono a Cuenta
  - Otro

#### Método de Pago
**Opción 1: Transferencia**
- Banco de Origen
- Número de Cuenta
- Referencia de Transferencia
- Fecha de Transferencia

**Opción 2: Consignación**
- Banco Destino (selector)
- Número de Cuenta Destino
- Número Comprobante
- Fecha de Consignación

#### Documentación
- Comprobante (PDF, JPG, PNG - max 5MB)
- Notas (opcional)

**Endpoints:**
```
GET /api/v1/tramites (para selector)
POST /api/v1/pagos
```

---

### 10. **Admin Dashboard** (`/admin-dashboard.html`)
**Descripción:** Panel de administración centralizado  
**Secciones:**

#### Dashboard
- Estadísticas generales
- Usuarios totales
- Solicitudes pendientes
- Trámites activos
- Tendencias

#### Usuarios
- Listado de todos los usuarios
- Estado de cuenta
- Rol asignado
- Acciones (ver detalle)

#### Solicitudes
- Solicitudes de registro pendientes
- Email del solicitante
- Estado
- **Modal** para revisar:
  - Ver información
  - Cambiar estado (Aprobar/Rechazar/Subsanación)
  - Agregar observaciones

#### Trámites
- Todos los trámites del sistema
- Radicado
- Usuario solicitante
- Estado
- Enlace a detalle

#### Documentos
- Documentos en sistema
- Estado de validación
- **Modal** para validar:
  - Aprobar/Rechazar
  - Agregar observaciones

#### Pagos
- Listado de pagos registrados
- Monto
- Estado
- Gestión de pagos

#### Entidades
- Entidades revisoras
- Nombre y sigla
- Contacto

**Endpoints:**
```
GET /api/v1/usuarios
GET /api/v1/registro/solicitudes
PATCH /api/v1/registro/solicitudes/:id
GET /api/v1/tramites
GET /api/v1/documentos
PATCH /api/v1/documentos/:id/validar
GET /api/v1/pagos
GET /api/v1/entidades
```

---

### 11. **Test Operations** (`/test-operations.html`)
**Descripción:** Centro interactivo para probar todos los endpoints  
**Módulos:**
- Usuarios
- Proyectos
- Trámites
- Documentos
- Pagos
- Catálogos
- Entidades
- Registro

**Características:**
- Selector de endpoint
- Formularios dinámicos
- Ejecución con parámetros
- Vista de resultados JSON
- Indicador de estado

---

## 🔗 Flujos Principales

### Flujo 1: Nuevo Usuario
```
Sign Up (/registro/)
    ↓
Completar Perfil (/completar-perfil/)
    ↓
Dashboard (/dashboard/)
```

### Flujo 2: Crear Proyecto y Trámite
```
Dashboard → Nuevo Proyecto
    ↓
Crear Proyecto (/crear-proyecto/)
    ↓
Dashboard → Nuevo Trámite
    ↓
Crear Trámite (/crear-tramite/) → selecciona proyecto
    ↓
Detalle Trámite (/detalle-tramite/?id=X)
```

### Flujo 3: Procesar Documentos y Pagos
```
Detalle Trámite
    ↓
Subir Documentos (/subir-documentos/)
    ↓
Registrar Pagos (/registrar-pago/)
    ↓
Admin revisa en Admin Dashboard
```

### Flujo 4: Supervisión Admin
```
Admin Dashboard (/admin-dashboard.html)
    ↓
Revisar Solicitudes → Aprobar/Rechazar
    ↓
Validar Documentos → Aprobar/Rechazar
    ↓
Gestionar Pagos → Cambiar estado
```

---

## 🚀 Uso Rápido

### Para Desarrolladores
1. **Navegar a home:** `http://localhost:3000/`
2. **Registrarse:** `http://localhost:3000/registro/`
3. **Completar perfil:** `http://localhost:3000/completar-perfil/`
4. **Acceder dashboard:** `http://localhost:3000/dashboard/`
5. **Pruebas API:** `http://localhost:3000/test-operations.html`
6. **Panel admin:** `http://localhost:3000/admin-dashboard.html`

### Para Testers
**URL de Pruebas Rápidas:**
- Crear proyecto: `/crear-proyecto/`
- Crear trámite: `/crear-tramite/`
- Subir documentos: `/subir-documentos/`
- Registrar pago: `/registrar-pago/`
- Dashboard admin: `/admin-dashboard.html`

---

## 🔐 Autenticación

### Session Management
- **Almacenamiento:** localStorage
- **Claves:**
  - `pufab_token` → JWT token
  - `pufab_user` → Datos del usuario

### Rutas Protegidas
Todas las vistas (excepto login/registro/home) requieren:
```javascript
if (!API_CLIENT.getSession()) {
  location.href = '/iniciar-sesion/';
}
```

### Logout
- Botón en nav: "Cerrar Sesión"
- Limpia localStorage
- Redirige a `/iniciar-sesion/`

---

## 📊 Endpoints Conectados (36 Total)

### Auth (2)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Usuarios (4)
- `GET /api/v1/usuarios`
- `GET /api/v1/usuarios/:id`
- `POST /api/v1/usuarios/perfil/natural`
- `POST /api/v1/usuarios/perfil/juridica`

### Proyectos (4)
- `GET /api/v1/proyectos`
- `GET /api/v1/proyectos/:id`
- `POST /api/v1/proyectos`
- `PATCH /api/v1/proyectos/:id`

### Trámites (4)
- `GET /api/v1/tramites`
- `GET /api/v1/tramites/:id`
- `POST /api/v1/tramites`
- `PATCH /api/v1/tramites/:id/estado`

### Documentos (3)
- `GET /api/v1/documentos/tramite/:id`
- `POST /api/v1/documentos`
- `PATCH /api/v1/documentos/:id/validar`

### Pagos (3)
- `GET /api/v1/pagos/tramite/:id`
- `POST /api/v1/pagos`
- `PATCH /api/v1/pagos/:id`

### Catálogos (8)
- `GET /api/v1/catalogos/tipos-produccion`
- `GET /api/v1/catalogos/municipios`
- `GET /api/v1/catalogos/departamentos`
- `GET /api/v1/catalogos/tipos-espacio`
- `GET /api/v1/catalogos/roles-equipo-tecnico`
- `GET /api/v1/catalogos/especialidades`
- `GET /api/v1/catalogos/estados-civiles`
- `GET /api/v1/catalogos/generos`

### Entidades (2)
- `GET /api/v1/entidades`
- `POST /api/v1/entidades`

### Registro (2)
- `GET /api/v1/registro/solicitudes`
- `PATCH /api/v1/registro/solicitudes/:id`

---

## 🎨 Estilos y Diseño

### Colores Principales
```css
--green-700: #2d7e3e (primario)
--green-900: #1e4620 (oscuro)
--yellow: #e8d033 (acentos)
--bg-soft: #f5f5f5
```

### Tipografía
- Font: Nunito Sans
- Pesos: 400, 500, 600, 700, 800

### Componentes Reutilizables
- Botones (primary, secondary, ghost)
- Badges (pending, approved, rejected)
- Cards con sombra
- Formularios responsive
- Modales para acciones importantes

---

## ✨ Características Implementadas

✅ Autenticación JWT completa  
✅ Sistema de sesión con localStorage  
✅ Formularios validados  
✅ Dragndrop para archivo  
✅ Barras de progreso  
✅ Tablas interactivas  
✅ Modales para confirmaciones  
✅ Menús dinámicos  
✅ Responsive (mobile-first)  
✅ Error handling user-friendly  
✅ Loading states  
✅ Actualizaciones en tiempo real  

---

## 🐛 Troubleshooting

### "Token expirado"
→ Cerrar sesión y volver a ingresar

### "No tienes permisos"
→ Verificar rol en admin dashboard

### "Documento no se carga"
→ Verificar tamaño (max 10MB) y formato

### "Pago no se registra"
→ Completar todos los campos requeridos

### "Trámite no aparece"
→ Verificar que el proyecto esté creado y seleccionado

---

## 📱 Responsive Design

Todas las vistas son **100% responsive**:
- Desktop (1200+px)
- Tablet (768px - 1199px)
- Mobile (< 768px)

---

## 🔄 Próximas Mejoras (Opcional)

- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Exportar reportes PDF
- [ ] Firma digital en documentos
- [ ] Chat en vivo con support
- [ ] Historial completo de cambios
- [ ] Búsqueda avanzada
- [ ] Filtros personalizados
- [ ] Temas oscuro/claro

---

## 📞 Soporte

Para reportar problemas o sugerencias:
- Contacto: contacto@pufab.gov.co
- Teléfono: +57 (8) 7409000

---

**Versión:** 1.0.0  
**Última actualización:** 2024  
**Estado:** ✅ Completo y Funcional
