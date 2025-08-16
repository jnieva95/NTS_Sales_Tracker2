// ⚙️ CONFIG.JS - CONFIGURACIÓN SUPABASE DEFINITIVA
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

function initializeSupabase() {
    try {
        console.log('🔧 Inicializando Supabase...');
        
        // Verificar que el CDN esté disponible
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase CDN no disponible');
            return false;
        }

        console.log('✅ CDN de Supabase disponible');

        // CONFIGURACIÓN CORREGIDA - Forzar headers en TODAS las requests
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url, 
            SUPABASE_CONFIG.key,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                    detectSessionInUrl: false
                },
                global: {
                    headers: {
                        'apikey': SUPABASE_CONFIG.key,
                        'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    }
                },
                db: {
                    schema: 'public'
                },
                realtime: {
                    disabled: true // Deshabilitar realtime para evitar problemas
                }
            }
        );

        // Verificar inicialización
        if (supabase && typeof supabase.from === 'function') {
            console.log('✅ Cliente Supabase creado correctamente');
            console.log('🔑 API Key configurada:', SUPABASE_CONFIG.key.substring(0, 20) + '...');
            
            // Intercepción de requests para debugging
            const originalFrom = supabase.from;
            supabase.from = function(table) {
                console.log(`📡 Query a tabla: ${table}`);
                const query = originalFrom.call(this, table);
                
                // Interceptar el método select para debug
                const originalSelect = query.select;
                query.select = function(...args) {
                    console.log(`🔍 SELECT en ${table}:`, args);
                    return originalSelect.apply(this, args);
                };
                
                // Interceptar insert para debug
                const originalInsert = query.insert;
                query.insert = function(data) {
                    console.log(`📝 INSERT en ${table}:`, data);
                    return originalInsert.call(this, data);
                };
                
                return query;
            };
            
            isSupabaseConnected = true;
            return true;
        } else {
            throw new Error('Cliente no se inicializó correctamente');
        }

    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        isSupabaseConnected = false;
        return false;
    }
}

// Test de conexión simplificado
async function testSupabaseConnection() {
    if (!supabase) {
        console.error('❌ Cliente Supabase no disponible');
        return false;
    }

    try {
        console.log('🧪 Probando conexión...');
        
        // Test con una query super simple que no requiere tablas
        const { data, error } = await supabase.rpc('version');
        
        if (error) {
            console.log('⚠️ RPC no disponible, probando auth...');
            
            // Fallback: test de auth
            const { data: authData, error: authError } = await supabase.auth.getSession();
            
            if (authError && !authError.message.includes('session_not_found')) {
                throw authError;
            }
        }
        
        console.log('✅ Test de conexión OK');
        isSupabaseConnected = true;
        return true;
        
    } catch (error) {
        console.error('❌ Test falló:', error);
        
        if (error.message.includes('No API key')) {
            console.error('🔑 API Key no se está enviando correctamente');
            console.error('📋 Headers actuales:', {
                apikey: SUPABASE_CONFIG.key ? 'PRESENTE' : 'AUSENTE',
                url: SUPABASE_CONFIG.url
            });
        }
        
        isSupabaseConnected = false;
        return false;
    }
}

// Función para crear requests manuales (fallback)
async function manualSupabaseRequest(endpoint, options = {}) {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'apikey': SUPABASE_CONFIG.key,
            'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        ...options
    };
    
    console.log('📡 Request manual a:', url);
    console.log('🔑 Headers:', defaultOptions.headers);
    
    try {
        const response = await fetch(url, defaultOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
        }
        
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

// Inicializar cuando esté disponible
if (typeof window.supabase !== 'undefined') {
    initializeSupabase();
    setTimeout(testSupabaseConnection, 1000);
} else {
    console.log('⏳ Esperando Supabase CDN...');
    const checkInterval = setInterval(() => {
        if (typeof window.supabase !== 'undefined') {
            clearInterval(checkInterval);
            initializeSupabase();
            setTimeout(testSupabaseConnection, 1000);
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(checkInterval);
        if (!isSupabaseConnected) {
            console.error('❌ Timeout esperando Supabase');
        }
    }, 5000);
}

// ===== ENUMs SIMPLIFICADOS =====
const ENUMS = {
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
    ],
    
    TIPO_PROVEEDOR: [
        { value: 'vuelos', label: '✈️ Vuelos', icon: '✈️', color: '#2563eb' },
        { value: 'hoteles', label: '🏨 Hoteles', icon: '🏨', color: '#7c3aed' },
        { value: 'traslados', label: '🚌 Traslados', icon: '🚌', color: '#059669' },
        { value: 'excursiones', label: '🗺️ Excursiones', icon: '🗺️', color: '#dc2626' },
        { value: 'mixto', label: '📦 Mixto', icon: '📦', color: '#9333ea' }
    ]
};

// ===== FUNCIONES HELPER =====
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

// ===== CONFIGURACIÓN DE LA APP =====
const APP_CONFIG = {
    company: {
        name: 'NTS',
        fullName: 'NIEVA TRAVEL SERVICES'
    },
    app: {
        version: '1.0.0',
        debugMode: true
    }
};

// ===== EXPORT GLOBAL =====
window.NTS_CONFIG = {
    supabase,
    isSupabaseConnected,
    ENUMS,
    APP_CONFIG,
    
    // Functions
    getEnumData,
    getEnumLabel,
    createEnumBadge,
    
    // Debug functions
    testConnection: testSupabaseConnection,
    reinitialize: initializeSupabase,
    manualRequest: manualSupabaseRequest,
    
    // Raw config for debugging
    rawConfig: SUPABASE_CONFIG
};

console.log('✅ Configuración NTS cargada');
console.log('🔗 Supabase:', isSupabaseConnected ? 'Conectado' : 'Desconectado');
