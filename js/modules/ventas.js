// 💰 MÓDULO DE VENTAS - VERSIÓN FINAL FUNCIONAL
// Archivo: js/modules/ventas.js

console.log('💰 Cargando módulo de ventas (versión final)...');

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
    const { supabase, isSupabaseConnected } = window.NTS_CONFIG;
    
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
            .select('id, nombre, email, telefono, vendedor_id')
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
    
    // Crear select de vendedores
    createVendedorSelect();
    
    // Configurar autocompletado de clientes
    setupClienteAutocomplete();
    
    // Crear selects de proveedores
    createProveedorSelects();
    
    // Actualizar descripción de vuelos automáticamente
    setupVueloDescriptionUpdate();
}

function createVendedorSelect() {
    // Buscar si ya existe
    if (document.getElementById('vendedor-select-nts')) return;
    
    const clienteSection = document.querySelector('#nueva-venta .form-section');
    if (!clienteSection) return;
    
    const vendedorRow = document.createElement('div');
    vendedorRow.className = 'form-row';
    vendedorRow.innerHTML = `
        <div>
            <label for="vendedor-select-nts"><strong>🧑‍💼 Vendedor Responsable *</strong></label>
            <select id="vendedor-select-nts" required>
                <option value="">Seleccionar vendedor...</option>
            </select>
            <small>Seleccione el vendedor responsable de esta venta</small>
        </div>
    `;
    
    clienteSection.appendChild(vendedorRow);
    
    const select = document.getElementById('vendedor-select-nts');
    VentasModule.vendedores.forEach(vendedor => {
        const option = document.createElement('option');
        option.value = vendedor.id;
        option.textContent = `${vendedor.nombre} (${vendedor.codigo_vendedor}) - ${vendedor.rol}`;
        select.appendChild(option);
    });
    
    console.log('✅ Select de vendedores creado');
}

function setupClienteAutocomplete() {
    const clienteNombre = document.getElementById('cliente-nombre');
    if (!clienteNombre) return;
    
    // Crear datalist si no existe
    let datalist = document.getElementById('clientes-datalist-nts');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'clientes-datalist-nts';
        document.body.appendChild(datalist);
    }
    
    // Llenar datalist
    datalist.innerHTML = '';
    VentasModule.clientesExistentes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.nombre;
        option.setAttribute('data-email', cliente.email || '');
        option.setAttribute('data-telefono', cliente.telefono || '');
        option.setAttribute('data-id', cliente.id);
        datalist.appendChild(option);
    });
    
    clienteNombre.setAttribute('list', 'clientes-datalist-nts');
    
    // Event listener para autocompletar
    clienteNombre.addEventListener('input', function() {
        const selectedOption = [...datalist.options].find(option => option.value === this.value);
        
        if (selectedOption) {
            const emailField = document.getElementById('cliente-email');
            const telefonoField = document.getElementById('cliente-telefono');
            
            if (emailField) emailField.value = selectedOption.getAttribute('data-email');
            if (telefonoField) telefonoField.value = selectedOption.getAttribute('data-telefono');
            
            VentasModule.currentVenta.cliente.id = selectedOption.getAttribute('data-id');
            VentasModule.currentVenta.cliente.esExistente = true;
            
            showNotification('✅ Cliente encontrado - datos autocompletados', 'success');
        } else {
            VentasModule.currentVenta.cliente.esExistente = false;
        }
    });
    
    console.log('✅ Autocompletado de clientes configurado');
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
        proveedorRow.style.borderTop = '1px solid #e9ecef';
        
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

function setupVueloDescriptionUpdate() {
    const origenInput = document.getElementById('vuelo-origen');
    const destinoInput = document.getElementById('vuelo-destino');
    const descripcionInput = document.getElementById('vuelo-descripcion');
    
    if (!origenInput || !destinoInput || !descripcionInput) return;
    
    function updateDescription() {
        const origen = origenInput.value.trim();
        const destino = destinoInput.value.trim();
        
        if (origen && destino) {
            descripcionInput.value = `Vuelo ${origen} → ${destino}`;
        }
    }
    
    origenInput.addEventListener('input', updateDescription);
    destinoInput.addEventListener('input', updateDescription);
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
            const origen = document.getElementById('vuelo-origen')?.value?.trim() || '';
            const destino = document.getElementById('vuelo-destino')?.value?.trim() || '';
            const descripcionManual = document.getElementById('vuelo-descripcion')?.value?.trim();
            
            // Generar descripción automática si no hay una manual
            let descripcion = descripcionManual;
            if (!descripcion && origen && destino) {
                descripcion = `Vuelo ${origen} → ${destino}`;
            }
            
            return {
                ...baseData,
                descripcion: descripcion || `Vuelo ${origen} → ${destino}`,
                origen: origen,
                destino: destino,
                tipo_itinerario: document.getElementById('vuelo-tipo')?.value || 'ida_vuelta',
                fecha_salida: document.getElementById('vuelo-fecha-salida')?.value || '',
                aerolinea: document.getElementById('vuelo-aerolinea')?.value?.trim() || '',
                pasajeros: parseInt(document.getElementById('vuelo-pasajeros')?.value) || 1
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
    
    // Validaciones específicas por tipo
    switch(tipo) {
        case 'vuelo':
            if (!serviceData.origen || !serviceData.destino) {
                showNotification('⚠️ Complete origen y destino del vuelo', 'warning');
                return false;
            }
            if (serviceData.origen.trim() === '' || serviceData.destino.trim() === '') {
                showNotification('⚠️ Origen y destino no pueden estar vacíos', 'warning');
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
        } else {
            input.value = '';
        }
    });
    
    serviceForm.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    
    // Remover display de margen
    const margenDisplay = serviceForm.querySelector('.margen-display-nts');
    if (margenDisplay) {
        margenDisplay.remove();
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
                        <span class="service-price">$${servicio.precio_venta.toLocaleString()}</span>
                    </div>
                    <div class="service-details">
                        ${proveedor ? `<span class="service-provider">🏢 ${proveedor.nombre}</span>` : ''}
                        <span class="service-margin" style="color: ${servicio.margen_ganancia >= 0 ? '#27ae60' : '#e74c3c'}">
                            💰 Margen: $${servicio.margen_ganancia.toLocaleString()}
                        </span>
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
                    <span class="total-amount">$${total.toLocaleString()}</span>
                </div>
                <div class="total-row">
                    <span>💸 Total Costos:</span>
                    <span class="cost-amount">$${totalCosto.toLocaleString()}</span>
                </div>
                <div class="total-row total-margin">
                    <span>📈 Margen Total:</span>
                    <span class="margin-amount" style="color: ${margenTotal >= 0 ? '#27ae60' : '#e74c3c'}">
                        $${margenTotal.toLocaleString()}
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
        
        const { isSupabaseConnected } = window.NTS_CONFIG;
        
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
    
    if (!clienteNombre) {
        showNotification('⚠️ Ingrese el nombre del cliente', 'warning');
        document.getElementById('cliente-nombre')?.focus();
        return false;
    }
    
    if (!vendedorId) {
        showNotification('⚠️ Seleccione un vendedor responsable', 'warning');
        document.getElementById('vendedor-select-nts')?.focus();
        return false;
    }
    
    if (VentasModule.currentVenta.servicios.length === 0) {
        showNotification('⚠️ Agregue al menos un servicio', 'warning');
        return false;
    }
    
    return true;
}

function buildVentaData() {
    const total = VentasModule.currentVenta.servicios.reduce((sum, s) => sum + s.precio_venta, 0);
    
    return {
        cliente: {
            nombre: document.getElementById('cliente-nombre')?.value?.trim(),
            email: document.getElementById('cliente-email')?.value?.trim(),
            telefono: document.getElementById('cliente-telefono')?.value?.trim(),
            documento: document.getElementById('cliente-documento')?.value?.trim(),
            vendedor_id: parseInt(document.getElementById('vendedor-select-nts')?.value),
            esExistente: VentasModule.currentVenta.cliente.esExistente || false,
            id: VentasModule.currentVenta.cliente.id || null
        },
        venta: {
            vendedor_id: parseInt(document.getElementById('vendedor-select-nts')?.value),
            fecha_venta: new Date().toISOString().split('T')[0],
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
    const { supabase } = window.NTS_CONFIG;
    
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
        
        console.log('✅ Venta creada en DB:', numeroVenta);
        
    } catch (error) {
        console.error('Error en crearVentaEnDB:', error);
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
    ['cliente-nombre', 'cliente-email', 'cliente-telefono', 'cliente-documento'].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
    
    // Limpiar vendedor
    const vendedorSelect = document.getElementById('vendedor-select-nts');
    if (vendedorSelect) vendedorSelect.selectedIndex = 0;
    
    // Limpiar fechas y observaciones
    ['fecha-viaje-inicio', 'fecha-viaje-fin', 'observaciones-venta'].forEach(id => {
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

console.log('✅ Módulo de ventas cargado correctamente');
