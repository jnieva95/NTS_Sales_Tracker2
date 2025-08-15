// ⚙️ CONFIG.JS - CONFIGURACIÓN BASE DEL SISTEMA NTS
// Archivo: js/config.js

console.log('🔧 Cargando configuración NTS...');

// ===== CONFIGURACIÓN SUPABASE =====
const SUPABASE_CONFIG = {
    url: 'https://fmvozdsvpxitoyhtdmcv.supabase.co', // ← REEMPLAZAR con tu URL
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdm96ZHN2cHhpdG95aHRkbWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjc1MzEsImV4cCI6MjA3MDgwMzUzMX0.EqK3pND6Zz48OpnVDCF_0KJUcV3TzkRUz9qTMWL3NNE', // ← REEMPLAZAR con tu clave
    
    // Configuración adicional
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
};

// ===== INICIALIZACIÓN SUPABASE =====
let supabase = null;
let isSupabaseConnected = false;

try {
    if (typeof window.supabase !== 'undefined' && 
        SUPABASE_CONFIG.url !== 'TU_SUPABASE_URL_AQUI') {
        
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        isSupabaseConnected = true;
        console.log('✅ Supabase inicializado correctamente');
    } else {
        console.log('⚠️ Configurar credenciales de Supabase en config.js');
    }
} catch (error) {
    console.error('❌ Error inicializando Supabase:', error);
    isSupabaseConnected = false;
}

// ===== DEFINICIÓN DE ENUMs (PICKLISTS) =====
// IMPORTANTE: Estos valores deben coincidir EXACTAMENTE con los ENUMs de PostgreSQL

const ENUMS = {
    // Tipos de proveedores
    TIPO_PROVEEDOR: [
        { value: 'hoteles', label: '🏨 Hoteles', icon: '🏨', color: '#2563eb' },
        { value: 'vuelos', label: '✈️ Vuelos', icon: '✈️', color: '#7c3aed' },
        { value: 'traslados', label: '🚌 Traslados', icon: '🚌', color: '#059669' },
        { value: 'excursiones', label: '🗺️ Excursiones', icon: '🗺️', color: '#dc2626' },
        { value: 'mixto', label: '📦 Mixto', icon: '📦', color: '#9333ea' }
    ],

    // Roles de vendedores
    ROL_VENDEDOR: [
        { value: 'vendedor', label: '👤 Vendedor', icon: '👤', color: '#6b7280' },
        { value: 'supervisor', label: '👥 Supervisor', icon: '👥', color: '#f59e0b' },
        { value: 'gerente', label: '👔 Gerente', icon: '👔', color: '#7c2d12' },
        { value: 'director', label: '🎯 Director', icon: '🎯', color: '#991b1b' }
    ],

    // Estados de pago
    ESTADO_PAGO: [
        { value: 'no_pagado', label: 'No Pagado', icon: '❌', color: '#dc2626' },
        { value: 'parcialmente_pagado', label: 'Parcialmente Pagado', icon: '⚠️', color: '#d97706' },
        { value: 'pagado_completo', label: 'Pagado Completo', icon: '✅', color: '#059669' }
    ],

    // Estados de venta
    ESTADO_VENTA: [
        { value: 'pendiente', label: 'Pendiente', icon: '⏳', color: '#6b7280' },
        { value: 'confirmada', label: 'Confirmada', icon: '✅', color: '#059669' },
        { value: 'cancelada', label: 'Cancelada', icon: '❌', color: '#dc2626' },
        { value: 'finalizada', label: 'Finalizada', icon: '🏁', color: '#7c3aed' }
    ],

    // Estados de servicios
    ESTADO_SERVICIO: [
        { value: 'cotizado', label: 'Cotizado', icon: '📋', color: '#6b7280' },
        { value: 'solicitado', label: 'Solicitado', icon: '📤', color: '#2563eb' },
        { value: 'confirmado', label: 'Confirmado', icon: '✅', color: '#059669' },
        { value: 'emitido', label: 'Emitido', icon: '🎫', color: '#7c3aed' },
        { value: 'realizado', label: 'Realizado', icon: '🏁', color: '#065f46' },
        { value: 'cancelado', label: 'Cancelado', icon: '❌', color: '#dc2626' }
    ],

    // Formas de pago
    FORMA_PAGO: [
        { value: 'efectivo', label: 'Efectivo', icon: '💵', color: '#059669' },
        { value: 'tarjeta_credito', label: 'Tarjeta de Crédito', icon: '💳', color: '#2563eb' },
        { value: 'tarjeta_debito', label: 'Tarjeta de Débito', icon: '💳', color: '#7c3aed' },
        { value: 'transferencia', label: 'Transferencia', icon: '🏦', color: '#dc2626' },
        { value: 'cheque', label: 'Cheque', icon: '📄', color: '#d97706' },
        { value: 'mercado_pago', label: 'Mercado Pago', icon: '💙', color: '#1d4ed8' },
        { value: 'paypal', label: 'PayPal', icon: '🅿️', color: '#0369a1' }
    ],

    // Tipos de itinerario de vuelos
    TIPO_ITINERARIO: [
        { value: 'ida', label: 'Solo Ida', icon: '➡️', color: '#6b7280' },
        { value: 'ida_vuelta', label: 'Ida y Vuelta', icon: '🔄', color: '#2563eb' },
        { value: 'multitramo', label: 'Multitramo', icon: '🔀', color: '#7c3aed' },
        { value: 'stopover', label: 'Stopover', icon: '⏸️', color: '#d97706' }
    ],

    // Clases de vuelos
    CLASE_VUELO: [
        { value: 'economica', label: 'Económica', icon: '🎒', color: '#6b7280' },
        { value: 'premium_economy', label: 'Premium Economy', icon: '🎒', color: '#d97706' },
        { value: 'business', label: 'Business', icon: '💼', color: '#dc2626' },
        { value: 'primera_clase', label: 'Primera Clase', icon: '👑', color: '#7c2d12' }
    ],

    // Categorías de hoteles
    CATEGORIA_HOTEL: [
        { value: '1', label: '⭐ 1 Estrella', icon: '⭐', color: '#9ca3af' },
        { value: '2', label: '⭐⭐ 2 Estrellas', icon: '⭐', color: '#6b7280' },
        { value: '3', label: '⭐⭐⭐ 3 Estrellas', icon: '⭐', color: '#d97706' },
        { value: '4', label: '⭐⭐⭐⭐ 4 Estrellas', icon: '⭐', color: '#dc2626' },
        { value: '5', label: '⭐⭐⭐⭐⭐ 5 Estrellas', icon: '⭐', color: '#7c2d12' },
        { value: 'boutique', label: 'Boutique', icon: '🏛️', color: '#7c3aed' },
        { value: 'resort', label: 'Resort', icon: '🏝️', color: '#059669' },
        { value: 'apart_hotel', label: 'Apart Hotel', icon: '🏠', color: '#2563eb' }
    ],

    // Tipos de habitación
    TIPO_HABITACION: [
        { value: 'simple', label: 'Simple', icon: '🛏️', color: '#6b7280' },
        { value: 'doble', label: 'Doble', icon: '🛏️', color: '#2563eb' },
        { value: 'triple', label: 'Triple', icon: '🛏️', color: '#7c3aed' },
        { value: 'cuadruple', label: 'Cuádruple', icon: '🛏️', color: '#dc2626' },
        { value: 'suite', label: 'Suite', icon: '🏰', color: '#7c2d12' },
        { value: 'familiar', label: 'Familiar', icon: '👨‍👩‍👧‍👦', color: '#059669' },
        { value: 'presidencial', label: 'Presidencial', icon: '👑', color: '#991b1b' }
    ],

    // Tipos de traslado
    TIPO_TRASLADO: [
        { value: 'aeropuerto', label: 'Aeropuerto', icon: '✈️', color: '#2563eb' },
        { value: 'hotel', label: 'Hotel', icon: '🏨', color: '#7c3aed' },
        { value: 'excursion', label: 'Excursión', icon: '🗺️', color: '#dc2626' },
        { value: 'libre', label: 'Libre', icon: '🆓', color: '#059669' },
        { value: 'city_tour', label: 'City Tour', icon: '🏙️', color: '#d97706' }
    ],

    // Tipos de vehículo
    TIPO_VEHICULO: [
        { value: 'auto', label: 'Auto', icon: '🚗', color: '#6b7280' },
        { value: 'van', label: 'Van', icon: '🚐', color: '#2563eb' },
        { value: 'minibus', label: 'Minibus', icon: '🚌', color: '#7c3aed' },
        { value: 'bus', label: 'Bus', icon: '🚌', color: '#dc2626' },
        { value: 'limousine', label: 'Limousine', icon: '🚖', color: '#7c2d12' },
        { value: 'taxi', label: 'Taxi', icon: '🚕', color: '#d97706' }
    ],

    // Nivel de dificultad de excursiones
    NIVEL_DIFICULTAD: [
        { value: 'facil', label: 'Fácil', icon: '😊', color: '#059669' },
        { value: 'moderado', label: 'Moderado', icon: '😐', color: '#d97706' },
        { value: 'dificil', label: 'Difícil', icon: '😰', color: '#dc2626' },
        { value: 'extremo', label: 'Extremo', icon: '🔥', color: '#991b1b' }
    ],

    // Tipos de servicio para pagos
    TIPO_SERVICIO: [
        { value: 'vuelo', label: 'Vuelo', icon: '✈️', color: '#2563eb' },
        { value: 'hotel', label: 'Hotel', icon: '🏨', color: '#7c3aed' },
        { value: 'traslado', label: 'Traslado', icon: '🚌', color: '#059669' },
        { value: 'excursion', label: 'Excursión', icon: '🗺️', color: '#dc2626' },
        { value: 'general', label: 'General', icon: '📋', color: '#6b7280' },
        { value: 'tasas', label: 'Tasas', icon: '📊', color: '#d97706' },
        { value: 'seguros', label: 'Seguros', icon: '🛡️', color: '#7c2d12' }
    ],

    // Condiciones de pago de proveedores
    CONDICIONES_PAGO: [
        { value: 'contado', label: 'Contado', icon: '💵', color: '#059669' },
        { value: '15_dias', label: '15 días', icon: '📅', color: '#6b7280' },
        { value: '30_dias', label: '30 días', icon: '📅', color: '#2563eb' },
        { value: '45_dias', label: '45 días', icon: '📅', color: '#7c3aed' },
        { value: '60_dias', label: '60 días', icon: '📅', color: '#dc2626' },
        { value: 'contra_entrega', label: 'Contra Entrega', icon: '📦', color: '#d97706' }
    ]
};

// ===== FUNCIONES HELPER PARA ENUMs =====

// Obtener información completa de un enum por su value
function getEnumData(enumType, value) {
    const enumArray = ENUMS[enumType];
    if (!enumArray) return null;
    
    return enumArray.find(item => item.value === value) || null;
}

// Obtener solo el label de un enum por su value
function getEnumLabel(enumType, value) {
    const data = getEnumData(enumType, value);
    return data ? data.label : value;
}

// Obtener solo el icono de un enum por su value
function getEnumIcon(enumType, value) {
    const data = getEnumData(enumType, value);
    return data ? data.icon : '';
}

// Obtener solo el color de un enum por su value
function getEnumColor(enumType, value) {
    const data = getEnumData(enumType, value);
    return data ? data.color : '#6b7280';
}

// Generar opciones HTML para un select basado en un enum
function generateEnumOptions(enumType, selectedValue = '', includeEmpty = true) {
    const enumArray = ENUMS[enumType];
    if (!enumArray) return '';
    
    let options = '';
    
    if (includeEmpty) {
        options += '<option value="">Seleccionar...</option>';
    }
    
    options += enumArray.map(item => 
        `<option value="${item.value}" ${item.value === selectedValue ? 'selected' : ''}>
            ${item.label}
        </option>`
    ).join('');
    
    return options;
}

// Crear badges HTML con estilo para mostrar estados
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

// Crear select HTML completo con opciones de enum
function createEnumSelect(enumType, selectedValue = '', attributes = {}) {
    const defaultAttributes = {
        class: 'form-select enum-select',
        ...attributes
    };
    
    const attributeString = Object.entries(defaultAttributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
    
    return `<select ${attributeString}>
        ${generateEnumOptions(enumType, selectedValue)}
    </select>`;
}

// ===== CONFIGURACIÓN GENERAL DE LA APLICACIÓN =====
const APP_CONFIG = {
    // Información de la empresa
    company: {
        name: 'NTS',
        fullName: 'NIEVA TRAVEL SERVICES',
        logo: 'images/nts-logo.png',
        favicon: 'images/favicon.ico'
    },
    
    // Configuración regional
    locale: {
        country: 'Argentina',
        currency: 'ARS',
        currencySymbol: '$',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 1 // Lunes
    },
    
    // Configuración de números y monedas
    formatting: {
        decimals: 2,
        thousandsSeparator: '.',
        decimalSeparator: ',',
        currencyPosition: 'left' // 'left' o 'right'
    },
    
    // Configuración de paginación
    pagination: {
        defaultPageSize: 20,
        pageSizeOptions: [10, 20, 50, 100],
        maxPageSize: 100
    },
    
    // Configuración de validaciones
    validation: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        minPasswordLength: 8,
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phoneRegex: /^[\+]?[1-9][\d]{0,15}$/
    },
    
    // Configuración de la aplicación
    app: {
        version: '1.0.0',
        environment: 'development', // 'development' | 'production'
        debugMode: true,
        autoSave: true,
        autoSaveInterval: 30000 // 30 segundos
    }
};

// ===== MENSAJES DEL SISTEMA =====
const MESSAGES = {
    success: {
        vendedorCreado: '✅ Vendedor creado exitosamente',
        proveedorCreado: '✅ Proveedor creado exitosamente',
        clienteCreado: '✅ Cliente creado exitosamente',
        ventaCreada: '✅ Venta creada exitosamente',
        pagoRegistrado: '✅ Pago registrado correctamente',
        servicioAgregado: '✅ Servicio agregado a la venta',
        datosGuardados: '✅ Datos guardados correctamente',
        sincronizacionExitosa: '✅ Datos sincronizados correctamente'
    },
    
    error: {
        conexionDB: '❌ Error de conexión con la base de datos',
        datosIncompletos: '⚠️ Por favor complete todos los campos requeridos',
        montoInvalido: '⚠️ El monto ingresado no es válido',
        fechaInvalida: '⚠️ La fecha ingresada no es válida',
        emailInvalido: '⚠️ El formato del email no es válido',
        telefonoInvalido: '⚠️ El formato del teléfono no es válido',
        archivoMuyGrande: '⚠️ El archivo es demasiado grande (máximo 5MB)',
        tipoArchivoInvalido: '⚠️ Tipo de archivo no permitido',
        errorInesperado: '❌ Ocurrió un error inesperado',
        noSeEncontro: '❌ No se encontró el registro solicitado'
    },
    
    warning: {
        eliminarVendedor: '⚠️ ¿Está seguro de eliminar este vendedor?',
        eliminarProveedor: '⚠️ ¿Está seguro de eliminar este proveedor?',
        eliminarCliente: '⚠️ ¿Está seguro de eliminar este cliente?',
        eliminarVenta: '⚠️ ¿Está seguro de eliminar esta venta?',
        cambiarEstado: '⚠️ ¿Confirma el cambio de estado?',
        cancelarVenta: '⚠️ ¿Está seguro de cancelar esta venta?',
        datosNoGuardados: '⚠️ Hay cambios sin guardar. ¿Desea continuar?'
    },
    
    info: {
        cargando: '⏳ Cargando datos...',
        guardando: '💾 Guardando cambios...',
        sincronizando: '🔄 Sincronizando datos...',
        noResultados: '📭 No se encontraron resultados',
        sinDatos: '📝 No hay datos para mostrar',
        seleccioneOpcion: 'ℹ️ Seleccione una opción',
        funcionNoDisponible: 'ℹ️ Función no disponible en esta versión'
    }
};

// ===== CONFIGURACIÓN DE TABLAS =====
const TABLE_CONFIG = {
    vendedores: {
        title: 'Gestión de Vendedores',
        icon: '👥',
        columns: ['nombre', 'codigo_vendedor', 'rol', 'comision_porcentaje', 'activo'],
        searchFields: ['nombre', 'email', 'codigo_vendedor'],
        sortField: 'nombre'
    },
    
    proveedores: {
        title: 'Gestión de Proveedores',
        icon: '🏢',
        columns: ['nombre', 'tipo', 'email', 'comision_porcentaje', 'activo'],
        searchFields: ['nombre', 'email', 'tipo'],
        sortField: 'nombre'
    },
    
    clientes: {
        title: 'Gestión de Clientes',
        icon: '👤',
        columns: ['nombre', 'email', 'telefono', 'vendedor_id', 'total_compras'],
        searchFields: ['nombre', 'email', 'telefono', 'documento'],
        sortField: 'nombre'
    },
    
    ventas: {
        title: 'Gestión de Ventas',
        icon: '💰',
        columns: ['numero_venta', 'cliente_id', 'vendedor_id', 'total_final', 'estado_pago'],
        searchFields: ['numero_venta', 'observaciones'],
        sortField: 'created_at'
    }
};

// ===== EXPORT PARA USO GLOBAL =====
window.NTS_CONFIG = {
    // Core
    supabase,
    isSupabaseConnected,
    ENUMS,
    APP_CONFIG,
    MESSAGES,
    TABLE_CONFIG,
    
    // Helper functions
    getEnumData,
    getEnumLabel,
    getEnumIcon,
    getEnumColor,
    generateEnumOptions,
    createEnumBadge,
    createEnumSelect
};

console.log('✅ Configuración NTS cargada correctamente');
console.log('🔗 Supabase:', isSupabaseConnected ? 'Conectado' : 'Desconectado');
