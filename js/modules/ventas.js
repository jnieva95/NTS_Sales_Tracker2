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
                id, numero_venta, fecha_venta, fecha_viaje_inicio, fecha_viaje_fin,
                total_final, total_pagado, saldo_pendiente, estado, estado_pago,
                observaciones, created_at,
                clientes (id, nombre, email, telefono),
                vendedores (id, nombre, codigo_vendedor)
            `)
            .order('created_at', { ascending: false });

        if (ventasError) throw ventasError;

        // Cargar clientes
        const { data: clientes, error: clientesError } = await supabase
            .from('clientes')
            .select(`
                id, nombre, email, telefono, DNI, dni_expiracion,
                Pasaporte, pasaporte_expiracion, direccion, ciudad,
                pais, vendedor_id, created_at,
                vendedores (id, nombre, codigo_vendedor)
            `)
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
            fecha_viaje_inicio: '2024-02-01',
            fecha_viaje_fin: '2024-02-10',
            total_final: 120000,
            total_pagado: 60000,
            saldo_pendiente: 60000,
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
            fecha_viaje_inicio: '2024-03-15',
            fecha_viaje_fin: '2024-03-22',
            total_final: 85000,
            total_pagado: 85000,
            saldo_pendiente: 0,
            estado: 'finalizada',
            estado_pago: 'pagado_completo',
            observaciones: 'Luna de miel en Caribe',
            created_at: '2024-01-10T14:20:00Z',
            clientes: { id: 2, nombre: 'María González', email: 'maria@email.com', telefono: '+54 9 11 9876-5432' },
            vendedores: { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002' }
        }
    ];

    VentasModule.clientes = [
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
            created_at: '2023-08-22T14:20:00Z',
            vendedores: { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002' }
        }
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
                <button class="btn btn-secondary" id="gestionar-clientes-btn">
                    <i data-lucide="users"></i>
                    Gestionar Clientes
                </button>
                <button class="btn btn-secondary" id="export-ventas">
                    <i data-lucide="download"></i>
                    Exportar
                </button>
                <button class="btn btn-primary" id="crear-venta-btn">
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
                    <button class="btn btn-primary" id="crear-primera-venta-btn">
                        <i data-lucide="plus"></i>
                        Crear Primera Venta
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Gestión de Clientes -->
        <div id="clientes-gestion-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content" style="max-width:1200px; max-height:90vh;">
                <div class="modal-header">
                    <h3>Gestión de Clientes</h3>
                    <button class="btn-icon" id="close-clientes-gestion"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" style="overflow-y: auto;">
                    <div class="page-actions" style="margin-bottom: var(--spacing-lg);">
                        <button class="btn btn-primary" id="nuevo-cliente-desde-ventas">
                            <i data-lucide="user-plus"></i>
                            Nuevo Cliente
                        </button>
                    </div>
                    
                    <!-- Filtros de clientes -->
                    <div class="form-grid" style="grid-template-columns: 2fr 1fr auto; margin-bottom: var(--spacing-lg);">
                        <div class="form-group">
                            <label for="buscar-cliente-modal">Buscar Cliente</label>
                            <input type="text" id="buscar-cliente-modal" class="form-control" placeholder="Nombre, email, teléfono...">
                        </div>
                        <div class="form-group">
                            <label for="filtro-vendedor-modal">Vendedor</label>
                            <select id="filtro-vendedor-modal" class="form-control">
                                <option value="">Todos los vendedores</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <button class="btn btn-secondary" id="limpiar-filtros-clientes-modal">
                                <i data-lucide="x"></i>
                                Limpiar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Tabla de clientes -->
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: var(--gray-50); border-bottom: 1px solid var(--gray-200);">
                                    <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Cliente</th>
                                    <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Contacto</th>
                                    <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Documentos</th>
                                    <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Vendedor</th>
                                    <th style="padding: var(--spacing-md); text-align: center; font-weight: 600;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="clientes-modal-table-body"></tbody>
                        </table>
                    </div>
                    
                    <div id="clientes-modal-empty-state" class="empty-state" style="display:none;">
                        <i data-lucide="users"></i>
                        <h3>No hay clientes</h3>
                        <p>No se encontraron clientes con los filtros aplicados</p>
                        <button class="btn btn-primary" id="crear-primer-cliente-modal">
                            <i data-lucide="user-plus"></i>
                            Crear Primer Cliente
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="close-clientes-gestion-btn">Cerrar</button>
                </div>
            </div>
        </div>

        <!-- Modal Cliente (Crear/Editar) -->
        <div id="cliente-ventas-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content" style="max-width:800px;">
                <div class="modal-header">
                    <h3 id="cliente-ventas-modal-title">Nuevo Cliente</h3>
                    <button class="btn-icon" id="close-cliente-ventas-modal"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body">
                    <form id="cliente-ventas-form">
                        <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                            <div class="form-group">
                                <label for="ventas-cliente-nombre">Nombre *</label>
                                <input type="text" id="ventas-cliente-nombre" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-apellido">Apellido *</label>
                                <input type="text" id="ventas-cliente-apellido" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-email">Email</label>
                                <input type="email" id="ventas-cliente-email" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-telefono">Teléfono</label>
                                <input type="tel" id="ventas-cliente-telefono" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-vendedor">Vendedor Asignado</label>
                                <select id="ventas-cliente-vendedor" class="form-control">
                                    <option value="">Sin asignar</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-dni">DNI</label>
                                <input type="text" id="ventas-cliente-dni" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-dni-exp">DNI Vencimiento</label>
                                <input type="date" id="ventas-cliente-dni-exp" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-pasaporte">Pasaporte</label>
                                <input type="text" id="ventas-cliente-pasaporte" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-pasaporte-exp">Pasaporte Vencimiento</label>
                                <input type="date" id="ventas-cliente-pasaporte-exp" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-direccion">Dirección</label>
                                <input type="text" id="ventas-cliente-direccion" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-ciudad">Ciudad</label>
                                <input type="text" id="ventas-cliente-ciudad" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="ventas-cliente-pais">País</label>
                                <input type="text" id="ventas-cliente-pais" class="form-control" value="Argentina">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-cliente-ventas">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="save-cliente-ventas">
                        <i data-lucide="save"></i>
                        Guardar Cliente
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
    
    // Configurar filtros del modal de clientes
    const vendedorModalSelect = document.getElementById('filtro-vendedor-modal');
    if (vendedorModalSelect) {
        vendedorModalSelect.innerHTML = '<option value="">Todos los vendedores</option>';
        VentasModule.vendedores.forEach(vendedor => {
            const option = document.createElement('option');
            option.value = vendedor.id;
            option.textContent = `${vendedor.nombre} (${vendedor.codigo_vendedor})`;
            vendedorModalSelect.appendChild(option);
        });
    }
    
    // Configurar select de vendedores en el formulario de cliente
    const clienteVendedorSelect = document.getElementById('ventas-cliente-vendedor');
    if (clienteVendedorSelect) {
        clienteVendedorSelect.innerHTML = '<option value="">Sin asignar</option>';
        VentasModule.vendedores.forEach(vendedor => {
            const option = document.createElement('option');
            option.value = vendedor.id;
            option.textContent = `${vendedor.nombre} (${vendedor.codigo_vendedor})`;
            clienteVendedorSelect.appendChild(option);
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
    const crearVentaBtn = document.getElementById('crear-venta-btn');
    const crearPrimeraVentaBtn = document.getElementById('crear-primera-venta-btn');
    const gestionarClientesBtn = document.getElementById('gestionar-clientes-btn');
    const exportBtn = document.getElementById('export-ventas');
    
    if (crearVentaBtn) {
        crearVentaBtn.addEventListener('click', () => {
            if (typeof showTab === 'function') {
                showTab('nueva-venta');
            } else {
                showNotification('Función de nueva venta no disponible', 'warning');
            }
        });
    }
    
    if (crearPrimeraVentaBtn) {
        crearPrimeraVentaBtn.addEventListener('click', () => {
            if (typeof showTab === 'function') {
                showTab('nueva-venta');
            } else {
                showNotification('Función de nueva venta no disponible', 'warning');
            }
        });
    }
    
    if (gestionarClientesBtn) {
        gestionarClientesBtn.addEventListener('click', () => {
            showClientesGestionModal();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportarVentas());
    }

    // Modal eventos
    setupVentaModalEvents();
    setupClientesModalEvents();
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

function setupClientesModalEvents() {
    // Modal de gestión de clientes
    const gestionModal = document.getElementById('clientes-gestion-modal');
    const closeGestionBtn = document.getElementById('close-clientes-gestion');
    const closeGestionBtnFooter = document.getElementById('close-clientes-gestion-btn');
    
    if (closeGestionBtn) closeGestionBtn.addEventListener('click', () => hideClientesGestionModal());
    if (closeGestionBtnFooter) closeGestionBtnFooter.addEventListener('click', () => hideClientesGestionModal());
    
    if (gestionModal) {
        gestionModal.addEventListener('click', e => {
            if (e.target === gestionModal) hideClientesGestionModal();
        });
    }
    
    // Botones de cliente
    const nuevoClienteBtn = document.getElementById('nuevo-cliente-desde-ventas');
    const crearPrimerClienteBtn = document.getElementById('crear-primer-cliente-modal');
    
    if (nuevoClienteBtn) nuevoClienteBtn.addEventListener('click', () => showClienteVentasModal());
    if (crearPrimerClienteBtn) crearPrimerClienteBtn.addEventListener('click', () => showClienteVentasModal());
    
    // Filtros de clientes en modal
    const buscarClienteModal = document.getElementById('buscar-cliente-modal');
    const vendedorModalFilter = document.getElementById('filtro-vendedor-modal');
    const limpiarFiltrosClientesBtn = document.getElementById('limpiar-filtros-clientes-modal');
    
    if (buscarClienteModal) {
        buscarClienteModal.addEventListener('input', debounce(() => {
            renderClientesModalTable();
        }, 300));
    }
    
    if (vendedorModalFilter) {
        vendedorModalFilter.addEventListener('change', () => {
            renderClientesModalTable();
        });
    }
    
    if (limpiarFiltrosClientesBtn) {
        limpiarFiltrosClientesBtn.addEventListener('click', () => {
            limpiarFiltrosClientesModal();
        });
    }
    
    // Modal de cliente (crear/editar)
    const clienteModal = document.getElementById('cliente-ventas-modal');
    const closeClienteBtn = document.getElementById('close-cliente-ventas-modal');
    const cancelClienteBtn = document.getElementById('cancel-cliente-ventas');
    const saveClienteBtn = document.getElementById('save-cliente-ventas');
    
    if (closeClienteBtn) closeClienteBtn.addEventListener('click', () => hideClienteVentasModal());
    if (cancelClienteBtn) cancelClienteBtn.addEventListener('click', () => hideClienteVentasModal());
    if (saveClienteBtn) saveClienteBtn.addEventListener('click', () => saveClienteVentas());
    
    if (clienteModal) {
        clienteModal.addEventListener('click', e => {
            if (e.target === clienteModal) hideClienteVentasModal();
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
        const { createEnumBadge } = window.NTS_CONFIG || {};
        const { formatCurrency, formatDate } = window.NTS_UTILS || {};
        
        const cliente = venta.clientes ? venta.clientes.nombre : 'Sin cliente';
        const fechaVenta = formatDate ? formatDate(venta.fecha_venta) : venta.fecha_venta;
        const fechaViaje = venta.fecha_viaje_inicio ? (formatDate ? formatDate(venta.fecha_viaje_inicio) : venta.fecha_viaje_inicio) : '-';
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
                <div>${venta.fecha_viaje_inicio ? (formatDate ? formatDate(venta.fecha_viaje_inicio) : venta.fecha_viaje_inicio) : '-'}</div>
            </div>
            <div class="form-group">
                <label>Subtotal</label>
                <div>${formatCurrency ? formatCurrency(venta.total_final) : `$${venta.total_final}`}</div>
            </div>
            <div class="form-group">
                <label>Descuentos</label>
                <div>${formatCurrency ? formatCurrency(0) : `$0`}</div>
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

// ===== GESTIÓN DE CLIENTES DESDE VENTAS =====

// Variable para almacenar filtros de clientes en modal
VentasModule.clientesFiltros = {
    busqueda: '',
    vendedor: ''
};

VentasModule.currentClienteVentas = null;

function showClientesGestionModal() {
    const modal = document.getElementById('clientes-gestion-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    renderClientesModalTable();
    
    if (window.lucide) window.lucide.createIcons();
}

function hideClientesGestionModal() {
    const modal = document.getElementById('clientes-gestion-modal');
    if (modal) modal.style.display = 'none';
}

function renderClientesModalTable() {
    const tbody = document.getElementById('clientes-modal-table-body');
    const emptyState = document.getElementById('clientes-modal-empty-state');
    
    if (!tbody) return;
    
    const clientesFiltrados = filtrarClientesModal();
    
    if (clientesFiltrados.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    tbody.innerHTML = clientesFiltrados.map(cliente => {
        const documentos = getDocumentosDisplay(cliente);
        const vendedor = cliente.vendedores ? cliente.vendedores.nombre : 'Sin asignar';
        
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
                <td style="padding:var(--spacing-md); text-align:center;">
                    <div style="display:flex; gap:var(--spacing-xs); justify-content:center;">
                        <button class="btn-icon" onclick="editarClienteVentas(${cliente.id})" title="Editar">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn-icon" onclick="crearVentaParaClienteVentas(${cliente.id})" title="Nueva Venta">
                            <i data-lucide="plus-circle"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    if (window.lucide) window.lucide.createIcons();
}

function filtrarClientesModal() {
    let clientes = [...VentasModule.clientes];
    
    const busqueda = document.getElementById('buscar-cliente-modal')?.value.toLowerCase() || '';
    const vendedor = document.getElementById('filtro-vendedor-modal')?.value || '';
    
    if (busqueda) {
        clientes = clientes.filter(c =>
            c.nombre.toLowerCase().includes(busqueda) ||
            (c.email && c.email.toLowerCase().includes(busqueda)) ||
            (c.telefono && c.telefono.includes(busqueda)) ||
            (c.DNI && c.DNI.includes(busqueda)) ||
            (c.Pasaporte && c.Pasaporte.toLowerCase().includes(busqueda))
        );
    }
    
    if (vendedor) {
        clientes = clientes.filter(c => c.vendedor_id == vendedor);
    }
    
    return clientes;
}

function limpiarFiltrosClientesModal() {
    const buscarInput = document.getElementById('buscar-cliente-modal');
    const vendedorFilter = document.getElementById('filtro-vendedor-modal');
    
    if (buscarInput) buscarInput.value = '';
    if (vendedorFilter) vendedorFilter.value = '';
    
    renderClientesModalTable();
}

function showClienteVentasModal(cliente = null) {
    const modal = document.getElementById('cliente-ventas-modal');
    const title = document.getElementById('cliente-ventas-modal-title');
    
    if (!modal) return;
    
    VentasModule.currentClienteVentas = cliente;
    
    if (cliente) {
        title.textContent = 'Editar Cliente';
        fillClienteVentasForm(cliente);
    } else {
        title.textContent = 'Nuevo Cliente';
        clearClienteVentasForm();
    }
    
    modal.style.display = 'flex';
    setTimeout(() => { document.getElementById('ventas-cliente-nombre')?.focus(); }, 100);
}

function hideClienteVentasModal() {
    const modal = document.getElementById('cliente-ventas-modal');
    if (modal) modal.style.display = 'none';
    VentasModule.currentClienteVentas = null;
}

function fillClienteVentasForm(cliente) {
    const [nombre, ...apellidos] = (cliente.nombre || '').split(' ');
    const fields = {
        'ventas-cliente-nombre': nombre,
        'ventas-cliente-apellido': apellidos.join(' '),
        'ventas-cliente-email': cliente.email,
        'ventas-cliente-telefono': cliente.telefono,
        'ventas-cliente-vendedor': cliente.vendedor_id,
        'ventas-cliente-dni': cliente.DNI,
        'ventas-cliente-dni-exp': cliente.dni_expiracion,
        'ventas-cliente-pasaporte': cliente.Pasaporte,
        'ventas-cliente-pasaporte-exp': cliente.pasaporte_expiracion,
        'ventas-cliente-direccion': cliente.direccion,
        'ventas-cliente-ciudad': cliente.ciudad,
        'ventas-cliente-pais': cliente.pais
    };
    
    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    });
}

function clearClienteVentasForm() {
    const form = document.getElementById('cliente-ventas-form');
    if (form) form.reset();
    const pais = document.getElementById('ventas-cliente-pais');
    if (pais) pais.value = 'Argentina';
}

async function saveClienteVentas() {
    try {
        const clienteData = getClienteVentasFormData();
        if (!validateClienteVentasData(clienteData)) return;
        
        window.NTS_UTILS?.showLoader('Guardando cliente...');
        
        const { supabase, isSupabaseConnected } = window.NTS_CONFIG || {};
        
        if (isSupabaseConnected && supabase) {
            if (VentasModule.currentClienteVentas) {
                await updateClienteVentasInDB(clienteData);
            } else {
                await createClienteVentasInDB(clienteData);
            }
        } else {
            if (VentasModule.currentClienteVentas) {
                updateClienteVentasLocally(clienteData);
            } else {
                createClienteVentasLocally(clienteData);
            }
        }
        
        hideClienteVentasModal();
        showNotification('Cliente guardado correctamente', 'success');
        renderClientesModalTable();
        setupVentasFilters(); // Actualizar filtros de ventas
        
    } catch (error) {
        console.error('❌ Error guardando cliente:', error);
        showNotification('Error guardando cliente', 'error');
    } finally {
        window.NTS_UTILS?.hideLoader();
    }
}

function getClienteVentasFormData() {
    const nombre = document.getElementById('ventas-cliente-nombre')?.value.trim();
    const apellido = document.getElementById('ventas-cliente-apellido')?.value.trim();
    
    return {
        id: VentasModule.currentClienteVentas?.id,
        nombre: [nombre, apellido].join(' '),
        email: document.getElementById('ventas-cliente-email')?.value.trim(),
        telefono: document.getElementById('ventas-cliente-telefono')?.value.trim(),
        vendedor_id: document.getElementById('ventas-cliente-vendedor')?.value || null,
        DNI: document.getElementById('ventas-cliente-dni')?.value.trim(),
        dni_expiracion: document.getElementById('ventas-cliente-dni-exp')?.value || null,
        Pasaporte: document.getElementById('ventas-cliente-pasaporte')?.value.trim(),
        pasaporte_expiracion: document.getElementById('ventas-cliente-pasaporte-exp')?.value || null,
        direccion: document.getElementById('ventas-cliente-direccion')?.value.trim(),
        ciudad: document.getElementById('ventas-cliente-ciudad')?.value.trim(),
        pais: document.getElementById('ventas-cliente-pais')?.value.trim() || 'Argentina'
    };
}

function validateClienteVentasData(data) {
    const nombre = document.getElementById('ventas-cliente-nombre')?.value.trim();
    const apellido = document.getElementById('ventas-cliente-apellido')?.value.trim();
    
    if (!nombre || !apellido) {
        showNotification('Ingrese nombre y apellido del cliente', 'warning');
        return false;
    }
    
    return true;
}

async function createClienteVentasInDB(data) {
    const { supabase } = window.NTS_CONFIG || {};
    if (!supabase) throw new Error('Supabase no disponible');
    
    const { data: nuevo, error } = await supabase
        .from('clientes')
        .insert(data)
        .select()
        .single();
    
    if (error || !nuevo) throw error || new Error('No se pudo crear cliente');
    
    VentasModule.clientes.unshift(nuevo);
}

async function updateClienteVentasInDB(data) {
    const { supabase } = window.NTS_CONFIG || {};
    const { error } = await supabase
        .from('clientes')
        .update(data)
        .eq('id', data.id);
    
    if (error) throw error;
    
    const idx = VentasModule.clientes.findIndex(c => c.id === data.id);
    if (idx !== -1) {
        VentasModule.clientes[idx] = { ...VentasModule.clientes[idx], ...data };
    }
}

function createClienteVentasLocally(data) {
    data.id = Date.now();
    data.created_at = new Date().toISOString();
    VentasModule.clientes.unshift(data);
}

function updateClienteVentasLocally(data) {
    const idx = VentasModule.clientes.findIndex(c => c.id === data.id);
    if (idx !== -1) {
        VentasModule.clientes[idx] = { ...VentasModule.clientes[idx], ...data };
    }
}

function editarClienteVentas(id) {
    const cliente = VentasModule.clientes.find(c => c.id === id);
    if (cliente) showClienteVentasModal(cliente);
}

function crearVentaParaClienteVentas(id) {
    hideClientesGestionModal();
    if (typeof showTab === 'function') {
        showTab('nueva-venta');
        // Aquí podrías preseleccionar el cliente en el formulario de nueva venta
        showNotification(`Cliente seleccionado para nueva venta`, 'success');
    } else {
        showNotification('Función de nueva venta no disponible', 'warning');
    }
}

function getDocumentosDisplay(cliente) {
    const { formatDate } = window.NTS_UTILS || {};
    const partes = [];
    
    if (cliente.DNI) {
        const vencimiento = cliente.dni_expiracion ? 
            ` (venc. ${formatDate ? formatDate(cliente.dni_expiracion) : cliente.dni_expiracion})` : '';
        partes.push(`DNI: ${cliente.DNI}${vencimiento}`);
    }
    
    if (cliente.Pasaporte) {
        const vencimiento = cliente.pasaporte_expiracion ? 
            ` (venc. ${formatDate ? formatDate(cliente.pasaporte_expiracion) : cliente.pasaporte_expiracion})` : '';
        partes.push(`Pasaporte: ${cliente.Pasaporte}${vencimiento}`);
    }
    
    return partes.length ? partes.join('<br>') : '-';
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
window.editarClienteVentas = editarClienteVentas;
window.crearVentaParaClienteVentas = crearVentaParaClienteVentas;

console.log('✅ Módulo de ventas cargado correctamente');