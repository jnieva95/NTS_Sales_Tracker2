// ===== CONFIGURACIÓN SUPABASE (NUEVO) =====
const SUPABASE_CONFIG = {
    url: 'https://fmvozdsvpxitoyhtdmcv.supabase.co', // ← REEMPLAZAR con tu URL real
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdm96ZHN2cHhpdG95aHRkbWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjc1MzEsImV4cCI6MjA3MDgwMzUzMX0.EqK3pND6Zz48OpnVDCF_0KJUcV3TzkRUz9qTMWL3NNE' // ← REEMPLAZAR con tu key real
};

// Verificar si Supabase está disponible
let supabase = null;
let usingSupabase = false;

if (typeof window.supabase !== 'undefined' && SUPABASE_CONFIG.url.includes('supabase')) {
    try {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        usingSupabase = true;
        console.log('✅ Supabase conectado correctamente');
    } catch (error) {
        console.error('❌ Error conectando Supabase:', error);
        usingSupabase = false;
    }
} else {
    console.log('📋 Usando Google Apps Script (modo original)');
    usingSupabase = false;
}

// ===== ENUMs BASADOS EN LA BASE DE DATOS =====
const ENUM_VALUES = {
    ESTADO_PAGO: [
        { value: 'no_pagado', label: '❌ No Pagado', color: '#ef4444' },
        { value: 'parcialmente_pagado', label: '⚠️ Parcialmente Pagado', color: '#f59e0b' },
        { value: 'pagado_completo', label: '✅ Pagado Completo', color: '#10b981' }
    ],
    ESTADO_VENTA: [
        { value: 'pendiente', label: '⏳ Pendiente', color: '#6b7280' },
        { value: 'confirmada', label: '✅ Confirmada', color: '#10b981' },
        { value: 'cancelada', label: '❌ Cancelada', color: '#ef4444' },
        { value: 'finalizada', label: '🏁 Finalizada', color: '#8b5cf6' }
    ],
    FORMA_PAGO: [
        { value: 'efectivo', label: '💵 Efectivo' },
        { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
        { value: 'tarjeta_debito', label: '💳 Tarjeta de Débito' },
        { value: 'transferencia', label: '🏦 Transferencia' },
        { value: 'mercado_pago', label: '💙 Mercado Pago' }
    ],
    ROL_VENDEDOR: [
        { value: 'vendedor', label: '👤 Vendedor' },
        { value: 'supervisor', label: '👥 Supervisor' },
        { value: 'gerente', label: '👔 Gerente' },
        { value: 'director', label: '🎯 Director' }
    ]
};

// ===== FUNCIONES HELPER PARA ENUMs =====
function getEnumLabel(enumType, value) {
    const enumArray = ENUM_VALUES[enumType];
    if (!enumArray) return value;
    const item = enumArray.find(item => item.value === value);
    return item ? item.label : value;
}

function generateEnumOptions(enumType, selectedValue = '') {
    const enumArray = ENUM_VALUES[enumType];
    if (!enumArray) return '';
    
    return enumArray.map(item => 
        `<option value="${item.value}" ${item.value === selectedValue ? 'selected' : ''}>
            ${item.label}
        </option>`
    ).join('');
}

// ===== FUNCIONES DE API SUPABASE (NUEVAS) =====
class NTS_API {
    // Vendedores
    static async getVendedores() {
        if (!usingSupabase) return { success: false, error: 'Supabase no disponible' };
        
        try {
            const { data, error } = await supabase
                .from('vendedores')
                .select('*')
                .eq('activo', true)
                .order('nombre');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener vendedores:', error);
            return { success: false, error: error.message };
        }
    }

    static async createVendedor(vendedorData) {
        if (!usingSupabase) return { success: false, error: 'Supabase no disponible' };
        
        try {
            const { data, error } = await supabase
                .from('vendedores')
                .insert(vendedorData)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al crear vendedor:', error);
            return { success: false, error: error.message };
        }
    }

    // Proveedores
    static async getProveedores() {
        if (!usingSupabase) return { success: false, error: 'Supabase no disponible' };
        
        try {
            const { data, error } = await supabase
                .from('proveedores')
                .select('*')
                .eq('activo', true)
                .order('nombre');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener proveedores:', error);
            return { success: false, error: error.message };
        }
    }

    // Clientes  
    static async getClientes() {
        if (!usingSupabase) return { success: false, error: 'Supabase no disponible' };
        
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select(`
                    *,
                    vendedores:vendedor_id (nombre, codigo_vendedor)
                `)
                .order('nombre');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            return { success: false, error: error.message };
        }
    }

    // Ventas (simplificado por ahora)
    static async getVentas() {
        if (!usingSupabase) return { success: false, error: 'Supabase no disponible' };
        
        try {
            const { data, error } = await supabase
                .from('ventas')
                .select(`
                    *,
                    clientes (nombre, email),
                    vendedores (nombre, codigo_vendedor)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener ventas:', error);
            return { success: false, error: error.message };
        }
    }
}

// ===== FUNCIONES DE TESTING SUPABASE =====
async function testSupabaseConnection() {
    console.log('🧪 Probando conexión con Supabase...');
    
    if (!usingSupabase) {
        console.log('❌ Supabase no está configurado');
        return false;
    }
    
    try {
        // Probar obtener vendedores
        const vendedores = await NTS_API.getVendedores();
        console.log('👥 Vendedores:', vendedores);
        
        // Probar obtener proveedores
        const proveedores = await NTS_API.getProveedores();
        console.log('🏢 Proveedores:', proveedores);
        
        // Probar obtener clientes
        const clientes = await NTS_API.getClientes();
        console.log('👤 Clientes:', clientes);
        
        console.log('✅ Conexión con Supabase exitosa!');
        return true;
        
    } catch (error) {
        console.error('❌ Error en test de Supabase:', error);
        return false;
    }
}

// ===== TU CÓDIGO ORIGINAL (SIN CAMBIOS) =====

// Configuración de Google Apps Script (Original)
const GAS_CONFIG = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwBERdg50_6_phMeifwqkhd8jL_L7umVUwxCmrAsq0Gm88WpPFSqs6tdyrL_wV2EFY/exec'
};

// Datos locales (cache) - Original
let ventasData = [];
let contadorOrden = 1;

// Estado de la aplicación - Original
let isLoading = false;

// ===== INICIALIZACIÓN MEJORADA =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando NTS con Supabase + Google Apps Script...');
    
    // Mostrar indicador de carga
    mostrarCarga(true);
    
    try {
        // NUEVO: Probar Supabase primero
        if (usingSupabase) {
            console.log('🔄 Probando Supabase...');
            const supabaseOk = await testSupabaseConnection();
            
            if (supabaseOk) {
                console.log('✅ Usando Supabase como fuente principal');
                alert('🎉 ¡Conectado con Supabase! Sistema NTS listo.');
            } else {
                console.log('⚠️ Supabase falló, usando Google Apps Script');
                usingSupabase = false;
            }
        }
        
        // Fallback a Google Apps Script (tu código original)
        if (!usingSupabase) {
            await cargarDatosDesdeScript();
        }
        
        // Configurar interfaz
        configurarInterfaz();
        
        // Actualizar vista
        actualizarDashboard();
        renderizarTabla();
        
        console.log('✅ Aplicación iniciada correctamente');
        
    } catch (error) {
        console.error('❌ Error iniciando aplicación:', error);
        alert('Error iniciando. Usando datos locales.');
        
        // Fallback a datos locales
        await inicializarDatosEjemplo();
        configurarInterfaz();
        actualizarDashboard();
        renderizarTabla();
    }
    
    // Ocultar indicador de carga
    mostrarCarga(false);
});

// ===== RESTO DE TU CÓDIGO ORIGINAL =====
// (Mantener todas las funciones existentes sin cambios)

// Configurar interfaz y event listeners - Original
function configurarInterfaz() {
    // Establecer fecha actual
    const fechaHoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaVenta').value = fechaHoy;
    
    // Generar número de orden
    generarNumeroOrden();
    
    // Event listeners
    const form = document.getElementById('ventaForm');
    if (form) {
        form.addEventListener('submit', registrarVenta);
    }
    
    const montoPagado = document.getElementById('montoPagado');
    if (montoPagado) {
        montoPagado.addEventListener('input', actualizarEstadoPago);
    }
}

// [MANTENER TODAS TUS FUNCIONES ORIGINALES AQUÍ]
// - mostrarCarga()
// - cargarDatosDesdeScript()
// - makeScriptRequest() 
// - guardarEnScript()
// - inicializarDatosEjemplo()
// - generarNumeroOrden()
// - registrarVenta()
// - actualizarDashboard()
// - renderizarTabla()
// - etc.

// Mostrar/ocultar indicador de carga
function mostrarCarga(mostrar) {
    const existingLoader = document.getElementById('loader');
    
    if (mostrar && !existingLoader) {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
                        align-items: center; z-index: 9999;">
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 20px; margin-bottom: 10px;">⏳</div>
                    <div>${usingSupabase ? 'Conectando con Supabase...' : 'Sincronizando con Google Sheets...'}</div>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    } else if (!mostrar && existingLoader) {
        existingLoader.remove();
    }
}

// ===== AGREGAR AL FINAL =====
// Función para cambiar entre modos
function toggleDataSource() {
    usingSupabase = !usingSupabase;
    console.log(`🔄 Cambiando a: ${usingSupabase ? 'Supabase' : 'Google Apps Script'}`);
    location.reload(); // Recargar para aplicar cambios
}

console.log('📊 NTS Sistema cargado - Modo:', usingSupabase ? 'Supabase' : 'Google Apps Script');
