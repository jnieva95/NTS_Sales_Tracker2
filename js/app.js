// 🚀 APP.JS - APLICACIÓN PRINCIPAL NTS (ACTUALIZADO)
// Archivo: js/app.js

console.log('🚀 Iniciando aplicación NTS...');

// ===== VARIABLES GLOBALES =====
let currentTab = 'dashboard';
let isLoading = false;
let salesChartInstance = null;

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
    
    // Verificar que utils.js esté cargado
    if (typeof window.NTS_UTILS === 'undefined') {
        throw new Error('Utils.js no está cargado');
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
                await loadVentasModule();
                break;
            case 'clientes':
                await loadClientesModule();
                break;
            case 'proveedores':
                await loadProveedoresModule();
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
        // Destroy existing chart if it exists
        if (salesChartInstance) {
            salesChartInstance.destroy();
            salesChartInstance = null;
        }
        
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
    
    // Destroy existing chart if it exists
    if (salesChartInstance) {
        salesChartInstance.destroy();
        salesChartInstance = null;
    }
    
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
    const { formatCurrency } = window.NTS_UTILS;
    
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
        const { supabase, createEnumBadge } = window.NTS_CONFIG;
        
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
            const { formatCurrency } = window.NTS_UTILS;
            
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
    
    // Verificar si el módulo de ventas está disponible
    if (typeof window.VentasModule !== 'undefined') {
        // Usar el módulo de ventas mejorado
        await window.VentasModule.init();
        console.log('✅ Módulo de ventas avanzado inicializado');
    } else {
        // Fallback al sistema básico
        console.log('⚠️ Módulo de ventas no encontrado, usando sistema básico');
        setupBasicVentas();
    }
}

function setupBasicVentas() {
    // Sistema básico de ventas como fallback
    console.log('🔧 Configurando sistema básico de ventas...');
    
    // Configurar pestañas de servicios
    showServiceTab('vuelo');
    
    // Configurar eventos básicos
    setupBasicVentasEvents();
}

function setupBasicVentasEvents() {
    // Event listeners básicos
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-add-service')) {
            e.preventDefault();
            showNotification('📋 Sistema de ventas básico - funcionalidad limitada', 'info');
        }
    });
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

// ===== OTRAS PESTAÑAS (PLACEHOLDER) =====
async function loadVentasModule() {
    console.log('📋 Cargando pestaña de ventas...');
    
    if (typeof window.initVentasModule === 'function') {
        await window.initVentasModule();
    } else {
        showNotification('🚧 Módulo de gestión de ventas no disponible', 'warning');
    }
}

async function loadClientesModule() {
    console.log('👥 Cargando pestaña de clientes...');
    
    if (typeof window.initClientesModule === 'function') {
        await window.initClientesModule();
    } else {
        showNotification('🚧 Módulo de gestión de clientes no disponible', 'warning');
    }
}

async function loadProveedoresModule() {
    console.log('🏢 Cargando pestaña de proveedores...');
    
    if (typeof window.initProveedoresModule === 'function') {
        await window.initProveedoresModule();
    } else {
        showNotification('🚧 Módulo de gestión de proveedores no disponible', 'warning');
    }
}

async function loadReportesTab() {
    console.log('📈 Cargando pestaña de reportes...');
    showNotification('🚧 Módulo de reportes en desarrollo', 'info');
}

// ===== CONFIGURACIÓN DE EVENTOS GLOBALES =====
function setupGlobalEvents() {
    console.log('🎯 Configurando eventos globales...');
    
    // Event listeners para pestañas de servicios
    document.addEventListener('click', function(e) {
        if (e.target.matches('.service-tab')) {
            const serviceType = e.target.getAttribute('onclick')?.match(/showServiceTab\('(.+)'\)/)?.[1];
            if (serviceType) {
                showServiceTab(serviceType);
            }
        }
    });
    
    // Event listener global para botones con data-action
    document.addEventListener('click', function(e) {
        const action = e.target.getAttribute('data-action');
        if (action) {
            e.preventDefault();
            handleGlobalAction(action, e.target);
        }
    });
}

function handleGlobalAction(action, element) {
    console.log(`🎯 Ejecutando acción global: ${action}`);
    
    switch(action) {
        case 'refresh-data':
            loadTabData(currentTab);
            showNotification('🔄 Datos actualizados', 'success');
            break;
        case 'export-data':
            exportCurrentTabData();
            break;
        case 'print-report':
            printCurrentTab();
            break;
        default:
            console.log(`⚠️ Acción no reconocida: ${action}`);
    }
}

// ===== CARGA DE DATOS INICIALES =====
async function loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    const { isSupabaseConnected } = window.NTS_CONFIG;
    
    if (isSupabaseConnected) {
        // Verificar conexión y cargar datos básicos
        await loadCoreData();
    } else {
        console.log('📝 Modo local - sin datos iniciales');
    }
}

async function loadCoreData() {
    try {
        const { supabase } = window.NTS_CONFIG;
        
        // Cargar counts básicos para verificación
        const [vendedores, proveedores, clientes] = await Promise.all([
            supabase.from('vendedores').select('id', { count: 'exact', head: true }),
            supabase.from('proveedores').select('id', { count: 'exact', head: true }),
            supabase.from('clientes').select('id', { count: 'exact', head: true })
        ]);
        
        console.log('📊 Datos disponibles:', {
            vendedores: vendedores.count || 0,
            proveedores: proveedores.count || 0,
            clientes: clientes.count || 0
        });
        
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
    }
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
    // Implementado en el módulo de ventas
}

function setupModals() {
    console.log('🎭 Configurando modales...');
    // Por implementar
}

function setupNotifications() {
    console.log('🔔 Configurando notificaciones...');
    // Implementado en utils.js
}

// ===== FUNCIONES DE UTILIDAD =====
function showLoader(message = 'Cargando...') {
    if (window.NTS_UTILS && window.NTS_UTILS.showLoader) {
        window.NTS_UTILS.showLoader(message);
    }
}

function hideLoader() {
    if (window.NTS_UTILS && window.NTS_UTILS.hideLoader) {
        window.NTS_UTILS.hideLoader();
    }
}

function showNotification(message, type = 'info') {
    if (window.NTS_UTILS && window.NTS_UTILS.showNotification) {
        window.NTS_UTILS.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

function exportCurrentTabData() {
    showNotification('📤 Función de exportación en desarrollo', 'info');
}

function printCurrentTab() {
    window.print();
}

// ===== FUNCIONES GLOBALES PARA COMPATIBILIDAD =====
// Estas funciones mantienen compatibilidad con el HTML existente

window.showTab = showTab;
window.showServiceTab = showServiceTab;

// Funciones placeholder para botones existentes
window.agregarServicio = function(tipo) {
    if (window.VentasModule && window.VentasModule.agregarServicio) {
        window.VentasModule.agregarServicio(tipo);
    } else {
        showNotification(`🚧 Función ${tipo} en desarrollo`, 'info');
    }
};

window.crearVenta = function() {
    if (window.VentasModule && window.VentasModule.crearVenta) {
        window.VentasModule.crearVenta();
    } else {
        showNotification('🚧 Función crear venta en desarrollo', 'info');
    }
};

window.limpiarFormulario = function() {
    if (window.VentasModule && window.VentasModule.limpiarFormulario) {
        window.VentasModule.limpiarFormulario();
    } else {
        showNotification('🚧 Función limpiar formulario en desarrollo', 'info');
    }
};

window.eliminarServicio = function(id) {
    if (window.VentasModule && window.VentasModule.eliminarServicio) {
        window.VentasModule.eliminarServicio(id);
    } else {
        showNotification('🚧 Función eliminar servicio en desarrollo', 'info');
    }
};

// Funciones placeholder para otras pestañas
window.filtrarVentas = function() {
    showNotification('🔍 Función de filtrado en desarrollo', 'info');
};

window.mostrarFormularioCliente = function() {
    showNotification('👤 Formulario de cliente en desarrollo', 'info');
};

window.cerrarModal = function() {
    const modal = document.getElementById('modal-detalle');
    if (modal) {
        modal.style.display = 'none';
    }
};

// ===== EXPORT PARA USO GLOBAL =====
window.NTS_APP = {
    // Estado
    currentTab,
    
    // Funciones principales
    showTab,
    loadTabData,
    loadDashboard,
    
    // Utilidades
    showLoader,
    hideLoader,
    showNotification
};

console.log('✅ Aplicación NTS cargada correctamente');
