// ⚙️ CONFIG.JS - VERSIÓN LIMPIA Y FUNCIONAL
// Archivo: js/config.js

console.log('🔧 Cargando configuración NTS...');

// ===== CONFIGURACIÓN SUPABASE =====
const supabaseUrl = 'https://fmvozdsvpxitoyhtdmcv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdm96ZHN2cHhpdG95aHRkbWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjc1MzEsImV4cCI6MjA3MDgwMzUzMX0.EqK3pND6Zz48OpnVDCF_0KJUcV3TzkRUz9qTMWL3NNE';

// ===== VARIABLES GLOBALES =====
let supabase = null;
let isSupabaseConnected = false;

// ===== INICIALIZACIÓN =====
function initializeSupabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            console.log('⚠️ Supabase CDN no disponible');
            return false;
        }

        console.log('✅ Inicializando Supabase...');
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

        if (supabase && supabase.from) {
            isSupabaseConnected = true;
            console.log('✅ Supabase conectado correctamente');
            testConnection();
            return true;
        } else {
            throw new Error('Cliente no se inicializó');
        }

    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        isSupabaseConnected = false;
        return false;
    }
}

async function testConnection() {
    try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error && !error.message.includes('session_not_found')) {
            throw error;
        }
        
        console.log('✅ Test de conexión exitoso');
        return true;
        
    } catch (error) {
        console.log('⚠️ Error en test de conexión:', error.message);
        return false;
    }
}

// Inicializar cuando esté disponible
if (typeof window.supabase !== 'undefined') {
    initializeSupabase();
} else {
    console.log('⏳ Esperando Supabase CDN...');
    const checkInterval = setInterval(() => {
        if (typeof window.supabase !== 'undefined') {
            clearInterval(checkInterval);
            initializeSupabase();
        }
    }, 100);
    
    setTimeout(() => clearInterval(checkInterval), 5000);
}

// ===== ENUMs =====
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
    // Core
    supabase,
    isSupabaseConnected,
    ENUMS,
    APP_CONFIG,
    
    // Functions
    getEnumData,
    getEnumLabel,
    createEnumBadge,
    
    // Config
    config: {
        url: supabaseUrl,
        key: supabaseKey
    }
};

console.log('✅ Config.js cargado correctamente');
console.log('🔗 Supabase:', isSupabaseConnected ? 'Conectado' : 'Desconectado');
