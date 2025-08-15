// 🔧 UTILS.JS - FUNCIONES UTILITARIAS NTS
// Archivo: js/utils.js

console.log('🔧 Cargando utilidades NTS...');

// ===== UTILIDADES DE FORMATO =====

// Formatear moneda
function formatCurrency(amount, includeCurrencySymbol = true) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    
    const { APP_CONFIG } = window.NTS_CONFIG || {};
    const config = APP_CONFIG?.formatting || {
        decimals: 2,
        thousandsSeparator: '.',
        decimalSeparator: ',',
        currencyPosition: 'left'
    };
    
    const symbol = APP_CONFIG?.locale?.currencySymbol || '$';
    
    // Formatear número
    const formatted = amount.toLocaleString('es-AR', {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals
    });
    
    if (!includeCurrencySymbol) {
        return formatted;
    }
    
    return config.currencyPosition === 'left' 
        ? `${symbol}${formatted}`
        : `${formatted} ${symbol}`;
}

// Formatear fecha
function formatDate(date, format = 'DD/MM/YYYY') {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    switch (format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'DD/MM/YY':
            return `${day}/${month}/${String(year).slice(-2)}`;
        default:
            return dateObj.toLocaleDateString('es-AR');
    }
}

// Formatear fecha y hora
function formatDateTime(date, includeSeconds = false) {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '';
    
    const dateStr = formatDate(dateObj);
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    let timeStr = `${hours}:${minutes}`;
    
    if (includeSeconds) {
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        timeStr += `:${seconds}`;
    }
    
    return `${dateStr} ${timeStr}`;
}

// Formatear teléfono
function formatPhone(phone) {
    if (!phone) return '';
    
    // Remover caracteres no numéricos excepto +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Formato argentino
    if (cleaned.startsWith('+54')) {
        const number = cleaned.slice(3);
        if (number.length === 10) {
            return `+54 ${number.slice(0, 2)} ${number.slice(2, 6)}-${number.slice(6)}`;
        }
    }
    
    return cleaned;
}

// Formatear porcentaje
function formatPercentage(value, decimals = 1) {
    if (typeof value !== 'number') {
        value = parseFloat(value) || 0;
    }
    
    return `${value.toFixed(decimals)}%`;
}

// ===== VALIDACIONES =====

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar teléfono
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleaned = phone.replace(/[^\d+]/g, '');
    return phoneRegex.test(cleaned);
}

// Validar fecha
function isValidDate(date) {
    if (!date) return false;
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
}

// Validar número positivo
function isPositiveNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
}

// Validar rango de fechas
function isValidDateRange(startDate, endDate) {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return false;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return start <= end;
}

// ===== MANIPULACIÓN DEL DOM =====

// Obtener valor de elemento
function getValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value.trim() : '';
}

// Establecer valor de elemento
function setValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value || '';
    }
}

// Obtener texto de elemento
function getText(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.textContent.trim() : '';
}

// Establecer texto de elemento
function setText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text || '';
    }
}

// Mostrar/ocultar elemento
function toggleElement(elementId, show = null) {
    const element = document.getElementById(elementId);
    if (element) {
        if (show === null) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        } else {
            element.style.display = show ? 'block' : 'none';
        }
    }
}

// Agregar clase CSS
function addClass(elementId, className) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add(className);
    }
}

// Remover clase CSS
function removeClass(elementId, className) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove(className);
    }
}

// Toggle clase CSS
function toggleClass(elementId, className) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.toggle(className);
    }
}

// Verificar si elemento tiene clase
function hasClass(elementId, className) {
    const element = document.getElementById(elementId);
    return element ? element.classList.contains(className) : false;
}

// ===== SISTEMA DE LOADER =====

let loaderElement = null;

function showLoader(message = 'Cargando...', target = null) {
    hideLoader(); // Remover loader existente
    
    const container = target || document.body;
    
    loaderElement = document.createElement('div');
    loaderElement.id = 'nts-loader';
    loaderElement.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(2px);
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                max-width: 300px;
                min-width: 200px;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f0f0f0;
                    border-top: 4px solid #00bcd4;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <div style="
                    color: #333;
                    font-size: 16px;
                    font-weight: 500;
                ">${message}</div>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    container.appendChild(loaderElement);
}

function hideLoader() {
    if (loaderElement) {
        loaderElement.remove();
        loaderElement = null;
    }
}

// ===== SISTEMA DE NOTIFICACIONES =====

let notificationContainer = null;

function initNotificationSystem() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'nts-notifications';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(notificationContainer);
    }
}

function showNotification(message, type = 'info', duration = 5000) {
    initNotificationSystem();
    
    const colors = {
        success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
        error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
        warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
        info: { bg: '#cce5ff', border: '#b3d9ff', text: '#004085' }
    };
    
    const color = colors[type] || colors.info;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${color.bg};
        border: 1px solid ${color.border};
        color: ${color.text};
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 350px;
        word-wrap: break-word;
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: space-between;
    `;
    
    notification.innerHTML = `
        <span>${message}</span>
        <button style="
            background: none;
            border: none;
            color: ${color.text};
            cursor: pointer;
            font-size: 18px;
            margin-left: 10px;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">&times;</button>
    `;
    
    // Agregar al contenedor
    notificationContainer.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Configurar botón de cerrar
    const closeBtn = notification.querySelector('button');
    closeBtn.addEventListener('click', () => removeNotification(notification));
    
    // Auto-remover después del tiempo especificado
    if (duration > 0) {
        setTimeout(() => removeNotification(notification), duration);
    }
    
    return notification;
}

function removeNotification(notification) {
    if (notification && notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// ===== UTILIDADES DE DATOS =====

// Generar ID único
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Generar número de venta
function generateSaleNumber(prefix = 'NTS') {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${year}-${timestamp}`;
}

// Limpiar objeto de valores vacíos
function cleanObject(obj) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
            cleaned[key] = value;
        }
    }
    
    return cleaned;
}

// Clonar objeto profundo
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Combinar objetos
function mergeObjects(...objects) {
    return Object.assign({}, ...objects);
}

// ===== UTILIDADES DE ARRAY =====

// Agrupar array por propiedad
function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
}

// Ordenar array por propiedad
function sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

// Filtrar array por múltiples criterios
function filterBy(array, filters) {
    return array.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true; // Si el filtro está vacío, no filtrar
            
            const itemValue = item[key];
            
            if (typeof itemValue === 'string') {
                return itemValue.toLowerCase().includes(value.toLowerCase());
            }
            
            return itemValue === value;
        });
    });
}

// ===== UTILIDADES DE ALMACENAMIENTO =====

// Guardar en localStorage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
        return false;
    }
}

// Cargar desde localStorage
function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error cargando desde localStorage:', error);
        return defaultValue;
    }
}

// Remover de localStorage
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removiendo de localStorage:', error);
        return false;
    }
}

// ===== UTILIDADES DE URL Y ARCHIVOS =====

// Descargar archivo
function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Exportar a CSV
function exportToCSV(data, filename = 'export.csv') {
    if (!Array.isArray(data) || data.length === 0) {
        showNotification('No hay datos para exportar', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const cell = row[header] || '';
                // Escapar comillas y envolver en comillas si contiene comas
                return typeof cell === 'string' && cell.includes(',') 
                    ? `"${cell.replace(/"/g, '""')}"` 
                    : cell;
            }).join(',')
        )
    ].join('\n');
    
    downloadFile(csvContent, filename, 'text/csv');
}

// ===== UTILIDADES DE FECHA =====

// Obtener fecha actual en formato YYYY-MM-DD
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Obtener fecha y hora actual en formato local
function getCurrentDateTime() {
    return new Date().toLocaleString('es-AR');
}

// Calcular diferencia de días entre fechas
function daysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Agregar días a una fecha
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// ===== UTILIDADES DE ERROR =====

// Manejar errores de manera consistente
function handleError(error, context = 'Operación') {
    console.error(`❌ Error en ${context}:`, error);
    
    let message = `Error en ${context}`;
    
    if (error.message) {
        message += `: ${error.message}`;
    }
    
    showNotification(message, 'error');
    
    // En desarrollo, mostrar más detalles
    if (window.NTS_CONFIG?.APP_CONFIG?.app?.debugMode) {
        console.error('Stack trace:', error.stack);
    }
}

// ===== UTILIDADES DE RENDIMIENTO =====

// Debounce para optimizar búsquedas
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

// Throttle para optimizar eventos de scroll
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== EXPORT PARA USO GLOBAL =====
window.NTS_UTILS = {
    // Formato
    formatCurrency,
    formatDate,
    formatDateTime,
    formatPhone,
    formatPercentage,
    
    // Validaciones
    isValidEmail,
    isValidPhone,
    isValidDate,
    isPositiveNumber,
    isValidDateRange,
    
    // DOM
    getValue,
    setValue,
    getText,
    setText,
    toggleElement,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    
    // Loader y Notificaciones
    showLoader,
    hideLoader,
    showNotification,
    removeNotification,
    
    // Datos
    generateId,
    generateSaleNumber,
    cleanObject,
    deepClone,
    mergeObjects,
    
    // Arrays
    groupBy,
    sortBy,
    filterBy,
    
    // Almacenamiento
    saveToStorage,
    loadFromStorage,
    removeFromStorage,
    
    // Archivos
    downloadFile,
    exportToCSV,
    
    // Fechas
    getCurrentDate,
    getCurrentDateTime,
    daysDifference,
    addDays,
    
    // Errores
    handleError,
    
    // Rendimiento
    debounce,
    throttle
};

console.log('✅ Utilidades NTS cargadas correctamente');
