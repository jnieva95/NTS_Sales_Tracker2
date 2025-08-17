// 🏢 MÓDULO DE PROVEEDORES - GESTIÓN COMPLETA
console.log('🏢 Cargando módulo de proveedores...');

// ===== ESTADO DEL MÓDULO =====
const ProveedoresModule = {
    proveedores: [],
    filtros: {
        busqueda: '',
        tipo: '',
        activo: 'true'
    },
    currentProveedor: null,
    isInitialized: false
};

// ===== INICIALIZACIÓN =====
async function initProveedoresModule() {
    console.log('🔧 Inicializando módulo de proveedores...');
    
    if (ProveedoresModule.isInitialized) {
        console.log('⚠️ Módulo ya inicializado');
        return;
    }

    try {
        await loadProveedoresData();
        setupProveedoresUI();
        setupProveedoresEvents();
        await renderProveedoresTable();
        updateProveedoresStats();
        ProveedoresModule.isInitialized = true;
        console.log('✅ Módulo de proveedores inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando módulo de proveedores:', error);
        showNotification('Error cargando módulo de proveedores', 'error');
    }
}

// ===== CARGAR DATOS =====
async function loadProveedoresData() {
    const { supabase, isSupabaseConnected } = window.NTS_CONFIG || {};
    
    if (!isSupabaseConnected || !supabase) {
        console.log('⚠️ Supabase no disponible - usando datos demo');
        loadMockProveedoresData();
        return;
    }

    try {
        console.log('📊 Cargando datos desde Supabase...');
        
        const { data: proveedores, error: proveedoresError } = await supabase
            .from('proveedores')
            .select('*')
            .order('nombre');

        if (proveedoresError) throw proveedoresError;

        ProveedoresModule.proveedores = proveedores || [];

        console.log('✅ Datos cargados:', {
            proveedores: ProveedoresModule.proveedores.length
        });

    } catch (error) {
        console.error('❌ Error cargando datos desde Supabase:', error);
        loadMockProveedoresData();
    }
}

function loadMockProveedoresData() {
    ProveedoresModule.proveedores = [
        {
            id: 1,
            nombre: 'Aerolíneas Argentinas',
            tipo: 'vuelos',
            email: 'contacto@aerolineas.com.ar',
            telefono: '+54 11 4320-2000',
            direccion: 'Av. Corrientes 485, CABA',
            ciudad: 'Buenos Aires',
            pais: 'Argentina',
            contacto_principal: 'Juan Carlos Mendez',
            activo: true,
            observaciones: 'Proveedor principal de vuelos nacionales',
            created_at: '2023-01-15T10:30:00Z'
        },
        {
            id: 2,
            nombre: 'Hotel Plaza',
            tipo: 'hoteles',
            email: 'reservas@hotelplaza.com',
            telefono: '+54 11 4318-3000',
            direccion: 'Florida 1005, CABA',
            ciudad: 'Buenos Aires',
            pais: 'Argentina',
            contacto_principal: 'María Elena Rodríguez',
            activo: true,
            observaciones: 'Hotel 5 estrellas en microcentro',
            created_at: '2023-02-10T14:20:00Z'
        },
        {
            id: 3,
            nombre: 'Traslados VIP',
            tipo: 'traslados',
            email: 'info@trasladosvip.com',
            telefono: '+54 11 4567-8900',
            direccion: 'Av. Santa Fe 2150, CABA',
            ciudad: 'Buenos Aires',
            pais: 'Argentina',
            contacto_principal: 'Roberto Silva',
            activo: true,
            observaciones: 'Servicio de traslados ejecutivos',
            created_at: '2023-03-05T09:15:00Z'
        },
        {
            id: 4,
            nombre: 'Excursiones Patagonia',
            tipo: 'excursiones',
            email: 'ventas@excursionespatagonia.com',
            telefono: '+54 294 442-5678',
            direccion: 'Av. San Martín 450, Bariloche',
            ciudad: 'San Carlos de Bariloche',
            pais: 'Argentina',
            contacto_principal: 'Ana Gutierrez',
            activo: true,
            observaciones: 'Especialistas en turismo aventura',
            created_at: '2023-04-12T16:45:00Z'
        }
    ];

    console.log('✅ Datos demo cargados');
}

// ===== CONFIGURAR INTERFAZ =====
function setupProveedoresUI() {
    console.log('🎨 Configurando interfaz de proveedores...');
    
    const proveedoresContent = document.getElementById('proveedores');
    if (!proveedoresContent) return;

    proveedoresContent.innerHTML = getProveedoresHTML();
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function getProveedoresHTML() {
    return `
        <div class="page-header">
            <div class="page-title">
                <h2>Gestión de Proveedores</h2>
                <p>Administrar proveedores de servicios</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" id="export-proveedores">
                    <i data-lucide="download"></i>
                    Exportar
                </button>
                <button class="btn btn-primary" id="nuevo-proveedor-btn">
                    <i data-lucide="building-2"></i>
                    Nuevo Proveedor
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="dashboard-card" style="margin-bottom: var(--spacing-xl);">
            <div class="card-content">
                <div class="form-grid" style="grid-template-columns: 2fr 1fr 1fr auto;">
                    <div class="form-group">
                        <label for="buscar-proveedor">Buscar Proveedor</label>
                        <input type="text" id="buscar-proveedor" class="form-control" placeholder="Nombre, email, teléfono...">
                    </div>
                    <div class="form-group">
                        <label for="filtro-tipo-proveedor">Tipo</label>
                        <select id="filtro-tipo-proveedor" class="form-control">
                            <option value="">Todos los tipos</option>
                            <option value="vuelos">✈️ Vuelos</option>
                            <option value="hoteles">🏨 Hoteles</option>
                            <option value="traslados">🚌 Traslados</option>
                            <option value="excursiones">🗺️ Excursiones</option>
                            <option value="mixto">📦 Mixto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="filtro-activo-proveedor">Estado</label>
                        <select id="filtro-activo-proveedor" class="form-control">
                            <option value="">Todos</option>
                            <option value="true" selected>Activos</option>
                            <option value="false">Inactivos</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button class="btn btn-secondary" id="limpiar-filtros-proveedores">
                            <i data-lucide="x"></i>
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estadísticas -->
        <div class="stats-grid" style="margin-bottom: var(--spacing-xl);">
            <div class="stat-card primary">
                <div class="stat-icon"><i data-lucide="building-2"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="total-proveedores">0</div>
                    <div class="stat-label">Total Proveedores</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon"><i data-lucide="check-circle"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="proveedores-activos">0</div>
                    <div class="stat-label">Activos</div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon"><i data-lucide="plane"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="proveedores-vuelos">0</div>
                    <div class="stat-label">Vuelos</div>
                </div>
            </div>
            <div class="stat-card info">
                <div class="stat-icon"><i data-lucide="building"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="proveedores-hoteles">0</div>
                    <div class="stat-label">Hoteles</div>
                </div>
            </div>
        </div>

        <!-- Tabla de Proveedores -->
        <div class="dashboard-card">
            <div class="card-header">
                <h3><i data-lucide="list"></i> Lista de Proveedores</h3>
                <div class="card-actions">
                    <span id="proveedores-count">0 proveedores</span>
                </div>
            </div>
            <div class="card-content">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--gray-50); border-bottom: 1px solid var(--gray-200);">
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Proveedor</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Tipo</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Contacto</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Ubicación</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Contacto Principal</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Estado</th>
                                <th style="padding: var(--spacing-md); text-align: center; font-weight: 600;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="proveedores-table-body"></tbody>
                    </table>
                </div>
                <div id="proveedores-empty-state" class="empty-state" style="display:none;">
                    <i data-lucide="building-2"></i>
                    <h3>No hay proveedores</h3>
                    <p>No se encontraron proveedores con los filtros aplicados</p>
                    <button class="btn btn-primary" id="nuevo-proveedor-empty">
                        <i data-lucide="building-2"></i>
                        Crear Primer Proveedor
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Proveedor -->
        <div id="proveedor-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content" style="max-width:800px;">
                <div class="modal-header">
                    <h3 id="proveedor-modal-title">Nuevo Proveedor</h3>
                    <button class="btn-icon" id="close-proveedor-modal"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body">
                    <form id="proveedor-form">
                        <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                            <div class="form-group">
                                <label for="modal-proveedor-nombre">Nombre *</label>
                                <input type="text" id="modal-proveedor-nombre" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="modal-proveedor-tipo">Tipo *</label>
                                <select id="modal-proveedor-tipo" class="form-control" required>
                                    <option value="">Seleccionar tipo...</option>
                                    <option value="vuelos">✈️ Vuelos</option>
                                    <option value="hoteles">🏨 Hoteles</option>
                                    <option value="traslados">🚌 Traslados</option>
                                    <option value="excursiones">🗺️ Excursiones</option>
                                    <option value="mixto">📦 Mixto</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="modal-proveedor-email">Email</label>
                                <input type="email" id="modal-proveedor-email" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-proveedor-telefono">Teléfono</label>
                                <input type="tel" id="modal-proveedor-telefono" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-proveedor-contacto">Contacto Principal</label>
                                <input type="text" id="modal-proveedor-contacto" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-proveedor-activo">Estado</label>
                                <select id="modal-proveedor-activo" class="form-control">
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label for="modal-proveedor-direccion">Dirección</label>
                                <input type="text" id="modal-proveedor-direccion" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-proveedor-ciudad">Ciudad</label>
                                <input type="text" id="modal-proveedor-ciudad" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-proveedor-pais">País</label>
                                <input type="text" id="modal-proveedor-pais" class="form-control" value="Argentina">
                            </div>
                            <div class="form-group full-width">
                                <label for="modal-proveedor-observaciones">Observaciones</label>
                                <textarea id="modal-proveedor-observaciones" class="form-control" rows="3"></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-proveedor">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="save-proveedor">
                        <i data-lucide="save"></i>
                        Guardar Proveedor
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== CONFIGURAR EVENTOS =====
function setupProveedoresEvents() {
    console.log('🎯 Configurando eventos de proveedores...');

    // Filtros
    const buscarInput = document.getElementById('buscar-proveedor');
    const tipoFilter = document.getElementById('filtro-tipo-proveedor');
    const activoFilter = document.getElementById('filtro-activo-proveedor');
    const limpiarBtn = document.getElementById('limpiar-filtros-proveedores');

    if (buscarInput) {
        buscarInput.addEventListener('input', debounce(() => {
            ProveedoresModule.filtros.busqueda = buscarInput.value;
            renderProveedoresTable();
        }, 300));
    }

    if (tipoFilter) {
        tipoFilter.addEventListener('change', () => {
            ProveedoresModule.filtros.tipo = tipoFilter.value;
            renderProveedoresTable();
        });
    }

    if (activoFilter) {
        activoFilter.addEventListener('change', () => {
            ProveedoresModule.filtros.activo = activoFilter.value;
            renderProveedoresTable();
        });
    }

    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', () => {
            limpiarFiltrosProveedores();
        });
    }

    // Botones
    const nuevoProveedorBtn = document.getElementById('nuevo-proveedor-btn');
    const nuevoProveedorEmpty = document.getElementById('nuevo-proveedor-empty');
    const exportBtn = document.getElementById('export-proveedores');

    if (nuevoProveedorBtn) nuevoProveedorBtn.addEventListener('click', () => showProveedorModal());
    if (nuevoProveedorEmpty) nuevoProveedorEmpty.addEventListener('click', () => showProveedorModal());
    if (exportBtn) exportBtn.addEventListener('click', () => exportarProveedores());

    setupProveedorModalEvents();
}

function setupProveedorModalEvents() {
    const modal = document.getElementById('proveedor-modal');
    const closeBtn = document.getElementById('close-proveedor-modal');
    const cancelBtn = document.getElementById('cancel-proveedor');
    const saveBtn = document.getElementById('save-proveedor');

    if (closeBtn) closeBtn.addEventListener('click', () => hideProveedorModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => hideProveedorModal());
    if (saveBtn) saveBtn.addEventListener('click', () => saveProveedor());

    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) hideProveedorModal();
        });
    }
}

// ===== RENDERIZAR TABLA =====
async function renderProveedoresTable() {
    const tbody = document.getElementById('proveedores-table-body');
    const emptyState = document.getElementById('proveedores-empty-state');
    const countElement = document.getElementById('proveedores-count');

    if (!tbody) return;

    const proveedoresFiltrados = filtrarProveedores();

    if (proveedoresFiltrados.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (countElement) countElement.textContent = '0 proveedores';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (countElement) countElement.textContent = `${proveedoresFiltrados.length} proveedor${proveedoresFiltrados.length !== 1 ? 'es' : ''}`;

    tbody.innerHTML = proveedoresFiltrados.map(proveedor => {
        const { createEnumBadge } = window.NTS_CONFIG || {};
        
        const tipoBadge = createEnumBadge ? createEnumBadge('TIPO_PROVEEDOR', proveedor.tipo) : proveedor.tipo;
        const estadoBadge = proveedor.activo 
            ? '<span style="color: var(--success-600); font-weight: 500;">✅ Activo</span>'
            : '<span style="color: var(--error-600); font-weight: 500;">❌ Inactivo</span>';

        return `
            <tr style="border-bottom:1px solid var(--gray-200);">
                <td style="padding:var(--spacing-md);">
                    <div style="font-weight:500;">${proveedor.nombre}</div>
                    <div style="font-size:var(--font-size-sm); color:var(--gray-600);">
                        ${proveedor.ciudad ? `${proveedor.ciudad}, ` : ''}${proveedor.pais || 'Argentina'}
                    </div>
                </td>
                <td style="padding:var(--spacing-md);">${tipoBadge}</td>
                <td style="padding:var(--spacing-md);">
                    <div>${proveedor.email || '-'}</div>
                    <div style="font-size:var(--font-size-sm); color:var(--gray-600);">${proveedor.telefono || '-'}</div>
                </td>
                <td style="padding:var(--spacing-md);">
                    <div>${proveedor.direccion || '-'}</div>
                </td>
                <td style="padding:var(--spacing-md);">
                    <div style="font-weight:500;">${proveedor.contacto_principal || '-'}</div>
                </td>
                <td style="padding:var(--spacing-md);">${estadoBadge}</td>
                <td style="padding:var(--spacing-md); text-align:center;">
                    <div style="display:flex; gap:var(--spacing-xs); justify-content:center;">
                        <button class="btn-icon" onclick="editarProveedor(${proveedor.id})" title="Editar">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn-icon" onclick="toggleProveedorEstado(${proveedor.id})" title="${proveedor.activo ? 'Desactivar' : 'Activar'}">
                            <i data-lucide="${proveedor.activo ? 'eye-off' : 'eye'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

// ===== FILTRAR PROVEEDORES =====
function filtrarProveedores() {
    let proveedores = [...ProveedoresModule.proveedores];

    // Filtro de búsqueda
    if (ProveedoresModule.filtros.busqueda) {
        const busqueda = ProveedoresModule.filtros.busqueda.toLowerCase();
        proveedores = proveedores.filter(p =>
            p.nombre.toLowerCase().includes(busqueda) ||
            (p.email && p.email.toLowerCase().includes(busqueda)) ||
            (p.telefono && p.telefono.includes(busqueda)) ||
            (p.contacto_principal && p.contacto_principal.toLowerCase().includes(busqueda))
        );
    }

    // Filtro de tipo
    if (ProveedoresModule.filtros.tipo) {
        proveedores = proveedores.filter(p => p.tipo === ProveedoresModule.filtros.tipo);
    }

    // Filtro de estado activo
    if (ProveedoresModule.filtros.activo !== '') {
        const activo = ProveedoresModule.filtros.activo === 'true';
        proveedores = proveedores.filter(p => p.activo === activo);
    }

    return proveedores;
}

// ===== ESTADÍSTICAS =====
function updateProveedoresStats() {
    const totalProveedores = ProveedoresModule.proveedores.length;
    const proveedoresActivos = ProveedoresModule.proveedores.filter(p => p.activo).length;
    const proveedoresVuelos = ProveedoresModule.proveedores.filter(p => p.tipo === 'vuelos').length;
    const proveedoresHoteles = ProveedoresModule.proveedores.filter(p => p.tipo === 'hoteles').length;

    const elements = {
        'total-proveedores': totalProveedores.toString(),
        'proveedores-activos': proveedoresActivos.toString(),
        'proveedores-vuelos': proveedoresVuelos.toString(),
        'proveedores-hoteles': proveedoresHoteles.toString()
    };

    Object.entries(elements).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}

// ===== MODAL =====
function showProveedorModal(proveedor = null) {
    const modal = document.getElementById('proveedor-modal');
    const title = document.getElementById('proveedor-modal-title');
    
    if (!modal) return;

    ProveedoresModule.currentProveedor = proveedor;

    if (proveedor) {
        title.textContent = 'Editar Proveedor';
        fillProveedorForm(proveedor);
    } else {
        title.textContent = 'Nuevo Proveedor';
        clearProveedorForm();
    }

    modal.style.display = 'flex';
    setTimeout(() => { document.getElementById('modal-proveedor-nombre')?.focus(); }, 100);
}

function hideProveedorModal() {
    const modal = document.getElementById('proveedor-modal');
    if (modal) modal.style.display = 'none';
    ProveedoresModule.currentProveedor = null;
}

function fillProveedorForm(proveedor) {
    const fields = {
        'modal-proveedor-nombre': proveedor.nombre,
        'modal-proveedor-tipo': proveedor.tipo,
        'modal-proveedor-email': proveedor.email,
        'modal-proveedor-telefono': proveedor.telefono,
        'modal-proveedor-contacto': proveedor.contacto_principal,
        'modal-proveedor-activo': proveedor.activo.toString(),
        'modal-proveedor-direccion': proveedor.direccion,
        'modal-proveedor-ciudad': proveedor.ciudad,
        'modal-proveedor-pais': proveedor.pais,
        'modal-proveedor-observaciones': proveedor.observaciones
    };

    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    });
}

function clearProveedorForm() {
    const form = document.getElementById('proveedor-form');
    if (form) form.reset();
    
    const pais = document.getElementById('modal-proveedor-pais');
    if (pais) pais.value = 'Argentina';
    
    const activo = document.getElementById('modal-proveedor-activo');
    if (activo) activo.value = 'true';
}

// ===== GUARDAR PROVEEDOR =====
async function saveProveedor() {
    try {
        const proveedorData = getProveedorFormData();
        if (!validateProveedorData(proveedorData)) return;

        window.NTS_UTILS?.showLoader('Guardando proveedor...');

        const { supabase, isSupabaseConnected } = window.NTS_CONFIG || {};

        if (isSupabaseConnected && supabase) {
            if (ProveedoresModule.currentProveedor) {
                await updateProveedorInDB(proveedorData);
            } else {
                await createProveedorInDB(proveedorData);
            }
        } else {
            if (ProveedoresModule.currentProveedor) {
                updateProveedorLocally(proveedorData);
            } else {
                createProveedorLocally(proveedorData);
            }
        }

        hideProveedorModal();
        showNotification('Proveedor guardado correctamente', 'success');
        await renderProveedoresTable();
        updateProveedoresStats();

    } catch (error) {
        console.error('❌ Error guardando proveedor:', error);
        showNotification('Error guardando proveedor', 'error');
    } finally {
        window.NTS_UTILS?.hideLoader();
    }
}

function getProveedorFormData() {
    return {
        id: ProveedoresModule.currentProveedor?.id,
        nombre: document.getElementById('modal-proveedor-nombre')?.value.trim(),
        tipo: document.getElementById('modal-proveedor-tipo')?.value,
        email: document.getElementById('modal-proveedor-email')?.value.trim(),
        telefono: document.getElementById('modal-proveedor-telefono')?.value.trim(),
        contacto_principal: document.getElementById('modal-proveedor-contacto')?.value.trim(),
        activo: document.getElementById('modal-proveedor-activo')?.value === 'true',
        direccion: document.getElementById('modal-proveedor-direccion')?.value.trim(),
        ciudad: document.getElementById('modal-proveedor-ciudad')?.value.trim(),
        pais: document.getElementById('modal-proveedor-pais')?.value.trim() || 'Argentina',
        observaciones: document.getElementById('modal-proveedor-observaciones')?.value.trim()
    };
}

function validateProveedorData(data) {
    if (!data.nombre) {
        showNotification('Ingrese el nombre del proveedor', 'warning');
        return false;
    }

    if (!data.tipo) {
        showNotification('Seleccione el tipo de proveedor', 'warning');
        return false;
    }

    return true;
}

async function createProveedorInDB(data) {
    const { supabase } = window.NTS_CONFIG || {};
    if (!supabase) throw new Error('Supabase no disponible');

    const { data: nuevo, error } = await supabase
        .from('proveedores')
        .insert(data)
        .select()
        .single();

    if (error || !nuevo) throw error || new Error('No se pudo crear proveedor');

    ProveedoresModule.proveedores.unshift(nuevo);
}

async function updateProveedorInDB(data) {
    const { supabase } = window.NTS_CONFIG || {};
    const { error } = await supabase
        .from('proveedores')
        .update(data)
        .eq('id', data.id);

    if (error) throw error;

    const idx = ProveedoresModule.proveedores.findIndex(p => p.id === data.id);
    if (idx !== -1) {
        ProveedoresModule.proveedores[idx] = { ...ProveedoresModule.proveedores[idx], ...data };
    }
}

function createProveedorLocally(data) {
    data.id = Date.now();
    data.created_at = new Date().toISOString();
    ProveedoresModule.proveedores.unshift(data);
}

function updateProveedorLocally(data) {
    const idx = ProveedoresModule.proveedores.findIndex(p => p.id === data.id);
    if (idx !== -1) {
        ProveedoresModule.proveedores[idx] = { ...ProveedoresModule.proveedores[idx], ...data };
    }
}

// ===== FUNCIONES DE ACCIÓN =====
function editarProveedor(id) {
    const proveedor = ProveedoresModule.proveedores.find(p => p.id === id);
    if (proveedor) showProveedorModal(proveedor);
}

async function toggleProveedorEstado(id) {
    try {
        const proveedor = ProveedoresModule.proveedores.find(p => p.id === id);
        if (!proveedor) return;

        const nuevoEstado = !proveedor.activo;
        const data = { id, activo: nuevoEstado };

        const { supabase, isSupabaseConnected } = window.NTS_CONFIG || {};

        if (isSupabaseConnected && supabase) {
            await updateProveedorInDB(data);
        } else {
            updateProveedorLocally(data);
        }

        showNotification(`Proveedor ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`, 'success');
        await renderProveedoresTable();
        updateProveedoresStats();

    } catch (error) {
        console.error('❌ Error cambiando estado del proveedor:', error);
        showNotification('Error cambiando estado del proveedor', 'error');
    }
}

function exportarProveedores() {
    const { exportToCSV } = window.NTS_UTILS || {};
    
    if (!exportToCSV) {
        showNotification('Función de exportación no disponible', 'warning');
        return;
    }

    const proveedoresFiltrados = filtrarProveedores();
    const datosExport = proveedoresFiltrados.map(proveedor => ({
        'Nombre': proveedor.nombre,
        'Tipo': proveedor.tipo,
        'Email': proveedor.email || '',
        'Teléfono': proveedor.telefono || '',
        'Contacto Principal': proveedor.contacto_principal || '',
        'Dirección': proveedor.direccion || '',
        'Ciudad': proveedor.ciudad || '',
        'País': proveedor.pais || '',
        'Estado': proveedor.activo ? 'Activo' : 'Inactivo',
        'Observaciones': proveedor.observaciones || ''
    }));

    exportToCSV(datosExport, 'proveedores.csv');
    showNotification('✅ Proveedores exportados correctamente', 'success');
}

function limpiarFiltrosProveedores() {
    ProveedoresModule.filtros = {
        busqueda: '',
        tipo: '',
        activo: 'true'
    };

    const buscarInput = document.getElementById('buscar-proveedor');
    const tipoFilter = document.getElementById('filtro-tipo-proveedor');
    const activoFilter = document.getElementById('filtro-activo-proveedor');

    if (buscarInput) buscarInput.value = '';
    if (tipoFilter) tipoFilter.value = '';
    if (activoFilter) activoFilter.value = 'true';

    renderProveedoresTable();
    updateProveedoresStats();
}

// ===== UTILIDADES =====
function showNotification(message, type = 'info') {
    if (window.NTS_UTILS && typeof window.NTS_UTILS.showNotification === 'function') {
        window.NTS_UTILS.showNotification(message, type);
    } else {
        console[type === 'error' ? 'error' : 'log'](message);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== EXPORT GLOBAL =====
window.ProveedoresModule = ProveedoresModule;
window.initProveedoresModule = initProveedoresModule;
window.editarProveedor = editarProveedor;
window.toggleProveedorEstado = toggleProveedorEstado;

console.log('✅ Módulo de proveedores cargado correctamente');