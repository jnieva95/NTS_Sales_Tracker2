// 💰 MÓDULO DE VENTAS - FUNCIONAL CON BASE DE DATOS
// Archivo: js/modules/ventas.js

console.log('💰 Cargando módulo de ventas...');

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
    clientesExistentes: []
};

// ===== INICIALIZACIÓN DEL MÓDULO =====
async function initVentasModule() {
    console.log('🔧 Inicializando módulo de ventas...');
    
    try {
        // Cargar datos necesarios
        await loadVentasData();
        
        // Configurar eventos del formulario
        setupVentasEvents();
        
        // Configurar formulario inteligente
        setupSmartForm();
        
        console.log('✅ Módulo de ventas inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando módulo de ventas:', error);
        showNotification('Error inicializando ventas', 'error');
    }
}

// ===== CARGAR DATOS NECESARIOS =====
async function loadVentasData() {
    const { supabase, isSupabaseConnected } = window.NTS_CONFIG;
    
    if (!isSupabaseConnected) {
        loadMockVentasData();
        return;
    }
    
    try {
        showLoader('Cargando datos del sistema...');
        
        // Cargar vendedores activos
        const { data: vendedores, error: vendedoresError } = await supabase
            .from('vendedores')
            .select('id, nombre, codigo_vendedor, rol, comision_porcentaje')
            .eq('activo', true)
            .order('nombre');
        
        if (vendedoresError) throw vendedoresError;
        
        // Cargar proveedores activos
        const { data: proveedores, error: proveedoresError } = await supabase
            .from('proveedores')
            .select('id, nombre, tipo, comision_porcentaje')
            .eq('activo', true)
            .order('nombre');
        
        if (proveedoresError) throw proveedoresError;
        
        // Cargar clientes existentes
        const { data: clientes, error: clientesError } = await supabase
            .from('clientes')
            .select('id, nombre, email, telefono, vendedor_id')
            .order('nombre');
        
        if (clientesError) throw clientesError;
        
        // Guardar en el estado
        VentasModule.vendedores = vendedores || [];
        VentasModule.proveedores = proveedores || [];
        VentasModule.clientesExistentes = clientes || [];
        
        // Actualizar formulario con los datos
        updateFormWithData();
        
        console.log('📊 Datos cargados:', {
            vendedores: VentasModule.vendedores.length,
            proveedores: VentasModule.proveedores.length,
            clientes: VentasModule.clientesExistentes.length
        });
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        loadMockVentasData(); // Fallback
    } finally {
        hideLoader();
    }
}

function loadMockVentasData() {
    VentasModule.vendedores = [
        { id: 1, nombre: 'Ana García', codigo_vendedor: 'V001', rol: 'vendedor', comision_porcentaje: 5 },
        { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002', rol: 'supervisor', comision_porcentaje: 6 }
    ];
    
    VentasModule.proveedores = [
        { id: 1, nombre: 'Consolidadora Aérea SA', tipo: 'vuelos', comision_porcentaje: 8 },
        { id: 2, nombre: 'Hoteles Directos', tipo: 'hoteles', comision_porcentaje: 15 },
        { id: 3, nombre: 'Miami Transport', tipo: 'traslados', comision_porcentaje: 20 }
    ];
    
    updateFormWithData();
}

// ===== ACTUALIZAR FORMULARIO CON DATOS =====
function updateFormWithData() {
    // Actualizar select de vendedores
    updateVendedoresSelect();
    
    // Actualizar autocompletado de clientes
    setupClienteAutocomplete();
    
    // Actualizar selects de proveedores en cada servicio
    updateProveedoresSelects();
    
    // Configurar validaciones inteligentes
    setupIntelligentValidation();
}

function updateVendedoresSelect() {
    // Agregar select de vendedor al formulario si no existe
    const clienteSection = document.querySelector('#nueva-venta .form-section');
    
    if (!document.getElementById('vendedor-select')) {
        const vendedorRow = document.createElement('div');
        vendedorRow.className = 'form-row';
        vendedorRow.innerHTML = `
            <div>
                <label for="vendedor-select">🧑‍💼 Vendedor Responsable *</label>
                <select id="vendedor-select" required>
                    <option value="">Seleccionar vendedor...</option>
                </select>
            </div>
        `;
        
        clienteSection.appendChild(vendedorRow);
    }
    
    const vendedorSelect = document.getElementById('vendedor-select');
    vendedorSelect.innerHTML = '<option value="">Seleccionar vendedor...</option>';
    
    VentasModule.vendedores.forEach(vendedor => {
        const option = document.createElement('option');
        option.value = vendedor.id;
        option.textContent = `${vendedor.nombre} (${vendedor.codigo_vendedor}) - ${vendedor.rol}`;
        vendedorSelect.appendChild(option);
    });
}

function setupClienteAutocomplete() {
    const clienteNombre = document.getElementById('cliente-nombre');
    const clienteEmail = document.getElementById('cliente-email');
    const clienteTelefono = document.getElementById('cliente-telefono');
    
    if (!clienteNombre) return;
    
    // Crear datalist para autocompletado
    let datalist = document.getElementById('clientes-datalist');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'clientes-datalist';
        document.body.appendChild(datalist);
    }
    
    // Llenar datalist con clientes existentes
    datalist.innerHTML = '';
    VentasModule.clientesExistentes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.nombre;
        option.setAttribute('data-email', cliente.email);
        option.setAttribute('data-telefono', cliente.telefono);
        option.setAttribute('data-id', cliente.id);
        datalist.appendChild(option);
    });
    
    // Configurar autocompletado
    clienteNombre.setAttribute('list', 'clientes-datalist');
    
    // Event listener para autocompletar datos
    clienteNombre.addEventListener('input', function() {
        const selectedOption = [...datalist.options].find(option => option.value === this.value);
        
        if (selectedOption) {
            clienteEmail.value = selectedOption.getAttribute('data-email') || '';
            clienteTelefono.value = selectedOption.getAttribute('data-telefono') || '';
            
            VentasModule.currentVenta.cliente.id = selectedOption.getAttribute('data-id');
            VentasModule.currentVenta.cliente.esExistente = true;
            
            showNotification('✅ Cliente encontrado - datos autocompletados', 'success');
        } else {
            VentasModule.currentVenta.cliente.esExistente = false;
        }
    });
}

function updateProveedoresSelects() {
    const serviceForms = ['vuelo', 'hotel', 'traslado', 'excursion'];
    
    serviceForms.forEach(serviceType => {
        const serviceForm = document.getElementById(`service-${serviceType}`);
        if (!serviceForm) return;
        
        // Agregar select de proveedor si no existe
        let proveedorSelect = serviceForm.querySelector('.proveedor-select');
        if (!proveedorSelect) {
            const proveedorRow = document.createElement('div');
            proveedorRow.className = 'form-row';
            proveedorRow.innerHTML = `
                <div>
                    <label>🏢 Proveedor</label>
                    <select class="proveedor-select" data-service="${serviceType}">
                        <option value="">Seleccionar proveedor...</option>
                    </select>
                </div>
                <div>
                    <label>💰 Precio Costo</label>
                    <input type="number" class="precio-costo" placeholder="Costo del proveedor" step="0.01" min="0">
                </div>
            `;
            
            // Insertar después del primer form-row
            const firstRow = serviceForm.querySelector('.form-row');
            if (firstRow) {
                firstRow.parentNode.insertBefore(proveedorRow, firstRow.nextSibling);
            }
            
            proveedorSelect = serviceForm.querySelector('.proveedor-select');
        }
        
        // Llenar select con proveedores del tipo correcto
        proveedorSelect.innerHTML = '<option value="">Seleccionar proveedor...</option>';
        
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
            proveedorSelect.appendChild(option);
        });
    });
}

// ===== CONFIGURAR EVENTOS INTELIGENTES =====
function setupVentasEvents() {
    console.log('🔧 Configurando eventos de ventas...');
    
    // Event listener mejorado para agregar servicios
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-add-service') || e.target.closest('.btn-add-service')) {
            e.preventDefault();
            const button = e.target.matches('.btn-add-service') ? e.target : e.target.closest('.btn-add-service');
            const serviceType = button.getAttribute('data-service') || 
                              button.getAttribute('onclick')?.match(/agregarServicio\('(.+)'\)/)?.[1];
            
            if (serviceType) {
                agregarServicioMejorado(serviceType);
            }
        }
    });
    
    // Event listener para crear venta
    const crearVentaBtn = document.querySelector('button[onclick="crearVenta()"]');
    if (crearVentaBtn) {
        crearVentaBtn.replaceWith(crearVentaBtn.cloneNode(true)); // Remover eventos anteriores
        const newBtn = document.querySelector('button[onclick="crearVenta()"]');
        newBtn.removeAttribute('onclick');
        newBtn.addEventListener('click', crearVentaCompleta);
    }
    
    // Event listener para limpiar formulario
    const limpiarBtn = document.querySelector('button[onclick="limpiarFormulario()"]');
    if (limpiarBtn) {
        limpiarBtn.replaceWith(limpiarBtn.cloneNode(true));
        const newBtn = document.querySelector('button[onclick="limpiarFormulario()"]');
        newBtn.removeAttribute('onclick');
        newBtn.addEventListener('click', limpiarFormularioCompleto);
    }
}

function setupSmartForm() {
    // Configurar validación en tiempo real
    const requiredFields = ['cliente-nombre', 'vendedor-select'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', clearFieldError);
        }
    });
    
    // Configurar cálculo automático de márgenes
    setupMarginCalculation();
}

function setupMarginCalculation() {
    document.addEventListener('input', function(e) {
        if (e.target.matches('.precio-costo') || e.target.matches('[id$="-precio"]')) {
            calculateMarginForService(e.target);
        }
    });
}

function calculateMarginForService(element) {
    const serviceForm = element.closest('.service-form');
    if (!serviceForm) return;
    
    const precioCosto = parseFloat(serviceForm.querySelector('.precio-costo')?.value) || 0;
    const precioVenta = parseFloat(serviceForm.querySelector('[id$="-precio"]')?.value) || 0;
    
    if (precioCosto > 0 && precioVenta > 0) {
        const margen = precioVenta - precioCosto;
        const porcentaje = ((margen / precioCosto) * 100).toFixed(1);
        
        // Mostrar margen calculado
        let margenDisplay = serviceForm.querySelector('.margen-display');
        if (!margenDisplay) {
            margenDisplay = document.createElement('div');
            margenDisplay.className = 'margen-display';
            margenDisplay.style.cssText = 'margin-top: 10px; padding: 10px; background: #e8f5e8; border-radius: 5px; font-size: 14px;';
            serviceForm.appendChild(margenDisplay);
        }
        
        margenDisplay.innerHTML = `
            💰 <strong>Margen:</strong> $${margen.toLocaleString()} (${porcentaje}%)
            ${margen < 0 ? '<span style="color: red;">⚠️ Pérdida</span>' : '<span style="color: green;">✅ Ganancia</span>'}
        `;
    }
}

// ===== AGREGAR SERVICIO MEJORADO =====
function agregarServicioMejorado(tipo) {
    console.log(`➕ Agregando servicio mejorado: ${tipo}`);
    
    const serviceData = getServiceFormDataMejorado(tipo);
    
    if (!validateServiceDataMejorado(serviceData, tipo)) {
        return;
    }
    
    // Agregar datos calculados
    serviceData.id = Date.now();
    serviceData.tipo = tipo;
    serviceData.margen_ganancia = (serviceData.precio_venta || 0) - (serviceData.precio_costo || 0);
    
    // Agregar a la lista
    VentasModule.currentVenta.servicios.push(serviceData);
    
    // Actualizar vista
    renderServiciosAgregadosMejorado();
    updateVentaTotalsMejorado();
    
    // Limpiar formulario
    clearServiceFormMejorado(tipo);
    
    showNotification(`✅ ${tipo} agregado correctamente`, 'success');
}

function getServiceFormDataMejorado(tipo) {
    const baseData = {
        proveedor_id: getValue(`service-${tipo} .proveedor-select`),
        precio_costo: parseFloat(getValue(`service-${tipo} .precio-costo`)) || 0,
        precio_venta: parseFloat(getValue(`${tipo}-precio`)) || 0
    };
    
    switch(tipo) {
        case 'vuelo':
            return {
                ...baseData,
                descripcion: getValue('vuelo-descripcion'),
                tipo_itinerario: getValue('vuelo-tipo'),
                pasajeros: parseInt(getValue('vuelo-pasajeros')) || 1,
                origen: getValue('vuelo-origen') || '',
                destino: getValue('vuelo-destino') || '',
                fecha_salida: getValue('vuelo-fecha-salida'),
                aerolinea: getValue('vuelo-aerolinea') || ''
            };
        case 'hotel':
            return {
                ...baseData,
                hotel_nombre: getValue('hotel-nombre'),
                hotel_ciudad: getValue('hotel-ciudad'),
                fecha_checkin: getValue('hotel-checkin'),
                fecha_checkout: getValue('hotel-checkout'),
                huespedes: parseInt(getValue('hotel-huespedes')) || 1,
                noches: calculateNights(getValue('hotel-checkin'), getValue('hotel-checkout'))
            };
        case 'traslado':
            return {
                ...baseData,
                origen: getValue('traslado-origen'),
                destino: getValue('traslado-destino'),
                fecha_traslado: getValue('traslado-fecha'),
                tipo_traslado: 'libre',
                pasajeros: 1
            };
        case 'excursion':
            return {
                ...baseData,
                nombre_excursion: getValue('excursion-nombre'),
                fecha_excursion: getValue('excursion-fecha'),
                participantes: parseInt(getValue('excursion-participantes')) || 1
            };
        default:
            return baseData;
    }
}

function calculateNights(checkin, checkout) {
    if (!checkin || !checkout) return 0;
    
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const diffTime = checkoutDate - checkinDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
}

function validateServiceDataMejorado(serviceData, tipo) {
    if (!serviceData.precio_venta || serviceData.precio_venta <= 0) {
        showNotification('⚠️ Ingrese un precio de venta válido', 'warning');
        return false;
    }
    
    // Validaciones específicas por tipo
    switch(tipo) {
        case 'vuelo':
            if (!serviceData.descripcion) {
                showNotification('⚠️ Ingrese la descripción del vuelo', 'warning');
                return false;
            }
            break;
        case 'hotel':
            if (!serviceData.hotel_nombre) {
                showNotification('⚠️ Ingrese el nombre del hotel', 'warning');
                return false;
            }
            if (!serviceData.fecha_checkin || !serviceData.fecha_checkout) {
                showNotification('⚠️ Ingrese las fechas de check-in y check-out', 'warning');
                return false;
            }
            break;
        case 'traslado':
            if (!serviceData.origen || !serviceData.destino) {
                showNotification('⚠️ Ingrese origen y destino del traslado', 'warning');
                return false;
            }
            break;
        case 'excursion':
            if (!serviceData.nombre_excursion) {
                showNotification('⚠️ Ingrese el nombre de la excursión', 'warning');
                return false;
            }
            break;
    }
    
    return true;
}

// ===== RENDERIZAR SERVICIOS MEJORADO =====
function renderServiciosAgregadosMejorado() {
    const container = document.getElementById('servicios-lista');
    if (!container) return;
    
    if (VentasModule.currentVenta.servicios.length === 0) {
        container.innerHTML = '<p class="no-services">No hay servicios agregados</p>';
        return;
    }
    
    const serviciosHTML = VentasModule.currentVenta.servicios.map(servicio => {
        const descripcion = getServiceDescriptionMejorado(servicio);
        const proveedor = VentasModule.proveedores.find(p => p.id == servicio.proveedor_id);
        const margenColor = servicio.margen_ganancia >= 0 ? '#27ae60' : '#e74c3c';
        
        return `
            <div class="service-item service-item-mejorado" data-id="${servicio.id}">
                <div class="service-info">
                    <div class="service-header">
                        <span class="service-description">${descripcion}</span>
                        <span class="service-price">${formatCurrency(servicio.precio_venta)}</span>
                    </div>
                    <div class="service-details">
                        ${proveedor ? `<span class="service-provider">🏢 ${proveedor.nombre}</span>` : ''}
                        <span class="service-margin" style="color: ${margenColor}">
                            💰 Margen: ${formatCurrency(servicio.margen_ganancia)}
                        </span>
                    </div>
                </div>
                <button type="button" onclick="eliminarServicioMejorado(${servicio.id})" class="btn-remove">🗑️</button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = serviciosHTML;
}

function getServiceDescriptionMejorado(servicio) {
    switch(servicio.tipo) {
        case 'vuelo':
            return `✈️ ${servicio.descripcion} (${servicio.pasajeros} pax)`;
        case 'hotel':
            return `🏨 ${servicio.hotel_nombre} - ${servicio.hotel_ciudad} (${servicio.huespedes} huéspedes, ${servicio.noches} noches)`;
        case 'traslado':
            return `🚌 ${servicio.origen} → ${servicio.destino}`;
        case 'excursion':
            return `🗺️ ${servicio.nombre_excursion} (${servicio.participantes} pax)`;
        default:
            return 'Servicio';
    }
}

// ===== CREAR VENTA COMPLETA =====
async function crearVentaCompleta() {
    console.log('💾 Creando venta completa...');
    
    try {
        // Validar formulario completo
        if (!validateVentaCompleta()) {
            return;
        }
        
        showLoader('Creando venta...');
        
        const ventaData = buildVentaData();
        
        const { isSupabaseConnected } = window.NTS_CONFIG;
        
        if (isSupabaseConnected) {
            await crearVentaEnDB(ventaData);
        } else {
            await crearVentaLocal(ventaData);
        }
        
        showNotification('✅ Venta creada exitosamente', 'success');
        limpiarFormularioCompleto();
        
        // Recargar dashboard si estamos en esa pestaña
        if (window.NTS_APP?.currentTab === 'dashboard') {
            loadDashboard();
        }
        
    } catch (error) {
        console.error('Error creando venta:', error);
        showNotification('❌ Error al crear la venta: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}

function validateVentaCompleta() {
    // Validar cliente
    const clienteNombre = getValue('cliente-nombre');
    if (!clienteNombre) {
        showNotification('⚠️ Ingrese el nombre del cliente', 'warning');
        return false;
    }
    
    // Validar vendedor
    const vendedorId = getValue('vendedor-select');
    if (!vendedorId) {
        showNotification('⚠️ Seleccione un vendedor responsable', 'warning');
        return false;
    }
    
    // Validar servicios
    if (VentasModule.currentVenta.servicios.length === 0) {
        showNotification('⚠️ Agregue al menos un servicio', 'warning');
        return false;
    }
    
    // Validar email si está presente
    const clienteEmail = getValue('cliente-email');
    if (clienteEmail && !isValidEmail(clienteEmail)) {
        showNotification('⚠️ El email del cliente no es válido', 'warning');
        return false;
    }
    
    return true;
}

function buildVentaData() {
    const total = VentasModule.currentVenta.servicios.reduce((sum, s) => sum + s.precio_venta, 0);
    
    return {
        // Datos del cliente
        cliente: {
            nombre: getValue('cliente-nombre'),
            email: getValue('cliente-email'),
            telefono: getValue('cliente-telefono'),
            documento: getValue('cliente-documento'),
            vendedor_id: parseInt(getValue('vendedor-select')),
            esExistente: VentasModule.currentVenta.cliente.esExistente || false,
            id: VentasModule.currentVenta.cliente.id || null
        },
        // Datos de la venta
        venta: {
            vendedor_id: parseInt(getValue('vendedor-select')),
            fecha_venta: new Date().toISOString().split('T')[0],
            fecha_viaje_inicio: getValue('fecha-viaje-inicio'),
            fecha_viaje_fin: getValue('fecha-viaje-fin'),
            total_final: total,
            estado: 'pendiente',
            estado_pago: 'no_pagado',
            observaciones: getValue('observaciones-venta')
        },
        // Servicios
        servicios: [...VentasModule.currentVenta.servicios]
    };
}

async function crearVentaEnDB(ventaData) {
    const { supabase } = window.NTS_CONFIG;
    
    try {
        // 1. Crear o actualizar cliente
        let clienteId;
        
        if (ventaData.cliente.esExistente && ventaData.cliente.id) {
            clienteId = ventaData.cliente.id;
        } else {
            // Crear nuevo cliente
            const { data: nuevoCliente, error: clienteError } = await supabase
                .from('clientes')
                .insert({
                    nombre: ventaData.cliente.nombre,
                    email: ventaData.cliente.email,
                    telefono: ventaData.cliente.telefono,
                    documento: ventaData.cliente.documento,
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
        
        // 4. Crear servicios
        for (const servicio of ventaData.servicios) {
            const tablaServicio = `venta_${servicio.tipo}s`;
            
            const { error: servicioError } = await supabase
                .from(tablaServicio)
                .insert({
                    ...servicio,
                    venta_id: nuevaVenta.id
                });
            
            if (servicioError) {
                console.error(`Error creando ${servicio.tipo}:`, servicioError);
                // Continuar con otros servicios
            }
        }
        
        console.log('✅ Venta creada en DB:', numeroVenta);
        
    } catch (error) {
        console.error('Error en crearVentaEnDB:', error);
        throw error;
    }
}

async function crearVentaLocal(ventaData) {
    console.log('💾 Guardando venta localmente:', ventaData);
    
    // Simular guardado local
    const ventas = JSON.parse(localStorage.getItem('nts_ventas') || '[]');
    ventas.push({
        ...ventaData,
        id: Date.now(),
        numero_venta: generateSaleNumber(),
        created_at: new Date().toISOString()
    });
    
    localStorage.setItem('nts_ventas', JSON.stringify(ventas));
}

// ===== UTILIDADES =====
function limpiarFormularioCompleto() {
    // Limpiar datos del cliente
    ['cliente-nombre', 'cliente-email', 'cliente-telefono', 'cliente-documento'].forEach(id => {
        setValue(id, '');
    });
    
    // Limpiar vendedor
    setValue('vendedor-select', '');
    
    // Limpiar fechas y observaciones
    setValue('fecha-viaje-inicio', '');
    setValue('fecha-viaje-fin', '');
    setValue('observaciones-venta', '');
    
    // Limpiar servicios
    VentasModule.currentVenta.servicios = [];
    VentasModule.currentVenta.cliente = {};
    
    renderServiciosAgregadosMejorado();
    updateVentaTotalsMejorado();
    
    // Limpiar formularios de servicios
    ['vuelo', 'hotel', 'traslado', 'excursion'].forEach(tipo => {
        clearServiceFormMejorado(tipo);
    });
    
    showNotification('🗑️ Formulario limpiado', 'info');
}

function clearServiceFormMejorado(tipo) {
    const serviceForm = document.getElementById(`service-${tipo}`);
    if (!serviceForm) return;
    
    // Limpiar todos los inputs
    const inputs = serviceForm.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type !== 'number' || !input.hasAttribute('min')) {
            input.value = '';
        } else {
            // Para campos numéricos con valor por defecto
            const defaultValue = input.getAttribute('value');
            input.value = defaultValue || '';
        }
    });
    
    // Remover display de margen
    const margenDisplay = serviceForm.querySelector('.margen-display');
    if (margenDisplay) {
        margenDisplay.remove();
    }
}

function updateVentaTotalsMejorado() {
    const total = VentasModule.currentVenta.servicios.reduce((sum, s) => sum + s.precio_venta, 0);
    const totalCosto = VentasModule.currentVenta.servicios.reduce((sum, s) => sum + (s.precio_costo || 0), 0);
    const margenTotal = total - totalCosto;
    
    const totalElement = document.getElementById('total-venta');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString();
    }
    
    // Actualizar sección de totales con más información
    const totalSection = document.querySelector('.total-section');
    if (totalSection && VentasModule.currentVenta.servicios.length > 0) {
        totalSection.innerHTML = `
            <div class="total-breakdown">
                <div class="total-row">
                    <span>💰 Total de Venta:</span>
                    <span class="total-amount">${formatCurrency(total)}</span>
                </div>
                <div class="total-row">
                    <span>💸 Total Costos:</span>
                    <span class="cost-amount">${formatCurrency(totalCosto)}</span>
                </div>
                <div class="total-row total-margin">
                    <span>📈 Margen Total:</span>
                    <span class="margin-amount" style="color: ${margenTotal >= 0 ? '#27ae60' : '#e74c3c'}">
                        ${formatCurrency(margenTotal)}
                    </span>
                </div>
                <div class="total-row">
                    <span>📊 Servicios:</span>
                    <span>${VentasModule.currentVenta.servicios.length}</span>
                </div>
            </div>
        `;
    }
}

function eliminarServicioMejorado(id) {
    VentasModule.currentVenta.servicios = VentasModule.currentVenta.servicios.filter(s => s.id !== id);
    renderServiciosAgregadosMejorado();
    updateVentaTotalsMejorado();
    showNotification('🗑️ Servicio eliminado', 'info');
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remover clases de error previas
    field.classList.remove('field-error');
    
    if (field.hasAttribute('required') && !value) {
        field.classList.add('field-error');
        showFieldError(field, 'Este campo es requerido');
        return false;
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        field.classList.add('field-error');
        showFieldError(field, 'Email inválido');
        return false;
    }
    
    return true;
}

function clearFieldError(e) {
    const field = e.target;
    field.classList.remove('field-error');
    
    const errorMsg = field.parentNode.querySelector('.field-error-msg');
    if (errorMsg) {
        errorMsg.remove();
    }
}

function showFieldError(field, message) {
    // Remover mensaje de error anterior
    const existingError = field.parentNode.querySelector('.field-error-msg');
    if (existingError) {
        existingError.remove();
    }
    
    // Crear nuevo mensaje de error
    const errorMsg = document.createElement('div');
    errorMsg.className = 'field-error-msg';
    errorMsg.style.cssText = 'color: #e74c3c; font-size: 12px; margin-top: 5px;';
    errorMsg.textContent = message;
    
    field.parentNode.appendChild(errorMsg);
}

function setupIntelligentValidation() {
    // Validación de fechas de viaje
    const fechaInicio = document.getElementById('fecha-viaje-inicio');
    const fechaFin = document.getElementById('fecha-viaje-fin');
    
    if (fechaInicio && fechaFin) {
        fechaInicio.addEventListener('change', function() {
            if (fechaFin.value && fechaInicio.value > fechaFin.value) {
                showNotification('⚠️ La fecha de inicio no puede ser posterior a la fecha de fin', 'warning');
                fechaInicio.value = '';
            }
        });
        
        fechaFin.addEventListener('change', function() {
            if (fechaInicio.value && fechaFin.value < fechaInicio.value) {
                showNotification('⚠️ La fecha de fin no puede ser anterior a la fecha de inicio', 'warning');
                fechaFin.value = '';
            }
        });
    }
}

// ===== FUNCIONES HELPER =====
function getValue(selector) {
    const element = typeof selector === 'string' && selector.includes(' ') 
        ? document.querySelector(selector)
        : document.getElementById(selector);
    return element ? element.value.trim() : '';
}

function setValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value || '';
    }
}

function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    return `${amount.toLocaleString()}`;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function generateSaleNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `NTS-${year}-${timestamp}`;
}

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
    eliminarServicio: eliminarServicioMejorado,
    crearVenta: crearVentaCompleta,
    limpiarFormulario: limpiarFormularioCompleto,
    currentVenta: VentasModule.currentVenta,
    vendedores: VentasModule.vendedores,
    proveedores: VentasModule.proveedores
};

console.log('✅ Módulo de ventas cargado correctamente');
