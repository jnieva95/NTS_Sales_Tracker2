// 🚀 FORZAR INICIALIZACIÓN DEL MÓDULO DE VENTAS
// Ejecuta esto en la consola del navegador:

async function forceInitVentas() {
    console.log('🚀 Forzando inicialización del módulo de ventas...');
    
    const { supabase } = window.NTS_CONFIG;
    
    if (!supabase) {
        console.error('❌ Supabase no disponible');
        return;
    }
    
    try {
        // 1. Cargar vendedores
        console.log('📊 Cargando vendedores...');
        const { data: vendedores, error: vendedoresError } = await supabase
            .from('vendedores')
            .select('id, nombre, codigo_vendedor, rol, comision_porcentaje')
            .eq('activo', true)
            .order('nombre');
        
        if (vendedoresError) {
            console.error('❌ Error cargando vendedores:', vendedoresError);
        } else {
            console.log('✅ Vendedores cargados:', vendedores.length);
            
            // Actualizar módulo
            if (window.VentasModule) {
                window.VentasModule.vendedores = vendedores;
            }
            
            // Actualizar select en el DOM
            updateVendedoresSelect(vendedores);
        }
        
        // 2. Cargar proveedores
        console.log('📊 Cargando proveedores...');
        const { data: proveedores, error: proveedoresError } = await supabase
            .from('proveedores')
            .select('id, nombre, tipo, comision_porcentaje')
            .eq('activo', true)
            .order('nombre');
        
        if (proveedoresError) {
            console.error('❌ Error cargando proveedores:', proveedoresError);
        } else {
            console.log('✅ Proveedores cargados:', proveedores.length);
            
            // Actualizar módulo
            if (window.VentasModule) {
                window.VentasModule.proveedores = proveedores;
            }
            
            // Actualizar selects de proveedores
            updateProveedoresSelects(proveedores);
        }
        
        // 3. Cargar clientes
        console.log('📊 Cargando clientes...');
        const { data: clientes, error: clientesError } = await supabase
            .from('clientes')
            .select('id, nombre, email, telefono, vendedor_id')
            .order('nombre');
        
        if (clientesError) {
            console.error('❌ Error cargando clientes:', clientesError);
        } else {
            console.log('✅ Clientes cargados:', clientes.length);
            
            // Actualizar módulo
            if (window.VentasModule) {
                window.VentasModule.clientesExistentes = clientes;
            }
            
            // Actualizar autocompletado
            setupClienteAutocomplete(clientes);
        }
        
        console.log('🎉 Inicialización completada');
        
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
    }
}

// Función para actualizar select de vendedores
function updateVendedoresSelect(vendedores) {
    // Buscar o crear select de vendedores
    let vendedorSelect = document.getElementById('vendedor-select');
    
    if (!vendedorSelect) {
        // Crear el select si no existe
        const clienteSection = document.querySelector('#nueva-venta .form-section');
        if (clienteSection) {
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
            vendedorSelect = document.getElementById('vendedor-select');
        }
    }
    
    if (vendedorSelect) {
        vendedorSelect.innerHTML = '<option value="">Seleccionar vendedor...</option>';
        
        vendedores.forEach(vendedor => {
            const option = document.createElement('option');
            option.value = vendedor.id;
            option.textContent = `${vendedor.nombre} (${vendedor.codigo_vendedor || 'Sin código'}) - ${vendedor.rol || 'vendedor'}`;
            vendedorSelect.appendChild(option);
        });
        
        console.log('✅ Select de vendedores actualizado');
    }
}

// Función para actualizar selects de proveedores
function updateProveedoresSelects(proveedores) {
    const serviceForms = ['vuelo', 'hotel', 'traslado', 'excursion'];
    
    serviceForms.forEach(serviceType => {
        const serviceForm = document.getElementById(`service-${serviceType}`);
        if (!serviceForm) return;
        
        // Buscar o crear select de proveedor
        let proveedorSelect = serviceForm.querySelector('.proveedor-select');
        
        if (!proveedorSelect) {
            // Crear fila de proveedor si no existe
            const firstRow = serviceForm.querySelector('.form-row');
            if (firstRow) {
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
                firstRow.parentNode.insertBefore(proveedorRow, firstRow.nextSibling);
                proveedorSelect = serviceForm.querySelector('.proveedor-select');
            }
        }
        
        if (proveedorSelect) {
            proveedorSelect.innerHTML = '<option value="">Seleccionar proveedor...</option>';
            
            // Mapear tipos de servicio a tipos de proveedor
            const tipoMapping = {
                'vuelo': 'vuelos',
                'hotel': 'hoteles',
                'traslado': 'traslados',
                'excursion': 'excursiones'
            };
            
            const proveedoresFiltrados = proveedores.filter(p => 
                p.tipo === tipoMapping[serviceType] || p.tipo === 'mixto'
            );
            
            proveedoresFiltrados.forEach(proveedor => {
                const option = document.createElement('option');
                option.value = proveedor.id;
                option.textContent = `${proveedor.nombre} (${proveedor.tipo})`;
                proveedorSelect.appendChild(option);
            });
        }
    });
    
    console.log('✅ Selects de proveedores actualizados');
}

// Función para configurar autocompletado de clientes
function setupClienteAutocomplete(clientes) {
    const clienteNombre = document.getElementById('cliente-nombre');
    if (!clienteNombre) return;
    
    // Crear o actualizar datalist
    let datalist = document.getElementById('clientes-datalist');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'clientes-datalist';
        document.body.appendChild(datalist);
    }
    
    datalist.innerHTML = '';
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.nombre;
        option.setAttribute('data-email', cliente.email || '');
        option.setAttribute('data-telefono', cliente.telefono || '');
        option.setAttribute('data-id', cliente.id);
        datalist.appendChild(option);
    });
    
    clienteNombre.setAttribute('list', 'clientes-datalist');
    
    console.log('✅ Autocompletado de clientes configurado');
}

// Ejecutar inicialización
forceInitVentas();
