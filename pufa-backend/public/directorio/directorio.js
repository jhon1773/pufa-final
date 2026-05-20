const state = {
  page: 1,
  limit: 12,
  subcategoria: '',
  search: '',
  items: [],
  total: 0,
  lastPage: 1,
  categories: [],
};

const elements = {
  menuToggle: document.getElementById('menuToggle'),
  navLinks: document.getElementById('navLinks'),
  directoryGrid: document.getElementById('directoryGrid'),
  loadingState: document.getElementById('loadingState'),
  emptyState: document.getElementById('emptyState'),
  resultsLabel: document.getElementById('resultsLabel'),
  pageLabel: document.getElementById('pageLabel'),
  prevPage: document.getElementById('prevPage'),
  nextPage: document.getElementById('nextPage'),
  clearFilters: document.getElementById('clearFilters'),
  searchInput: document.getElementById('directorySearch'),
  subcategorySelect: document.getElementById('subcategorySelect'),
  quickFilters: document.getElementById('quickFilters'),
  totalResults: document.getElementById('totalResults'),
  totalPages: document.getElementById('totalPages'),
  activeFilters: document.getElementById('activeFilters'),
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getResponseData = (payload) => payload?.datos ?? payload?.data ?? payload ?? [];

function getProviderName(item) {
  return (
    item?.usuario?.nombre_publico ||
    item?.usuario?.nombre ||
    item?.subcategorias?.[0]?.nombre ||
    `Proveedor #${item?.id ?? ''}`.trim()
  );
}

function getProviderSubtitle(item) {
  const parts = [];
  if (item?.usuario?.email) {
    parts.push(item.usuario.email);
  }
  if (item?.usuario?.telefono) {
    parts.push(item.usuario.telefono);
  }
  return parts.join(' · ') || 'Proveedor del directorio público';
}

function matchesSearch(item) {
  if (!state.search) {
    return true;
  }

  const haystack = [
    getProviderName(item),
    getProviderSubtitle(item),
    item?.descripcion_perfil,
    item?.sitio_web,
    ...(item?.subcategorias ?? []).map((entry) => entry?.nombre),
    ...(item?.especialidades ?? []).map((entry) => entry?.nombre),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(state.search.toLowerCase());
}

function renderQuickFilters() {
  const subcategories = state.categories
    .flatMap((category) => (category?.subcategorias ?? []).map((subcategoria) => ({
      id: subcategoria.id,
      label: `${category?.nombre ?? 'Categoría'} · ${subcategoria?.nombre ?? 'Subcategoría'}`,
    })))
    .slice(0, 5);
  const chips = [
    `<button type="button" class="filter-chip ${state.subcategoria ? '' : 'active'}" data-subcategoria="">Todas</button>`,
    ...subcategories.map(
      (entry) => `<button type="button" class="filter-chip ${String(entry.id) === String(state.subcategoria) ? 'active' : ''}" data-subcategoria="${escapeHtml(entry.id)}">${escapeHtml(entry.label)}</button>`,
    ),
  ];

  elements.quickFilters.innerHTML = chips.join('');
  elements.quickFilters.querySelectorAll('[data-subcategoria]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-subcategoria') || '';
      state.subcategoria = value;
      state.page = 1;
      elements.subcategorySelect.value = value;
      loadDirectory();
    });
  });
}

function renderCategories() {
  const options = ['<option value="">Todas</option>'];
  state.categories.forEach((category) => {
    const groupLabel = category?.nombre ? `${category.nombre}` : 'Categoría';
    (category?.subcategorias ?? []).forEach((subcategoria) => {
      options.push(
        `<option value="${escapeHtml(subcategoria.id)}" ${String(subcategoria.id) === String(state.subcategoria) ? 'selected' : ''}>${escapeHtml(groupLabel)} · ${escapeHtml(subcategoria.nombre)}</option>`,
      );
    });
  });

  elements.subcategorySelect.innerHTML = options.join('');
}

function renderCards() {
  const filteredItems = state.items.filter(matchesSearch);
  const cards = filteredItems.map((item) => {
    const subcategories = (item?.subcategorias ?? []).map((entry) => escapeHtml(entry?.nombre)).filter(Boolean);
    const specialties = (item?.especialidades ?? []).map((entry) => escapeHtml(entry?.nombre)).filter(Boolean);
    const website = item?.sitio_web ? escapeHtml(item.sitio_web) : '';
    const email = item?.usuario?.email ? escapeHtml(item.usuario.email) : '';
    const contactLink = website ? item.sitio_web : email ? `mailto:${item.usuario.email}` : '#';
    const contactLabel = website ? 'Sitio web' : email ? 'Contactar' : 'Ver detalle';
    const status = item?.verificado ? 'Verificado' : 'Pendiente';

    return `
      <article class="directory-item">
        <div class="directory-media placeholder">
          <span>${escapeHtml(String(getProviderName(item).charAt(0) || 'P'))}</span>
        </div>
        <div class="directory-body">
          <span class="directory-badge provider">${status}</span>
          <h3>${escapeHtml(getProviderName(item))}</h3>
          <p>${escapeHtml(item?.descripcion_perfil || getProviderSubtitle(item))}</p>
          <ul>
            ${subcategories.slice(0, 2).map((entry) => `<li>${entry}</li>`).join('')}
            ${specialties.slice(0, 2).map((entry) => `<li>${entry}</li>`).join('')}
            ${email ? `<li>${email}</li>` : ''}
          </ul>
          <div class="directory-footer-row">
            <strong>${escapeHtml(item?.usuario?.telefono || 'Sin teléfono')}</strong>
            <a href="${escapeHtml(contactLink)}" ${website ? 'target="_blank" rel="noreferrer"' : ''}>${contactLabel}</a>
          </div>
        </div>
      </article>
    `;
  });

  elements.directoryGrid.innerHTML = cards.join('');
  elements.emptyState.hidden = filteredItems.length > 0;
  elements.directoryGrid.hidden = filteredItems.length === 0;
  elements.resultsLabel.textContent = `${filteredItems.length} resultado${filteredItems.length === 1 ? '' : 's'} en esta página`;
}

function updateSummary() {
  const activeFilters = [state.search, state.subcategoria].filter(Boolean).length;
  elements.totalResults.textContent = String(state.total);
  elements.totalPages.textContent = String(state.lastPage);
  elements.activeFilters.textContent = String(activeFilters);
  elements.pageLabel.textContent = `Página ${state.page} de ${state.lastPage}`;
  elements.prevPage.disabled = state.page <= 1;
  elements.nextPage.disabled = state.page >= state.lastPage;
}

async function loadCategories() {
  const response = await fetch('/api/v1/perfiles/categorias');
  const payload = await response.json();
  const categories = getResponseData(payload);
  state.categories = Array.isArray(categories) ? categories : [];
  renderCategories();
  renderQuickFilters();
}

async function loadDirectory() {
  elements.loadingState.hidden = false;
  elements.directoryGrid.hidden = true;
  elements.emptyState.hidden = true;

  const params = new URLSearchParams({
    page: String(state.page),
    limit: String(state.limit),
  });

  if (state.subcategoria) {
    params.set('subcategoria', String(state.subcategoria));
  }

  const response = await fetch(`/api/v1/perfiles/proveedores/directorio?${params.toString()}`);
  const payload = await response.json();
  const directory = getResponseData(payload);

  state.items = Array.isArray(directory?.data) ? directory.data : [];
  state.total = directory?.total ?? 0;
  state.lastPage = Math.max(1, directory?.lastPage ?? 1);

  elements.loadingState.hidden = true;
  updateSummary();
  renderCards();
  renderQuickFilters();
}

function bindEvents() {
  elements.menuToggle?.addEventListener('click', () => {
    elements.navLinks?.classList.toggle('open');
  });

  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim();
    renderCards();
    updateSummary();
  });

  elements.subcategorySelect.addEventListener('change', (event) => {
    state.subcategoria = event.target.value;
    state.page = 1;
    loadDirectory();
  });

  elements.prevPage.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      loadDirectory();
    }
  });

  elements.nextPage.addEventListener('click', () => {
    if (state.page < state.lastPage) {
      state.page += 1;
      loadDirectory();
    }
  });

  elements.clearFilters.addEventListener('click', () => {
    state.page = 1;
    state.subcategoria = '';
    state.search = '';
    elements.searchInput.value = '';
    elements.subcategorySelect.value = '';
    loadDirectory();
  });
}

async function bootstrap() {
  bindEvents();

  try {
    await loadCategories();
    await loadDirectory();
  } catch (error) {
    elements.loadingState.hidden = true;
    elements.emptyState.hidden = false;
    elements.emptyState.textContent = 'No se pudo cargar el directorio. Intenta nuevamente.';
    elements.resultsLabel.textContent = 'Error al cargar';
    console.error(error);
  }
}

bootstrap();