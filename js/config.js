// ⚙️ CONFIG.JS - VERSIÓN MÍNIMA SIN ERRORES
// Reemplaza TODO tu config.js con esto:

console.log('🔧 Cargando configuración NTS (versión mínima)...');

// ===== CONFIGURACIÓN BÁSICA =====
const supabaseUrl = 'https://fmvozdsvpxitoyhtdmcv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdm96ZHN2cHhpdG95aHRkbWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjc1MzEsImV4cCI6MjA3MDgwMzUzMX0.EqK3pND6Zz48OpnVDCF_0KJUcV3TzkRUz9qTMWL3NNE';

// ===== VARIABLES GLOBALES =====
let supabase = null;
let isSupabaseConnected = false;

// ===== INICIALIZACIÓN SIMPLE =====
try {
    if (typeof window.supabase !== 'undefined') {
        console.log('✅ Supabase CDN disponible');
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        isSupabaseConnected = true;
        console.log('✅ Cliente Supabase creado');
    } else {
        console.log('⚠️ Supabase CDN no disponible - modo local');
        isSupabaseConnected = false;
    }
} catch (error) {
    console.error('❌ Error inicializando Supabase:', error);
    isSupabaseConnected = false;
}

// ===== ENUMs BÁSICOS =====
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
    ]
};

// ===== FUNCIONES BÁSICAS =====
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

// ===== EXPORT GLOBAL (LO MÁS IMPORTANTE) =====
window.NTS_CONFIG = {
    // Core
    supabase,
    isSupabaseConnected,
    ENUMS,
    APP_CONFIG,
    
    // Functions
    getEnumData,
    getEnumLabel,
    createEnumBadge
};

console.log('✅ Config.js cargado correctamente');
console.log('🔗 Supabase:', isSupabaseConnected ? 'Conectado' : 'Desconectado');
console.log('📦 NTS_CONFIG exportado:', typeof window.NTS_CONFIG);
