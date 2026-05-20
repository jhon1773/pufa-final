(function () {
  if (window.__pufabPortalFetchPatched) return;
  window.__pufabPortalFetchPatched = true;

  const nativeFetch = window.fetch.bind(window);
  const demoFlagKey = 'pufab_demo_mode';

  const localhostApiFallback =
    window.location.hostname === 'localhost' && window.location.port !== '3000'
      ? `${window.location.protocol}//localhost:3000`
      : null;

  async function fetchWithApiFallback(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isApiPath = url.startsWith('/api/') || url.includes('/api/');

    try {
      const response = await nativeFetch(input, init);
      if (
        localhostApiFallback
        && isApiPath
        && response.status === 404
      ) {
        const retryUrl = url.startsWith('/') ? `${localhostApiFallback}${url}` : url.replace(window.location.origin, localhostApiFallback);
        return nativeFetch(retryUrl, init);
      }
      return response;
    } catch (error) {
      if (!localhostApiFallback || !isApiPath) throw error;
      const retryUrl = url.startsWith('/') ? `${localhostApiFallback}${url}` : url.replace(window.location.origin, localhostApiFallback);
      return nativeFetch(retryUrl, init);
    }
  }

  const originalFetch = fetchWithApiFallback;

  function resolveDemoMode() {
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get('demo');

    if (demoParam === '1' || demoParam === 'true' || demoParam === 'on') {
      localStorage.setItem(demoFlagKey, '1');
    }

    if (demoParam === '0' || demoParam === 'false' || demoParam === 'off') {
      localStorage.setItem(demoFlagKey, '0');
    }

    const stored = localStorage.getItem(demoFlagKey) === '1';
    const globalFlag = window.__PUFAB_DEMO_MODE__ === true;

    return stored || globalFlag;
  }

  const demoModeEnabled = resolveDemoMode();

  const demoByPath = {
    '/api/v1/portal/productor/permisos': {
      datos: {
        data: [
          {
            id: 1,
            numero_radicado: 'PUFA-2026-001',
            proyecto: 'Boyaca en Plano',
            locacion: 'Tunja',
            estado: 'pendiente',
            estado_label: 'Pendiente',
            progreso: 65,
            fecha: '2026-04-04',
            respuesta: '2026-04-12',
            correcciones: ['Ajustar póliza de responsabilidad civil.'],
          },
          {
            id: 2,
            numero_radicado: 'PUFA-2026-002',
            proyecto: 'Ruta Libertadora',
            locacion: 'Paipa',
            estado: 'aprobado',
            estado_label: 'Aprobado',
            progreso: 100,
            fecha: '2026-03-22',
            respuesta: '2026-03-29',
            correcciones: [],
          },
        ],
      },
    },
    '/api/v1/portal/productor/locaciones': {
      datos: [
        { id: 1, nombre: 'Centro Histórico de Tunja', provincia: 'Centro', tipo: 'urbano', precio: 1500000, imagen: '/assets/images/boyaca-1.jpg' },
        { id: 2, nombre: 'Lago de Tota', provincia: 'Sugamuxi', tipo: 'natural', precio: 2200000, imagen: '/assets/images/boyaca-2.jpg' },
      ],
    },
    '/api/v1/portal/productor/evaluaciones': {
      datos: {
        codigo: 'PUFA-2026-001',
        permiso: 'PUFA-2026-001',
        proyecto: 'Boyaca en Plano',
        comite: 'Comité Técnico de Locaciones',
        fecha_limite: '2026-04-20',
        observaciones: ['Actualizar cronograma operativo.', 'Adjuntar seguro de responsabilidad civil vigente.'],
        documentos_requeridos: ['Cronograma actualizado', 'Seguro de responsabilidad civil'],
      },
    },
    '/api/v1/portal/proveedor/panel': {
      datos: {
        nombre: 'Laura Castillo',
        rol: 'Proveedor audiovisual',
        ciudad: 'Tunja',
        rating: '4.8★',
        resenas: 41,
        descripcion: 'Servicios integrales de producción, transporte y soporte técnico para rodajes.',
        metricas: { proyectos: 27, solicitudes: 5, reseñas: 41, tarifaBase: 1800000 },
        servicios: [
          { nombre: 'Coordinación logística', precio: 1200000 },
          { nombre: 'Alquiler de iluminación', precio: 900000 },
          { nombre: 'Transporte especializado', precio: 600000 },
        ],
        solicitudes: [
          { codigo: 'SOL-501', estado: 'Pendiente', proyecto: 'Caminos de Boyaca', cliente: 'Productora Sierra', fecha: '2026-04-07', dias: 3, valor: 2800000 },
          { codigo: 'SOL-498', estado: 'Aprobada', proyecto: 'Voces del Páramo', cliente: 'Altiplano Studio', fecha: '2026-04-02', dias: 2, valor: 1700000 },
        ],
      },
    },
    '/api/v1/portal/proveedor/portafolio': {
      datos: [
        { id: 1, titulo: 'Spot Turismo Boyaca', categoria: 'Comercial', anio: 2025, cliente: 'Gobernación de Boyacá' },
        { id: 2, titulo: 'Serie Senderos', categoria: 'Serie web', anio: 2024, cliente: 'Canal Regional' },
      ],
    },
    '/api/v1/portal/proveedor/disponibilidad': {
      datos: { semana: [{ dia: 'Lunes', estado: 'Disponible' }, { dia: 'Martes', estado: 'Disponible' }, { dia: 'Miércoles', estado: 'Parcial' }] },
    },
    '/api/v1/portal/proveedor/solicitudes': {
      datos: [
        { id: 1, proyecto: 'Ruta Libertadora', estado: 'Pendiente', fecha: '2026-04-08', presupuesto: 3200000 },
        { id: 2, proyecto: 'Boyaca 360', estado: 'En negociación', fecha: '2026-04-05', presupuesto: 2100000 },
      ],
    },
    '/api/v1/portal/proveedor/mensajes': {
      datos: [
        { id: 1, remitente: 'Productora Sierra', asunto: 'Confirmación de disponibilidad', fecha: '2026-04-05', leido: false },
        { id: 2, remitente: 'Comisión Fílmica', asunto: 'Actualización de lineamientos', fecha: '2026-04-03', leido: true },
      ],
    },
    '/api/v1/portal/academico/panel': {
      datos: {
        stats: { producciones: 36, tutoriales: 58, pasantias: 14, documentos: 72 },
        acciones: ['Explorar observatorio', 'Aplicar a pasantías', 'Descargar guías de producción'],
        aplicaciones: [
          { titulo: 'Pasantía - Documental Sierra', estado: 'En revisión' },
          { titulo: 'Semillero postproducción', estado: 'Aprobado' },
        ],
      },
    },
    '/api/v1/portal/academico/observatorio': {
      datos: {
        metricas: { rodajesMes: 12, empleoEstimado: 148, inversion: 420000000 },
        reportes: [
          { titulo: 'Tendencias de rodaje Q1', fecha: '2026-03-30' },
          { titulo: 'Impacto económico local', fecha: '2026-03-15' },
        ],
      },
    },
    '/api/v1/portal/academico/capacitacion': {
      datos: [
        { id: 1, nombre: 'Producción de campo', modalidad: 'Presencial', cupos: 25 },
        { id: 2, nombre: 'Dirección de fotografía', modalidad: 'Virtual', cupos: 40 },
      ],
    },
    '/api/v1/portal/academico/pasantias': {
      datos: [
        { id: 1, empresa: 'Altiplano Studio', rol: 'Asistente de producción', estado: 'Abierta' },
        { id: 2, empresa: 'Boyaca Films', rol: 'Apoyo de arte', estado: 'Abierta' },
      ],
    },
    '/api/v1/portal/academico/recursos': {
      datos: [
        { id: 1, titulo: 'Manual de permisos', tipo: 'PDF', tamano: '2.4 MB' },
        { id: 2, titulo: 'Plantilla de presupuesto', tipo: 'XLSX', tamano: '640 KB' },
      ],
    },
    '/api/v1/portal/admin/resumen': {
      datos: {
        stats: { usuarios: 248, permisos_pendientes: 17, reservas: 185000000, satisfaccion: 92 },
        acciones: [
          { titulo: 'Aprobar perfiles pendientes', detalle: '7 solicitudes listas para revisión' },
          { titulo: 'Validar flujo de permisos', detalle: '4 trámites en punto crítico' },
        ],
        notificaciones: [
          { texto: 'Nuevo proveedor solicita verificación', fecha: 'Hoy 09:20' },
          { texto: 'Trámite PUFA-2026-031 requiere ajuste', fecha: 'Ayer 16:10' },
        ],
      },
    },
    '/api/v1/portal/admin/usuarios': {
      datos: [
        { id: 1, nombre: 'Carolina Ruiz', email: 'carolina@demo.co', rol: 'Proveedor', estado: 'activo' },
        { id: 2, nombre: 'Miguel Rojas', email: 'miguel@demo.co', rol: 'Productora', estado: 'activo' },
      ],
    },
    '/api/v1/portal/admin/verificacion': {
      datos: [
        { id: 1, nombre: 'Andes Camera', tipo: 'Proveedor', fecha: '2026-04-04', estado: 'pendiente' },
        { id: 2, nombre: 'Studio Cordillera', tipo: 'Proveedor', fecha: '2026-04-03', estado: 'pendiente' },
      ],
    },
    '/api/v1/portal/admin/activos': {
      datos: [
        { id: 1, nombre: 'Set Móvil 01', tipo: 'Unidad móvil', mantenimiento: false },
        { id: 2, nombre: 'Kit Iluminación A', tipo: 'Equipamiento', mantenimiento: true },
      ],
    },
    '/api/v1/portal/admin/flujo-permisos': {
      datos: [
        { id: 1, codigo: 'PUFA-2026-031', proyecto: 'Boyaca 360', estado: 'revisión técnica' },
        { id: 2, codigo: 'PUFA-2026-029', proyecto: 'Voces del páramo', estado: 'aprobado' },
      ],
    },
    '/api/v1/portal/admin/comites': {
      datos: [
        { id: 1, nombre: 'Comité Centro', activo: true },
        { id: 2, nombre: 'Comité Provincia Norte', activo: true },
      ],
    },
    '/api/v1/portal/admin/finanzas': {
      datos: {
        totalMes: 245000000,
        pendientes: 32000000,
        reservas: [
          { proyecto: 'Ruta Libertadora', valor: 5400000 },
          { proyecto: 'Boyaca en Plano', valor: 3200000 },
        ],
      },
    },
    '/api/v1/portal/admin/kpis': {
      datos: {
        permisosProcesados: 138,
        tiempoPromedioDias: 7.2,
        tasaAprobacion: 89,
      },
    },
    '/api/v1/portal/admin/comunicaciones': {
      datos: [
        { id: 1, canal: 'Email', titulo: 'Boletín mensual', activo: true },
        { id: 2, canal: 'SMS', titulo: 'Alertas de estado de trámite', activo: true },
      ],
    },
  };

  function isEmptyValue(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return true;
      return keys.every((key) => isEmptyValue(value[key]));
    }
    return false;
  }

  function getPathFromInput(input) {
    const raw = typeof input === 'string' ? input : input?.url || '';
    return new URL(raw || '/', window.location.origin).pathname;
  }

  const figmaAssetMap = {
    '55d910c5-1bcc-479c-acd9-c78a28860e9b': '/assets/govco.svg',
    '511e76a4-6700-42b7-9db5-458f4c2c18ba': '/assets/hero-boyaca.svg',
    '98e6d230-4a3c-43e5-94c8-78be324402db': '/assets/images/boyaca-3.jpeg',
    '6f13ec87-8cbe-4e88-b8a2-ee0ff5c5527c': '/assets/images/boyaca-4.jpg',
    '77a655c2-ce42-4373-9dcb-5d34cf237826': '/assets/images/boyaca-5.jpg',
  };

  function fallbackFigmaImage(img) {
    const src = img.getAttribute('src') || '';
    if (!src.includes('figma.com/api/mcp/asset/')) return;

    const assetId = src.split('/asset/')[1]?.split(/[?#]/)[0] || '';
    const mapped = figmaAssetMap[assetId] || '/assets/images/boyaca-1.jpg';
    if (img.getAttribute('src') !== mapped) {
      img.setAttribute('src', mapped);
    }
  }

  document.querySelectorAll('img[src*="figma.com/api/mcp/asset/"]').forEach((img) => {
    img.addEventListener('error', () => fallbackFigmaImage(img), { once: true });
    fallbackFigmaImage(img);
  });

  if (!demoModeEnabled) {
    return;
  }

  window.fetch = async (input, init = {}) => {
    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    if (method !== 'GET') {
      return originalFetch(input, init);
    }

    const path = getPathFromInput(input);
    if (!path.startsWith('/api/v1/portal/')) {
      return originalFetch(input, init);
    }

    const demoPayload = demoByPath[path];

    try {
      const response = await originalFetch(input, init);
      if (!demoPayload) return response;
      if (!response.ok) {
        return new Response(JSON.stringify(demoPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const json = await response.clone().json().catch(() => null);
      const payload = json?.datos ?? json;
      if (!isEmptyValue(payload)) {
        return response;
      }

      return new Response(JSON.stringify(demoPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (!demoPayload) throw error;
      return new Response(JSON.stringify(demoPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
})();

(function () {
  const navLinks = document.getElementById('navLinks');
  const navInner = document.querySelector('.site-nav-inner');
  const navCta = document.querySelector('.nav-cta');
  const portalUser = document.querySelector('.portal-user');

  if (!navLinks) return;

  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;

  const roleMap = {
    producer: { label: 'Trámites', path: '/tramites/' },
    provider: { label: 'Proveedor', path: '/proveedor/' },
    academy: { label: 'Académico', path: '/academico/' },
    admin: { label: 'Admin', path: '/admin/' },
  };

  let session = null;
  try {
    session = JSON.parse(localStorage.getItem('pufab_session') || 'null');
  } catch {
    session = null;
  }

  const roleConfig = session?.loggedIn ? roleMap[session.role] : null;

  function logout() {
    localStorage.removeItem('pufab_session');
    window.location.href = '/';
  }

  function wireLogout(button) {
    button?.addEventListener('click', logout);
  }

  function isActive(linkPath) {
    if (currentPath.startsWith('/directorio/') && linkPath === '/directorio/') {
      return true;
    }
    if (currentPath === '/contacto/' && linkPath === '/#contacto') {
      return true;
    }
    if (linkPath.startsWith('/#')) {
      return currentPath === '/' && currentHash === linkPath.slice(1);
    }
    if (linkPath === '/') return currentPath === '/';
    return currentPath.startsWith(linkPath);
  }

  const homeLinks = [
    { href: '/#inicio', label: 'Inicio' },
    { href: '/#conocenos', label: 'Conózcanos' },
    { href: '/#locaciones', label: 'Locaciones' },
    { href: '/#noticias', label: 'Noticias' },
    { href: '/#contacto', label: 'Contacto' },
    { href: '/directorio/', label: 'Directorio' },
  ];

  const links = homeLinks;

  navLinks.innerHTML = links
    .map((link) => `<a href="${link.href}"${isActive(link.href) ? ' class="active"' : ''}>${link.label}</a>`)
    .join('');

  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  navLinks.appendChild(indicator);

  const linkElements = Array.from(navLinks.querySelectorAll('a'));
  const sectionTargets = new Map();
  let indicatorRaf = null;

  function setIndicatorTo(linkEl) {
    if (!linkEl) {
      indicator.style.opacity = '0';
      return;
    }

    const navRect = navLinks.getBoundingClientRect();
    const linkRect = linkEl.getBoundingClientRect();
    indicator.style.opacity = '1';
    indicator.style.width = `${linkRect.width}px`;
    indicator.style.transform = `translateX(${linkRect.left - navRect.left}px) scaleX(1)`;
  }

  function setActiveLink(targetHref) {
    linkElements.forEach((el) => el.classList.toggle('active', el.getAttribute('href') === targetHref));
    setIndicatorTo(linkElements.find((el) => el.getAttribute('href') === targetHref) || null);
  }

  function findHomeSectionInView() {
    if (currentPath !== '/') return null;

    const ordered = ['inicio', 'conocenos', 'locaciones', 'noticias', 'contacto'];
    for (const id of ordered) {
      const section = document.getElementById(id);
      if (!section) continue;
      const rect = section.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) return `/#${id}`;
    }
    return '/#inicio';
  }

  function refreshNavState() {
    const activeHref = currentPath === '/' ? findHomeSectionInView() : links.find((link) => isActive(link.href))?.href;
    if (activeHref) setActiveLink(activeHref);
  }

  function scheduleIndicatorUpdate(targetEl) {
    if (indicatorRaf) cancelAnimationFrame(indicatorRaf);
    indicatorRaf = requestAnimationFrame(() => setIndicatorTo(targetEl));
  }

  navLinks.addEventListener('pointerenter', (event) => {
    const link = event.target.closest('a');
    if (link) scheduleIndicatorUpdate(link);
  }, true);

  navLinks.addEventListener('pointermove', (event) => {
    const link = event.target.closest('a');
    if (link) scheduleIndicatorUpdate(link);
  }, true);

  navLinks.addEventListener('pointerleave', () => {
    const active = linkElements.find((el) => el.classList.contains('active')) || linkElements[0] || null;
    scheduleIndicatorUpdate(active);
  });

  if (currentPath === '/') {
    const observerOptions = { threshold: [0.2, 0.4, 0.6], rootMargin: '-20% 0px -55% 0px' };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) {
        setActiveLink(`/#${visible.target.id}`);
      }
    }, observerOptions);

    ['inicio', 'conocenos', 'locaciones', 'noticias', 'contacto'].forEach((id) => {
      const section = document.getElementById(id);
      if (section) {
        sectionTargets.set(id, section);
        observer.observe(section);
      }
    });

    window.addEventListener('scroll', refreshNavState, { passive: true });
    window.addEventListener('resize', refreshNavState);
    window.addEventListener('load', refreshNavState, { once: true });
    refreshNavState();
  } else {
    window.addEventListener('resize', () => {
      const active = linkElements.find((el) => el.classList.contains('active')) || null;
      scheduleIndicatorUpdate(active);
    });
    refreshNavState();
  }

  if (portalUser) {
    portalUser.textContent = session?.loggedIn ? session.name || roleConfig?.label || 'Usuario' : 'Invitado';
  }

  let actions = navCta;
  if (!actions && roleConfig && navInner && !portalUser) {
    actions = document.createElement('div');
    actions.className = 'nav-cta';
    navInner.appendChild(actions);
  }

  if (actions) {
    if (roleConfig) {
      actions.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; gap: 1rem;">
          <button class="btn btn-ghost" type="button" id="logoutBtn">Cerrar sesión</button>
          <a class="btn btn-primary" href="${roleConfig.path}">${roleConfig.label}</a>
        </div>
      `;
      wireLogout(actions.querySelector('#logoutBtn'));
    } else {
      actions.innerHTML = `
        <a class="btn btn-ghost" href="/iniciar-sesion/">Ingresar</a>
        <a class="btn btn-primary" href="/contacto/">Ventanilla Única</a>
      `;
    }
  }

  if (roleConfig && portalUser?.parentElement) {
    let portalLogoutBtn = document.getElementById('portalLogoutBtn');
    if (!portalLogoutBtn) {
      portalLogoutBtn = document.createElement('button');
      portalLogoutBtn.id = 'portalLogoutBtn';
      portalLogoutBtn.type = 'button';
      portalLogoutBtn.className = 'btn btn-glass portal-logout-btn';
      portalLogoutBtn.textContent = 'Cerrar sesión';
      portalUser.parentElement.appendChild(portalLogoutBtn);
    }
    wireLogout(portalLogoutBtn);
  }

  if (session?.loggedIn && !document.getElementById('pufab-profile-bubble')) {
    const bubble = document.createElement('button');
    bubble.id = 'pufab-profile-bubble';
    bubble.type = 'button';
    bubble.style.cssText = 'position:fixed;top:18px;right:18px;z-index:1200;display:flex;align-items:center;gap:.75rem;padding:.6rem .85rem;background:rgba(15,23,42,.96);color:#fff;border-radius:999px;box-shadow:0 12px 30px rgba(15,23,42,.22);backdrop-filter:blur(10px);border:0;cursor:pointer;';

    const avatarMarkup = session.avatarUrl
      ? `<img src="${session.avatarUrl}" alt="Perfil" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.2);">`
      : `<span style="width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#22c55e,#0f766e);font-weight:700;">${(session.name || 'U').trim().charAt(0).toUpperCase()}</span>`;

    bubble.innerHTML = `
      ${avatarMarkup}
      <div style="display:flex;flex-direction:column;line-height:1.1;text-align:left;">
        <strong style="font-size:.88rem;">${session.name || 'Usuario'}</strong>
        <span style="font-size:.74rem;opacity:.8;">${roleConfig?.label || 'Mi cuenta'}</span>
      </div>
    `;

    bubble.addEventListener('click', () => {
      window.location.href = '/perfil/';
    });

    document.body.appendChild(bubble);
  }
})();
