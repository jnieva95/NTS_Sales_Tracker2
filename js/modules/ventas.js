// 💰 MÓDULO DE VENTAS - VERSIÓN COMPLETA SIN DUPLICADOS
// Archivo: js/modules/ventas.js

import { supabase, isSupabaseConnected } from '../config.js';

console.log('💰 Cargando módulo de ventas (versión sin duplicados)...');

// ===== ESTADO DEL MÓDULO =====
const VentasModule = {
    currentVenta: {
        cliente: {},
        servicios: [],
        total: 0,
        vendedor_id: null
    },
    vendedores: [],
    proveedores: [],
    clientesExistentes: [],
    isInitialized: false
};

// ===== INICIALIZACIÓN DEL MÓDULO =====
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
        
        VentasModule.isInitialized = true;
        console.log('✅ Módulo de ventas inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando módulo de ventas:', error);
    }
}

// ===== CARGAR DATOS =====
async function loadVentasData() {
    if (!isSupabaseConnected || !supabase) {
        console.log('⚠️ Supabase no disponible - usando datos demo');
        loadMockData();
        return;
    }
    
    try {
        console.log('📊 Cargando datos desde Supabase...');
        
        // Cargar vendedores
        const { data: vendedores, error: vendedoresError } = await supabase
            .from('vendedores')
            .select('id, nombre, codigo_vendedor, rol, comision_porcentaje')
            .eq('activo', true)
            .order('nombre');
        
        if (vendedoresError) throw vendedoresError;
        
        // Cargar proveedores
        const { data: proveedores, error: proveedoresError } = await supabase
            .from('proveedores')
            .select('id, nombre, tipo, comision_porcentaje')
            .eq('activo', true)
            .order('nombre');
        
        if (proveedoresError) throw proveedoresError;
        
        // Cargar clientes
        const { data: clientes, error: clientesError } = await supabase
            .from('clientes')
            .select('id, nombre, email, telefono, vendedor_id, DNI, Pasaporte, dni_expiracion, pasaporte_expiracion')
            .order('nombre');
        
        if (clientesError) throw clientesError;
        
        // Asignar datos
        VentasModule.vendedores = vendedores || [];
        VentasModule.proveedores = proveedores || [];
        VentasModule.clientesExistentes = clientes || [];
        
        console.log('✅ Datos cargados:', {
            vendedores: VentasModule.vendedores.length,
            proveedores: VentasModule.proveedores.length,
            clientes: VentasModule.clientesExistentes.length
        });
        
    } catch (error) {
        console.error('❌ Error cargando datos desde Supabase:', error);
        loadMockData();
    }
}

function loadMockData() {
    VentasModule.vendedores = [
        { id: 1, nombre: 'Ana García', codigo_vendedor: 'V001', rol: 'gerente', comision_porcentaje: 6 },
        { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002', rol: 'vendedor', comision_porcentaje: 5 }
    ];
    
    VentasModule.proveedores = [
        { id: 1, nombre: 'Aerolíneas Demo', tipo: 'vuelos', comision_porcentaje: 8 },
        { id: 2, nombre: 'Hoteles Demo', tipo: 'hoteles', comision_porcentaje: 15 },
        { id: 3, nombre: 'Traslados Demo', tipo: 'traslados', comision_porcentaje: 20 },
        { id: 4, nombre: 'Excursiones Demo', tipo: 'excursiones', comision_porcentaje: 25 }
    ];
    
    VentasModule.clientesExistentes = [];
    
    console.log('✅ Datos demo cargados');
}

// ===== CONFIGURAR INTERFAZ =====
function setupVentasUI() {
    console.log('🎨 Configurando interfaz...');

    // Poblar select de vendedores
    createVendedorSelect();

    // Configurar autocompletado de clientes
    setupClienteAutocomplete();

    // Configurar toggle de documentos
    setupDocumentoToggle();

    // Crear selects de proveedores
    createProveedorSelects();

    // Configuración adicional puede agregarse aquí
}

function createVendedorSelect() {
    const select = document.getElementById('vendedor-select-nts');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar vendedor...</option>';
    VentasModule.vendedores.forEach(vendedor => {
        const option = document.createElement('option');
        option.value = vendedor.id;
        option.textContent = `${vendedor.nombre} (${vendedor.codigo_vendedor}) - ${vendedor.rol}`;
        select.appendChild(option);
    });

    console.log('✅ Select de vendedores cargado');
}

function toggleDocumentoFields(selected) {
    const tipo = selected || document.getElementById('cliente-doc-tipo')?.value || 'dni';
    const isDNI = tipo === 'dni';
    document.getElementById('grupo-dni')?.classList.toggle('hidden', !isDNI);
    document.getElementById('grupo-dni-exp')?.classList.toggle('hidden', !isDNI);
    document.getElementById('grupo-pasaporte')?.classList.toggle('hidden', isDNI);
    document.getElementById('grupo-pasaporte-exp')?.classList.toggle('hidden', isDNI);
}

function setupDocumentoToggle() {
    const select = document.getElementById('cliente-doc-tipo');
    if (!select) return;
    select.addEventListener('change', (e) => toggleDocumentoFields(e.target.value));
    toggleDocumentoFields(select.value);
    window.toggleDocumentoFields = toggleDocumentoFields;
}


function setupClienteAutocomplete() {
    const clienteNombre = document.getElementById('cliente-nombre');
    const clienteApellido = document.getElementById('cliente-apellido');
    if (!clienteNombre) return;

    // Crear container de búsqueda
    const searchContainer = document.createElement('div');
    searchContainer.className = 'cliente-search-container';
    searchContainer.style.cssText = `
        position: relative;
        width: 100%;
    `;

    // Envolver el input original
    const originalParent = clienteNombre.parentNode;
    originalParent.insertBefore(searchContainer, clienteNombre);
    searchContainer.appendChild(clienteNombre);

    // Crear dropdown de resultados
    const dropdown = document.createElement('div');
    dropdown.id = 'cliente-search-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid var(--gray-300);
        border-top: none;
        border-radius: 0 0 0.5rem 0.5rem;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    `;
    searchContainer.appendChild(dropdown);

    // Agregar icono de búsqueda
    clienteNombre.placeholder = "🔍 Buscar cliente existente o crear nuevo...";
    
    let searchTimeout;
    
    // Event listener para búsqueda en tiempo real
    clienteNombre.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const searchTerm = this.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            hideDropdown();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchClientes(searchTerm);
        }, 300); // Debounce de 300ms
    });

    // Ocultar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!searchContainer.contains(e.target)) {
            hideDropdown();
        }
    });

    function searchClientes(searchTerm) {
        // Filtrar clientes que coincidan con el término de búsqueda
        const clientesFiltrados = VentasModule.clientesExistentes.filter(cliente => {
            return cliente.nombre.toLowerCase().includes(searchTerm) ||
                   (cliente.email && cliente.email.toLowerCase().includes(searchTerm)) ||
                   (cliente.telefono && cliente.telefono.includes(searchTerm)) ||
                   (cliente.DNI && cliente.DNI.includes(searchTerm)) ||
                   (cliente.Pasaporte && cliente.Pasaporte.includes(searchTerm));
        });

        showSearchResults(clientesFiltrados, searchTerm);
    }

    function showSearchResults(clientes, searchTerm) {
        const dropdown = document.getElementById('cliente-search-dropdown');
        
        if (clientes.length === 0) {
            dropdown.innerHTML = `
                <div class="search-result-item no-results" id="crear-cliente-item">
                    <div class="no-results-content">
                        <i data-lucide="user-plus"></i>
                        <span>Crear cliente: "${searchTerm}"</span>
                    </div>
                </div>
            `;
            const crearItem = dropdown.querySelector('#crear-cliente-item');
            if (crearItem) {
                crearItem.addEventListener('click', () => showNuevoClienteModal(searchTerm));
            }
        } else {
            dropdown.innerHTML = clientes.map(cliente => `
                <div class="search-result-item" onclick="selectCliente(${cliente.id}, '${cliente.nombre}', '${cliente.email || ''}', '${cliente.telefono || ''}', '${cliente.DNI || ''}', '${cliente.Pasaporte || ''}', '${cliente.dni_expiracion || ''}', '${cliente.pasaporte_expiracion || ''}')">
                    <div class="cliente-info">
                        <div class="cliente-nombre">${highlightMatch(cliente.nombre, searchTerm)}</div>
                        <div class="cliente-detalles">
                            ${cliente.email ? `📧 ${cliente.email}` : ''} 
                            ${cliente.telefono ? `📱 ${cliente.telefono}` : ''}
                        </div>
                    </div>
                    <div class="cliente-status">
                        <span class="status-badge existing">Existente</span>
                    </div>
                </div>
            `).join('');
        }
        
        dropdown.style.display = 'block';
        
        // Re-inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function hideDropdown() {
        const dropdown = document.getElementById('cliente-search-dropdown');
        dropdown.style.display = 'none';
    }

    function highlightMatch(text, searchTerm) {
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}

// NUEVA FUNCIÓN GLOBAL: Seleccionar cliente
window.selectCliente = function(id, nombre, email, telefono, dni, pasaporte, dniExp, pasaporteExp) {
    const [first, ...rest] = nombre.split(' ');
    document.getElementById('cliente-nombre').value = first;
    document.getElementById('cliente-apellido').value = rest.join(' ');
    document.getElementById('cliente-email').value = email;
    document.getElementById('cliente-telefono').value = telefono;

    const tipoSelect = document.getElementById('cliente-doc-tipo');
    if (dni) {
        tipoSelect.value = 'dni';
        toggleDocumentoFields('dni');
        document.getElementById('cliente-dni').value = dni;
        document.getElementById('cliente-dni-expiracion').value = dniExp || '';
        document.getElementById('cliente-pasaporte').value = '';
        document.getElementById('cliente-pasaporte-expiracion').value = '';
    } else {
        tipoSelect.value = 'pasaporte';
        toggleDocumentoFields('pasaporte');
        document.getElementById('cliente-pasaporte').value = pasaporte;
        document.getElementById('cliente-pasaporte-expiracion').value = pasaporteExp || '';
        document.getElementById('cliente-dni').value = '';
        document.getElementById('cliente-dni-expiracion').value = '';
    }

    VentasModule.currentVenta.cliente = {
        id,
        nombre,
        email,
        telefono,
        dni,
        pasaporte,
        dni_expiracion: dniExp || null,
        pasaporte_expiracion: pasaporteExp || null,
        esExistente: true
    };

    document.getElementById('cliente-search-dropdown').style.display = 'none';
    showNotification(`✅ Cliente seleccionado: ${nombre}`, 'success');
    document.getElementById('cliente-email')?.focus();
};

function showNuevoClienteModal(nombre = '') {
    const modal = document.getElementById('nuevo-cliente-modal');
    if (!modal) return;

    const form = document.getElementById('nuevo-cliente-form');
    form?.reset();
    const [first, ...rest] = nombre.split(' ');
    document.getElementById('nuevo-cliente-nombre').value = first;
    document.getElementById('nuevo-cliente-apellido').value = rest.join(' ');
    modal.style.display = 'flex';
    toggleNuevoClienteDocFields(document.getElementById('nuevo-cliente-doc-tipo')?.value);

    setTimeout(() => {
        document.getElementById('nuevo-cliente-nombre')?.focus();
    }, 100);
}

function hideNuevoClienteModal() {
    const modal = document.getElementById('nuevo-cliente-modal');
    if (modal) modal.style.display = 'none';
}

function toggleNuevoClienteDocFields(tipo) {
    const isDNI = (tipo || 'dni') === 'dni';
    document.getElementById('nuevo-grupo-dni')?.classList.toggle('hidden', !isDNI);
    document.getElementById('nuevo-grupo-dni-exp')?.classList.toggle('hidden', !isDNI);
    document.getElementById('nuevo-grupo-pasaporte')?.classList.toggle('hidden', isDNI);
    document.getElementById('nuevo-grupo-pasaporte-exp')?.classList.toggle('hidden', isDNI);
}

async function saveNuevoCliente() {
    const nombre = document.getElementById('nuevo-cliente-nombre')?.value?.trim();
    const apellido = document.getElementById('nuevo-cliente-apellido')?.value?.trim();
    if (!nombre || !apellido) {
        showNotification('⚠️ Ingrese nombre y apellido válidos', 'warning');
        return;
    }

    const email = document.getElementById('nuevo-cliente-email')?.value?.trim();
    const telefono = document.getElementById('nuevo-cliente-telefono')?.value?.trim();
    const docTipo = document.getElementById('nuevo-cliente-doc-tipo')?.value;
    const dni = document.getElementById('nuevo-cliente-dni')?.value?.trim();
    const dniExp = document.getElementById('nuevo-cliente-dni-exp')?.value;
    const pasaporte = document.getElementById('nuevo-cliente-pasaporte')?.value?.trim();
    const pasaporteExp = document.getElementById('nuevo-cliente-pasaporte-exp')?.value;

    const clienteData = {
        nombre: [nombre, apellido].join(' '),
        email,
        telefono,
    };

    if (docTipo === 'dni') {
        clienteData.DNI = dni || null;
        clienteData.dni_expiracion = dniExp || null;
    } else {
        clienteData.Pasaporte = pasaporte || null;
        clienteData.pasaporte_expiracion = pasaporteExp || null;
    }

    try {
        const { supabase, isSupabaseConnected } = window.NTS_CONFIG || {};
        if (!isSupabaseConnected || !supabase) {
            throw new Error('Supabase no disponible');
        }
        const { data, error } = await supabase
            .from('clientes')
            .insert(clienteData)
            .select()
            .single();
        if (error || !data) throw error || new Error('No se pudo crear cliente');

        VentasModule.clientesExistentes.push(data);
        selectCliente(data.id, data.nombre, data.email || '', data.telefono || '', data.DNI || '', data.Pasaporte || '', data.dni_expiracion || '', data.pasaporte_expiracion || '');
        hideNuevoClienteModal();
        showNotification('✅ Cliente creado correctamente', 'success');
    } catch (err) {
        console.error('Error creando cliente:', err);
        showNotification('❌ Error creando cliente', 'error');
    }
}

function createProveedorSelects() {
    const serviceForms = ['vuelo', 'hotel', 'traslado', 'excursion'];
    
    serviceForms.forEach(serviceType => {
        const serviceForm = document.getElementById(`service-${serviceType}`);
        if (!serviceForm) return;
        
        // Verificar si ya existe
        if (serviceForm.querySelector('.proveedor-select-nts')) return;
        
        // Crear fila de proveedor
        const proveedorRow = document.createElement('div');
        proveedorRow.className = 'form-row';
        proveedorRow.style.marginTop = '15px';
        proveedorRow.style.paddingTop = '15px';
        proveedorRow.style.borderTop = '1px solid #e2e8f0';
        
        proveedorRow.innerHTML = `
            <div>
                <label><strong>🏢 Proveedor</strong></label>
                <select class="proveedor-select-nts" data-service="${serviceType}">
                    <option value="">Seleccionar proveedor...</option>
                </select>
            </div>
            <div>
                <label><strong>💰 Precio Costo</strong></label>
                <input type="number" class="precio-costo-nts" placeholder="0.00" step="0.01" min="0">
                <small>Precio que te cobra el proveedor</small>
            </div>
        `;
        
        // Insertar después del primer form-row
        const firstRow = serviceForm.querySelector('.form-row');
        if (firstRow) {
            firstRow.parentNode.insertBefore(proveedorRow, firstRow.nextSibling);
        }
        
        // Llenar select con proveedores filtrados
        const select = proveedorRow.querySelector('.proveedor-select-nts');
        const tipoMapping = {
            'vuelo': 'vuelos',
            'hotel': 'hoteles',
            'traslado': 'traslados',
            'excursion': 'excursiones'
        };
        
        const proveedoresFiltrados = VentasModule.proveedores.filter(p => 
            p.tipo === tipoMapping[serviceType] || p.tipo === 'mixto'
        );
        
        proveedoresFiltrados.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.id;
            option.textContent = `${proveedor.nombre} (${proveedor.tipo})`;
            select.appendChild(option);
        });
    });
    
    console.log('✅ Selects de proveedores creados');
}

// ===== CONFIGURAR FLATPICKR - VERSIÓN SIN DUPLICADOS =====
function setupFlatpickrFields() {
    console.log('📅 Configurando Flatpickr...');
    
    // Verificar que Flatpickr esté disponible
    if (typeof flatpickr === 'undefined') {
        console.error('❌ Flatpickr no está cargado');
        return;
    }
    
    // ELIMINAR TODOS LOS CAMPOS DE FECHA EXISTENTES PRIMERO
    const vueloForm = document.getElementById('service-vuelo');
    if (!vueloForm) return;
    
    // Buscar y eliminar campos de fecha existentes
    const existingDateFields = vueloForm.querySelectorAll('[id*="fecha"], [id*="flat"]');
    existingDateFields.forEach(field => {
        const parentRow = field.closest('.form-row');
        if (parentRow && !parentRow.querySelector('#vuelo-origen')) { // No eliminar row principal
            parentRow.remove();
        }
    });
    
    // Buscar container o crearlo
    let dateContainer = document.getElementById('campos-fecha-container');
    if (!dateContainer) {
        dateContainer = document.createElement('div');
        dateContainer.id = 'campos-fecha-container';
        
        // Insertar después de la descripción
        const descripcionRow = vueloForm.querySelector('.form-row');
        if (descripcionRow && descripcionRow.nextSibling) {
            descripcionRow.parentNode.insertBefore(dateContainer, descripcionRow.nextSibling);
        } else {
            vueloForm.appendChild(dateContainer);
        }
    }
    
    // Limpiar container
    dateContainer.innerHTML = '';
    
    // Crear campos iniciales
    createDateFieldsForType('ida_vuelta'); // Por defecto ida y vuelta
    
    // Configurar listener para cambio de tipo
    const tipoSelect = document.getElementById('vuelo-itinerario');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            console.log(`🔄 Cambiando tipo de vuelo a: ${this.value}`);
            createDateFieldsForType(this.value);
        });
    }
    
    console.log('✅ Flatpickr configurado correctamente');
}

// ===== CREAR CAMPOS DE FECHA DINÁMICAMENTE =====
function createDateFieldsForType(tipoVuelo) {
    const dateContainer = document.getElementById('campos-fecha-container');
    if (!dateContainer) return;
    
    // Limpiar container
    dateContainer.innerHTML = '';
    
    // Configuración base para Flatpickr
    const flatpickrConfig = {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        minDate: "today",
        locale: "es",
        allowInput: false,
        clickOpens: true,
        theme: "material_blue"
    };
    
    switch(tipoVuelo) {
        case 'ida':
            dateContainer.innerHTML = `
                <div class="form-row">
                    <div>
                        <label><strong>🛫 Fecha y Hora de Salida *</strong></label>
                        <input type="text" id="vuelo-fecha-salida-flat" placeholder="📅 Seleccionar fecha y hora de salida..." required>
                        <small>Fecha y hora de despegue</small>
                    </div>
                    <div>
                        <label><strong>🛬 Fecha y Hora de Llegada</strong></label>
                        <input type="text" id="vuelo-fecha-llegada-flat" placeholder="📅 Seleccionar fecha y hora de llegada...">
                        <small>Fecha y hora de aterrizaje (opcional)</small>
                    </div>
                </div>
            `;
            break;
            
        case 'ida_vuelta':
            dateContainer.innerHTML = `
                <div class="form-row">
                    <div>
                        <label><strong>🛫 Fecha y Hora de Salida *</strong></label>
                        <input type="text" id="vuelo-fecha-salida-flat" placeholder="📅 Seleccionar fecha y hora de salida..." required>
                        <small>Fecha y hora de despegue</small>
                    </div>
                    <div>
                        <label><strong>🛬 Fecha y Hora de Llegada</strong></label>
                        <input type="text" id="vuelo-fecha-llegada-flat" placeholder="📅 Seleccionar fecha y hora de llegada...">
                        <small>Fecha y hora de aterrizaje (opcional)</small>
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <label><strong>🔄 Fecha y Hora de Regreso *</strong></label>
                        <input type="text" id="vuelo-fecha-regreso-flat" placeholder="📅 Seleccionar fecha y hora de regreso..." required>
                        <small>Fecha y hora de despegue del regreso</small>
                    </div>
                    <div>
                        <label><strong>🛬 Llegada del Regreso</strong></label>
                        <input type="text" id="vuelo-fecha-llegada-regreso-flat" placeholder="📅 Seleccionar fecha y hora de llegada del regreso...">
                        <small>Fecha y hora de aterrizaje del regreso (opcional)</small>
                    </div>
                </div>
            `;
            break;
            
        case 'multitramo':
        case 'stopover':
            dateContainer.innerHTML = `
                <div class="form-row">
                    <div>
                        <label><strong>🛫 Fecha y Hora de Salida *</strong></label>
                        <input type="text" id="vuelo-fecha-salida-flat" placeholder="📅 Seleccionar fecha y hora de salida..." required>
                        <small>Fecha y hora de despegue</small>
                    </div>
                    <div>
                        <label><strong>📝 Observaciones del Itinerario</strong></label>
                        <textarea id="vuelo-itinerario-observaciones" placeholder="Detalles del itinerario multitramo, escalas, etc..." rows="3"></textarea>
                        <small>Describa las escalas y tramos del viaje</small>
                    </div>
                </div>
            `;
            break;
    }
    
    // Inicializar Flatpickr en los nuevos campos
    setTimeout(() => {
        initializeFlatpickrFields(flatpickrConfig);
    }, 100);
}

function initializeFlatpickrFields(config) {
    // Inicializar campo de salida
    const salidaField = document.getElementById('vuelo-fecha-salida-flat');
    if (salidaField && !salidaField._flatpickr) {
        flatpickr(salidaField, {
            ...config,
            onChange: function(selectedDates, dateStr) {
                // Actualizar fecha mínima de llegada
                const llegadaField = document.getElementById('vuelo-fecha-llegada-flat');
                if (llegadaField && llegadaField._flatpickr) {
                    llegadaField._flatpickr.set('minDate', dateStr);
                }
                
                // Actualizar fecha mínima de regreso
                const regresoField = document.getElementById('vuelo-fecha-regreso-flat');
                if (regresoField && regresoField._flatpickr) {
                    regresoField._flatpickr.set('minDate', dateStr);
                }
            }
        });
    }
    
    // Inicializar campo de llegada
    const llegadaField = document.getElementById('vuelo-fecha-llegada-flat');
    if (llegadaField && !llegadaField._flatpickr) {
        flatpickr(llegadaField, config);
    }
    
    // Inicializar campo de regreso
    const regresoField = document.getElementById('vuelo-fecha-regreso-flat');
    if (regresoField && !regresoField._flatpickr) {
        flatpickr(regresoField, {
            ...config,
            onChange: function(selectedDates, dateStr) {
                // Actualizar fecha mínima de llegada del regreso
                const llegadaRegresoField = document.getElementById('vuelo-fecha-llegada-regreso-flat');
                if (llegadaRegresoField && llegadaRegresoField._flatpickr) {
                    llegadaRegresoField._flatpickr.set('minDate', dateStr);
                }
            }
        });
    }
    
    // Inicializar campo de llegada del regreso
    const llegadaRegresoField = document.getElementById('vuelo-fecha-llegada-regreso-flat');
    if (llegadaRegresoField && !llegadaRegresoField._flatpickr) {
        flatpickr(llegadaRegresoField, config);
    }
}

// ===== CONFIGURAR EVENTOS =====
function setupVentasEvents() {
    console.log('🎯 Configurando eventos...');
    
    // Event listener para botones de agregar servicio
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-add-service[data-service]')) {
            e.preventDefault();
            const serviceType = e.target.getAttribute('data-service');
            agregarServicioMejorado(serviceType);
        }
    });
    
    // Event listener para calcular márgenes
    document.addEventListener('input', function(e) {
        if (e.target.matches('.precio-costo-nts') || e.target.matches('[id$="-precio"]')) {
            calculateMargin(e.target);
        }
    });

    // Event listener para botón de agregar tramo
    document.addEventListener('click', function(e) {
        if (e.target.matches('#add-segment-btn')) {
            e.preventDefault();
            if (typeof addSegmentRow === 'function') {
                addSegmentRow();
            }
        }
    });

    // Eventos del modal de nuevo cliente
    const closeBtn = document.getElementById('close-nuevo-cliente-modal');
    const cancelBtn = document.getElementById('cancel-nuevo-cliente');
    const saveBtn = document.getElementById('save-nuevo-cliente');
    const tipoSelect = document.getElementById('nuevo-cliente-doc-tipo');

    closeBtn?.addEventListener('click', hideNuevoClienteModal);
    cancelBtn?.addEventListener('click', hideNuevoClienteModal);
    saveBtn?.addEventListener('click', saveNuevoCliente);
    tipoSelect?.addEventListener('change', (e) => toggleNuevoClienteDocFields(e.target.value));
    toggleNuevoClienteDocFields(tipoSelect?.value);
}

function calculateMargin(element) {
    const serviceForm = element.closest('.service-form');
    if (!serviceForm) return;
    
    const precioCosto = parseFloat(serviceForm.querySelector('.precio-costo-nts')?.value) || 0;
    const precioVenta = parseFloat(serviceForm.querySelector('[id$="-precio"]')?.value) || 0;
    
    if (precioCosto > 0 && precioVenta > 0) {
        const margen = precioVenta - precioCosto;
        const porcentaje = ((margen / precioCosto) * 100).toFixed(1);
        
        // Mostrar margen
        let margenDisplay = serviceForm.querySelector('.margen-display-nts');
        if (!margenDisplay) {
            margenDisplay = document.createElement('div');
            margenDisplay.className = 'margen-display-nts margen-display';
            serviceForm.appendChild(margenDisplay);
        }
        
        const color = margen >= 0 ? '#27ae60' : '#e74c3c';
        const icon = margen >= 0 ? '✅' : '⚠️';
        
        margenDisplay.innerHTML = `
            💰 <strong>Margen:</strong> $${margen.toLocaleString()} (${porcentaje}%) 
            <span style="color: ${color};">${icon} ${margen >= 0 ? 'Ganancia' : 'Pérdida'}</span>
        `;
    }
}

// ===== AGREGAR SERVICIOS =====
function agregarServicioMejorado(tipo) {
    console.log(`➕ Agregando servicio: ${tipo}`);
    
    const serviceData = getServiceFormData(tipo);
    
    if (!validateServiceData(serviceData, tipo)) {
        return;
    }
    
    // Agregar al estado
    serviceData.id = Date.now();
    serviceData.tipo = tipo;
    serviceData.margen_ganancia = (serviceData.precio_venta || 0) - (serviceData.precio_costo || 0);
    
    VentasModule.currentVenta.servicios.push(serviceData);
    
    // Actualizar vista
    renderServiciosAgregados();
    updateVentaTotals();
    clearServiceForm(tipo);
    
    showNotification(`✅ ${tipo} agregado correctamente`, 'success');
}

function getServiceFormData(tipo) {
    const serviceForm = document.getElementById(`service-${tipo}`);
    
    const baseData = {
        proveedor_id: serviceForm.querySelector('.proveedor-select-nts')?.value || null,
        precio_costo: parseFloat(serviceForm.querySelector('.precio-costo-nts')?.value) || 0,
        precio_venta: parseFloat(document.getElementById(`${tipo}-precio`)?.value) || 0
    };
    
    switch(tipo) {
        case 'vuelo':
            const segmentRows = document.querySelectorAll('#segments-container .segment-row');
            const segmentos = Array.from(segmentRows).map((row, index) => {
                const escalas = Array.from(row.querySelectorAll('.escala-row')).map(er => ({
                    aeropuerto: er.querySelector('.segment-aeropuerto-escala')?.value?.trim(),
                    duracion: er.querySelector('.segment-duracion-escala')?.value?.trim()
                }));
                return {
                    numero_segmento: index + 1,
                    aeropuerto_origen: row.querySelector('.segment-origen')?.value?.trim(),
                    aeropuerto_destino: row.querySelector('.segment-destino')?.value?.trim(),
                    aerolinea: row.querySelector('.segment-aerolinea')?.value?.trim(),
                    numero_vuelo: row.querySelector('.segment-numero')?.value?.trim(),
                    fecha_hora_salida_local: row.querySelector('.segment-salida')?.value || null,
                    fecha_hora_llegada_local: row.querySelector('.segment-llegada')?.value || null,
                    tiempo_total_tramo: row.querySelector('.segment-tiempo-total')?.value?.trim() || '',
                    escalas,
                    tiene_escala: escalas.length > 0
                };
            });

            const origen = segmentos[0]?.aeropuerto_origen || '';
            const destino = segmentos[segmentos.length - 1]?.aeropuerto_destino || '';
            const tieneEscalas = segmentos.some(s => s.tiene_escala);
            const descripcion = origen && destino ? `Vuelo ${origen} → ${destino}` : 'Vuelo';
            const tipo_itinerario = document.getElementById('vuelo-itinerario')?.value || 'ida_vuelta';

            return {
                ...baseData,
                pasajeros: parseInt(document.getElementById('vuelo-pasajeros')?.value) || 1,
                tipo_itinerario,
                origen,
                destino,
                descripcion,
                tieneEscalas,
                segmentos
            };
        case 'hotel':
            return {
                ...baseData,
                hotel_nombre: document.getElementById('hotel-nombre')?.value?.trim() || '',
                hotel_ciudad: document.getElementById('hotel-ciudad')?.value?.trim() || '',
                fecha_checkin: document.getElementById('hotel-checkin')?.value || '',
                fecha_checkout: document.getElementById('hotel-checkout')?.value || '',
                huespedes: parseInt(document.getElementById('hotel-huespedes')?.value) || 1
            };
        case 'traslado':
            return {
                ...baseData,
                origen: document.getElementById('traslado-origen')?.value?.trim() || '',
                destino: document.getElementById('traslado-destino')?.value?.trim() || '',
                fecha_traslado: document.getElementById('traslado-fecha')?.value || '',
                hora: document.getElementById('traslado-hora')?.value || '',
                pasajeros: parseInt(document.getElementById('traslado-pasajeros')?.value) || 1
            };
        case 'excursion':
            return {
                ...baseData,
                nombre_excursion: document.getElementById('excursion-nombre')?.value?.trim() || '',
                fecha_excursion: document.getElementById('excursion-fecha')?.value || '',
                destino: document.getElementById('excursion-destino')?.value?.trim() || '',
                duracion: parseInt(document.getElementById('excursion-duracion')?.value) || 0,
                participantes: parseInt(document.getElementById('excursion-participantes')?.value) || 1,
                incluye_almuerzo: document.getElementById('excursion-almuerzo')?.checked || false,
                incluye_transporte: document.getElementById('excursion-transporte')?.checked || false
            };
        default:
            return baseData;
    }
}

function validateServiceData(serviceData, tipo) {
    if (!serviceData.precio_venta || serviceData.precio_venta <= 0) {
        showNotification('⚠️ Ingrese un precio de venta válido', 'warning');
        return false;
    }
    if (!serviceData.proveedor_id) {
        showNotification('⚠️ Seleccione un proveedor', 'warning');
        return false;
    }

    // Validaciones específicas por tipo
    switch(tipo) {
        case 'vuelo':
            if (!serviceData.segmentos || serviceData.segmentos.length === 0) {
                showNotification('⚠️ Agregue al menos un tramo', 'warning');
                return false;
            }

            const invalid = serviceData.segmentos.some(s => !s.aeropuerto_origen || !s.aeropuerto_destino || !s.aerolinea || !s.numero_vuelo);
            if (invalid) {
                showNotification('⚠️ Complete origen, destino, aerolínea y número de vuelo en todos los tramos', 'warning');
                return false;
            }

            const escalaInvalid = serviceData.segmentos.some(s => s.tiene_escala && (s.escalas.length === 0 || s.escalas.some(e => !e.aeropuerto || !e.duracion)));
            if (escalaInvalid) {
                showNotification('⚠️ Complete los datos de todas las escalas', 'warning');
                return false;
            }
            break;
        case 'hotel':
            if (!serviceData.hotel_nombre || serviceData.hotel_nombre.trim() === '') {
                showNotification('⚠️ Ingrese el nombre del hotel', 'warning');
                return false;
            }
            break;
        case 'traslado':
            if (!serviceData.origen || !serviceData.destino) {
                showNotification('⚠️ Complete origen y destino del traslado', 'warning');
                return false;
            }
            if (serviceData.origen.trim() === '' || serviceData.destino.trim() === '') {
                showNotification('⚠️ Origen y destino no pueden estar vacíos', 'warning');
                return false;
            }
            break;
        case 'excursion':
            if (!serviceData.nombre_excursion || serviceData.nombre_excursion.trim() === '') {
                showNotification('⚠️ Ingrese el nombre de la excursión', 'warning');
                return false;
            }
            break;
    }
    
    return true;
}

function clearServiceForm(tipo) {
    const serviceForm = document.getElementById(`service-${tipo}`);
    if (!serviceForm) return;
    
    // Limpiar inputs excepto los que tienen valores por defecto
    serviceForm.querySelectorAll('input').forEach(input => {
        if (input.type === 'number' && input.hasAttribute('value')) {
            input.value = input.getAttribute('value');
        } else if (input.id && input.id.includes('flat')) {
            // Limpiar campos de Flatpickr
            if (input._flatpickr) {
                input._flatpickr.clear();
            }
        } else {
            input.value = '';
        }
    });
    
    serviceForm.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    
    serviceForm.querySelectorAll('textarea').forEach(textarea => {
        textarea.value = '';
    });

    // Remover display de margen
    const margenDisplay = serviceForm.querySelector('.margen-display-nts');
    if (margenDisplay) {
        margenDisplay.remove();
    }

    if (tipo === 'vuelo') {
        const segmentsContainer = document.getElementById('segments-container');
        if (segmentsContainer) {
            segmentsContainer.innerHTML = '';
            if (typeof addSegmentRow === 'function') {
                addSegmentRow();
            }
        }
    }
}

// ===== RENDERIZAR SERVICIOS =====
function renderServiciosAgregados() {
    const container = document.getElementById('servicios-lista');
    if (!container) return;
    
    if (VentasModule.currentVenta.servicios.length === 0) {
        container.innerHTML = '<p class="no-services">No hay servicios agregados</p>';
        return;
    }
    
    const serviciosHTML = VentasModule.currentVenta.servicios.map(servicio => {
        const descripcion = getServiceDescription(servicio);
        const proveedor = VentasModule.proveedores.find(p => p.id == servicio.proveedor_id);
        
        return `
            <div class="service-item service-item-mejorado" data-id="${servicio.id}">
                <div class="service-info">
                    <div class="service-header">
                        <span class="service-description">${descripcion}</span>
                        <span class="service-price">${servicio.precio_venta.toLocaleString()}</span>
                    </div>
                    <div class="service-details">
                        ${proveedor ? `<span class="service-provider">🏢 ${proveedor.nombre}</span>` : ''}
                        <span class="service-margin" style="color: ${servicio.margen_ganancia >= 0 ? '#27ae60' : '#e74c3c'}">
                            💰 Margen: ${servicio.margen_ganancia.toLocaleString()}
                        </span>
                        ${servicio.fecha_hora_salida ? `<span class="service-date">📅 ${formatDateForDisplay(servicio.fecha_hora_salida)}</span>` : ''}
                    </div>
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
            return `🚌 ${servicio.origen} → ${servicio.destino} (${servicio.pasajeros} pax)`;
        case 'excursion':
            return `🗺️ ${servicio.nombre_excursion} (${servicio.participantes} pax)`;
        default:
            return 'Servicio';
    }
}

function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR') + ' ' + date.toLocaleTimeString('es-AR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (error) {
        return dateString;
    }
}

function updateVentaTotals() {
    const total = VentasModule.currentVenta.servicios.reduce((sum, s) => sum + s.precio_venta, 0);
    const totalCosto = VentasModule.currentVenta.servicios.reduce((sum, s) => sum + (s.precio_costo || 0), 0);
    const margenTotal = total - totalCosto;
    
    // Actualizar total simple
    const totalElement = document.getElementById('total-venta');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString();
    }
    
    // Actualizar sección detallada si hay servicios
    const totalSection = document.querySelector('.total-section');
    if (totalSection && VentasModule.currentVenta.servicios.length > 0) {
        totalSection.innerHTML = `
            <div class="total-breakdown">
                <div class="total-row">
                    <span>💰 Total de Venta:</span>
                    <span class="total-amount">${total.toLocaleString()}</span>
                </div>
                <div class="total-row">
                    <span>💸 Total Costos:</span>
                    <span class="cost-amount">${totalCosto.toLocaleString()}</span>
                </div>
                <div class="total-row total-margin">
                    <span>📈 Margen Total:</span>
                    <span class="margin-amount" style="color: ${margenTotal >= 0 ? '#27ae60' : '#e74c3c'}">
                        ${margenTotal.toLocaleString()}
                    </span>
                </div>
            </div>
        `;
    }
}

// ===== CREAR VENTA =====
async function crearVentaCompleta() {
    console.log('💾 Creando venta...');
    
    try {
        if (!validateVentaForm()) {
            return;
        }
        
        showLoader('Creando venta...');
        
        const ventaData = buildVentaData();
        
        if (isSupabaseConnected) {
            await crearVentaEnDB(ventaData);
        } else {
            await crearVentaLocal(ventaData);
        }
        
        showNotification('✅ Venta creada exitosamente', 'success');
        limpiarFormularioCompleto();
        
    } catch (error) {
        console.error('Error creando venta:', error);
        showNotification('❌ Error al crear la venta: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}

function validateVentaForm() {
    const clienteNombre = document.getElementById('cliente-nombre')?.value?.trim();
    const vendedorId = document.getElementById('vendedor-select-nts')?.value;
    const docTipo = document.getElementById('cliente-doc-tipo')?.value;
    const dni = document.getElementById('cliente-dni')?.value?.trim();
    const pasaporte = document.getElementById('cliente-pasaporte')?.value?.trim();

    if (!clienteNombre) {
        showNotification('⚠️ Ingrese el nombre del cliente', 'warning');
        document.getElementById('cliente-nombre')?.focus();
        return false;
    }

    if (docTipo === 'dni' && !dni) {
        showNotification('⚠️ Ingrese el DNI del cliente', 'warning');
        document.getElementById('cliente-dni')?.focus();
        return false;
    }

    if (docTipo === 'pasaporte' && !pasaporte) {
        showNotification('⚠️ Ingrese el pasaporte del cliente', 'warning');
        document.getElementById('cliente-pasaporte')?.focus();
        return false;
    }

    if (!vendedorId) {
        showNotification('⚠️ Seleccione un vendedor responsable', 'warning');
        document.getElementById('vendedor-select-nts')?.focus();
        return false;
    }

    const fechaVenta = document.getElementById('fecha-venta')?.value;
    if (!fechaVenta) {
        showNotification('⚠️ Ingrese la fecha de venta', 'warning');
        document.getElementById('fecha-venta')?.focus();
        return false;
    }
    
    if (VentasModule.currentVenta.servicios.length === 0) {
        showNotification('⚠️ Agregue al menos un servicio', 'warning');
        return false;
    }
    
    return true;
}

function buildVentaData() {
    const docTipo = document.getElementById('cliente-doc-tipo')?.value;
    const dni = document.getElementById('cliente-dni')?.value?.trim();
    const pasaporte = document.getElementById('cliente-pasaporte')?.value?.trim();
    const total = VentasModule.currentVenta.servicios.reduce((sum, s) => sum + s.precio_venta, 0);
    
    return {
        cliente: {
            nombre: [
                document.getElementById('cliente-nombre')?.value?.trim() || '',
                document.getElementById('cliente-apellido')?.value?.trim() || ''
            ].join(' ').trim(),
            email: document.getElementById('cliente-email')?.value?.trim(),
            telefono: document.getElementById('cliente-telefono')?.value?.trim(),
            dni: docTipo === 'dni' ? dni : null,
            pasaporte: docTipo === 'pasaporte' ? pasaporte : null,
            dni_expiracion: docTipo === 'dni' ? document.getElementById('cliente-dni-expiracion')?.value : null,
            pasaporte_expiracion: docTipo === 'pasaporte' ? document.getElementById('cliente-pasaporte-expiracion')?.value : null,
            vendedor_id: parseInt(document.getElementById('vendedor-select-nts')?.value),
            esExistente: VentasModule.currentVenta.cliente.esExistente || false,
            id: VentasModule.currentVenta.cliente.id || null
        },
        venta: {
            vendedor_id: parseInt(document.getElementById('vendedor-select-nts')?.value),
            fecha_venta: document.getElementById('fecha-venta')?.value,
            fecha_viaje_inicio: document.getElementById('fecha-viaje-inicio')?.value,
            fecha_viaje_fin: document.getElementById('fecha-viaje-fin')?.value,
            total_final: total,
            estado: 'pendiente',
            estado_pago: 'no_pagado',
            observaciones: document.getElementById('observaciones-venta')?.value?.trim()
        },
        servicios: [...VentasModule.currentVenta.servicios]
    };
}

async function crearVentaEnDB(ventaData) {
    try {
        // 1. Crear o actualizar cliente
        let clienteId;
        
        if (ventaData.cliente.esExistente && ventaData.cliente.id) {
            clienteId = ventaData.cliente.id;
        } else {
            const { data: nuevoCliente, error: clienteError } = await supabase
                .from('clientes')
                .insert({
                    nombre: ventaData.cliente.nombre,
                    email: ventaData.cliente.email,
                    telefono: ventaData.cliente.telefono,
                    DNI: ventaData.cliente.dni,
                    Pasaporte: ventaData.cliente.pasaporte,
                    dni_expiracion: ventaData.cliente.dni_expiracion,
                    pasaporte_expiracion: ventaData.cliente.pasaporte_expiracion,
                    vendedor_id: ventaData.cliente.vendedor_id
                })
                .select()
                .single();
            
            if (clienteError) throw clienteError;
            clienteId = nuevoCliente.id;
        }
        
        // 2. Generar número de venta
        const numeroVenta = generateSaleNumber();
        
        // 3. Crear venta
        const { data: nuevaVenta, error: ventaError } = await supabase
            .from('ventas')
            .insert({
                ...ventaData.venta,
                numero_venta: numeroVenta,
                cliente_id: clienteId
            })
            .select()
            .single();
        
        if (ventaError) throw ventaError;
        
        // 4. Crear servicios (solo para vuelos, puedes expandir para otros)
        for (const servicio of ventaData.servicios) {
            if (servicio.tipo === 'vuelo') {
                const { data: vuelo, error: servicioError } = await supabase
                    .from('venta_vuelos')
                    .insert({
                        venta_id: nuevaVenta.id,
                        descripcion: servicio.descripcion,
                        tipo_itinerario: servicio.tipo_itinerario,
                        pasajeros: servicio.pasajeros,
                        precio_costo: servicio.precio_costo,
                        precio_venta: servicio.precio_venta,
                        margen_ganancia: servicio.precio_venta - servicio.precio_costo,
                        monto_pagado: 0,
                        saldo_pendiente_servicio: servicio.precio_costo,
                        estado_pago_servicio: 'no_pagado',
                        tiempo_total_vuelo: servicio.tiempo_total_vuelo || null,
                        cantidad_escalas: servicio.cantidad_escalas || 0,
                        tiene_escalas: servicio.tieneEscalas || false,
                        proveedor_id: servicio.proveedor_id || null
                    })
                    .select()
                    .single();

                if (servicioError) {
                    console.error(`Error creando vuelo:`, servicioError.message, servicioError.details);
                } else if (servicio.segmentos && servicio.segmentos.length) {
                    const segmentos = servicio.segmentos.map(seg => ({
                        venta_vuelo_id: vuelo.id,
                        numero_segmento: seg.numero_segmento,
                        aeropuerto_origen: seg.aeropuerto_origen,
                        aeropuerto_destino: seg.aeropuerto_destino,
                        fecha_hora_salida_local: seg.fecha_hora_salida_local,
                        fecha_hora_llegada_local: seg.fecha_hora_llegada_local,
                        aerolinea: seg.aerolinea || null,
                        numero_vuelo: seg.numero_vuelo || null,
                        tiene_escala: seg.tiene_escala,
                        aeropuerto_escala: seg.escalas[0]?.aeropuerto || null,
                        duracion_escala: seg.escalas[0]?.duracion || null
                    }));

                    const { error: segError } = await supabase
                        .from('vuelo_segmentos')
                        .insert(segmentos);
                    if (segError) {
                        console.error('Error creando segmentos:', segError.message, segError.details);
                    }
                }
            } else if (servicio.tipo === 'hotel') {
                const { error: hotelError } = await supabase
                    .from('venta_hoteles')
                    .insert({
                        venta_id: nuevaVenta.id,
                        proveedor_id: servicio.proveedor_id || null,
                        hotel_nombre: servicio.hotel_nombre,
                        hotel_ciudad: servicio.hotel_ciudad,
                        fecha_checkin: servicio.fecha_checkin || null,
                        fecha_checkout: servicio.fecha_checkout || null,
                        huespedes: servicio.huespedes || 1,
                        precio_costo: servicio.precio_costo,
                        precio_venta: servicio.precio_venta,
                        margen_ganancia: servicio.precio_venta - servicio.precio_costo
                    });
                if (hotelError) {
                    console.error('Error creando hotel:', hotelError.message, hotelError.details);
                }
            } else if (servicio.tipo === 'traslado') {
                const { error: trasladoError } = await supabase
                    .from('venta_traslados')
                    .insert({
                        venta_id: nuevaVenta.id,
                        proveedor_id: servicio.proveedor_id || null,
                        origen: servicio.origen,
                        destino: servicio.destino,
                        fecha_traslado: servicio.fecha_traslado || null,
                        hora_traslado: servicio.hora || null,
                        pasajeros: servicio.pasajeros || 1,
                        precio_costo: servicio.precio_costo,
                        precio_venta: servicio.precio_venta,
                        margen_ganancia: servicio.precio_venta - servicio.precio_costo
                    });
                if (trasladoError) {
                    console.error('Error creando traslado:', trasladoError.message, trasladoError.details);
                }
            } else if (servicio.tipo === 'excursion') {
                const { error: excursionError } = await supabase
                    .from('venta_excursiones')
                    .insert({
                        venta_id: nuevaVenta.id,
                        proveedor_id: servicio.proveedor_id || null,
                        nombre_excursion: servicio.nombre_excursion,
                        destino_excursion: servicio.destino,
                        fecha_excursion: servicio.fecha_excursion || null,
                        duracion_horas: servicio.duracion || null,
                        participantes: servicio.participantes || 1,
                        precio_costo: servicio.precio_costo,
                        precio_venta: servicio.precio_venta,
                        margen_ganancia: servicio.precio_venta - servicio.precio_costo
                    });
                if (excursionError) {
                    console.error('Error creando excursión:', excursionError.message, excursionError.details);
                }
            }
        }
        
        console.log('✅ Venta creada en DB:', numeroVenta);
        
    } catch (error) {
        console.error('Error en crearVentaEnDB:', error.message, error.details || error);
        throw error;
    }
}

async function crearVentaLocal(ventaData) {
    const ventas = JSON.parse(localStorage.getItem('nts_ventas') || '[]');
    ventas.push({
        ...ventaData,
        id: Date.now(),
        numero_venta: generateSaleNumber(),
        created_at: new Date().toISOString()
    });
    
    localStorage.setItem('nts_ventas', JSON.stringify(ventas));
    console.log('✅ Venta guardada localmente');
}

// ===== FUNCIONES DE UTILIDAD =====
function limpiarFormularioCompleto() {
    // Limpiar campos de cliente
    ['cliente-nombre', 'cliente-apellido', 'cliente-email', 'cliente-telefono', 'cliente-dni', 'cliente-pasaporte', 'cliente-dni-expiracion', 'cliente-pasaporte-expiracion'].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });

    const docTipo = document.getElementById('cliente-doc-tipo');
    if (docTipo) {
        docTipo.value = 'dni';
        toggleDocumentoFields('dni');
    }
    
    // Limpiar vendedor
    const vendedorSelect = document.getElementById('vendedor-select-nts');
    if (vendedorSelect) vendedorSelect.selectedIndex = 0;
    
    // Limpiar fechas y observaciones
    ['fecha-venta', 'fecha-viaje-inicio', 'fecha-viaje-fin', 'observaciones-venta'].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
    
    // Limpiar servicios
    VentasModule.currentVenta.servicios = [];
    VentasModule.currentVenta.cliente = {};
    
    renderServiciosAgregados();
    updateVentaTotals();
    
    // Limpiar formularios de servicios
    ['vuelo', 'hotel', 'traslado', 'excursion'].forEach(tipo => {
        clearServiceForm(tipo);
    });
    
    showNotification('🗑️ Formulario limpiado', 'info');
}

function eliminarServicio(id) {
    VentasModule.currentVenta.servicios = VentasModule.currentVenta.servicios.filter(s => s.id !== id);
    renderServiciosAgregados();
    updateVentaTotals();
    showNotification('🗑️ Servicio eliminado', 'info');
}

function generateSaleNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `NTS-${year}-${timestamp}`;
}

// ===== FUNCIONES DE UTILIDAD =====
function showLoader(message) {
    if (window.NTS_UTILS && window.NTS_UTILS.showLoader) {
        window.NTS_UTILS.showLoader(message);
    }
}

function hideLoader() {
    if (window.NTS_UTILS && window.NTS_UTILS.hideLoader) {
        window.NTS_UTILS.hideLoader();
    }
}

function showNotification(message, type) {
    if (window.NTS_UTILS && window.NTS_UTILS.showNotification) {
        window.NTS_UTILS.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// ===== EXPORT PARA USO GLOBAL =====
window.VentasModule = {
    init: initVentasModule,
    agregarServicio: agregarServicioMejorado,
    eliminarServicio: eliminarServicio,
    crearVenta: crearVentaCompleta,
    limpiarFormulario: limpiarFormularioCompleto,
    currentVenta: VentasModule.currentVenta,
    vendedores: VentasModule.vendedores,
    proveedores: VentasModule.proveedores,
    clientesExistentes: VentasModule.clientesExistentes
};

// ===== FUNCIONES GLOBALES PARA COMPATIBILIDAD =====
window.agregarServicio = agregarServicioMejorado;
window.crearVenta = crearVentaCompleta;
window.limpiarFormulario = limpiarFormularioCompleto;
window.eliminarServicio = eliminarServicio;

console.log('✅ Módulo de ventas completo sin duplicados cargado correctamente');
console.log('✅ Correcciones para escalas y búsqueda de clientes implementadas');
