// 📋 MÓDULO DE VENTAS - GESTIÓN COMPLETA
console.log('📋 Cargando módulo de ventas...');

// ===== ESTADO DEL MÓDULO =====
const VentasModule = {
    ventas: [],
    clientes: [],
    vendedores: [],
    proveedores: [],
    servicios: [],
    currentVenta: null,
    currentStep: 1,
    isInitialized: false,
    filtros: {
        busqueda: '',
        cliente: '',
        estado: '',
        fechaDesde: '',
        fechaHasta: '',
        fechaRelativa: ''
    }
};

// ===== INICIALIZACIÓN =====
async function initVentasModule() {
    console.log('🔧 Inicializando módulo de ventas...');
    
    if (VentasModule.isInitialized) {
        console.log('⚠️ Módulo ya inicializado');
        return;
    }

    try {
        await loadVentasData();
        setupVentasUI();
        setupVentasEvents();
        await renderVentasTable();
        updateVentasStats();
        VentasModule.isInitialized = true;
        console.log('✅ Módulo de ventas inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando módulo de ventas:', error);
        showNotification('Error cargando módulo de ventas', 'error');
    }
}

// ===== CARGAR DATOS =====
async function loadVentasData() {
    const { supabase, isSupabaseConnected } = window.NTS_CONFIG || {};
    
    if (!isSupabaseConnected || !supabase) {
        console.log('⚠️ Supabase no disponible - usando datos demo');
        loadMockVentasData();
        return;
    }

    try {
        console.log('📊 Cargando datos desde Supabase...');
        
        // Cargar ventas con relaciones
        const { data: ventas, error: ventasError } = await supabase
            .from('ventas')
            .select(`
                id, numero_venta, fecha_venta, fecha_inicio_viaje, fecha_fin_viaje,
                subtotal, descuentos, total_final, total_pagado, estado, estado_pago,
                observaciones, created_at,
                clientes (id, nombre, email, telefono),
                vendedores (id, nombre, codigo_vendedor)
            `)
            .order('created_at', { ascending: false });

        if (ventasError) throw ventasError;

        // Cargar clientes
        const { data: clientes, error: clientesError } = await supabase
            .from('clientes')
            .select('id, nombre, email, telefono')
            .order('nombre');

        if (clientesError) throw clientesError;

        // Cargar vendedores
        const { data: vendedores, error: vendedoresError } = await supabase
            .from('vendedores')
            .select('id, nombre, codigo_vendedor, activo')
            .eq('activo', true)
            .order('nombre');

        if (vendedoresError) throw vendedoresError;

        VentasModule.ventas = ventas || [];
        VentasModule.clientes = clientes || [];
        VentasModule.vendedores = vendedores || [];

        console.log('✅ Datos cargados:', {
            ventas: VentasModule.ventas.length,
            clientes: VentasModule.clientes.length,
            vendedores: VentasModule.vendedores.length
        });

    } catch (error) {
        console.error('❌ Error cargando datos desde Supabase:', error);
        loadMockVentasData();
    }
}

function loadMockVentasData() {
    VentasModule.ventas = [
        {
            id: 1,
            numero_venta: 'NTS-2024-001',
            fecha_venta: '2024-01-15',
            fecha_inicio_viaje: '2024-02-01',
            fecha_fin_viaje: '2024-02-10',
            subtotal: 125000,
            descuentos: 5000,
            total_final: 120000,
            total_pagado: 60000,
            estado: 'confirmada',
            estado_pago: 'parcialmente_pagado',
            observaciones: 'Viaje familiar a Europa',
            created_at: '2024-01-15T10:30:00Z',
            clientes: { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '+54 9 11 1234-5678' },
            vendedores: { id: 1, nombre: 'Ana García', codigo_vendedor: 'V001' }
        },
        {
            id: 2,
            numero_venta: 'NTS-2024-002',
            fecha_venta: '2024-01-10',
            fecha_inicio_viaje: '2024-03-15',
            fecha_fin_viaje: '2024-03-22',
            subtotal: 85000,
            descuentos: 0,
            total_final: 85000,
            total_pagado: 85000,
            estado: 'finalizada',
            estado_pago: 'pagado_completo',
            observaciones: 'Luna de miel en Caribe',
            created_at: '2024-01-10T14:20:00Z',
            clientes: { id: 2, nombre: 'María González', email: 'maria@email.com', telefono: '+54 9 11 9876-5432' },
            vendedores: { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002' }
        }
    ];

    VentasModule.clientes = [
        { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '+54 9 11 1234-5678' },
        { id: 2, nombre: 'María González', email: 'maria@email.com', telefono: '+54 9 11 9876-5432' }
    ];

    VentasModule.vendedores = [
        { id: 1, nombre: 'Ana García', codigo_vendedor: 'V001' },
        { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002' }
    ];

    console.log('✅ Datos demo cargados');
}

// ===== CONFIGURAR INTERFAZ =====
function setupVentasUI() {
    console.log('🎨 Configurando interfaz de ventas...');
    
    const ventasContent = document.getElementById('ventas');
    if (!ventasContent) return;

    ventasContent.innerHTML = getVentasHTML();
    setupVentasFilters();
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function getVentasHTML() {
    return `
        <div class="page-header">
            <div class="page-title">
                <h2>Gestión de Ventas</h2>
                <p>Administrar todas las ventas del sistema</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" id="export-ventas">
                    <i data-lucide="download"></i>
                    Exportar
                </button>
                <button class="btn btn-primary" onclick="showTab('nueva-venta')">
                    <i data-lucide="plus"></i>
                    Nueva Venta
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="dashboard-card" style="margin-bottom: var(--spacing-xl);">
            <div class="card-content">
                <div class="form-grid" style="grid-template-columns: 2fr 1fr 1fr 1fr auto;">
                    <div class="form-group">
                        <label for="buscar-venta">Buscar Venta</label>
                        <input type="text" id="buscar-venta" class="form-control" placeholder="Número, cliente, observaciones...">
                    </div>
                    <div class="form-group">
                        <label for="filtro-cliente-venta">Cliente</label>
                        <select id="filtro-cliente-venta" class="form-control">
                            <option value="">Todos los clientes</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="filtro-estado-venta">Estado</label>
                        <select id="filtro-estado-venta" class="form-control">
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="cancelada">Cancelada</option>
                            <option value="finalizada">Finalizada</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="filtro-fecha-venta">Período</label>
                        <select id="filtro-fecha-venta" class="form-control">
                            <option value="">Todas las fechas</option>
                            <option value="7">Últimos 7 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="90">Últimos 90 días</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button class="btn btn-secondary" id="limpiar-filtros-ventas">
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
                <div class="stat-icon"><i data-lucide="shopping-cart"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="total-ventas-count">0</div>
                    <div class="stat-label">Total Ventas</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon"><i data-lucide="dollar-sign"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="facturacion-ventas">$0</div>
                    <div class="stat-label">Facturación Total</div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon"><i data-lucide="clock"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="ventas-pendientes">0</div>
                    <div class="stat-label">Pendientes</div>
                </div>
            </div>
            <div class="stat-card info">
                <div class="stat-icon"><i data-lucide="check-circle"></i></div>
                <div class="stat-content">
                    <div class="stat-value" id="ventas-finalizadas">0</div>
                    <div class="stat-label">Finalizadas</div>
                </div>
            </div>
        </div>

        <!-- Tabla de Ventas -->
        <div class="dashboard-card">
            <div class="card-header">
                <h3><i data-lucide="list"></i> Lista de Ventas</h3>
                <div class="card-actions">
                    <span id="ventas-count">0 ventas</span>
                </div>
            </div>
            <div class="card-content">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--gray-50); border-bottom: 1px solid var(--gray-200);">
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Número</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Cliente</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Fecha Venta</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Viaje</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Total</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Estado</th>
                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Pago</th>
                                <th style="padding: var(--spacing-md); text-align: center; font-weight: 600;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="ventas-table-body"></tbody>
                    </table>
                </div>
                <div id="ventas-empty-state" class="empty-state" style="display:none;">
                    <i data-lucide="shopping-cart"></i>
                    <h3>No hay ventas</h3>
                    <p>No se encontraron ventas con los filtros aplicados</p>
                    <button class="btn btn-primary" onclick="showTab('nueva-venta')">
                        <i data-lucide="plus"></i>
                        Crear Primera Venta
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Detalle Venta -->
        <div id="venta-detalle-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content" style="max-width:900px;">
                <div class="modal-header">
                    <h3 id="venta-detalle-title">Detalle de Venta</h3>
                    <button class="btn-icon" id="close-venta-detalle"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" id="venta-detalle-content">
                    <!-- Contenido se carga dinámicamente -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="close-venta-detalle-btn">Cerrar</button>
                    <button type="button" class="btn btn-primary" id="edit-venta-btn">
                        <i data-lucide="edit"></i>
                        Editar Venta
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== CONFIGURAR FILTROS =====
function setupVentasFilters() {
    const clienteSelect = document.getElementById('filtro-cliente-venta');
    if (clienteSelect) {
        clienteSelect.innerHTML = '<option value="">Todos los clientes</option>';
        VentasModule.clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nombre;
            clienteSelect.appendChild(option);
        });
    }
}

// ===== CONFIGURAR EVENTOS =====
function setupVentasEvents() {
    console.log('🎯 Configurando eventos de ventas...');

    // Filtros
    const buscarInput = document.getElementById('buscar-venta');
    const clienteFilter = document.getElementById('filtro-cliente-venta');
    const estadoFilter = document.getElementById('filtro-estado-venta');
    const fechaFilter = document.getElementById('filtro-fecha-venta');
    const limpiarBtn = document.getElementById('limpiar-filtros-ventas');

    if (buscarInput) {
        buscarInput.addEventListener('input', debounce(() => {
            VentasModule.filtros.busqueda = buscarInput.value;
            renderVentasTable();
        }, 300));
    }

    if (clienteFilter) {
        clienteFilter.addEventListener('change', () => {
            VentasModule.filtros.cliente = clienteFilter.value;
            renderVentasTable();
        });
    }

    if (estadoFilter) {
        estadoFilter.addEventListener('change', () => {
            VentasModule.filtros.estado = estadoFilter.value;
            renderVentasTable();
        });
    }

    if (fechaFilter) {
        fechaFilter.addEventListener('change', () => {
            VentasModule.filtros.fechaRelativa = fechaFilter.value;
            renderVentasTable();
        });
    }

    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', () => {
            limpiarFiltrosVentas();
        });
    }

    // Botones
    const exportBtn = document.getElementById('export-ventas');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportarVentas());
    }

    // Modal eventos
    setupVentaModalEvents();
}

function setupVentaModalEvents() {
    const modal = document.getElementById('venta-detalle-modal');
    const closeBtn = document.getElementById('close-venta-detalle');
    const closeBtnFooter = document.getElementById('close-venta-detalle-btn');
    const editBtn = document.getElementById('edit-venta-btn');

    if (closeBtn) closeBtn.addEventListener('click', () => hideVentaModal());
    if (closeBtnFooter) closeBtnFooter.addEventListener('click', () => hideVentaModal());
    if (editBtn) editBtn.addEventListener('click', () => editarVenta());

    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) hideVentaModal();
        });
    }
}

// ===== RENDERIZAR TABLA =====
async function renderVentasTable() {
    const tbody = document.getElementById('ventas-table-body');
    const emptyState = document.getElementById('ventas-empty-state');
    const countElement = document.getElementById('ventas-count');

    if (!tbody) return;

    const ventasFiltradas = filtrarVentas();

    if (ventasFiltradas.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (countElement) countElement.textContent = '0 ventas';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (countElement) countElement.textContent = `${ventasFiltradas.length} venta${ventasFiltradas.length !== 1 ? 's' : ''}`;

    tbody.innerHTML = ventasFiltradas.map(venta => {
        const { formatCurrency, formatDate, createEnumBadge } = window.NTS_CONFIG || {};
        
        const cliente = venta.clientes ? venta.clientes.nombre : 'Sin cliente';
        const fechaVenta = formatDate ? formatDate(venta.fecha_venta) : venta.fecha_venta;
        const fechaViaje = venta.fecha_inicio_viaje ? (formatDate ? formatDate(venta.fecha_inicio_viaje) : venta.fecha_inicio_viaje) : '-';
        const total = formatCurrency ? formatCurrency(venta.total_final) : `$${venta.total_final}`;
        
        const estadoBadge = createEnumBadge ? createEnumBadge('ESTADO_VENTA', venta.estado) : venta.estado;
        const pagoBadge = createEnumBadge ? createEnumBadge('ESTADO_PAGO', venta.estado_pago) : venta.estado_pago;

        return `
            <tr style="border-bottom:1px solid var(--gray-200);">
                <td style="padding:var(--spacing-md);">
                    <div style="font-weight:600; color:var(--primary-600);">${venta.numero_venta}</div>
                </td>
                <td style="padding:var(--spacing-md);">
                    <div style="font-weight:500;">${cliente}</div>
                    <div style="font-size:var(--font-size-sm); color:var(--gray-600);">${venta.clientes?.email || ''}</div>
                </td>
                <td style="padding:var(--spacing-md);">${fechaVenta}</td>
                <td style="padding:var(--spacing-md);">${fechaViaje}</td>
                <td style="padding:var(--spacing-md);">
                    <div style="font-weight:600; color:var(--success-600);">${total}</div>
                </td>
                <td style="padding:var(--spacing-md);">${estadoBadge}</td>
                <td style="padding:var(--spacing-md);">${pagoBadge}</td>
                <td style="padding:var(--spacing-md); text-align:center;">
                    <div style="display:flex; gap:var(--spacing-xs); justify-content:center;">
                        <button class="btn-icon" onclick="verDetalleVenta(${venta.id})" title="Ver Detalle">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn-icon" onclick="editarVenta(${venta.id})" title="Editar">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn-icon" onclick="duplicarVenta(${venta.id})" title="Duplicar">
                            <i data-lucide="copy"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

// ===== FILTRAR VENTAS =====
function filtrarVentas() {
    let ventas = [...VentasModule.ventas];

    // Filtro de búsqueda
    if (VentasModule.filtros.busqueda) {
        const busqueda = VentasModule.filtros.busqueda.toLowerCase();
        ventas = ventas.filter(v =>
            v.numero_venta.toLowerCase().includes(busqueda) ||
            (v.clientes?.nombre && v.clientes.nombre.toLowerCase().includes(busqueda)) ||
            (v.observaciones && v.observaciones.toLowerCase().includes(busqueda))
        );
    }

    // Filtro de cliente
    if (VentasModule.filtros.cliente) {
        ventas = ventas.filter(v => v.clientes?.id == VentasModule.filtros.cliente);
    }

    // Filtro de estado
    if (VentasModule.filtros.estado) {
        ventas = ventas.filter(v => v.estado === VentasModule.filtros.estado);
    }

    // Filtro de fecha relativa
    if (VentasModule.filtros.fechaRelativa) {
        const dias = parseInt(VentasModule.filtros.fechaRelativa);
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);
        
        ventas = ventas.filter(v => new Date(v.fecha_venta) >= fechaLimite);
    }

    return ventas;
}

// ===== ESTADÍSTICAS =====
function updateVentasStats() {
    const ventasFiltradas = filtrarVentas();
    
    const totalVentas = VentasModule.ventas.length;
    const facturacionTotal = VentasModule.ventas.reduce((sum, v) => sum + (v.total_final || 0), 0);
    const ventasPendientes = VentasModule.ventas.filter(v => v.estado === 'pendiente').length;
    const ventasFinalizadas = VentasModule.ventas.filter(v => v.estado === 'finalizada').length;

    const { formatCurrency } = window.NTS_UTILS || {};

    const elements = {
        'total-ventas-count': totalVentas.toString(),
        'facturacion-ventas': formatCurrency ? formatCurrency(facturacionTotal) : `$${facturacionTotal}`,
        'ventas-pendientes': ventasPendientes.toString(),
        'ventas-finalizadas': ventasFinalizadas.toString()
    };

    Object.entries(elements).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}

// ===== FUNCIONES DE ACCIÓN =====
function verDetalleVenta(id) {
    const venta = VentasModule.ventas.find(v => v.id === id);
    if (!venta) return;

    VentasModule.currentVenta = venta;
    showVentaModal(venta);
}

function showVentaModal(venta) {
    const modal = document.getElementById('venta-detalle-modal');
    const title = document.getElementById('venta-detalle-title');
    const content = document.getElementById('venta-detalle-content');

    if (!modal || !content) return;

    title.textContent = `Venta ${venta.numero_venta}`;
    content.innerHTML = getVentaDetalleHTML(venta);

    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
}

function getVentaDetalleHTML(venta) {
    const { formatCurrency, formatDate } = window.NTS_UTILS || {};
    
    return `
        <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
            <div class="form-group">
                <label>Número de Venta</label>
                <div style="font-weight:600; color:var(--primary-600);">${venta.numero_venta}</div>
            </div>
            <div class="form-group">
                <label>Cliente</label>
                <div>${venta.clientes?.nombre || 'Sin cliente'}</div>
            </div>
            <div class="form-group">
                <label>Fecha de Venta</label>
                <div>${formatDate ? formatDate(venta.fecha_venta) : venta.fecha_venta}</div>
            </div>
            <div class="form-group">
                <label>Fecha de Viaje</label>
                <div>${venta.fecha_inicio_viaje ? (formatDate ? formatDate(venta.fecha_inicio_viaje) : venta.fecha_inicio_viaje) : '-'}</div>
            </div>
            <div class="form-group">
                <label>Subtotal</label>
                <div>${formatCurrency ? formatCurrency(venta.subtotal) : `$${venta.subtotal}`}</div>
            </div>
            <div class="form-group">
                <label>Descuentos</label>
                <div>${formatCurrency ? formatCurrency(venta.descuentos || 0) : `$${venta.descuentos || 0}`}</div>
            </div>
            <div class="form-group">
                <label>Total Final</label>
                <div style="font-weight:600; color:var(--success-600);">${formatCurrency ? formatCurrency(venta.total_final) : `$${venta.total_final}`}</div>
            </div>
            <div class="form-group">
                <label>Total Pagado</label>
                <div>${formatCurrency ? formatCurrency(venta.total_pagado || 0) : `$${venta.total_pagado || 0}`}</div>
            </div>
            <div class="form-group">
                <label>Estado</label>
                <div>${venta.estado}</div>
            </div>
            <div class="form-group">
                <label>Estado de Pago</label>
                <div>${venta.estado_pago}</div>
            </div>
            <div class="form-group full-width">
                <label>Observaciones</label>
                <div>${venta.observaciones || 'Sin observaciones'}</div>
            </div>
        </div>
    `;
}

function hideVentaModal() {
    const modal = document.getElementById('venta-detalle-modal');
    if (modal) modal.style.display = 'none';
    VentasModule.currentVenta = null;
}

function editarVenta(id) {
    if (id) {
        const venta = VentasModule.ventas.find(v => v.id === id);
        if (venta) {
            VentasModule.currentVenta = venta;
        }
    }
    
    hideVentaModal();
    showTab('nueva-venta');
    showNotification('🔧 Función de edición en desarrollo', 'info');
}

function duplicarVenta(id) {
    showNotification('🔧 Función de duplicación en desarrollo', 'info');
}

function exportarVentas() {
    const { exportToCSV } = window.NTS_UTILS || {};
    
    if (!exportToCSV) {
        showNotification('Función de exportación no disponible', 'warning');
        return;
    }

    const ventasFiltradas = filtrarVentas();
    const datosExport = ventasFiltradas.map(venta => ({
        'Número': venta.numero_venta,
        'Cliente': venta.clientes?.nombre || '',
        'Fecha Venta': venta.fecha_venta,
        'Fecha Viaje': venta.fecha_inicio_viaje || '',
        'Total': venta.total_final,
        'Estado': venta.estado,
        'Estado Pago': venta.estado_pago,
        'Observaciones': venta.observaciones || ''
    }));

    exportToCSV(datosExport, 'ventas.csv');
    showNotification('✅ Ventas exportadas correctamente', 'success');
}

function limpiarFiltrosVentas() {
    VentasModule.filtros = {
        busqueda: '',
        cliente: '',
        estado: '',
        fechaDesde: '',
        fechaHasta: '',
        fechaRelativa: ''
    };

    const buscarInput = document.getElementById('buscar-venta');
    const clienteFilter = document.getElementById('filtro-cliente-venta');
    const estadoFilter = document.getElementById('filtro-estado-venta');
    const fechaFilter = document.getElementById('filtro-fecha-venta');

    if (buscarInput) buscarInput.value = '';
    if (clienteFilter) clienteFilter.value = '';
    if (estadoFilter) estadoFilter.value = '';
    if (fechaFilter) fechaFilter.value = '';

    renderVentasTable();
    updateVentasStats();
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
window.VentasModule = VentasModule;
window.initVentasModule = initVentasModule;
window.verDetalleVenta = verDetalleVenta;
window.editarVenta = editarVenta;
window.duplicarVenta = duplicarVenta;

console.log('✅ Módulo de ventas cargado correctamente');