// ⚙️ CONFIG.JS - CONFIGURACIÓN SUPABASE CORREGIDA
// Archivo: js/config.js

console.log('🔧 Cargando configuración NTS...');

// ===== CONFIGURACIÓN SUPABASE =====
const SUPABASE_CONFIG = {
    url: 'https://fmvozdsvpxitoyhtdmcv.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdm96ZHN2cHhpdG95aHRkbWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjc1MzEsImV4cCI6MjA3MDgwMzUzMX0.EqK3pND6Zz48OpnVDCF_0KJUcV3TzkRUz9qTMWL3NNE'
};

// ===== INICIALIZACIÓN SUPABASE CORREGIDA =====
let supabase = null;
let isSupabaseConnected = false;

// Función para inicializar Supabase cuando el CDN esté listo
function initializeSupabase() {
    try {
        console.log('🔧 Verificando disponibilidad de Supabase...');
        
        // Verificar que el CDN de Supabase esté cargado
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase CDN no está disponible');
            console.log('📝 Verifica que tengas esta línea en tu HTML:');
            console.log('<script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
            return false;
        }

        console.log('✅ CDN de Supabase detectado');
        console.log('🔑 Inicializando cliente...');

        // Crear cliente de Supabase con configuración específica
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url, 
            SUPABASE_CONFIG.key,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: false, // Cambiar a false para evitar problemas
                    detectSessionInUrl: false
                },
                global: {
                    headers: {
                        'apikey': SUPABASE_CONFIG.key, // Forzar header
                        'Authorization': `Bearer ${SUPABASE_CONFIG.key}`
                    }
                }
            }
        );

        // Verificar que el cliente se creó correctamente
        if (supabase && supabase.from) {
            isSupabaseConnected = true;
            console.log('✅ Supabase inicializado correctamente');
            console.log('📡 URL:', SUPABASE_CONFIG.url);
            console.log('🔑 API Key configurada');
            
            // Test inmediato de conexión
            testSupabaseConnection();
            
            return true;
        } else {
            throw new Error('Cliente de Supabase no se inicializó correctamente');
        }

    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        isSupabaseConnected = false;
        return false;
    }
}

// Test de conexión
async function testSupabaseConnection() {
    try {
        console.log('🧪 Probando conexión a Supabase...');
        
        const { data, error, count } = await supabase
            .from('vendedores')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error en test de conexión:', error);
            if (error.message.includes('JWT')) {
                console.error('🔑 Problema con la API Key - verifica las credenciales');
            }
            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                console.error('📋 La tabla "vendedores" no existe - verifica la base de datos');
            }
            isSupabaseConnected = false;
        } else {
            console.log('✅ Test de conexión exitoso');
            console.log(`📊 Registros en vendedores: ${count || 0}`);
            isSupabaseConnected = true;
        }
    } catch (testError) {
        console.error('❌ Error durante test:', testError);
        isSupabaseConnected = false;
    }
}

// Intentar inicializar inmediatamente
if (typeof window.supabase !== 'undefined') {
    initializeSupabase();
} else {
    // Si Supabase no está disponible, esperar a que se cargue
    console.log('⏳ Esperando que Supabase CDN se cargue...');
    
    // Intentar cada 100ms hasta que esté disponible
    const checkSupabase = setInterval(() => {
        if (typeof window.supabase !== 'undefined') {
            clearInterval(checkSupabase);
            initializeSupabase();
        }
    }, 100);
    
    // Timeout después de 5 segundos
    setTimeout(() => {
        if (!isSupabaseConnected) {
            clearInterval(checkSupabase);
            console.error('❌ Timeout esperando Supabase CDN');
            console.log('🔧 Continuando en modo local...');
        }
    }, 5000);
}

// ===== RESTO DE TU CONFIGURACIÓN (ENUMs, etc.) =====
// [Aquí va todo tu código de ENUMs y configuración existente]

const ENUMS = {
    // ... tu código existente de ENUMs ...
    TIPO_PROVEEDOR: [
        { value: 'hoteles', label: '🏨 Hoteles', icon: '🏨', color: '#2563eb' },
        { value: 'vuelos', label: '✈️ Vuelos', icon: '✈️', color: '#7c3aed' },
        { value: 'traslados', label: '🚌 Traslados', icon: '🚌', color: '#059669' },
        { value: 'excursiones', label: '🗺️ Excursiones', icon: '🗺️', color: '#dc2626' },
        { value: 'mixto', label: '📦 Mixto', icon: '📦', color: '#9333ea' }
    ],

    ESTADO_PAGO: [
        { value: 'no_pagado', label: 'No Pagado', icon: '❌', color: '#dc2626' },
        { value: 'parcialmente_pagado', label: 'Parcialmente Pagado', icon: '⚠️', color: '#d97706' },
        { value: 'pagado_completo', label: 'Pagado Completo', icon: '✅', color: '#059669' }
    ],

    ESTADO_VENTA: [
        { value: 'pendiente', label: 'Pendiente', icon: '⏳', color: '#6b7280' },
        { value: 'confirmada', label: 'Confirmada', icon: '✅', color: '#059669' },
        { value: 'cancelada', label: 'Cancelada', icon: '❌', color: '#dc2626' },
        { value: 'finalizada', label: 'Finalizada', icon: '🏁', color: '#7c3aed' }
    ]
    // ... resto de tus ENUMs ...
};

// ===== FUNCIONES HELPER (tu código existente) =====
function getEnumData(enumType, value) {
    const enumArray = ENUMS[enumType];
    if (!enumArray) return null;
    return enumArray.find(item => item.value === value) || null;
}

function getEnumLabel(enumType, value) {
    const data = getEnumData(enumType, value);
    return data ? data.label : value;
}

function createEnumBadge(enumType, value, includeIcon = true) {
    const data = getEnumData(enumType, value);
    if (!data) return `<span class="enum-badge">${value}</span>`;
    
    const icon = includeIcon ? data.icon + ' ' : '';
    
    return `<span class="enum-badge" style="
        background-color: ${data.color}15; 
        color: ${data.color}; 
        border: 1px solid ${data.color}30;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.85em;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    ">
        ${icon}${data.label}
    </span>`;
}

// ===== EXPORT PARA USO GLOBAL =====
window.NTS_CONFIG = {
    // Core
    supabase,
    isSupabaseConnected,
    ENUMS,
    
    // Functions
    getEnumData,
    getEnumLabel,
    createEnumBadge,
    
    // Test function para debugging
    testConnection: testSupabaseConnection,
    reinitialize: initializeSupabase
};

console.log('✅ Configuración NTS cargada');
console.log('🔗 Supabase:', isSupabaseConnected ? 'Conectado' : 'Desconectado');
