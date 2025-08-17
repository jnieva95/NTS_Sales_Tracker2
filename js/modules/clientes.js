console.log('👥 Cargando módulo de clientes...');

// ===== UTILIDADES =====
function showNotification(message, type = 'info') {
    if (window.app && typeof window.app.showNotification === 'function') {
        window.app.showNotification(message, type);
    } else if (window.NTS_UTILS && typeof window.NTS_UTILS.showNotification === 'function') {
        window.NTS_UTILS.showNotification(message, type);
    } else {
        console[type === 'error' ? 'error' : 'log'](message);
    }
}

// ===== ESTADO DEL MÓDULO =====
const ClientesModule = {
    clientes: [],
    vendedores: [],
    filtros: {
        busqueda: '',
        vendedor: '',
        periodo: 'todos'
    },
    currentCliente: null,
    isInitialized: false
};

// ===== INICIALIZACIÓN DEL MÓDULO =====
async function initClientesModule() {
    console.log('🔧 Inicializando módulo de clientes...');
    if (ClientesModule.isInitialized) {
        console.log('⚠️ Módulo ya inicializado');
        return;
    }
    try {
        await loadClientesData();
        setupClientesUI();
        setupClientesEvents();
        await renderClientesTable();
        updateClientesStats();
        ClientesModule.isInitialized = true;
        console.log('✅ Módulo de clientes inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando módulo de clientes:', error);
        showNotification('Error cargando módulo de clientes', 'error');
    }
}

// ===== CARGAR DATOS =====
async function loadClientesData() {
    const { supabase, isSupabaseConnected } = window.NTS_CONFIG || {};
    if (!isSupabaseConnected || !supabase) {
        console.log('⚠️ Supabase no disponible - usando datos demo');
        loadMockClientesData();
        return;
    }
    try {
        console.log('📊 Cargando datos desde Supabase...');
        const { data: clientes, error: clientesError } = await supabase
            .from('clientes')
            .select(`
                id, nombre, email, telefono, DNI, dni_expiracion,
                Pasaporte, pasaporte_expiracion, direccion, ciudad,
                pais, vendedor_id, fecha_ultima_venta, total_compras, created_at,
                vendedores (id, nombre, codigo_vendedor)
            `)
            .order('created_at', { ascending: false });
        if (clientesError) throw clientesError;
        const { data: vendedores, error: vendedoresError } = await supabase
            .from('vendedores')
            .select('id, nombre, codigo_vendedor, activo')
            .eq('activo', true)
            .order('nombre');
        if (vendedoresError) throw vendedoresError;
        ClientesModule.clientes = clientes || [];
        ClientesModule.vendedores = vendedores || [];
        console.log('✅ Datos cargados:', {
            clientes: ClientesModule.clientes.length,
            vendedores: ClientesModule.vendedores.length
        });
    } catch (error) {
        console.error('❌ Error cargando datos desde Supabase:', error);
        loadMockClientesData();
    }
}

function loadMockClientesData() {
    ClientesModule.clientes = [
        {
            id: 1,
            nombre: 'Juan Pérez',
            email: 'juan@email.com',
            telefono: '+54 9 11 1234-5678',
            DNI: '12345678',
            dni_expiracion: '2030-01-15',
            ciudad: 'Buenos Aires',
            pais: 'Argentina',
            vendedor_id: 1,
            fecha_ultima_venta: '2024-01-15',
            total_compras: 125000,
            created_at: '2023-06-10T10:30:00Z',
            vendedores: { id: 1, nombre: 'Ana García', codigo_vendedor: 'V001' }
        },
        {
            id: 2,
            nombre: 'María González',
            email: 'maria@email.com',
            telefono: '+54 9 11 9876-5432',
            Pasaporte: 'ABC123456',
            pasaporte_expiracion: '2028-08-20',
            ciudad: 'Córdoba',
            pais: 'Argentina',
            vendedor_id: 2,
            fecha_ultima_venta: '2024-01-10',
            total_compras: 75000,
            created_at: '2023-08-22T14:20:00Z',
            vendedores: { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002' }
        }
    ];
    ClientesModule.vendedores = [
        { id: 1, nombre: 'Ana García', codigo_vendedor: 'V001' },
        { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002' }
    ];
    console.log('✅ Datos demo cargados');
}

// ===== CONFIGURAR INTERFAZ =====
function setupClientesUI() {
    console.log('🎨 Configurando interfaz de clientes...');
    const clientesContent = document.getElementById('clientes');
    if (!clientesContent) return;
    clientesContent.innerHTML = getClientesHTML();
    setupClientesFilters();
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function getClientesHTML() {
    return `
        <div class="page-header">
            <div class="page-title">
                <h2>Gestión de Clientes</h2>
                <p>Administrar base de clientes</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" id="export-clientes">
                    <i data-lucide="download"></i>
                    Exportar
                </button>
                <button class="btn btn-primary" id="nuevo-cliente-btn">
                    <i data-lucide="user-plus"></i>
                    Nuevo Cliente
                </button>
            </div>
        </div>
        <div class="dashboard-card" style="margin-bottom: var(--spacing-xl);">
            <div class="card-content">
                <div class="form-grid" style="grid-template-columns: 2fr 1fr 1fr auto;">
                    <div class="form-group">
                        <label for="buscar-cliente">Buscar Cliente</label>
                        <input type="text" id="buscar-cliente" class="form-control" placeholder="Nombre, email, DNI o teléfono...">
                    </div>
                    <div class="form-group">
                        <label for="filtro-vendedor">Vendedor</label>
                        <select id="filtro-vendedor" class="form-control">
                            <option value="">Todos los vendedores</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="filtro-periodo">Período</label>
                        <select id="filtro-periodo" class="form-control">
                            <option value="todos">Todos</option>
                            <option value="mes">Último mes</option>
                            <option value="trimestre">Último trimestre</option>
                            <option value="año">Último año</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button class="btn btn-secondary" id="limpiar-filtros">
                            <i data-lucide="x"></i>
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="stats-grid" style="margin-bottom: var(--spacing-xl);">
            <div class="stat-card primary">
                <div class="stat-icon"><i data-lucide="users"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="total-clientes">0</div>
                    <div class="stat-label">Total Clientes</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon"><i data-lucide="user-check"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="clientes-activos">0</div>
                    <div class="stat-label">Clientes Activos</div>
                    <div class="stat-change positive">
                        <i data-lucide="trending-up"></i>
                        Este mes
                    </div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon"><i data-lucide="dollar-sign"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="facturacion-total">$0</div>
                    <div class="stat-label">Facturación Total</div>
                </div>
            </div>
            <div class="stat-card info">
                <div class="stat-icon"><i data-lucide="calendar"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="nuevos-mes">0</div>
                    <div class="stat-label">Nuevos este Mes</div>
                </div>
            </div>
        </div>
        <div class="dashboard-card">
            <div class="card-header">
                <h3><i data-lucide="users"></i> Lista de Clientes</h3>
                <div class="card-actions"><span id="clientes-count">0 clientes</span></div>
            </div>
            <div class="card-content">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--gray-50); border-bottom: 1px solid var(--gray-200);">
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Cliente</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Contacto</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Documentos</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Vendedor</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Última Venta</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Total Compras</th>
                                <th style="padding: var(--spacing-md); text-align: center; font-weight: 600;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="clientes-table-body"></tbody>
                    </table>
                </div>
                <div id="clientes-empty-state" class="empty-state" style="display:none;">
                    <i data-lucide="users"></i>
                    <h3>No hay clientes</h3>
                    <p>No se encontraron clientes con los filtros aplicados</p>
                    <button class="btn btn-primary" id="nuevo-cliente-empty">
                        <i data-lucide="user-plus"></i>
                        Crear Primer Cliente
                    </button>
                </div>
            </div>
        </div>
        <div id="cliente-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content" style="max-width:800px;">
                <div class="modal-header">
                    <h3 id="cliente-modal-title">Nuevo Cliente</h3>
                    <button class="btn-icon" id="close-cliente-modal"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body">
                    <form id="cliente-form">
                        <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                            <div class="form-group">
                                <label for="modal-cliente-nombre">Nombre *</label>
                                <input type="text" id="modal-cliente-nombre" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-apellido">Apellido *</label>
                                <input type="text" id="modal-cliente-apellido" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-email">Email</label>
                                <input type="email" id="modal-cliente-email" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-telefono">Teléfono</label>
                                <input type="tel" id="modal-cliente-telefono" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-vendedor">Vendedor Asignado</label>
                                <select id="modal-cliente-vendedor" class="form-control">
                                    <option value="">Sin asignar</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-dni">DNI</label>
                                <input type="text" id="modal-cliente-dni" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-dni-exp">DNI Vencimiento</label>
                                <input type="date" id="modal-cliente-dni-exp" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-pasaporte">Pasaporte</label>
                                <input type="text" id="modal-cliente-pasaporte" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-pasaporte-exp">Pasaporte Vencimiento</label>
                                <input type="date" id="modal-cliente-pasaporte-exp" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-direccion">Dirección</label>
                                <input type="text" id="modal-cliente-direccion" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-ciudad">Ciudad</label>
                                <input type="text" id="modal-cliente-ciudad" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="modal-cliente-pais">País</label>
                                <input type="text" id="modal-cliente-pais" class="form-control" value="Argentina">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-cliente">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="save-cliente">
                        <i data-lucide="save"></i>
                        Guardar Cliente
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== CONFIGURAR FILTROS =====
function setupClientesFilters() {
    const vendedorSelect = document.getElementById('filtro-vendedor');
    if (vendedorSelect) {
        vendedorSelect.innerHTML = '<option value="">Todos los vendedores</option>';
        ClientesModule.vendedores.forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = `${v.nombre} (${v.codigo_vendedor})`;
            vendedorSelect.appendChild(option);
        });
    }
    const modalVendedorSelect = document.getElementById('modal-cliente-vendedor');
    if (modalVendedorSelect) {
        modalVendedorSelect.innerHTML = '<option value="">Sin asignar</option>';
        ClientesModule.vendedores.forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = `${v.nombre} (${v.codigo_vendedor})`;
            modalVendedorSelect.appendChild(option);
        });
    }
}

// ===== CONFIGURAR EVENTOS =====
function setupClientesEvents() {
    console.log('🎯 Configurando eventos de clientes...');
    const buscarInput = document.getElementById('buscar-cliente');
    const vendedorFilter = document.getElementById('filtro-vendedor');
    const periodoFilter = document.getElementById('filtro-periodo');
    const limpiarBtn = document.getElementById('limpiar-filtros');
    if (buscarInput) {
        buscarInput.addEventListener('input', debounce(() => {
            ClientesModule.filtros.busqueda = buscarInput.value;
            renderClientesTable();
        }, 300));
    }
    if (vendedorFilter) {
        vendedorFilter.addEventListener('change', () => {
            ClientesModule.filtros.vendedor = vendedorFilter.value;
            renderClientesTable();
        });
    }
    if (periodoFilter) {
        periodoFilter.addEventListener('change', () => {
            ClientesModule.filtros.periodo = periodoFilter.value;
            renderClientesTable();
        });
    }
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', () => {
            limpiarFiltros();
        });
    }
    const nuevoClienteBtn = document.getElementById('nuevo-cliente-btn');
    const nuevoClienteEmpty = document.getElementById('nuevo-cliente-empty');
    const exportBtn = document.getElementById('export-clientes');
    if (nuevoClienteBtn) nuevoClienteBtn.addEventListener('click', () => showClienteModal());
    if (nuevoClienteEmpty) nuevoClienteEmpty.addEventListener('click', () => showClienteModal());
    if (exportBtn) exportBtn.addEventListener('click', () => exportarClientes());
    setupClienteModalEvents();
}

function setupClienteModalEvents() {
    const modal = document.getElementById('cliente-modal');
    const closeBtn = document.getElementById('close-cliente-modal');
    const cancelBtn = document.getElementById('cancel-cliente');
    const saveBtn = document.getElementById('save-cliente');
    if (closeBtn) closeBtn.addEventListener('click', () => hideClienteModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => hideClienteModal());
    if (saveBtn) saveBtn.addEventListener('click', () => saveCliente());
    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) hideClienteModal();
        });
    }
}

// ===== RENDERIZAR TABLA =====
async function renderClientesTable() {
    const tbody = document.getElementById('clientes-table-body');
    const emptyState = document.getElementById('clientes-empty-state');
    const countElement = document.getElementById('clientes-count');
    if (!tbody) return;
    const clientesFiltrados = filtrarClientes();
    if (clientesFiltrados.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (countElement) countElement.textContent = '0 clientes';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';
    if (countElement) countElement.textContent = `${clientesFiltrados.length} cliente${clientesFiltrados.length !== 1 ? 's' : ''}`;
    tbody.innerHTML = clientesFiltrados.map(cliente => {
        const documentos = getDocumentosDisplay(cliente);
        const vendedor = cliente.vendedores ? cliente.vendedores.nombre : 'Sin asignar';
        const ultimaVenta = cliente.fecha_ultima_venta ? formatDate(cliente.fecha_ultima_venta) : 'Nunca';
        const totalCompras = formatCurrency(cliente.total_compras || 0);
        return `
            <tr style="border-bottom:1px solid var(--gray-200);">
                <td style="padding:var(--spacing-md);">
                    <div style="font-weight:500;">${cliente.nombre}</div>
                    <div style="font-size:var(--font-size-sm); color:var(--gray-600);">
                        ${cliente.ciudad ? `${cliente.ciudad}, ` : ''}${cliente.pais || 'Argentina'}
                    </div>
                </td>
                <td style="padding:var(--spacing-md);">
                    <div>${cliente.email || '-'}</div>
                    <div style="font-size:var(--font-size-sm); color:var(--gray-600);">${cliente.telefono || '-'}</div>
                </td>
                <td style="padding:var(--spacing-md);">${documentos}</td>
                <td style="padding:var(--spacing-md);"><div style="font-weight:500;">${vendedor}</div></td>
                <td style="padding:var(--spacing-md);">${ultimaVenta}</td>
                <td style="padding:var(--spacing-md);"><div style="font-weight:600; color:var(--primary-600);">${totalCompras}</div></td>
                <td style="padding:var(--spacing-md); text-align:center;">
                    <div style="display:flex; gap:var(--spacing-xs); justify-content:center;">
                        <button class="btn-icon" onclick="editarCliente(${cliente.id})" title="Editar"><i data-lucide="edit"></i></button>
                        <button class="btn-icon" onclick="verHistorialCliente(${cliente.id})" title="Historial"><i data-lucide="history"></i></button>
                        <button class="btn-icon" onclick="crearVentaParaCliente(${cliente.id})" title="Nueva Venta"><i data-lucide="plus-circle"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
}

// ===== FILTRAR CLIENTES =====
function filtrarClientes() {
    let clientes = [...ClientesModule.clientes];
    if (ClientesModule.filtros.busqueda) {
        const b = ClientesModule.filtros.busqueda.toLowerCase();
        clientes = clientes.filter(c =>
            c.nombre.toLowerCase().includes(b) ||
            (c.email && c.email.toLowerCase().includes(b)) ||
            (c.telefono && c.telefono.includes(b)) ||
            (c.DNI && c.DNI.includes(b)) ||
            (c.Pasaporte && c.Pasaporte.toLowerCase().includes(b))
        );
    }
    if (ClientesModule.filtros.vendedor) {
        clientes = clientes.filter(c => c.vendedor_id == ClientesModule.filtros.vendedor);
    }
    if (ClientesModule.filtros.periodo !== 'todos') {
        const now = new Date();
        let limit;
        switch (ClientesModule.filtros.periodo) {
            case 'mes':
                limit = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case 'trimestre':
                limit = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case 'año':
                limit = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
        }
        if (limit) {
            clientes = clientes.filter(c => c.fecha_ultima_venta && new Date(c.fecha_ultima_venta) >= limit);
        }
    }
    return clientes;
}

// ===== ESTADÍSTICAS =====
function updateClientesStats() {
    const clientesFiltrados = filtrarClientes();
    const totalClientes = ClientesModule.clientes.length;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const clientesActivos = ClientesModule.clientes.filter(c => c.fecha_ultima_venta && new Date(c.fecha_ultima_venta) >= sixMonthsAgo).length;
    const facturacionTotal = ClientesModule.clientes.reduce((sum, c) => sum + (c.total_compras || 0), 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const nuevosMes = ClientesModule.clientes.filter(c => c.created_at && new Date(c.created_at) >= startOfMonth).length;
    const elements = {
        'total-clientes': totalClientes.toString(),
        'clientes-activos': clientesActivos.toString(),
        'facturacion-total': formatCurrency(facturacionTotal),
        'nuevos-mes': nuevosMes.toString()
    };
    Object.entries(elements).forEach(([id,val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}

// ===== MODAL =====
function showClienteModal(cliente=null) {
    const modal = document.getElementById('cliente-modal');
    const title = document.getElementById('cliente-modal-title');
    if (!modal) return;
    ClientesModule.currentCliente = cliente;
    if (cliente) {
        title.textContent = 'Editar Cliente';
        fillClienteForm(cliente);
    } else {
        title.textContent = 'Nuevo Cliente';
        clearClienteForm();
    }
    modal.style.display = 'flex';
    setTimeout(() => { document.getElementById('modal-cliente-nombre')?.focus(); }, 100);
}

function hideClienteModal() {
    const modal = document.getElementById('cliente-modal');
    if (modal) modal.style.display = 'none';
    ClientesModule.currentCliente = null;
}

function fillClienteForm(cliente) {
    const [nombre, ...apellidos] = (cliente.nombre || '').split(' ');
    const fields = {
        'modal-cliente-nombre': nombre,
        'modal-cliente-apellido': apellidos.join(' '),
        'modal-cliente-email': cliente.email,
        'modal-cliente-telefono': cliente.telefono,
        'modal-cliente-vendedor': cliente.vendedor_id,
        'modal-cliente-dni': cliente.DNI,
        'modal-cliente-dni-exp': cliente.dni_expiracion,
        'modal-cliente-pasaporte': cliente.Pasaporte,
        'modal-cliente-pasaporte-exp': cliente.pasaporte_expiracion,
        'modal-cliente-direccion': cliente.direccion,
        'modal-cliente-ciudad': cliente.ciudad,
        'modal-cliente-pais': cliente.pais
    };
    Object.entries(fields).forEach(([id,val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    });
}

function clearClienteForm() {
    const form = document.getElementById('cliente-form');
    if (form) form.reset();
    const pais = document.getElementById('modal-cliente-pais');
    if (pais) pais.value = 'Argentina';
}

// ===== GUARDAR CLIENTE =====
async function saveCliente() {
    try {
        const clienteData = getClienteFormData();
        if (!validateClienteData(clienteData)) return;
        window.NTS_UTILS?.showLoader('Guardando cliente...');
        const { supabase, isSupabaseConnected } = window.NTS_CONFIG || {};
        if (!isSupabaseConnected || !supabase) {
            if (ClientesModule.currentCliente) {
                updateClienteLocally(clienteData);
            } else {
                createClienteLocally(clienteData);
            }
        } else {
            if (ClientesModule.currentCliente) {
                await updateClienteInDB(clienteData);
            } else {
                await createClienteInDB(clienteData);
            }
        }
        hideClienteModal();
        showNotification('Cliente guardado correctamente', 'success');
        await renderClientesTable();
        updateClientesStats();
    } catch (error) {
        console.error('❌ Error guardando cliente:', error);
        showNotification('Error guardando cliente', 'error');
    } finally {
        window.NTS_UTILS?.hideLoader();
    }
}

function getClienteFormData() {
    const nombre = document.getElementById('modal-cliente-nombre')?.value.trim();
    const apellido = document.getElementById('modal-cliente-apellido')?.value.trim();
    return {
        id: ClientesModule.currentCliente?.id,
        nombre: [nombre, apellido].join(' '),
        email: document.getElementById('modal-cliente-email')?.value.trim(),
        telefono: document.getElementById('modal-cliente-telefono')?.value.trim(),
        vendedor_id: document.getElementById('modal-cliente-vendedor')?.value || null,
        DNI: document.getElementById('modal-cliente-dni')?.value.trim(),
        dni_expiracion: document.getElementById('modal-cliente-dni-exp')?.value || null,
        Pasaporte: document.getElementById('modal-cliente-pasaporte')?.value.trim(),
        pasaporte_expiracion: document.getElementById('modal-cliente-pasaporte-exp')?.value || null,
        direccion: document.getElementById('modal-cliente-direccion')?.value.trim(),
        ciudad: document.getElementById('modal-cliente-ciudad')?.value.trim(),
        pais: document.getElementById('modal-cliente-pais')?.value.trim() || 'Argentina'
    };
}

function validateClienteData(data) {
    const nombre = document.getElementById('modal-cliente-nombre')?.value.trim();
    const apellido = document.getElementById('modal-cliente-apellido')?.value.trim();
    if (!nombre || !apellido) {
        showNotification('Ingrese nombre y apellido del cliente', 'warning');
        return false;
    }
    return true;
}

async function createClienteInDB(data) {
    const { supabase } = window.NTS_CONFIG || {};
    if (!supabase) throw new Error('Supabase no disponible');
    const { data: nuevo, error } = await supabase.from('clientes').insert(data).select().single();
    if (error || !nuevo) throw error || new Error('No se pudo crear cliente');
    ClientesModule.clientes.unshift(nuevo);
}

async function updateClienteInDB(data) {
    const { supabase } = window.NTS_CONFIG || {};
    const { error } = await supabase.from('clientes').update(data).eq('id', data.id);
    if (error) throw error;
    const idx = ClientesModule.clientes.findIndex(c => c.id === data.id);
    if (idx !== -1) ClientesModule.clientes[idx] = { ...ClientesModule.clientes[idx], ...data };
}

function createClienteLocally(data) {
    data.id = Date.now();
    ClientesModule.clientes.unshift(data);
}

function updateClienteLocally(data) {
    const idx = ClientesModule.clientes.findIndex(c => c.id === data.id);
    if (idx !== -1) ClientesModule.clientes[idx] = { ...ClientesModule.clientes[idx], ...data };
}

function exportarClientes() {
    showNotification('Función de exportación no implementada', 'info');
}

function limpiarFiltros() {
    ClientesModule.filtros = { busqueda: '', vendedor: '', periodo: 'todos' };
    const buscarInput = document.getElementById('buscar-cliente');
    const vendedorFilter = document.getElementById('filtro-vendedor');
    const periodoFilter = document.getElementById('filtro-periodo');
    if (buscarInput) buscarInput.value = '';
    if (vendedorFilter) vendedorFilter.value = '';
    if (periodoFilter) periodoFilter.value = 'todos';
    renderClientesTable();
    updateClientesStats();
}

function editarCliente(id) {
    const cliente = ClientesModule.clientes.find(c => c.id === id);
    if (cliente) showClienteModal(cliente);
}

function verHistorialCliente(id) {
    showNotification('Historial no implementado', 'info');
}

function crearVentaParaCliente(id) {
    showNotification('Creación de venta desde cliente no implementada', 'info');
}

function getDocumentosDisplay(cliente) {
    const partes = [];
    if (cliente.DNI) partes.push(`DNI: ${cliente.DNI}${cliente.dni_expiracion ? ` (venc. ${formatDate(cliente.dni_expiracion)})` : ''}`);
    if (cliente.Pasaporte) partes.push(`Pasaporte: ${cliente.Pasaporte}${cliente.pasaporte_expiracion ? ` (venc. ${formatDate(cliente.pasaporte_expiracion)})` : ''}`);
    return partes.length ? partes.join('<br>') : '-';
}

function formatCurrency(num) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(num);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('es-AR');
}

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Exponer módulo globalmente
window.ClientesModule = ClientesModule;
window.initClientesModule = initClientesModule;
