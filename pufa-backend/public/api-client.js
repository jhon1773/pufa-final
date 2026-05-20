/**
 * Cliente API centralizado para PUFAB
 * Define la URL base, maneja JWT, y proporciona métodos para todos los endpoints
 */

const API_CLIENT = (function () {
  const API_BASE =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/api/v1`
      : 'http://localhost:3000/api/v1';
  const SESSION_KEY = 'pufab_session';
  const TOKEN_KEY = 'pufab_token';

  /**
   * Obtiene el token JWT del localStorage
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Guarda el token JWT y datos de sesión
   */
  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      loggedIn: true,
      userId: user.id,
      email: user.email,
      roles: user.roles,
      role: user.roles?.[0] || 'user',
      permisos: user.permisos,
    }));
  }

  /**
   * Obtiene la sesión actual
   */
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  /**
   * Limpia la sesión (logout)
   */
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  /**
   * Realiza una petición HTTP genérica
   */
  async function request(method, endpoint, body = null, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.mensaje || data.message || data.errores?.[0]?.mensaje || 'Error en la solicitud',
          errors: data.errores,
        };
      }

      return data.datos ?? data.data ?? data;
    } catch (error) {
      console.error(`[API] Error en ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Realiza petición multipart/form-data (para archivos)
   */
  async function requestFormData(method, endpoint, formData, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      ...options.headers,
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.mensaje || data.message || data.errores?.[0]?.mensaje || 'Error en la solicitud',
          errors: data.errores,
        };
      }

      return data.datos ?? data.data ?? data;
    } catch (error) {
      console.error(`[API] Error en ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  return {
    // Utils
    API_BASE,
    getToken,
    setSession,
    getSession,
    clearSession,

    // Auth
    auth: {
      register: (payload) => request('POST', '/auth/register', payload),
      login: (email, password) =>
        request('POST', '/auth/login', { email, password }),
      me: () => request('GET', '/auth/me'),
      cambiarPassword: (passwordActual, passwordNueva) =>
        request('PATCH', '/auth/cambiar-password', { passwordActual, passwordNueva }),
    },

    // Usuarios
    usuarios: {
      listar: (page = 1, limit = 20) =>
        request('GET', `/usuarios?page=${page}&limit=${limit}`),
      obtenerPorId: (id) =>
        request('GET', `/usuarios/${id}`),
      completarPerfilNatural: (data) =>
        request('PATCH', '/usuarios/perfil/natural', data),
      completarPerfilJuridica: (data) =>
        request('PATCH', '/usuarios/perfil/juridica', data),
      cambiarEstado: (id, estado, observaciones) =>
        request('PATCH', `/usuarios/${id}/estado`, { estado, observaciones }),
      asignarRol: (id, rolId) =>
        request('POST', `/usuarios/${id}/roles/${rolId}`),
    },

    // Catálogos
    catalogos: {
      municipios: () => request('GET', '/catalogos/municipios'),
      tiposProduccion: () => request('GET', '/catalogos/tipos-produccion'),
      estadosTramite: () => request('GET', '/catalogos/estados-tramite'),
      tiposEspacio: () => request('GET', '/catalogos/tipos-espacio'),
      rolesEquipoTecnico: () => request('GET', '/catalogos/roles-equipo-tecnico'),
      tiposIdentificacion: () => request('GET', '/catalogos/tipos-identificacion'),
      tiposEntidad: () => request('GET', '/catalogos/tipos-entidad'),
      gruposEtnicos: () => request('GET', '/catalogos/grupos-etnicos'),
      sexosNacer: () => request('GET', '/catalogos/sexos-nacer'),
      identidadesGenero: () => request('GET', '/catalogos/identidades-genero'),
      nivelesEducativos: () => request('GET', '/catalogos/niveles-educativos'),
      tiposDiscapacidad: () => request('GET', '/catalogos/tipos-discapacidad'),
      tiemposDedicacionSector: () => request('GET', '/catalogos/tiempos-dedicacion-sector'),
      tiposIngresosSector: () => request('GET', '/catalogos/tipos-ingresos-sector'),
      tiposPropiedadEquipos: () => request('GET', '/catalogos/tipos-propiedad-equipos'),
      gamasEquipos: () => request('GET', '/catalogos/gamas-equipos'),
      rangosExperienciaSector: () => request('GET', '/catalogos/rangos-experiencia-sector'),
      tiposProduccionParticipa: () => request('GET', '/catalogos/tipos-produccion-participa'),
      tiposTramite: () => request('GET', '/catalogos/tipos-tramite'),
      tiposPago: () => request('GET', '/catalogos/tipos-pago'),
      estadosPago: () => request('GET', '/catalogos/estados-pago'),
    },

    // Registro
    registro: {
      crearSolicitud: () =>
        request('POST', '/registro/solicitudes'),
      listarSolicitudes: (page = 1, limit = 20, estado = '') =>
        request('GET', `/registro/solicitudes?page=${page}&limit=${limit}&estado=${estado}`),
      revisarSolicitud: (id, estado, observaciones) =>
        request('PATCH', `/registro/solicitudes/${id}/revisar`, { estado, observaciones }),
    },

    // Perfiles
    perfiles: {
      categorias: () => request('GET', '/perfiles/categorias'),
      directorio: (page = 1, limit = 20, subcategoria = '') =>
        request('GET', `/perfiles/proveedores/directorio?page=${page}&limit=${limit}&subcategoria=${subcategoria}`),
      editarProveedor: (data) =>
        request('PATCH', '/perfiles/proveedor', data),
      editarProductora: (data) =>
        request('PATCH', '/perfiles/productora', data),
      verificarProveedor: (id) =>
        request('PATCH', `/perfiles/proveedores/${id}/verificar`),
    },

    // Proyectos
    proyectos: {
      listar: (page = 1, limit = 20) =>
        request('GET', `/proyectos?page=${page}&limit=${limit}`),
      obtenerPorId: (id) =>
        request('GET', `/proyectos/${id}`),
      // Alias legacy usado por pantallas existentes
      obtener: (id) =>
        request('GET', `/proyectos/${id}`),
      crear: (data) =>
        request('POST', '/proyectos', data),
      actualizar: (id, data) =>
        request('PATCH', `/proyectos/${id}`, data),
    },

    // Trámites
    tramites: {
      listar: (page = 1, limit = 20, estado = '') =>
        request('GET', `/tramites?page=${page}&limit=${limit}&estado=${estado}`),
      obtenerPorId: (id) =>
        request('GET', `/tramites/${id}`),
      // Alias legacy usado por pantallas existentes
      obtener: (id) =>
        request('GET', `/tramites/${id}`),
      crear: (data) =>
        request('POST', '/tramites', data),
      cambiarEstado: (id, estadoId, observacion) =>
        request('PATCH', `/tramites/${id}/estado`, { estado_id: estadoId, observacion }),
    },

    // Documentos
    documentos: {
      subir: (archivo, tipoDocumentoId, tramiteId, solicitudRegistroId, proyectoId) => {
        const formData = new FormData();
        formData.append('archivo', archivo);
        if (tipoDocumentoId) formData.append('tipo_documento_id', tipoDocumentoId);
        if (tramiteId) formData.append('tramite_id', tramiteId);
        if (solicitudRegistroId) formData.append('solicitud_registro_id', solicitudRegistroId);
        if (proyectoId) formData.append('proyecto_id', proyectoId);
        return requestFormData('POST', '/documentos/subir', formData);
      },
      listarPorTramite: (tramiteId) =>
        request('GET', `/documentos/tramite/${tramiteId}`),
      listarPorProyecto: (proyectoId) =>
        request('GET', `/documentos/proyecto/${proyectoId}`),
      validar: (id, estado, observaciones) =>
        request('PATCH', `/documentos/${id}/validar`, { estado, observaciones }),
    },

    // Pagos
    pagos: {
      registrar: (tramiteId, monto, tipoPagoId, soporteDocumentoId) =>
        request('POST', '/pagos', { tramite_id: tramiteId, monto, tipo_pago_id: tipoPagoId, soporte_documento_id: soporteDocumentoId }),
      listarPorTramite: (tramiteId) =>
        request('GET', `/pagos/tramite/${tramiteId}`),
      cambiarEstado: (id, estado) =>
        request('PATCH', `/pagos/${id}/estado`, { estado }),
      obtenerAbono: (tramiteId) =>
        request('GET', `/pagos/tramite/${tramiteId}/abono`),
    },

    // Entidades
    entidades: {
      listar: (page = 1, limit = 50) =>
        request('GET', `/entidades?page=${page}&limit=${limit}`),
      crear: (data) =>
        request('POST', '/entidades', data),
      actualizar: (id, data) =>
        request('PATCH', `/entidades/${id}`, data),
      eliminar: (id) =>
        request('DELETE', `/entidades/${id}`),
    },

    // Portal productor (datos para UI pública)
    portal: {
      productor: {
        proyectosMenu: () => request('GET', '/portal/productor/proyectos-menu'),
        locacionesMenu: () => request('GET', '/portal/productor/locaciones-menu'),
      },
      proveedor: {
        servicios: () => request('GET', '/portal/proveedor/servicios'),
        serviciosPublicos: () => request('GET', '/portal/proveedor/servicios-publicos'),
        crearServicio: (data) => request('POST', '/portal/proveedor/servicios', data),
        galeria: () => request('GET', '/portal/proveedor/galeria'),
        crearGaleria: (formData) => requestFormData('POST', '/portal/proveedor/galeria', formData),
        panel: () => request('GET', '/portal/proveedor/panel'),
        portafolio: () => request('GET', '/portal/proveedor/portafolio'),
        disponibilidad: () => request('GET', '/portal/proveedor/disponibilidad'),
        solicitudes: () => request('GET', '/portal/proveedor/solicitudes'),
        mensajes: () => request('GET', '/portal/proveedor/mensajes'),
        guardarDisponibilidad: (dia_semana, estado, horas) =>
          request('POST', '/portal/proveedor/disponibilidad', { dia_semana, estado, horas }),
        enviarMensaje: (titulo, texto) =>
          request('POST', '/portal/proveedor/mensajes', { titulo, texto }),
      },
      academico: {
        panel: () => request('GET', '/portal/academico/panel'),
        observatorio: () => request('GET', '/portal/academico/observatorio'),
        capacitacion: (q = '') => request('GET', `/portal/academico/capacitacion?q=${encodeURIComponent(q)}`),
        pasantias: () => request('GET', '/portal/academico/pasantias'),
        recursos: () => request('GET', '/portal/academico/recursos'),
      },
    },
  };
})();
