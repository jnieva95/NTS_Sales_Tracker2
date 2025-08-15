// 🚀 APP.JS - APLICACIÓN PRINCIPAL NTS
// Archivo: js/app.js

console.log('🚀 Iniciando aplicación NTS...');

// ===== VARIABLES GLOBALES =====
let currentTab = 'dashboard';
let isLoading = false;
let appData = {
    vendedores: [],
    proveedores: [],
    clientes: [],
    ventas: [],
    serviciosActuales: [] // Para nueva venta
};

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📱 DOM cargado, inicializando sistema...');
    
    try {
        // Mostrar loader
        showLoader('Iniciando sistema NTS...');
        
        // Verificar dependencias
        await checkDependencies();
        
        // Inicializar componentes
        await initializeApp();
        
        // Configurar eventos globales
        setupGlobalEvents();
        
        // Cargar datos iniciales
        await loadInitialData();
        
        // Mostrar dashboard
        showTab('dashboard');
        
        console.log('✅ Sistema NTS iniciado correctamente');
        showNotification('🎉 Sistema NTS listo para usar', 'success');
        
    } catch (error) {
        console.error('❌ Error iniciando aplicación:', error);
        showNotification('❌ Error iniciando el sistema', 'error');
    } finally {
        hideLoader();
    }
});

// ===== VERIFICACIÓN DE DEPENDENCIAS =====
async function checkDependencies() {
    console.log('🔍 Verificando dependencias...');
    
    // Verificar que config.js esté cargado
    if (typeof window.NTS_CONFIG === 'undefined') {
        throw new Error('Config.js no está cargado');
    }
    
    // Verificar conexión a Supabase
    const { isSupabaseConnected } = window.NTS_CONFIG;
    
    if (isSupabaseConnected) {
        console.log('✅ Supabase conectado');
        await testSupabaseConnection();
    } else {
        console.log('⚠️ Supabase no conectado - modo local');
    }
    
    console.log('✅ Dependencias verificadas');
}

// ===== INICIALIZACIÓN DE COMPONENTES =====
async function initializeApp() {
    console.log('🔧 Inicializando componentes...');
    
    // Configurar sistema de pestañas
    setupTabSystem();
    
    // Configurar formularios
    setupForms();
    
    // Configurar modales
    setupModals();
    
    // Configurar notificaciones
    setupNotifications();
    
    console.log('✅ Componentes inicializados');
}

// ===== SISTEMA DE PESTAÑAS =====
function setupTabSystem() {
    console.log('📂 Configurando sistema de pestañas...');
    
    // Agregar event listeners a los botones de pestañas
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('onclick')?.match(/showTab\('(.+)'\)/)?.[1];
            if (tabName) {
                showTab(tabName);
            }
        });
    });
}

// Función principal para mostrar pestañas
function showTab(tabName) {
    console.log(`📂 Mostrando pestaña: ${tabName}`);
    
    // Actualizar estado
    currentTab = tabName;
    
    // Ocultar todos los contenidos
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Remover clase active de todos los botones
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Mostrar contenido seleccionado
    const selectedContent = document.getElementById(tabName);
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.display = 'block';
    }
    
    // Activar botón correspondiente
    const selectedButton = document.querySelector(`button[onclick*="'${tabName}'"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Cargar datos específicos de la pestaña
    loadTabData(tabName);
}

// ===== CARGA DE DATOS POR PESTAÑA =====
async function loadTabData(tabName) {
    console.log(`📊 Cargando datos para pestaña: ${tabName}`);
    
    try {
        switch(tabName) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'nueva-venta':
                await setupNuevaVenta();
                break;
            case 'ventas':
                await loadVentasTab();
                break;
            case 'clientes':
                await loadClientesTab();
                break;
            case 'reportes':
                await loadReportesTab();
                break;
        }
    } catch (error) {
        console.error(`❌ Error cargando ${tabName}:`, error);
        showNotification(`Error cargando ${tabName}`, 'error');
    }
}

// ===== DASHBOARD =====
async function loadDashboard() {
    console.log('📊 Cargando dashboard...');
    
    const { isSupabaseConnected } = window.NTS_CONFIG;
    
    if (isSupabaseConnected) {
        await loadDashboardFromDB();
    } else {
        loadDashboardMock();
    }
}

async function loadDashboardFromDB() {
    try {
        const { supabase } = window.NTS_CONFIG;
        
        // Obtener estadísticas de ventas
        const { data: ventas, error: ventasError } = await supabase
            .from('ventas')
            .select('total_final, total_pagado, estado_pago, fecha_venta, created_at');
        
        if (ventasError) throw ventasError;
        
        // Obtener total de clientes
        const { count: totalClientes, error: clientesError } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true });
        
        if (clientesError) throw clientesError;
        
        // Calcular métricas
        const fechaActual = new Date();
        const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        
        const ventasDelMes = ventas.filter(v => 
            new Date(v.fecha_venta) >= inicioMes
        );
        
        const totalVentasMes = ventasDelMes.reduce((sum, v) => sum + (v.total_final || 0), 0);
        const totalVentas = ventas.length;
        const pendientesCobro = ventas.filter(v => v.estado_pago !== 'pagado_completo').length;
        
        // Actualizar dashboard
        updateDashboardMetrics({
            ventasDelMes: totalVentasMes,
            totalVentas: totalVentas,
            pendientesCobro: pendientesCobro,
            totalClientes: totalClientes || 0
        });
        
        // Cargar ventas recientes
        await loadVentasRecientes();
        
    } catch (error) {
        console.error('Error cargando dashboard desde DB:', error);
        loadDashboardMock(); // Fallback
    }
}

function loadDashboardMock() {
    console.log('📊 Cargando dashboard con datos mock...');
    
    updateDashboardMetrics({
        ventasDelMes: 125000,
        totalVentas: 25,
        pendientesCobro: 8,
        totalClientes: 15
    });
    
    // Ventas recientes mock
    const ventasRecientesHTML = `
        <div class="sale-item">
            <div class="sale-info">
                <strong>Juan Pérez</strong> - Viaje a París
                <span class="sale-amount">$45,000</span>
            </div>
            <span class="sale-status confirmada">✅ Confirmada</span>
        </div>
        <div class="sale-item">
            <div class="sale-info">
                <strong>María González</strong> - Hotel en Roma
                <span class="sale-amount">$28,500</span>
            </div>
            <span class="sale-status pendiente">⏳ Pendiente</span>
        </div>
        <div class="sale-item">
            <div class="sale-info">
                <strong>Carlos López</strong> - Excursión Bariloche
                <span class="sale-amount">$15,200</span>
            </div>
            <span class="sale-status pagado_completo">✅ Pagado</span>
        </div>
    `;
    
    const container = document.getElementById('ventas-recientes');
    if (container) {
        container.innerHTML = ventasRecientesHTML;
    }
}

function updateDashboardMetrics(metrics) {
    const { APP_CONFIG } = window.NTS_CONFIG;
    
    const updates = {
        'ventas-mes': formatCurrency(metrics.ventasDelMes),
        'ventas-total': metrics.totalVentas.toString(),
        'pendientes': metrics.pendientesCobro.toString(),
        'total-clientes': metrics.totalClientes.toString()
    };
    
    Object.entries(updates).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

async function loadVentasRecientes() {
    try {
        const { supabase } = window.NTS_CONFIG;
        
        const { data: ventas, error } = await supabase
            .from('ventas')
            .select(`
                numero_venta,
                total_final,
                estado,
                estado_pago,
                clientes (nombre)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const ventasHTML = ventas.map(venta => {
            const { createEnumBadge } = window.NTS_CONFIG;
            
            return `
                <div class="sale-item">
                    <div class="sale-info">
                        <strong>${venta.clientes?.nombre || 'Cliente'}</strong> - ${venta.numero_venta}
                        <span class="sale-amount">${formatCurrency(venta.total_final)}</span>
                    </div>
                    ${createEnumBadge('ESTADO_PAGO', venta.estado_pago)}
                </div>
            `;
        }).join('');
        
        const container = document.getElementById('ventas-recientes');
        if (container) {
            container.innerHTML = ventasHTML;
        }
        
    } catch (error) {
        console.error('Error cargando ventas recientes:', error);
    }
}

// ===== NUEVA VENTA =====
async function setupNuevaVenta() {
    console.log('➕ Configurando nueva venta...');
    
    // Inicializar servicios vacíos
    appData.serviciosActuales = [];
    
    // Configurar pestañas de servicios
    setupServiceTabs();
    
    // Cargar vendedores y proveedores para los selects
    await loadSelectData();
    
    // Actualizar totales
    updateVentaTotals();
    
    // Configurar eventos de formularios
    setupNuevaVentaEvents();
}

function setupServiceTabs() {
    // Mostrar primera pestaña de servicio por defecto
    showServiceTab('vuelo');
}

function showServiceTab(serviceType) {
    console.log(`🎯 Mostrando pestaña de servicio: ${serviceType}`);
    
    // Remover clase active de todos los tabs y forms
    document.querySelectorAll('.service-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.service-form').forEach(form => {
        form.classList.remove('active');
        form.style.display = 'none';
    });
    
    // Activar tab y form seleccionado
    const selectedTab = document.querySelector(`button[onclick*="'${serviceType}'"]`);
    const selectedForm = document.getElementById(`service-${serviceType}`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedForm) {
        selectedForm.classList.add('active');
        selectedForm.style.display = 'block';
    }
}

async function loadSelectData() {
    // Aquí cargaremos datos para los selects cuando implementemos los módulos
    console.log('📋 Cargando datos para selects...');
}

function setupNuevaVentaEvents() {
    // Event listeners para agregar servicios
    const addButtons = [
        { id: 'agregar-vuelo', type: 'vuelo' },
        { id: 'agregar-hotel', type: 'hotel' },
        { id: 'agregar-traslado', type: 'traslado' },
        { id: 'agregar-excursion', type: 'excursion' }
    ];
    
    addButtons.forEach(({ id, type }) => {
        const button = document.querySelector(`button[onclick*="${type}"]`);
        if (button) {
            button.addEventListener('click', () => agregarServicio(type));
        }
    });
}

// ===== OTRAS PESTAÑAS (PLACEHOLDER) =====
async function loadVentasTab() {
    console.log('📋 Cargando pestaña de ventas...');
    showNotification('🚧 Módulo de ventas en desarrollo', 'info');
}

async function loadClientesTab() {
    console.log('👥 Cargando pestaña de clientes...');
    showNotification('🚧 Módulo de clientes en desarrollo', 'info');
}

async function loadReportesTab() {
    console.log('📈 Cargando pestaña de reportes...');
    showNotification('🚧 Módulo de reportes en desarrollo', 'info');
}

// ===== GESTIÓN DE SERVICIOS =====
function agregarServicio(tipo) {
    console.log(`➕ Agregando servicio: ${tipo}`);
    
    const servicio = getServiceFormData(tipo);
    
    if (!validateServiceData(servicio)) {
        return;
    }
    
    // Agregar ID único
    servicio.id = Date.now();
    servicio.tipo = tipo;
    
    // Agregar a la lista
    appData.serviciosActuales.push(servicio);
    
    // Actualizar vista
    renderServiciosAgregados();
    updateVentaTotals();
    
    // Limpiar formulario
    clearServiceForm(tipo);
    
    showNotification(`✅ ${tipo} agregado correctamente`, 'success');
}

function getServiceFormData(tipo) {
    switch(tipo) {
        case 'vuelo':
            return {
                descripcion: getValue('vuelo-descripcion'),
                tipo_itinerario: getValue('vuelo-tipo'),
                precio_venta: parseFloat(getValue('vuelo-precio')) || 0,
                pasajeros: parseInt(getValue('vuelo-pasajeros')) || 1
            };
        case 'hotel':
            return {
                hotel_nombre: getValue('hotel-nombre'),
                hotel_ciudad: getValue('hotel-ciudad'),
                fecha_checkin: getValue('hotel-checkin'),
                fecha_checkout: getValue('hotel-checkout'),
                precio_venta: parseFloat(getValue('hotel-precio')) || 0,
                huespedes: parseInt(getValue('hotel-huespedes')) || 1
            };
        case 'traslado':
            return {
                origen: getValue('traslado-origen'),
                destino: getValue('traslado-destino'),
                fecha_traslado: getValue('traslado-fecha'),
                precio_venta: parseFloat(getValue('traslado-precio')) || 0
            };
        case 'excursion':
            return {
                nombre_excursion: getValue('excursion-nombre'),
                fecha_excursion: getValue('excursion-fecha'),
                precio_venta: parseFloat(getValue('excursion-precio')) || 0,
                participantes: parseInt(getValue('excursion-participantes')) || 1
            };
        default:
            return {};
    }
}

function validateServiceData(servicio) {
    if (!servicio.precio_venta || servicio.precio_venta <= 0) {
        showNotification('⚠️ Ingrese un precio válido', 'warning');
        return false;
    }
    return true;
}

function renderServiciosAgregados() {
    const container = document.getElementById('servicios-lista');
    if (!container) return;
    
    if (appData.serviciosActuales.length === 0) {
        container.innerHTML = '<p class="no-services">No hay servicios agregados</p>';
        return;
    }
    
    const serviciosHTML = appData.serviciosActuales.map(servicio => {
        const descripcion = getServiceDescription(servicio);
        
        return `
            <div class="service-item" data-id="${servicio.id}">
                <div class="service-info">
                    <span class="service-description">${descripcion}</span>
                    <span class="service-price">${formatCurrency(servicio.precio_venta)}</span>
                </div>
                <button type="button" onclick="eliminarServicio(${servicio.id})" class="btn-remove">🗑️</button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = serviciosHTML;
}

function getServiceDescription(servicio) {
    switch(servicio.tipo) {
        case 'vuelo':
            return `✈️ ${servicio.descripcion} (${servicio.pasajeros} pax)`;
        case 'hotel':
            return `🏨 ${servicio.hotel_nombre} - ${servicio.hotel_ciudad} (${servicio.huespedes} huéspedes)`;
        case 'traslado':
            return `🚌 ${servicio.origen} → ${servicio.destino}`;
        case 'excursion':
            return `🗺️ ${servicio.nombre_excursion} (${servicio.participantes} pax)`;
        default:
            return 'Servicio';
    }
}

function eliminarServicio(id) {
    appData.serviciosActuales = appData.serviciosActuales.filter(s => s.id !== id);
    renderServiciosAgregados();
    updateVentaTotals();
    showNotification('🗑️ Servicio eliminado', 'info');
}

function updateVentaTotals() {
    const total = appData.serviciosActuales.reduce((sum, s) => sum + s.precio_venta, 0);
    
    const totalElement = document.getElementById('total-venta');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString();
    }
}

function clearServiceForm(tipo) {
    const fields = {
        vuelo: ['vuelo-descripcion', 'vuelo-precio'],
        hotel: ['hotel-nombre', 'hotel-ciudad', 'hotel-precio'],
        traslado: ['traslado-origen', 'traslado-destino', 'traslado-precio'],
        excursion: ['excursion-nombre', 'excursion-precio']
    };
    
    const fieldsToClean = fields[tipo] || [];
    fieldsToClean.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) element.value = '';
    });
}

// ===== CREAR VENTA =====
async function crearVenta() {
    console.log('💾 Creando nueva venta...');
    
    try {
        // Validar datos del cliente
        const clienteData = getClienteFormData();
        if (!validateClienteData(clienteData)) {
            return;
        }
        
        // Validar servicios
        if (appData.serviciosActuales.length === 0) {
            showNotification('⚠️ Agregue al menos un servicio', 'warning');
            return;
        }
        
        const total = appData.serviciosActuales.reduce((sum, s) => sum + s.precio_venta, 0);
        
        const ventaData = {
            ...clienteData,
            fecha_viaje_inicio: getValue('fecha-viaje-inicio'),
            fecha_viaje_fin: getValue('fecha-viaje-fin'),
            observaciones: getValue('observaciones-venta'),
            servicios: [...appData.serviciosActuales],
            total_final: total
        };
        
        showLoader('Creando venta...');
        
        const { isSupabaseConnected } = window.NTS_CONFIG;
        
        if (isSupabaseConnected) {
            await crearVentaDB(ventaData);
        } else {
            await crearVentaLocal(ventaData);
        }
        
        showNotification('✅ Venta creada exitosamente', 'success');
        limpiarFormularioVenta();
        
    } catch (error) {
        console.error('Error creando venta:', error);
        showNotification('❌ Error al crear la venta', 'error');
    } finally {
        hideLoader();
    }
}

function getClienteFormData() {
    return {
        nombre: getValue('cliente-nombre'),
        email: getValue('cliente-email'),
        telefono: getValue('cliente-telefono'),
        documento: getValue('cliente-documento')
    };
}

function validateClienteData(clienteData) {
    if (!clienteData.nombre.trim()) {
        showNotification('⚠️ Ingrese el nombre del cliente', 'warning');
        return false;
    }
    
    if (clienteData.email && !isValidEmail(clienteData.email)) {
        showNotification('⚠️ Email inválido', 'warning');
        return false;
    }
    
    return true;
}

async function crearVentaDB(ventaData) {
    // Implementaremos cuando tengamos el módulo de ventas
    console.log('📤 Enviando a Supabase:', ventaData);
}

async function crearVentaLocal(ventaData) {
    console.log('💾 Guardando localmente:', ventaData);
    // Simular guardado local
    await new Promise(resolve => setTimeout(resolve, 1000));
}

function limpiarFormularioVenta() {
    // Limpiar formulario de cliente
    ['cliente-nombre', 'cliente-email', 'cliente-telefono', 'cliente-documento'].forEach(id => {
        setValue(id, '');
    });
    
    // Limpiar observaciones
    setValue('observaciones-venta', '');
    
    // Limpiar servicios
    appData.serviciosActuales = [];
    renderServiciosAgregados();
    updateVentaTotals();
}

// ===== CONFIGURACIÓN DE EVENTOS GLOBALES =====
function setupGlobalEvents() {
    console.log('🎯 Configurando eventos globales...');
    
    // Event listener para botones de agregar servicio
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-add-service')) {
            e.preventDefault();
            const serviceType = e.target.getAttribute('onclick')?.match(/agregarServicio\('(.+)'\)/)?.[1];
            if (serviceType) {
                agregarServicio(serviceType);
            }
        }
        
        if (e.target.matches('.btn-remove')) {
            e.preventDefault();
            const serviceId = parseInt(e.target.getAttribute('onclick')?.match(/eliminarServicio\((.+)\)/)?.[1]);
            if (serviceId) {
                eliminarServicio(serviceId);
            }
        }
    });
    
    // Event listeners para pestañas de servicios
    document.addEventListener('click', function(e) {
        if (e.target.matches('.service-tab')) {
            const serviceType = e.target.getAttribute('onclick')?.match(/showServiceTab\('(.+)'\)/)?.[1];
            if (serviceType) {
                showServiceTab(serviceType);
            }
        }
    });
    
    // Event listener para crear venta
    const crearVentaBtn = document.querySelector('button[onclick="crearVenta()"]');
    if (crearVentaBtn) {
        crearVentaBtn.addEventListener('click', crearVenta);
    }
    
    // Event listener para limpiar formulario
    const limpiarBtn = document.querySelector('button[onclick="limpiarFormulario()"]');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarFormularioVenta);
    }
}

// ===== FUNCIONES DE UTILIDAD =====
function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
}

function formatCurrency(amount) {
    const { APP_CONFIG } = window.NTS_CONFIG;
    return `${APP_CONFIG.locale.currencySymbol}${amount.toLocaleString()}`;
}

function isValidEmail(email) {
    const { APP_CONFIG } = window.NTS_CONFIG;
    return APP_CONFIG.validation.emailRegex.test(email);
}

// ===== CARGA DE DATOS INICIALES =====
async function loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    const { isSupabaseConnected } = window.NTS_CONFIG;
    
    if (isSupabaseConnected) {
        // Cargar datos desde Supabase
        await loadDataFromDB();
    } else {
        // Cargar datos mock
        loadMockData();
    }
}

async function loadDataFromDB() {
    // Implementaremos cuando tengamos los módulos específicos
    console.log('📥 Cargando desde base de datos...');
}

function loadMockData() {
    console.log('📝 Cargando datos mock...');
    
    appData.vendedores = [
        { id: 1, nombre: 'Ana García', codigo_vendedor: 'V001', rol: 'vendedor' },
        { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002', rol: 'supervisor' }
    ];
    
    appData.proveedores = [
        { id: 1, nombre: 'Consolidadora Aérea SA', tipo: 'vuelos' },
        { id: 2, nombre: 'Hoteles Directos', tipo: 'hoteles' }
    ];
    
    appData.clientes = [
        { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com' },
        { id: 2, nombre: 'María González', email: 'maria@email.com' }
    ];
}

// ===== TEST DE CONEXIÓN SUPABASE =====
async function testSupabaseConnection() {
    try {
        const { supabase } = window.NTS_CONFIG;
        
        const { data, error } = await supabase
            .from('vendedores')
            .select('count', { count: 'exact', head: true });
        
        if (error) throw error;
        
        console.log('✅ Test Supabase exitoso');
        return true;
        
    } catch (error) {
        console.error('❌ Test Supabase falló:', error);
        return false;
    }
}

// ===== FUNCIONES PLACEHOLDER PARA COMPONENTES =====
function setupForms() {
    console.log('📝 Configurando formularios...');
}

function setupModals() {
    console.log('🎭 Configurando modales...');
}

function setupNotifications() {
    console.log('🔔 Configurando notificaciones...');
}

function showLoader(message = 'Cargando...') {
    console.log(`⏳ Loader: ${message}`);
    // Implementaremos en utils.js
}

function hideLoader() {
    console.log('✅ Ocultando loader');
    // Implementaremos en utils.js
}

function showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    // Implementaremos en components/notifications.js
}

// ===== EXPORT PARA USO GLOBAL =====
window.NTS_APP = {
    // Estado
    currentTab,
    appData,
    
    // Funciones principales
    showTab,
    loadTabData,
    agregarServicio,
    eliminarServicio,
    crearVenta,
    
    // Utilidades
    getValue,
    setValue,
    formatCurrency
};

console.log('✅ Aplicación NTS cargada correctamente');
