(function () {
  const viewCache = new Map();
  const inflightPrefetch = new Map();
  const MAX_CACHE_ENTRIES = 20;
  let isNavigating = false;

  function normalizeRoute(input) {
    try {
      const url = new URL(input, window.location.origin);
      let path = url.pathname.replace(/\/+$/, '');
      if (!path) path = '/';
      return `${path}${url.search}`;
    } catch {
      const value = String(input || '/');
      const [rawPath, search = ''] = value.split('?');
      let path = rawPath.replace(/\/+$/, '');
      if (!path) path = '/';
      return search ? `${path}?${search}` : path;
    }
  }

  function safeRunInlineScript(code) {
    const source = String(code || '').trim();
    if (!source) return;
    try {
      // Keep variables scoped to avoid collisions between pages.
      new Function(source)();
    } catch (error) {
      console.error('Error ejecutando script parcial:', error);
    }
  }

  function runInlineScripts(inlineScripts) {
    const currentToggle = document.getElementById('menuToggle');
    if (currentToggle && currentToggle.parentElement) {
      const toggleClone = currentToggle.cloneNode(true);
      currentToggle.parentElement.replaceChild(toggleClone, currentToggle);
    }

    (inlineScripts || []).forEach((code) => safeRunInlineScript(code));
  }

  function extractInlineScripts(root) {
    return Array.from(root.querySelectorAll('script'))
      .filter((script) => !(script.getAttribute('src') || '').trim())
      .map((script) => script.textContent || '');
  }

  function extractViewPayload(rootDoc) {
    const shell = rootDoc.querySelector('.portal-shell');
    if (!shell) return null;

    return {
      title: rootDoc.title || document.title,
      shellHtml: shell.outerHTML,
      inlineScripts: extractInlineScripts(rootDoc),
    };
  }

  function setCachedView(routeKey, payload) {
    if (!routeKey || !payload) return;

    if (viewCache.has(routeKey)) {
      viewCache.delete(routeKey);
    }
    viewCache.set(routeKey, payload);

    if (viewCache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = viewCache.keys().next().value;
      viewCache.delete(oldestKey);
    }
  }

  function applyViewPayload(payload) {
    if (!payload?.shellHtml) return false;

    const currentShell = document.querySelector('.portal-shell');
    if (!currentShell) return false;

    const template = document.createElement('template');
    template.innerHTML = payload.shellHtml.trim();
    const nextShell = template.content.firstElementChild;
    if (!nextShell) return false;

    currentShell.replaceWith(nextShell);
    document.title = payload.title || document.title;
    markTopNavActive();
    runInlineScripts(payload.inlineScripts || []);

    requestAnimationFrame(() => {
      window.initSidebarSlider?.();
    });

    return true;
  }

  function markTopNavActive() {
    const navLinks = Array.from(document.querySelectorAll('#navLinks a'));
    const currentPath = normalizeRoute(`${window.location.pathname}${window.location.search}`);
    navLinks.forEach((anchor) => {
      const href = normalizeRoute(anchor.getAttribute('href') || '/');
      const shouldActivate = href !== '/' ? currentPath.startsWith(href) : currentPath === '/';
      anchor.classList.toggle('active', shouldActivate);
    });
  }

  function resolveAdminReportSection() {
    const path = normalizeRoute(`${window.location.pathname}${window.location.search}`).split('?')[0];
    const map = {
      '/admin/admin-2.html': 'usuarios',
      '/admin/admin-3.html': 'verificacion',
      '/admin/admin-4.html': 'locaciones',
      '/admin/admin-5.html': 'permisos',
      '/admin/admin-6.html': 'comites',
      '/admin/admin-7.html': 'finanzas',
      '/admin/admin-8.html': 'kpis',
      '/admin/admin-9.html': 'comunicaciones',
      '/admin': 'usuarios',
      '/admin/': 'usuarios',
    };
    return map[path] || null;
  }

  async function exportPortalContentAsPdf() {
    const section = resolveAdminReportSection();
    if (!section) {
      alert('Esta página no tiene una sección de reporte PDF configurada.');
      return;
    }

    try {
      const response = await fetch(`/api/v1/reportes/admin/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parametros: {
            ruta: window.location.pathname,
            fecha: new Date().toISOString(),
          },
        }),
      });

      const payload = await response.json();
      const result = payload?.datos || payload;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || 'No se pudo generar el PDF.');
      }

      const fileUrl = result?.data?.archivo_url;
      if (!fileUrl) {
        throw new Error('No se recibió la URL del archivo PDF.');
      }

      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.target = '_blank';
      downloadLink.rel = 'noopener noreferrer';
      downloadLink.click();
    } catch (error) {
      alert(error?.message || 'Error generando el PDF.');
    }
  }

  function ensurePdfExportButton() {
    const portalContent = document.querySelector('.portal-content');
    if (!portalContent) return;
    if (!resolveAdminReportSection()) return;

    if (portalContent.querySelector('[data-export-pdf-btn]')) return;

    const headerRow = portalContent.querySelector('.portal-head-row');
    if (headerRow) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-secondary';
      button.textContent = 'Generar PDF';
      button.setAttribute('data-export-pdf-btn', '1');
      button.addEventListener('click', exportPortalContentAsPdf);
      headerRow.appendChild(button);
      return;
    }

    const fallbackWrap = document.createElement('div');
    fallbackWrap.style.display = 'flex';
    fallbackWrap.style.justifyContent = 'flex-end';
    fallbackWrap.style.marginBottom = '12px';

    const fallbackButton = document.createElement('button');
    fallbackButton.type = 'button';
    fallbackButton.className = 'btn btn-secondary';
    fallbackButton.textContent = 'Generar PDF';
    fallbackButton.setAttribute('data-export-pdf-btn', '1');
    fallbackButton.addEventListener('click', exportPortalContentAsPdf);

    fallbackWrap.appendChild(fallbackButton);
    portalContent.insertBefore(fallbackWrap, portalContent.firstChild);
  }

  async function navigateTo(href, options) {
    const opts = {
      pushHistory: false,
      preferCache: true,
      ...options,
    };

    const routeKey = normalizeRoute(href || '/');
    const currentKey = normalizeRoute(`${window.location.pathname}${window.location.search}`);
    if (routeKey === currentKey && opts.pushHistory) return;
    if (isNavigating) return;

    isNavigating = true;
    try {
      if (opts.preferCache && viewCache.has(routeKey)) {
        const cached = viewCache.get(routeKey);
        const applied = applyViewPayload(cached);
        if (applied) {
          if (opts.pushHistory) {
            history.pushState({ partial: true, routeKey }, '', routeKey);
          }
          return;
        }
      }

      const response = await fetch(routeKey, {
        headers: { 'X-Requested-With': 'PUFAB-Partial' },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        window.location.href = routeKey;
        return;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const payload = extractViewPayload(doc);

      if (!payload) {
        window.location.href = routeKey;
        return;
      }

      setCachedView(routeKey, payload);
      const applied = applyViewPayload(payload);
      if (!applied) {
        window.location.href = routeKey;
        return;
      }

      if (opts.pushHistory) {
        history.pushState({ partial: true, routeKey }, '', routeKey);
      }
    } catch {
      window.location.href = routeKey;
    } finally {
      isNavigating = false;
    }
  }

  async function prefetchRoute(href) {
    const routeKey = normalizeRoute(href || '/');
    if (!routeKey || viewCache.has(routeKey)) return;
    if (inflightPrefetch.has(routeKey)) return inflightPrefetch.get(routeKey);

    const task = (async () => {
      try {
        const response = await fetch(routeKey, {
          headers: { 'X-Requested-With': 'PUFAB-Partial-Prefetch' },
          credentials: 'same-origin',
        });

        if (!response.ok) return;

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const payload = extractViewPayload(doc);
        if (payload) {
          setCachedView(routeKey, payload);
        }
      } catch {
        // Ignore prefetch errors and keep normal navigation fallback.
      } finally {
        inflightPrefetch.delete(routeKey);
      }
    })();

    inflightPrefetch.set(routeKey, task);
    return task;
  }

  function initSidebarSlider() {
    const sidebar = document.querySelector('.portal-sidebar');
    if (!sidebar) return;
    if (sidebar.dataset.sliderBound === '1') return;

    const links = Array.from(sidebar.querySelectorAll('.portal-link'));
    if (!links.length) return;

    ensurePdfExportButton();

    function updateSliderPosition() {
      const activeLink = sidebar.querySelector('.portal-link.active');
      if (!activeLink) return;

      const activeIndex = links.indexOf(activeLink);
      if (activeIndex >= 0) {
        sidebar.style.setProperty('--link-index', String(activeIndex));
      }

      sidebar.style.setProperty('--slider-y', `${activeLink.offsetTop}px`);
      sidebar.style.setProperty('--slider-height', `${activeLink.offsetHeight}px`);
    }

    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('http')) return;

      link.addEventListener('mouseenter', () => {
        prefetchRoute(href);
      });

      link.addEventListener('focus', () => {
        prefetchRoute(href);
      });

      link.addEventListener('click', (event) => {
        const targetPath = normalizeRoute(href);
        const currentPath = normalizeRoute(`${window.location.pathname}${window.location.search}`);

        if (targetPath === currentPath) {
          event.preventDefault();
          return;
        }

        event.preventDefault();

        links.forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
        updateSliderPosition();

        navigateTo(href, { pushHistory: true, preferCache: true });
      });
    });

    updateSliderPosition();
    requestAnimationFrame(() => {
      sidebar.classList.add('is-ready');
    });

    const onResize = () => {
      requestAnimationFrame(updateSliderPosition);
    };

    window.addEventListener('resize', onResize);
    sidebar.dataset.sliderBound = '1';
  }

  window.initSidebarSlider = initSidebarSlider;

  window.exportPortalContentAsPdf = exportPortalContentAsPdf;

  const startupKey = normalizeRoute(`${window.location.pathname}${window.location.search}`);
  const startupPayload = extractViewPayload(document);
  if (startupPayload) {
    setCachedView(startupKey, startupPayload);
    if (!history.state?.partial) {
      history.replaceState({ partial: true, routeKey: startupKey }, '', startupKey);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.initSidebarSlider?.(), { once: true });
  } else {
    window.initSidebarSlider?.();
  }

  window.addEventListener('popstate', () => {
    const target = normalizeRoute(`${window.location.pathname}${window.location.search}`);
    navigateTo(target, { pushHistory: false, preferCache: true });
  });
})();
