// ===== MAIN.JS - APLICACIÓN PRINCIPAL NTS V2.0 =====

console.log('🚀 Iniciando NTS Sistema v2.0...');

// ===== CONFIGURACIÓN GLOBAL =====
const APP_CONFIG = {
  name: 'NTS Sistema',
  version: '2.0.0',
  debug: true,
  supabase: {
    url: 'https://fmvozdsvpxitoyhtdmcv.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdm96ZHN2cHhpdG95aHRkbWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjc1MzEsImV4cCI6MjA3MDgwMzUzMX0.EqK3pND6Zz48OpnVDCF_0KJUcV3TzkRUz9qTMWL3NNE'
  }
};

// ===== ESTADO GLOBAL =====
const AppState = {
  currentTab: 'dashboard',
  currentStep: 1,
  isLoading: false,
  supabase: null,
  isConnected: false,
  user: null,
  notifications: [],
  clientes: [],
  vendedores: [],
  proveedores: [],
  ventas: [],
  originalClientData: null,

  // Datos de la venta actual
  currentSale: {
    client: {},
    trip: {},
    services: [],
    totals: {
      subtotal: 0,
      discounts: 0,
      total: 0
    },
    fechaVenta: null
  },
  editingSaleId: null,
  editingServiceId: null
};

// ===== INICIALIZACIÓN =====
class NTSApp {
  constructor() {
    this.ventasListenersSetup = false;
    this.init();
  }

  async init() {
    try {
      console.log('🔧 Inicializando aplicación...');
      
      // Mostrar loader
      this.showLoader();
      
      // Inicializar Supabase
      await this.initSupabase();
      
      // Configurar UI
      this.setupUI();
      
      // Configurar eventos
      this.setupEventListeners();
      
      // Inicializar iconos
      this.initIcons();
      
      // Cargar datos iniciales
      await this.loadInitialData();
      
      // Ocultar loader y mostrar app
      this.hideLoader();
      
      console.log('✅ Aplicación inicializada correctamente');
      this.showNotification('Sistema NTS iniciado correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      this.showNotification('Error al inicializar el sistema', 'error');
      this.hideLoader();
    }
  }

  async initSupabase() {
    try {
      const { supabase, isSupabaseConnected } = window.NTS_CONFIG || {};
      if (supabase && isSupabaseConnected) {
        AppState.supabase = supabase;
        AppState.isConnected = true;
        console.log('✅ Supabase conectado');
        this.updateConnectionStatus(true);
      } else {
        console.log('⚠️ Supabase no disponible');
        this.updateConnectionStatus(false);
      }
    } catch (error) {
      console.error('❌ Error conectando Supabase:', error);
      this.updateConnectionStatus(false);
    }
  }

  setupUI() {
    console.log('🎨 Configurando interfaz...');
    
    // Configurar navegación
    this.setupNavigation();
    
    // Configurar formulario de pasos
    this.setupStepForm();

    // Configurar servicios
    this.setupServices();

    // Configurar toggle de documentos
    this.setupDocumentoToggle();

    // Configurar header actions
    this.setupHeaderActions();
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        this.showTab(tab);
      });
    });
  }

  setupStepForm() {
    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep());
    }
  }

  setupServices() {
    const serviceTabs = document.querySelectorAll('.service-tab[data-service]');
    
    serviceTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const service = tab.getAttribute('data-service');
        this.showServiceTab(service);
      });
    });
  }

  setupHeaderActions() {
    // Botón de pantalla completa
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }
    
    // Botón de notificaciones
    const notificationsBtn = document.getElementById('notifications-btn');
    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', () => this.showNotificationsPanel());
    }
    
    // Botón de configuración
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showSettingsPanel());
    }
  }

  setupDocumentoToggle() {
    const select = document.getElementById('cliente-doc-tipo');
    if (!select) return;
    select.addEventListener('change', () => this.toggleDocumentoFields());
    this.toggleDocumentoFields();
  }

  toggleDocumentoFields() {
    const tipo = document.getElementById('cliente-doc-tipo')?.value || 'dni';
    const isDNI = tipo === 'dni';
    document.getElementById('grupo-dni')?.classList.toggle('hidden', !isDNI);
    document.getElementById('grupo-dni-exp')?.classList.toggle('hidden', !isDNI);
    document.getElementById('grupo-pasaporte')?.classList.toggle('hidden', isDNI);
    document.getElementById('grupo-pasaporte-exp')?.classList.toggle('hidden', isDNI);
  }

  setupEventListeners() {
    console.log('🎯 Configurando eventos...');
    
    // Refresh dashboard
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshDashboard());
    }
    
    // Create sale button
    const createSaleBtn = document.getElementById('create-sale');
    if (createSaleBtn) {
      createSaleBtn.addEventListener('click', () => this.createSale());
    }
    
    // Save draft button
    const saveDraftBtn = document.getElementById('save-draft');
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', () => this.saveDraft());
    }
    
    // Responsive sidebar toggle
    this.setupResponsiveNavigation();
  }

  setupResponsiveNavigation() {
    // Agregar botón de menú móvil si no existe
    if (window.innerWidth <= 1024) {
      this.addMobileMenuButton();
    }
    
    // Listener para cambios de tamaño
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 1024) {
        this.addMobileMenuButton();
      } else {
        this.removeMobileMenuButton();
      }
    });
  }

  addMobileMenuButton() {
    if (document.getElementById('mobile-menu-btn')) return;
    
    const headerContent = document.querySelector('.header-content');
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.id = 'mobile-menu-btn';
    mobileMenuBtn.className = 'btn-icon';
    mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
    mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar());
    
    headerContent.insertBefore(mobileMenuBtn, headerContent.firstChild);
    
    // Re-inicializar iconos
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  removeMobileMenuButton() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.remove();
    }
  }

  toggleMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    sidebar.classList.toggle('open');
  }

  initIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
      console.log('✅ Iconos inicializados');
    } else {
      console.log('⚠️ Lucide icons no disponible');
    }
  }

  async loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    try {
      if (AppState.isConnected) {
        await this.loadDashboardData();
        await this.loadClientes();
        await this.loadVendedores();
        await this.loadProveedores();
      } else {
        this.loadMockData();
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.loadMockData();
    }
  }

  async loadDashboardData() {
    try {
      // Cargar estadísticas reales desde Supabase
      const { data: ventas, error } = await AppState.supabase
        .from('ventas')
        .select('total_final, estado_pago, created_at');
      
      if (error) throw error;
      
      // Calcular métricas
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const ventasDelMes = ventas.filter(v => {
        const fecha = new Date(v.created_at);
        return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
      });
      
      const totalVentasMes = ventasDelMes.reduce((sum, v) => sum + (v.total_final || 0), 0);
      const totalVentas = ventas.length;
      const pendientes = ventas.filter(v => v.estado_pago !== 'pagado_completo').length;
      
      // Actualizar UI
      this.updateDashboardStats({
        ventasDelMes: totalVentasMes,
        totalVentas: totalVentas,
        pendientes: pendientes,
        totalClientes: 0 // Se cargará por separado
      });
      
      // Cargar actividad reciente
      this.loadRecentActivity(ventas.slice(0, 5));
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      this.loadMockData();
    }
  }

  loadMockData() {
    console.log('📊 Cargando datos de demostración...');
    
    this.updateDashboardStats({
      ventasDelMes: 125000,
      totalVentas: 25,
      pendientes: 8,
      totalClientes: 15
    });
    
    this.loadMockActivity();
    this.initSalesChart();

    AppState.vendedores = [
      { id: 1, nombre: 'Ana García', codigo_vendedor: 'V001', rol: 'gerente' },
      { id: 2, nombre: 'Carlos López', codigo_vendedor: 'V002', rol: 'vendedor' }
    ];
    this.populateVendedorSelect();
  }

  updateDashboardStats(stats) {
    const elements = {
      'ventas-mes': this.formatCurrency(stats.ventasDelMes),
      'ventas-total': stats.totalVentas.toString(),
      'pendientes': stats.pendientes.toString(),
      'total-clientes': stats.totalClientes.toString()
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  }

  loadRecentActivity(ventas) {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    
    const activityHTML = ventas.map(venta => `
      <div class="activity-item">
        <div class="activity-icon" style="background: var(--primary-100); color: var(--primary-600);">
          <i data-lucide="shopping-cart"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">Nueva venta creada</div>
          <div class="activity-description">${this.formatCurrency(venta.total_final)}</div>
        </div>
        <div class="activity-time">${this.formatRelativeTime(venta.created_at)}</div>
      </div>
    `).join('');
    
    container.innerHTML = activityHTML;
    
    // Re-inicializar iconos
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  async loadClientes() {
    try {
      if (!AppState.isConnected) return;
      const { data, error } = await AppState.supabase
        .from('clientes')
        .select(
          'id, nombre, email, telefono, DNI, dni_expiracion, Pasaporte, pasaporte_expiracion'
        )
        .order('nombre');
      if (error) throw error;
      AppState.clientes = data || [];
      this.setupClientAutocomplete();
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  }

  setupClientAutocomplete() {
    const input = document.getElementById('cliente-nombre');
    const apellidoInput = document.getElementById('cliente-apellido');
    if (!input) return;

    let datalist = document.getElementById('clientes-datalist');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'clientes-datalist';
      document.body.appendChild(datalist);
    }

    datalist.innerHTML = AppState.clientes
      .map(c => `<option value="${c.nombre}" data-id="${c.id}" data-email="${c.email || ''}" data-telefono="${c.telefono || ''}" data-dni="${c.DNI || ''}" data-dni-expiracion="${c.dni_expiracion || ''}" data-pasaporte="${c.Pasaporte || ''}" data-pasaporte-expiracion="${c.pasaporte_expiracion || ''}"></option>`)
      .join('');

    input.setAttribute('list', 'clientes-datalist');

    input.addEventListener('input', function () {
      const option = [...datalist.options].find(
        o => o.value.toLowerCase() === this.value.toLowerCase()
      );
      if (option) {
        const [first, ...rest] = option.value.split(' ');
        input.value = first;
        if (apellidoInput) apellidoInput.value = rest.join(' ');

        const emailField = document.getElementById('cliente-email');
        const telField = document.getElementById('cliente-telefono');
        const dniField = document.getElementById('cliente-dni');
        const dniExpField = document.getElementById('cliente-dni-expiracion');
        const pasaporteField = document.getElementById('cliente-pasaporte');
        const pasaporteExpField = document.getElementById(
          'cliente-pasaporte-expiracion'
        );

        if (emailField) emailField.value = option.dataset.email;
        if (telField) telField.value = option.dataset.telefono;
        if (dniField) dniField.value = option.dataset.dni;
        if (dniExpField) dniExpField.value = option.dataset.dniExpiracion;
        if (pasaporteField) pasaporteField.value = option.dataset.pasaporte;
        if (pasaporteExpField)
          pasaporteExpField.value = option.dataset.pasaporteExpiracion;

        const docSelect = document.getElementById('cliente-doc-tipo');
        if (docSelect) {
          const tipo = option.dataset.dni ? 'dni' : 'pasaporte';
          docSelect.value = tipo;
          window.app?.toggleDocumentoFields();
        }

        AppState.currentSale.client.id = option.dataset.id;
        AppState.currentSale.client.esExistente = true;
        AppState.originalClientData = {
          email: option.dataset.email || '',
          telefono: option.dataset.telefono || '',
          DNI: option.dataset.dni || '',
          dni_expiracion: option.dataset.dniExpiracion || '',
          Pasaporte: option.dataset.pasaporte || '',
          pasaporte_expiracion: option.dataset.pasaporteExpiracion || ''
        };
      }
    });
  }

  async loadVendedores() {
    try {
      if (!AppState.isConnected) return;
      const { data, error } = await AppState.supabase
        .from('vendedores')
        .select('id, nombre, codigo_vendedor, rol')
        .order('nombre');
      if (error) throw error;
      AppState.vendedores = data || [];
      this.populateVendedorSelect();
    } catch (error) {
      console.error('Error cargando vendedores:', error);
    }
  }

  populateVendedorSelect() {
    const select = document.getElementById('vendedor-select-nts');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar vendedor...</option>';
    AppState.vendedores.forEach(v => {
      const option = document.createElement('option');
      option.value = v.id;
      option.textContent = `${v.nombre} (${v.codigo_vendedor}) - ${v.rol}`;
      select.appendChild(option);
    });
  }

  async loadProveedores() {
    try {
      if (!AppState.isConnected) return;
      const { data, error } = await AppState.supabase
        .from('proveedores')
        .select('id, nombre, tipo')
        .order('nombre');
      if (error) throw error;
      AppState.proveedores = data || [];
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      AppState.proveedores = [];
    }
  }

  loadMockActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    
    const mockActivity = [
      { type: 'sale', title: 'Nueva venta creada', description: '$45,000 - Juan Pérez', time: 'hace 2 horas' },
      { type: 'client', title: 'Cliente agregado', description: 'María González', time: 'hace 4 horas' },
      { type: 'payment', title: 'Pago recibido', description: '$28,500', time: 'hace 6 horas' },
      { type: 'sale', title: 'Venta confirmada', description: 'Carlos López', time: 'hace 1 día' }
    ];
    
    const activityHTML = mockActivity.map(activity => {
      const iconMap = {
        sale: 'shopping-cart',
        client: 'user-plus',
        payment: 'credit-card'
      };
      
      return `
        <div class="activity-item">
          <div class="activity-icon" style="background: var(--primary-100); color: var(--primary-600);">
            <i data-lucide="${iconMap[activity.type] || 'circle'}"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-description">${activity.description}</div>
          </div>
          <div class="activity-time">${activity.time}</div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = activityHTML;
    
    // Re-inicializar iconos
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  initSalesChart() {
    const canvas = document.getElementById('sales-chart');
    if (!canvas || !window.Chart) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
          label: 'Ventas',
          data: [65000, 78000, 85000, 92000, 105000, 125000],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  // ===== NAVEGACIÓN =====
  showTab(tabName) {
    console.log(`📂 Mostrando pestaña: ${tabName}`);
    
    AppState.currentTab = tabName;
    
    // Actualizar navegación
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Mostrar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    document.getElementById(tabName)?.classList.add('active');
    
    // Cerrar sidebar móvil
    if (window.innerWidth <= 1024) {
      document.getElementById('app-sidebar')?.classList.remove('open');
    }
    
    // Cargar datos específicos de la pestaña
    this.loadTabData(tabName);
  }

  loadTabData(tabName) {
    switch (tabName) {
      case 'dashboard':
        this.refreshDashboard();
        break;
      case 'nueva-venta':
        this.initNewSaleForm();
        break;
      case 'ventas':
        this.loadVentasList();
        break;
      case 'clientes':
        if (typeof initClientesModule === 'function') {
          initClientesModule();
        }
        break;
      default:
        console.log(`Pestaña ${tabName} no implementada aún`);
    }
  }

  // ===== FORMULARIO DE PASOS =====
  nextStep() {
    if (AppState.currentStep < 4) {
      if (this.validateCurrentStep()) {
        AppState.currentStep++;
        this.updateStepForm();
      }
    } else {
      this.createSale();
    }
  }

  prevStep() {
    if (AppState.currentStep > 1) {
      AppState.currentStep--;
      this.updateStepForm();
    }
  }

  updateStepForm() {
    // Actualizar indicadores de paso
    document.querySelectorAll('.step').forEach((step, index) => {
      step.classList.toggle('active', index + 1 === AppState.currentStep);
    });
    
    // Mostrar/ocultar pasos
    document.querySelectorAll('.form-step').forEach((step, index) => {
      step.classList.toggle('active', index + 1 === AppState.currentStep);
    });
    
    // Actualizar botones de navegación
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    
    if (prevBtn) {
      prevBtn.style.display = AppState.currentStep === 1 ? 'none' : 'flex';
    }
    
    if (nextBtn) {
      nextBtn.innerHTML = AppState.currentStep === 4 
        ? '<i data-lucide="check"></i> Crear Venta'
        : 'Siguiente <i data-lucide="chevron-right"></i>';
    }
    
    // Re-inicializar iconos
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  validateCurrentStep() {
    switch (AppState.currentStep) {
      case 1:
        return this.validateClientStep();
      case 2:
        return this.validateTripStep();
      case 3:
        return this.validateServicesStep();
      default:
        return true;
    }
  }

  validateClientStep() {
    const nombre = document.getElementById('cliente-nombre')?.value?.trim();
    const apellido = document.getElementById('cliente-apellido')?.value?.trim();
    const docTipo = document.getElementById('cliente-doc-tipo')?.value;
    const dni = document.getElementById('cliente-dni')?.value?.trim();
    const pasaporte = document.getElementById('cliente-pasaporte')?.value?.trim();

    if (!nombre || !apellido) {
      this.showNotification('Por favor ingrese nombre y apellido del cliente', 'warning');
      document.getElementById(!nombre ? 'cliente-nombre' : 'cliente-apellido')?.focus();
      return false;
    }

    if (docTipo === 'dni' && !dni) {
      this.showNotification('Por favor ingrese el DNI del cliente', 'warning');
      document.getElementById('cliente-dni')?.focus();
      return false;
    }

    if (docTipo === 'pasaporte' && !pasaporte) {
      this.showNotification('Por favor ingrese el pasaporte del cliente', 'warning');
      document.getElementById('cliente-pasaporte')?.focus();
      return false;
    }

    // Guardar datos del cliente
    AppState.currentSale.client = {
      ...AppState.currentSale.client,
      nombre: nombre,
      email: document.getElementById('cliente-email')?.value?.trim(),
      telefono: document.getElementById('cliente-telefono')?.value?.trim(),
      dni: docTipo === 'dni' ? dni : null,
      pasaporte: docTipo === 'pasaporte' ? pasaporte : null,
      dni_expiracion: docTipo === 'dni' ? document.getElementById('cliente-dni-expiracion')?.value : null,
      pasaporte_expiracion: docTipo === 'pasaporte' ? document.getElementById('cliente-pasaporte-expiracion')?.value : null,
      documento_tipo: docTipo
    };

    return true;
  }

  validateTripStep() {
    const fechaVenta = document.getElementById('fecha-venta')?.value;
    const fechaInicio = document.getElementById('fecha-viaje-inicio')?.value;

    if (!fechaVenta) {
      this.showNotification('Por favor seleccione la fecha de venta', 'warning');
      document.getElementById('fecha-venta')?.focus();
      return false;
    }

    if (!fechaInicio) {
      this.showNotification('Por favor seleccione la fecha de inicio del viaje', 'warning');
      document.getElementById('fecha-viaje-inicio')?.focus();
      return false;
    }

    // Guardar datos del viaje y venta
    AppState.currentSale.fechaVenta = fechaVenta;
    AppState.currentSale.trip = {
      fechaInicio: fechaInicio,
      fechaFin: document.getElementById('fecha-viaje-fin')?.value,
      observaciones: document.getElementById('observaciones-venta')?.value?.trim()
    };

    return true;
  }

  validateServicesStep() {
    if (AppState.currentSale.services.length === 0) {
      this.showNotification('Por favor agregue al menos un servicio', 'warning');
      return false;
    }
    
    return true;
  }

  // ===== SERVICIOS =====
  showServiceTab(serviceType) {
    // Actualizar tabs
    document.querySelectorAll('.service-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    document.querySelector(`[data-service="${serviceType}"]`)?.classList.add('active');
    
    // Cargar formulario del servicio
    this.loadServiceForm(serviceType);
  }

  loadServiceForm(serviceType) {
    const container = document.getElementById('service-forms');
    if (!container) return;
    
    const forms = {
      vuelo: this.getFlightForm(),
      hotel: this.getHotelForm(),
      traslado: this.getTransferForm(),
      excursion: this.getExcursionForm()
    };
    
    container.innerHTML = forms[serviceType] || '<p>Formulario no disponible</p>';
    
    // Configurar eventos del formulario
    this.setupServiceFormEvents(serviceType);
    
    // Re-inicializar iconos
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  getFlightForm() {
    return `
      <div class="form-card">
        <div class="card-header">
          <h3><i data-lucide="plane"></i> Información del Vuelo</h3>
        </div>
        <div class="card-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="vuelo-itinerario">Tipo de itinerario *</label>
              <select id="vuelo-itinerario" class="form-control" required>
                <option value="ida_vuelta">Ida y vuelta</option>
                <option value="ida">Ida</option>
                <option value="multitramo">Multitramo</option>
                <option value="stopover">Stopover</option>
              </select>
            </div>
            <div class="form-group">
              <label for="vuelo-proveedor">Proveedor *</label>
              <select id="vuelo-proveedor" class="form-control">
                <option value="">Seleccionar...</option>
              </select>
            </div>
            <div class="form-group">
              <label for="vuelo-pasajeros">Pasajeros</label>
              <input type="number" id="vuelo-pasajeros" class="form-control" value="1" min="1">
            </div>
            <div class="form-group">
              <label for="vuelo-costo">Costo</label>
              <input type="number" id="vuelo-costo" class="form-control" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="vuelo-precio">Precio de venta *</label>
              <input type="number" id="vuelo-precio" class="form-control" step="0.01" min="0" required>
            </div>
          </div>

          <div class="form-section" style="margin-top: 1rem;">
            <h4>Segmentos del vuelo</h4>
            <div id="segments-container"></div>
            <button type="button" class="btn btn-secondary" id="add-segment-btn" style="margin-top: 0.5rem;">
              <i data-lucide="plus"></i>
              Agregar tramo
            </button>
          </div>

          <div class="form-actions" style="margin-top: 1.5rem;">
            <button type="button" class="btn btn-primary" onclick="app.addService('vuelo')">
              <i data-lucide="plus"></i>
              Agregar Vuelo
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getHotelForm() {
    return `
      <div class="form-card">
        <div class="card-header">
          <h3><i data-lucide="building"></i> Información del Hotel</h3>
        </div>
        <div class="card-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="hotel-nombre">Nombre del Hotel *</label>
              <input type="text" id="hotel-nombre" class="form-control" placeholder="Hotel Fontainebleau" required>
            </div>
            <div class="form-group">
              <label for="hotel-ciudad">Ciudad</label>
              <input type="text" id="hotel-ciudad" class="form-control" placeholder="Miami Beach">
            </div>
            <div class="form-group">
              <label for="hotel-checkin">Check-in *</label>
              <input type="date" id="hotel-checkin" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="hotel-checkout">Check-out *</label>
              <input type="date" id="hotel-checkout" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="hotel-proveedor">Proveedor *</label>
              <select id="hotel-proveedor" class="form-control">
                <option value="">Seleccionar...</option>
              </select>
            </div>
            <div class="form-group">
              <label for="hotel-costo">Costo</label>
              <input type="number" id="hotel-costo" class="form-control" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="hotel-precio">Precio Total *</label>
              <input type="number" id="hotel-precio" class="form-control" placeholder="800" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label for="hotel-huespedes">Huéspedes</label>
              <input type="number" id="hotel-huespedes" class="form-control" value="2" min="1">
            </div>
          </div>
          <div class="form-actions" style="margin-top: var(--spacing-lg);">
            <button type="button" class="btn btn-primary" onclick="app.addService('hotel')">
              <i data-lucide="plus"></i>
              Agregar Hotel
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getTransferForm() {
    return `
      <div class="form-card">
        <div class="card-header">
          <h3><i data-lucide="car"></i> Información del Traslado</h3>
        </div>
        <div class="card-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="traslado-origen">Origen *</label>
              <input type="text" id="traslado-origen" class="form-control" placeholder="Aeropuerto Internacional" required>
            </div>
            <div class="form-group">
              <label for="traslado-destino">Destino *</label>
              <input type="text" id="traslado-destino" class="form-control" placeholder="Hotel Fontainebleau" required>
            </div>
            <div class="form-group">
              <label for="traslado-fecha">Fecha</label>
              <input type="date" id="traslado-fecha" class="form-control">
            </div>
            <div class="form-group">
              <label for="traslado-hora">Hora</label>
              <input type="time" id="traslado-hora" class="form-control">
            </div>
            <div class="form-group">
              <label for="traslado-proveedor">Proveedor *</label>
              <select id="traslado-proveedor" class="form-control">
                <option value="">Seleccionar...</option>
              </select>
            </div>
            <div class="form-group">
              <label for="traslado-costo">Costo</label>
              <input type="number" id="traslado-costo" class="form-control" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="traslado-precio">Precio *</label>
              <input type="number" id="traslado-precio" class="form-control" placeholder="80" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label for="traslado-pasajeros">Pasajeros</label>
              <input type="number" id="traslado-pasajeros" class="form-control" value="2" min="1">
            </div>
          </div>
          <div class="form-actions" style="margin-top: var(--spacing-lg);">
            <button type="button" class="btn btn-primary" onclick="app.addService('traslado')">
              <i data-lucide="plus"></i>
              Agregar Traslado
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getExcursionForm() {
    return `
      <div class="form-card">
        <div class="card-header">
          <h3><i data-lucide="map"></i> Información de la Excursión</h3>
        </div>
        <div class="card-content">
          <div class="form-grid">
            <div class="form-group">
              <label for="excursion-nombre">Nombre de la Excursión *</label>
              <input type="text" id="excursion-nombre" class="form-control" placeholder="Tour a Chichen Itzá" required>
            </div>
            <div class="form-group">
              <label for="excursion-destino">Destino</label>
              <input type="text" id="excursion-destino" class="form-control" placeholder="Chichen Itzá, Yucatán">
            </div>
            <div class="form-group">
              <label for="excursion-fecha">Fecha</label>
              <input type="date" id="excursion-fecha" class="form-control">
            </div>
            <div class="form-group">
              <label for="excursion-duracion">Duración (horas)</label>
              <input type="number" id="excursion-duracion" class="form-control" placeholder="8" min="1">
            </div>
            <div class="form-group">
              <label for="excursion-proveedor">Proveedor *</label>
              <select id="excursion-proveedor" class="form-control">
                <option value="">Seleccionar...</option>
              </select>
            </div>
            <div class="form-group">
              <label for="excursion-costo">Costo</label>
              <input type="number" id="excursion-costo" class="form-control" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="excursion-precio">Precio *</label>
              <input type="number" id="excursion-precio" class="form-control" placeholder="470" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label for="excursion-participantes">Participantes</label>
              <input type="number" id="excursion-participantes" class="form-control" value="2" min="1">
            </div>
          </div>
          <div class="form-actions" style="margin-top: var(--spacing-lg);">
            <button type="button" class="btn btn-primary" onclick="app.addService('excursion')">
              <i data-lucide="plus"></i>
              Agregar Excursión
            </button>
          </div>
        </div>
      </div>
    `;
  }

  setupServiceFormEvents(serviceType) {
    // Eventos específicos por tipo de servicio
    console.log(`Configurando eventos para servicio: ${serviceType}`);
    this.populateProveedorSelect(serviceType);
    if (serviceType === 'vuelo') {
      const container = document.getElementById('segments-container');
      if (container && !container.children.length) {
        addSegmentRow();
      }
    }
  }

  populateProveedorSelect(serviceType) {
    const select = document.getElementById(`${serviceType}-proveedor`);
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar proveedor...</option>';
    const typeMap = {
      vuelo: 'vuelos',
      hotel: 'hoteles',
      traslado: 'traslados',
      excursion: 'excursiones'
    };
    const list = AppState.proveedores.filter(
      p => p.tipo === typeMap[serviceType] || p.tipo === 'mixto'
    );
    list.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nombre;
      select.appendChild(opt);
    });
  }

  addService(serviceType) {
    const serviceData = this.getServiceData(serviceType);

    if (!this.validateServiceData(serviceData, serviceType)) {
      return;
    }

    const isEdit = !!AppState.editingServiceId;
    if (isEdit) {
      const idx = AppState.currentSale.services.findIndex(
        s => s.id === AppState.editingServiceId
      );
      if (idx !== -1) {
        AppState.currentSale.services[idx] = {
          ...serviceData,
          id: AppState.editingServiceId,
          type: serviceType
        };
      }
      AppState.editingServiceId = null;
    } else {
      serviceData.id = Date.now();
      serviceData.type = serviceType;
      AppState.currentSale.services.push(serviceData);
    }

    // Actualizar UI
    this.updateServicesList();
    this.updateTotals();
    this.clearServiceForm(serviceType);

    const btn = document.querySelector('#service-forms .btn.btn-primary');
    if (btn) {
      btn.innerHTML = `<i data-lucide="plus"></i> Agregar ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}`;
      if (window.lucide) window.lucide.createIcons();
    }

    this.showNotification(`${serviceType} ${isEdit ? 'actualizado' : 'agregado'} correctamente`, 'success');
  }

  getServiceData(serviceType) {
    const baseData = {
      costo: parseFloat(document.getElementById(`${serviceType}-costo`)?.value) || 0,
      precio: parseFloat(document.getElementById(`${serviceType}-precio`)?.value) || 0,
      proveedor_id: parseInt(document.getElementById(`${serviceType}-proveedor`)?.value) || null
    };
    
    switch (serviceType) {
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
        const cantidad_escalas = segmentos.reduce(
          (sum, s) => sum + (s.escalas ? s.escalas.length : 0),
          0
        );
        const descripcion = origen && destino ? `Vuelo ${origen} → ${destino}` : 'Vuelo';
        const tipo_itinerario =
          document.getElementById('vuelo-itinerario')?.value || 'ida_vuelta';

        return {
          ...baseData,
          pasajeros: parseInt(document.getElementById('vuelo-pasajeros')?.value) || 1,
          tipo_itinerario,
          origen,
          destino,
          descripcion,
          tieneEscalas,
          cantidad_escalas,
          tiempo_total_vuelo: null,
          segmentos
        };
      case 'hotel':
        return {
          ...baseData,
          nombre: document.getElementById('hotel-nombre')?.value?.trim(),
          ciudad: document.getElementById('hotel-ciudad')?.value?.trim(),
          checkin: document.getElementById('hotel-checkin')?.value,
          checkout: document.getElementById('hotel-checkout')?.value,
          huespedes: parseInt(document.getElementById('hotel-huespedes')?.value) || 2
        };
      case 'traslado':
        return {
          ...baseData,
          origen: document.getElementById('traslado-origen')?.value?.trim(),
          destino: document.getElementById('traslado-destino')?.value?.trim(),
          fecha: document.getElementById('traslado-fecha')?.value,
          hora: document.getElementById('traslado-hora')?.value,
          pasajeros: parseInt(document.getElementById('traslado-pasajeros')?.value) || 2
        };
      case 'excursion':
        return {
          ...baseData,
          nombre: document.getElementById('excursion-nombre')?.value?.trim(),
          destino: document.getElementById('excursion-destino')?.value?.trim(),
          fecha: document.getElementById('excursion-fecha')?.value,
          duracion: parseInt(document.getElementById('excursion-duracion')?.value) || 0,
          participantes: parseInt(document.getElementById('excursion-participantes')?.value) || 2
        };
      default:
        return baseData;
    }
  }

  validateServiceData(serviceData, serviceType) {
    if (!serviceData.precio || serviceData.precio <= 0) {
      this.showNotification('Por favor ingrese un precio válido', 'warning');
      return false;
    }

    if (!serviceData.proveedor_id) {
      this.showNotification('Seleccione un proveedor', 'warning');
      return false;
    }
    
    // Validaciones específicas por tipo
    switch (serviceType) {
      case 'vuelo':
        if (!serviceData.segmentos || serviceData.segmentos.length === 0) {
          this.showNotification('Agregue al menos un tramo', 'warning');
          return false;
        }

        const invalid = serviceData.segmentos.some(s => !s.aeropuerto_origen || !s.aeropuerto_destino || !s.aerolinea || !s.numero_vuelo);
        if (invalid) {
          this.showNotification('Complete origen, destino, aerolínea y número de vuelo en todos los tramos', 'warning');
          return false;
        }
        const escalaInvalid = serviceData.segmentos.some(s => s.tiene_escala && (s.escalas.length === 0 || s.escalas.some(e => !e.aeropuerto || !e.duracion)));
        if (escalaInvalid) {
          this.showNotification('Complete los datos de todas las escalas', 'warning');
          return false;
        }
        break;
      case 'hotel':
        if (!serviceData.nombre) {
          this.showNotification('Por favor ingrese el nombre del hotel', 'warning');
          return false;
        }
        break;
      case 'traslado':
        if (!serviceData.origen || !serviceData.destino) {
          this.showNotification('Por favor complete origen y destino del traslado', 'warning');
          return false;
        }
        break;
      case 'excursion':
        if (!serviceData.nombre) {
          this.showNotification('Por favor ingrese el nombre de la excursión', 'warning');
          return false;
        }
        break;
    }
    
    return true;
  }

  updateServicesList() {
    const container = document.getElementById('services-list');
    if (!container) return;
    
    if (AppState.currentSale.services.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package"></i>
          <p>No hay servicios agregados</p>
          <small>Agregue servicios usando las pestañas de arriba</small>
        </div>
      `;
    } else {
      const servicesHTML = AppState.currentSale.services.map(service => {
        const description = this.getServiceDescription(service);
        
        return `
          <div class="service-item" data-id="${service.id}">
            <div class="service-content">
              <div class="service-title">${description}</div>
              <div class="service-price">${this.formatCurrency(service.precio)}</div>
            </div>
            <div class="service-actions">
              <button type="button" class="btn-icon" onclick="app.editService(${service.id})" title="Editar servicio">
                <i data-lucide="edit"></i>
              </button>
              <button type="button" class="btn-icon" onclick="app.removeService(${service.id})" title="Eliminar servicio">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
      
      container.innerHTML = servicesHTML;
    }
    
    // Re-inicializar iconos
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  getServiceDescription(service) {
    const icons = {
      vuelo: '✈️',
      hotel: '🏨',
      traslado: '🚗',
      excursion: '🗺️'
    };
    
    const icon = icons[service.type] || '📦';
    
    switch (service.type) {
      case 'vuelo':
        return `${icon} Vuelo ${service.origen} → ${service.destino} (${service.pasajeros} pax)`;
      case 'hotel':
        return `${icon} ${service.nombre} - ${service.ciudad} (${service.huespedes} huéspedes)`;
      case 'traslado':
        return `${icon} ${service.origen} → ${service.destino} (${service.pasajeros} pax)`;
      case 'excursion':
        return `${icon} ${service.nombre} (${service.participantes} pax)`;
      default:
        return `${icon} Servicio`;
    }
  }

  removeService(serviceId) {
    AppState.currentSale.services = AppState.currentSale.services.filter(s => s.id !== serviceId);
    this.updateServicesList();
    this.updateTotals();
    this.showNotification('Servicio eliminado', 'info');
  }

  editService(serviceId) {
    const service = AppState.currentSale.services.find(s => s.id === serviceId);
    if (!service) return;
    AppState.editingServiceId = serviceId;
    this.showServiceTab(service.type);
    setTimeout(() => {
      this.populateServiceForm(service);
      const btn = document.querySelector('#service-forms .btn.btn-primary');
      if (btn) {
        btn.innerHTML = '<i data-lucide="check"></i> Guardar servicio';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  populateServiceForm(service) {
    switch (service.type) {
      case 'vuelo': {
        document.getElementById('vuelo-itinerario').value = service.tipo_itinerario || 'ida_vuelta';
        document.getElementById('vuelo-pasajeros').value = service.pasajeros || 1;
        document.getElementById('vuelo-costo').value = service.costo || '';
        document.getElementById('vuelo-precio').value = service.precio || '';
        const vProv = document.getElementById('vuelo-proveedor');
        if (vProv) vProv.value = service.proveedor_id || '';
        const container = document.getElementById('segments-container');
        if (container) {
          container.innerHTML = '';
          service.segmentos.forEach(seg => {
            addSegmentRow();
            const row = container.lastElementChild;
            row.querySelector('.segment-origen').value = seg.aeropuerto_origen || '';
            row.querySelector('.segment-destino').value = seg.aeropuerto_destino || '';
            row.querySelector('.segment-aerolinea').value = seg.aerolinea || '';
            row.querySelector('.segment-numero').value = seg.numero_vuelo || '';
            row.querySelector('.segment-salida').value = seg.fecha_hora_salida_local || '';
            row.querySelector('.segment-llegada').value = seg.fecha_hora_llegada_local || '';
            row.querySelector('.segment-tiempo-total').value = seg.tiempo_total_tramo || '';
            if (seg.tiene_escala) {
              const toggle = row.querySelector('.segment-has-escala');
              toggle.checked = true;
              const escalaSection = row.querySelector('.escalas-section');
              escalaSection.style.display = 'block';
              const escalaContainer = row.querySelector('.escalas-container');
              escalaContainer.innerHTML = '';
              seg.escalas.forEach(es => {
                addEscalaRowToSegment(row);
                const escalaRow = escalaContainer.lastElementChild;
                escalaRow.querySelector('.segment-aeropuerto-escala').value = es.aeropuerto || '';
                escalaRow.querySelector('.segment-duracion-escala').value = es.duracion || '';
              });
            }
          });
        }
        break;
      }
      case 'hotel':
        document.getElementById('hotel-nombre').value = service.nombre || '';
        document.getElementById('hotel-ciudad').value = service.ciudad || '';
        document.getElementById('hotel-checkin').value = service.checkin || '';
        document.getElementById('hotel-checkout').value = service.checkout || '';
        document.getElementById('hotel-huespedes').value = service.huespedes || 1;
        const hCosto = document.getElementById('hotel-costo');
        if (hCosto) hCosto.value = service.costo || '';
        const hProv = document.getElementById('hotel-proveedor');
        if (hProv) hProv.value = service.proveedor_id || '';
        document.getElementById('hotel-precio').value = service.precio || '';
        break;
      case 'traslado':
        document.getElementById('traslado-origen').value = service.origen || '';
        document.getElementById('traslado-destino').value = service.destino || '';
        document.getElementById('traslado-fecha').value = service.fecha || '';
        document.getElementById('traslado-hora').value = service.hora || '';
        document.getElementById('traslado-pasajeros').value = service.pasajeros || 1;
        const tCosto = document.getElementById('traslado-costo');
        if (tCosto) tCosto.value = service.costo || '';
        const tProv = document.getElementById('traslado-proveedor');
        if (tProv) tProv.value = service.proveedor_id || '';
        document.getElementById('traslado-precio').value = service.precio || '';
        break;
      case 'excursion':
        document.getElementById('excursion-nombre').value = service.nombre || '';
        document.getElementById('excursion-destino').value = service.destino || '';
        document.getElementById('excursion-fecha').value = service.fecha || '';
        document.getElementById('excursion-duracion').value = service.duracion || '';
        document.getElementById('excursion-participantes').value = service.participantes || 1;
        const eCosto = document.getElementById('excursion-costo');
        if (eCosto) eCosto.value = service.costo || '';
        const eProv = document.getElementById('excursion-proveedor');
        if (eProv) eProv.value = service.proveedor_id || '';
        document.getElementById('excursion-precio').value = service.precio || '';
        break;
    }
  }

  updateTotals() {
    const subtotal = AppState.currentSale.services.reduce((sum, s) => sum + s.precio, 0);
    const descuentos = 0; // Por ahora sin descuentos
    const total = subtotal - descuentos;
    
    AppState.currentSale.totals = {
      subtotal,
      descuentos,
      total
    };
    
    // Actualizar UI
    const elements = {
      'subtotal': this.formatCurrency(subtotal),
      'descuentos': this.formatCurrency(descuentos),
      'total-final': this.formatCurrency(total)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  }

  clearServiceForm(serviceType) {
    const form = document.querySelector('#service-forms .form-card');
    if (!form) return;
    
    form.querySelectorAll('input').forEach(input => {
      if (input.type === 'number' && input.hasAttribute('value')) {
        input.value = input.getAttribute('value');
      } else {
        input.value = '';
      }
    });

    form.querySelectorAll('select').forEach(sel => {
      sel.selectedIndex = 0;
    });

    if (serviceType === 'vuelo') {
      const container = document.getElementById('segments-container');
      if (container) {
        container.innerHTML = '';
        addSegmentRow();
      }
    }
  }

  // ===== ACCIONES PRINCIPALES =====
  async createSale() {
    try {
      this.showLoader(AppState.editingSaleId ? 'Actualizando venta...' : 'Creando venta...');

      if (!this.validateSaleData()) {
        this.hideLoader();
        return;
      }

      const saleData = this.buildSaleData();

      if (AppState.editingSaleId) {
        if (AppState.isConnected) {
          await this.updateSaleInDB(saleData);
        } else {
          this.updateSaleLocally(saleData);
        }
        this.showNotification('Venta actualizada', 'success');
      } else {
        if (AppState.isConnected) {
          await this.createSaleInDB(saleData);
        } else {
          this.createSaleLocally(saleData);
        }
        this.showNotification('Venta creada exitosamente', 'success');
      }

      this.resetSaleForm();
      this.showTab('ventas');
    } catch (error) {
      console.error('Error creando venta:', error.message, error.details || error);
      this.showNotification('Error al crear la venta: ' + (error.message || 'Error'), 'error');
    } finally {
      this.hideLoader();
    }
  }

  validateSaleData() {
    if (!AppState.currentSale.client.nombre) {
      this.showNotification('Faltan datos del cliente', 'warning');
      AppState.currentStep = 1;
      this.updateStepForm();
      return false;
    }

    if (!AppState.currentSale.trip.fechaInicio) {
      this.showNotification('Faltan datos del viaje', 'warning');
      AppState.currentStep = 2;
      this.updateStepForm();
      return false;
    }

    if (!AppState.currentSale.fechaVenta) {
      this.showNotification('Falta la fecha de venta', 'warning');
      AppState.currentStep = 2;
      this.updateStepForm();
      return false;
    }

    if (AppState.currentSale.services.length === 0) {
      this.showNotification('Debe agregar al menos un servicio', 'warning');
      AppState.currentStep = 3;
      this.updateStepForm();
      return false;
    }

    const vendedorId = parseInt(document.getElementById('vendedor-select-nts')?.value);
    if (!vendedorId) {
      this.showNotification('Falta seleccionar el vendedor responsable', 'warning');
      AppState.currentStep = 1;
      this.updateStepForm();
      return false;
    }

    return true;
  }

  buildSaleData() {
    const vendedorId =
      parseInt(document.getElementById('vendedor-select-nts')?.value) ||
      AppState.currentSale.vendedor_id ||
      null;
    return {
      id: AppState.editingSaleId || undefined,
      numero_venta:
        AppState.currentSale.numero_venta || this.generateSaleNumber(),
      cliente: AppState.currentSale.client,
      viaje: AppState.currentSale.trip,
      servicios: AppState.currentSale.services,
      totales: AppState.currentSale.totals,
      fecha_venta: AppState.currentSale.fechaVenta,
      fecha_creacion: new Date().toISOString(),
      estado: 'pendiente',
      estado_pago: 'no_pagado',
      vendedor_id: vendedorId
    };
  }

  async createSaleInDB(saleData) {
    if (!AppState.supabase) return;
    console.log('Creando venta en DB:', saleData);

    let clienteId = saleData.cliente.id || null;
    if (clienteId) {
      const { error: clienteError } = await AppState.supabase
        .from('clientes')
        .update({
          nombre: saleData.cliente.nombre,
          email: saleData.cliente.email,
          telefono: saleData.cliente.telefono,
          DNI: saleData.cliente.dni || null,
          Pasaporte: saleData.cliente.pasaporte || null,
          dni_expiracion: saleData.cliente.dni_expiracion || null,
          pasaporte_expiracion: saleData.cliente.pasaporte_expiracion || null,
          vendedor_id: saleData.vendedor_id
        })
        .eq('id', clienteId);
      if (clienteError) throw clienteError;
    } else {
      const { data: nuevoCliente, error: clienteError } = await AppState.supabase
        .from('clientes')
        .insert({
          nombre: saleData.cliente.nombre,
          email: saleData.cliente.email,
          telefono: saleData.cliente.telefono,
          DNI: saleData.cliente.dni || null,
          Pasaporte: saleData.cliente.pasaporte || null,
          dni_expiracion: saleData.cliente.dni_expiracion || null,
          pasaporte_expiracion: saleData.cliente.pasaporte_expiracion || null,
          vendedor_id: saleData.vendedor_id
        })
        .select()
        .single();
      if (clienteError) throw clienteError;
      clienteId = nuevoCliente.id;
    }

    const { data: venta, error: ventaError } = await AppState.supabase
      .from('ventas')
      .insert({
        numero_venta: saleData.numero_venta,
        cliente_id: clienteId,
        vendedor_id: saleData.vendedor_id,
        fecha_venta: saleData.fecha_venta,
        fecha_viaje_inicio: saleData.viaje.fechaInicio || null,
        fecha_viaje_fin: saleData.viaje.fechaFin || null,
        observaciones: saleData.viaje.observaciones || null,
        total_final: saleData.totales.total,
        estado: saleData.estado,
        estado_pago: saleData.estado_pago
      })
      .select()
      .single();

    if (ventaError) {
      console.error('Error creando venta:', ventaError.message, ventaError.details);
      throw ventaError;
    }

    for (const servicio of saleData.servicios) {
      if (servicio.type === 'vuelo') {
        const { data: vuelo, error: vueloError } = await AppState.supabase
          .from('venta_vuelos')
          .insert({
            venta_id: venta.id,
            descripcion: servicio.descripcion,
            tipo_itinerario: servicio.tipo_itinerario,
            pasajeros: servicio.pasajeros,
            precio_costo: servicio.costo,
            precio_venta: servicio.precio,
            margen_ganancia: servicio.precio - servicio.costo,
            monto_pagado: 0,
            saldo_pendiente_servicio: servicio.costo,
            estado_pago_servicio: 'no_pagado',
            tiempo_total_vuelo: servicio.tiempo_total_vuelo || null,
            cantidad_escalas: servicio.cantidad_escalas || 0,
            tiene_escalas: servicio.tieneEscalas,
            proveedor_id: servicio.proveedor_id || null
          })
          .select()
          .single();

        if (vueloError) {
          console.error('Error creando vuelo:', vueloError.message, vueloError.details);
          throw vueloError;
        }

        if (servicio.segmentos && servicio.segmentos.length) {
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
          const { error: segError } = await AppState.supabase
            .from('vuelo_segmentos')
            .insert(segmentos);
          if (segError) {
            console.error('Error creando segmentos:', segError.message, segError.details);
            throw segError;
          }
        }
      }
      if (servicio.type === 'hotel') {
        await AppState.supabase.from('venta_hoteles').insert({
          venta_id: venta.id,
          proveedor_id: servicio.proveedor_id || null,
          hotel_nombre: servicio.nombre,
          hotel_ciudad: servicio.ciudad,
          fecha_checkin: servicio.checkin || null,
          fecha_checkout: servicio.checkout || null,
          huespedes: servicio.huespedes || 1,
          precio_costo: servicio.costo,
          precio_venta: servicio.precio,
          margen_ganancia: servicio.precio - servicio.costo
        });
      }
      if (servicio.type === 'traslado') {
        await AppState.supabase.from('venta_traslados').insert({
          venta_id: venta.id,
          proveedor_id: servicio.proveedor_id || null,
          origen: servicio.origen,
          destino: servicio.destino,
          fecha_traslado: servicio.fecha || null,
          hora_traslado: servicio.hora || null,
          pasajeros: servicio.pasajeros || 1,
          precio_costo: servicio.costo,
          precio_venta: servicio.precio,
          margen_ganancia: servicio.precio - servicio.costo
        });
      }
      if (servicio.type === 'excursion') {
        await AppState.supabase.from('venta_excursiones').insert({
          venta_id: venta.id,
          proveedor_id: servicio.proveedor_id || null,
          nombre_excursion: servicio.nombre,
          destino_excursion: servicio.destino,
          fecha_excursion: servicio.fecha || null,
          duracion_horas: servicio.duracion || null,
          participantes: servicio.participantes || 1,
          precio_costo: servicio.costo,
          precio_venta: servicio.precio,
          margen_ganancia: servicio.precio - servicio.costo
        });
      }
    }
  }

  async updateSaleInDB(saleData) {
    if (!AppState.supabase || !AppState.editingSaleId) return;
    const id = AppState.editingSaleId;

    if (saleData.cliente.id) {
      await AppState.supabase
        .from('clientes')
        .update({
          nombre: saleData.cliente.nombre,
          email: saleData.cliente.email,
          telefono: saleData.cliente.telefono,
          DNI: saleData.cliente.dni || null,
          Pasaporte: saleData.cliente.pasaporte || null,
          dni_expiracion: saleData.cliente.dni_expiracion || null,
          pasaporte_expiracion: saleData.cliente.pasaporte_expiracion || null,
          vendedor_id: saleData.vendedor_id
        })
        .eq('id', saleData.cliente.id);
    }

    const { error: ventaError } = await AppState.supabase
      .from('ventas')
      .update({
        cliente_id: saleData.cliente.id || null,
        vendedor_id: saleData.vendedor_id,
        fecha_venta: saleData.fecha_venta,
        fecha_viaje_inicio: saleData.viaje.fechaInicio || null,
        fecha_viaje_fin: saleData.viaje.fechaFin || null,
        observaciones: saleData.viaje.observaciones || null,
        total_final: saleData.totales.total,
        estado: saleData.estado,
        estado_pago: saleData.estado_pago
      })
      .eq('id', id);
    if (ventaError) throw ventaError;

    // Remove existing services
    const { data: vuelosExistentes } = await AppState.supabase
      .from('venta_vuelos')
      .select('id')
      .eq('venta_id', id);
    if (vuelosExistentes) {
      for (const v of vuelosExistentes) {
        await AppState.supabase
          .from('vuelo_segmentos')
          .delete()
          .eq('venta_vuelo_id', v.id);
      }
    }
    await AppState.supabase.from('venta_vuelos').delete().eq('venta_id', id);
    await AppState.supabase.from('venta_hoteles').delete().eq('venta_id', id);
    await AppState.supabase.from('venta_traslados').delete().eq('venta_id', id);
    await AppState.supabase.from('venta_excursiones').delete().eq('venta_id', id);

    for (const servicio of saleData.servicios) {
      if (servicio.type === 'vuelo') {
        const { data: vuelo, error: vueloError } = await AppState.supabase
          .from('venta_vuelos')
          .insert({
            venta_id: id,
            descripcion: servicio.descripcion,
            tipo_itinerario: servicio.tipo_itinerario,
            pasajeros: servicio.pasajeros,
            precio_costo: servicio.costo,
            precio_venta: servicio.precio,
            margen_ganancia: servicio.precio - servicio.costo,
            monto_pagado: 0,
            saldo_pendiente_servicio: servicio.costo,
            estado_pago_servicio: 'no_pagado',
            tiempo_total_vuelo: servicio.tiempo_total_vuelo || null,
            cantidad_escalas: servicio.cantidad_escalas || 0,
            tiene_escalas: servicio.tieneEscalas,
            proveedor_id: servicio.proveedor_id || null
          })
          .select()
          .single();
        if (vueloError) throw vueloError;
        if (servicio.segmentos && servicio.segmentos.length) {
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
          const { error: segError } = await AppState.supabase
            .from('vuelo_segmentos')
            .insert(segmentos);
          if (segError) throw segError;
        }
      } else if (servicio.type === 'hotel') {
        await AppState.supabase.from('venta_hoteles').insert({
          venta_id: id,
          proveedor_id: servicio.proveedor_id || null,
          hotel_nombre: servicio.nombre,
          hotel_ciudad: servicio.ciudad,
          fecha_checkin: servicio.checkin,
          fecha_checkout: servicio.checkout,
          huespedes: servicio.huespedes || 1,
          precio_costo: servicio.costo,
          precio_venta: servicio.precio,
          margen_ganancia: servicio.precio - servicio.costo
        });
      } else if (servicio.type === 'traslado') {
        await AppState.supabase.from('venta_traslados').insert({
          venta_id: id,
          proveedor_id: servicio.proveedor_id || null,
          origen: servicio.origen,
          destino: servicio.destino,
          fecha_traslado: servicio.fecha,
          hora_traslado: servicio.hora,
          pasajeros: servicio.pasajeros || 1,
          precio_costo: servicio.costo,
          precio_venta: servicio.precio,
          margen_ganancia: servicio.precio - servicio.costo
        });
      } else if (servicio.type === 'excursion') {
        await AppState.supabase.from('venta_excursiones').insert({
          venta_id: id,
          proveedor_id: servicio.proveedor_id || null,
          nombre_excursion: servicio.nombre,
          destino_excursion: servicio.destino,
          fecha_excursion: servicio.fecha,
          duracion_horas: servicio.duracion,
          participantes: servicio.participantes || 1,
          precio_costo: servicio.costo,
          precio_venta: servicio.precio,
          margen_ganancia: servicio.precio - servicio.costo
        });
      }
    }
  }

  updateSaleLocally(saleData) {
    let sales = JSON.parse(localStorage.getItem('nts_ventas') || '[]');
    sales = sales.map(s =>
      s.id === AppState.editingSaleId ? { ...saleData, id: AppState.editingSaleId } : s
    );
    localStorage.setItem('nts_ventas', JSON.stringify(sales));
    console.log('Venta actualizada localmente:', saleData);
  }

  createSaleLocally(saleData) {
    const sales = JSON.parse(localStorage.getItem('nts_ventas') || '[]');
    sales.push({ ...saleData, id: Date.now() });
    localStorage.setItem('nts_ventas', JSON.stringify(sales));
    console.log('Venta guardada localmente:', saleData);
  }

  resetSaleForm() {
    AppState.currentSale = {
      client: {},
      trip: {},
      services: [],
      totals: { subtotal: 0, descuentos: 0, total: 0 },
      fechaVenta: null,
      numero_venta: null,
      vendedor_id: null
    };
    AppState.editingSaleId = null;
    AppState.editingServiceId = null;

    AppState.currentStep = 1;
    this.updateStepForm();
    this.updateServicesList();
    this.updateTotals();
    
    // Limpiar formularios
    document.querySelectorAll('.form-control').forEach(input => {
      input.value = '';
    });

    const docTipo = document.getElementById('cliente-doc-tipo');
    if (docTipo) {
      docTipo.value = 'dni';
      this.toggleDocumentoFields();
    }

    const createBtn = document.getElementById('create-sale');
    if (createBtn) {
      createBtn.innerHTML = '<i data-lucide="check"></i> Crear Venta';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  saveDraft() {
    const draftData = {
      ...this.buildSaleData(),
      isDraft: true,
      lastModified: new Date().toISOString()
    };

    localStorage.setItem('nts_draft', JSON.stringify(draftData));
    this.showNotification('Borrador guardado', 'success');
  }

  async loadVentasList() {
    const searchInput = document.getElementById('ventas-search');
    const filterSelect = document.getElementById('ventas-filter');
    const clientInput = document.getElementById('ventas-cliente');
    const desdeInput = document.getElementById('ventas-fecha-desde');
    const hastaInput = document.getElementById('ventas-fecha-hasta');
    const relativaSelect = document.getElementById('ventas-fecha-relativa');
    const table = document.getElementById('ventas-table');

    if (!this.ventasListenersSetup) {
      const rerender = () => this.renderVentasTable(this.filterVentas());
      searchInput?.addEventListener('input', rerender);
      filterSelect?.addEventListener('change', rerender);
      clientInput?.addEventListener('input', rerender);
       desdeInput?.addEventListener('change', () => { if (relativaSelect) relativaSelect.value = ''; rerender(); });
       hastaInput?.addEventListener('change', () => { if (relativaSelect) relativaSelect.value = ''; rerender(); });
       relativaSelect?.addEventListener('change', () => { if (relativaSelect.value) { if (desdeInput) desdeInput.value=''; if (hastaInput) hastaInput.value=''; } rerender(); });
      table?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit"]');
        const deleteBtn = e.target.closest('[data-action="delete"]');
        const id = editBtn?.dataset.id || deleteBtn?.dataset.id;
        if (editBtn) this.editVenta(id);
        if (deleteBtn) this.deleteVenta(id);
      });
      this.ventasListenersSetup = true;
    }

    try {
      if (AppState.isConnected && AppState.supabase) {
        const { data, error } = await AppState.supabase
          .from('ventas')
          .select('id, numero_venta, fecha_venta, total_final, estado, clientes (nombre)')
          .order('fecha_venta', { ascending: false });
        if (error) throw error;
        AppState.ventas = (data || []).map(v => ({
          id: v.id,
          numero_venta: v.numero_venta,
          fecha_venta: v.fecha_venta,
          total_final: v.total_final,
          estado: v.estado,
          cliente_nombre: v.clientes?.nombre || ''
        }));
      } else {
        const ventas = JSON.parse(localStorage.getItem('nts_ventas') || '[]');
        AppState.ventas = ventas.map(v => ({
          id: v.id,
          numero_venta: v.numero_venta,
          fecha_venta: v.fecha_venta || v.created_at,
          total_final: v.total_final || v.total,
          estado: v.estado || 'pendiente',
          cliente_nombre: v.cliente?.nombre || ''
        }));
      }
    } catch (err) {
      console.error('Error cargando ventas:', err);
      this.showNotification('Error cargando ventas', 'error');
      AppState.ventas = [];
    }

    const clientList = document.getElementById('ventas-clientes');
    if (clientList) {
      const uniqueClients = [...new Set(AppState.ventas.map(v => v.cliente_nombre).filter(Boolean))];
      clientList.innerHTML = uniqueClients.map(n => `<option value="${n}"></option>`).join('');
    }

    this.renderVentasTable(this.filterVentas());
    this.updateVentasStats();
  }

  filterVentas() {
    const term = document.getElementById('ventas-search')?.value.toLowerCase() || '';
    const estado = document.getElementById('ventas-filter')?.value || '';
    const cliente = document.getElementById('ventas-cliente')?.value.toLowerCase() || '';
    const desde = document.getElementById('ventas-fecha-desde')?.value;
    const hasta = document.getElementById('ventas-fecha-hasta')?.value;
    const relativa = document.getElementById('ventas-fecha-relativa')?.value;

    let desdeDate = desde ? new Date(desde) : null;
    let hastaDate = hasta ? new Date(hasta) : null;
    if (relativa) {
      const days = parseInt(relativa, 10);
      hastaDate = new Date();
      desdeDate = new Date();
      desdeDate.setDate(hastaDate.getDate() - days);
    }
    return AppState.ventas.filter(v => {
      const matchesTerm = v.numero_venta?.toLowerCase().includes(term) ||
        v.cliente_nombre?.toLowerCase().includes(term);
      const matchesEstado = !estado || v.estado === estado;
      const matchesCliente = !cliente || v.cliente_nombre?.toLowerCase().includes(cliente);
      const fecha = new Date(v.fecha_venta);
      const matchesFecha = (!desdeDate || fecha >= desdeDate) && (!hastaDate || fecha <= hastaDate);
      return matchesTerm && matchesEstado && matchesCliente && matchesFecha;
    });
  }

  renderVentasTable(ventas) {
    const tbody = document.querySelector('#ventas-table tbody');
    if (!tbody) return;
    if (!ventas.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Sin ventas registradas</td></tr>';
      return;
    }

    tbody.innerHTML = ventas.map(v => `
      <tr>
        <td>${v.numero_venta || ''}</td>
        <td>${v.cliente_nombre || ''}</td>
        <td>${this.formatDate(v.fecha_venta)}</td>
        <td>${this.formatCurrency(v.total_final || 0)}</td>
        <td>${v.estado || ''}</td>
        <td class="table-row-actions">
          <button class="btn-icon" data-action="edit" data-id="${v.id}" title="Editar"><i data-lucide="edit"></i></button>
          <button class="btn-icon btn-danger" data-action="delete" data-id="${v.id}" title="Eliminar"><i data-lucide="trash-2"></i></button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  async editVenta(id) {
    try {
      let data;
      if (AppState.isConnected && AppState.supabase) {
        const { data: venta, error } = await AppState.supabase
          .from('ventas')
          .select(`
            *,
            clientes(*),
            venta_vuelos:venta_vuelos(
              *,
              vuelo_segmentos:vuelo_segmentos(*)
            ),
            venta_hoteles:venta_hoteles(*),
            venta_traslados:venta_traslados(*),
            venta_excursiones:venta_excursiones(*)
          `)
          .eq('id', id)
          .single();
        if (error) throw error;
        data = venta;
      } else {
        const ventas = JSON.parse(localStorage.getItem('nts_ventas') || '[]');
        data = ventas.find(v => v.id === Number(id));
        if (!data) throw new Error('Venta no encontrada');
      }

      AppState.currentSale = {
        client: data.clientes ? {
          id: data.cliente_id,
          nombre: data.clientes.nombre,
          email: data.clientes.email,
          telefono: data.clientes.telefono,
          DNI: data.clientes.dni || data.clientes.DNI || '',
          Pasaporte: data.clientes.Pasaporte || '',
          dni_expiracion: data.clientes.dni_expiracion || '',
          pasaporte_expiracion: data.clientes.pasaporte_expiracion || '',
          vendedor_id: data.vendedor_id
        } : (data.cliente || {}),
        trip: {
          fechaInicio: data.fecha_viaje_inicio || '',
          fechaFin: data.fecha_viaje_fin || '',
          observaciones: data.observaciones || ''
        },
        services: [],
        totals: { subtotal: data.total_final || 0, descuentos: 0, total: data.total_final || 0 },
        fechaVenta: data.fecha_venta || null,
        numero_venta: data.numero_venta,
        vendedor_id: data.vendedor_id
      };

      if (data.venta_vuelos) {
        const vuelos = Array.isArray(data.venta_vuelos) ? data.venta_vuelos : [data.venta_vuelos];
        vuelos.forEach(v => {
          const segmentos = (v.vuelo_segmentos || [])
            .sort((a, b) => (a.numero_segmento || 0) - (b.numero_segmento || 0))
            .map(seg => ({
              numero_segmento: seg.numero_segmento,
              aeropuerto_origen: seg.aeropuerto_origen,
              aeropuerto_destino: seg.aeropuerto_destino,
              aerolinea: seg.aerolinea,
              numero_vuelo: seg.numero_vuelo,
              fecha_hora_salida_local: seg.fecha_hora_salida_local,
              fecha_hora_llegada_local: seg.fecha_hora_llegada_local,
              tiempo_total_tramo: seg.tiempo_vuelo || '',
              escalas: seg.tiene_escala && seg.aeropuerto_escala ? [{ aeropuerto: seg.aeropuerto_escala, duracion: seg.duracion_escala }] : [],
              tiene_escala: seg.tiene_escala
            }));

          const origen = v.origen || segmentos[0]?.aeropuerto_origen || '';
          const destino = v.destino || segmentos[segmentos.length - 1]?.aeropuerto_destino || '';

          AppState.currentSale.services.push({
            id: Date.now() + Math.random(),
            type: 'vuelo',
            costo: v.precio_costo || 0,
            precio: v.precio_venta || 0,
            pasajeros: v.pasajeros || 1,
            tipo_itinerario: v.tipo_itinerario || 'ida_vuelta',
            origen,
            destino,
            descripcion: v.descripcion || '',
            tieneEscalas: v.tiene_escalas || segmentos.some(s => s.tiene_escala),
            cantidad_escalas: v.cantidad_escalas || segmentos.filter(s => s.tiene_escala).length,
            tiempo_total_vuelo: v.tiempo_total_vuelo || null,
            segmentos
          });
        });
      }
      if (data.venta_hoteles) {
        const hoteles = Array.isArray(data.venta_hoteles) ? data.venta_hoteles : [data.venta_hoteles];
        hoteles.forEach(h => {
          AppState.currentSale.services.push({
            id: Date.now() + Math.random(),
            type: 'hotel',
            costo: h.precio_costo || 0,
            precio: h.precio_venta || 0,
            nombre: h.hotel_nombre,
            ciudad: h.hotel_ciudad,
            checkin: h.fecha_checkin,
            checkout: h.fecha_checkout,
            huespedes: h.huespedes || 1
          });
        });
      }
      if (data.venta_traslados) {
        const traslados = Array.isArray(data.venta_traslados) ? data.venta_traslados : [data.venta_traslados];
        traslados.forEach(t => {
          AppState.currentSale.services.push({
            id: Date.now() + Math.random(),
            type: 'traslado',
            costo: t.precio_costo || 0,
            precio: t.precio_venta || 0,
            origen: t.origen,
            destino: t.destino,
            fecha: t.fecha_traslado,
            hora: t.hora_traslado,
            pasajeros: t.pasajeros || 1
          });
        });
      }
      if (data.venta_excursiones) {
        const excursiones = Array.isArray(data.venta_excursiones) ? data.venta_excursiones : [data.venta_excursiones];
        excursiones.forEach(ex => {
          AppState.currentSale.services.push({
            id: Date.now() + Math.random(),
            type: 'excursion',
            costo: ex.precio_costo || 0,
            precio: ex.precio_venta || 0,
            nombre: ex.nombre_excursion,
            destino: ex.destino_excursion,
            fecha: ex.fecha_excursion,
            duracion: ex.duracion_horas,
            participantes: ex.participantes || 1
          });
        });
      }

      AppState.editingSaleId = Number(id);
      this.showTab('nueva-venta');
      setTimeout(() => {
        this.fillSaleForm();
        const createBtn = document.getElementById('create-sale');
        if (createBtn) {
          createBtn.innerHTML = '<i data-lucide="check"></i> Guardar Venta';
          if (window.lucide) window.lucide.createIcons();
        }
      });
      this.showNotification('Editando venta', 'info');
    } catch (err) {
      console.error('Error cargando venta:', err);
      this.showNotification('No se pudo cargar la venta', 'error');
    }
  }

  fillSaleForm() {
    const c = AppState.currentSale.client || {};
    const [first, ...rest] = (c.nombre || '').split(' ');
    document.getElementById('cliente-nombre').value = first || '';
    document.getElementById('cliente-apellido').value = rest.join(' ');
    document.getElementById('cliente-email').value = c.email || '';
    document.getElementById('cliente-telefono').value = c.telefono || '';
    const docTipo = document.getElementById('cliente-doc-tipo');
    if (docTipo) {
      const tipo = c.Pasaporte ? 'pasaporte' : 'dni';
      docTipo.value = tipo;
      this.toggleDocumentoFields(tipo);
    }
    document.getElementById('cliente-dni').value = c.DNI || '';
    document.getElementById('cliente-dni-expiracion').value = c.dni_expiracion || '';
    document.getElementById('cliente-pasaporte').value = c.Pasaporte || '';
    document.getElementById('cliente-pasaporte-expiracion').value = c.pasaporte_expiracion || '';
    document.getElementById('vendedor-select-nts').value = AppState.currentSale.vendedor_id || c.vendedor_id || '';

    document.getElementById('fecha-venta').value = AppState.currentSale.fechaVenta || '';
    document.getElementById('fecha-viaje-inicio').value = AppState.currentSale.trip.fechaInicio || '';
    document.getElementById('fecha-viaje-fin').value = AppState.currentSale.trip.fechaFin || '';
    document.getElementById('observaciones-venta').value = AppState.currentSale.trip.observaciones || '';

    this.updateServicesList();
    this.updateTotals();
  }

  async deleteVenta(id) {
    if (!confirm('¿Eliminar esta venta?')) return;
    try {
      if (AppState.isConnected && AppState.supabase) {
        const { error } = await AppState.supabase.from('ventas').delete().eq('id', id);
        if (error) throw error;
      } else {
        let ventas = JSON.parse(localStorage.getItem('nts_ventas') || '[]');
        ventas = ventas.filter(v => v.id !== Number(id));
        localStorage.setItem('nts_ventas', JSON.stringify(ventas));
      }
      AppState.ventas = AppState.ventas.filter(v => v.id !== Number(id));
      this.renderVentasTable(this.filterVentas());
      this.updateVentasStats();
      this.showNotification('Venta eliminada', 'success');
    } catch (err) {
      console.error('Error eliminando venta:', err);
      this.showNotification('No se pudo eliminar la venta', 'error');
    }
  }

  updateVentasStats() {
    const now = new Date();
    const ventasDelMes = AppState.ventas
      .filter(v => {
        const fecha = new Date(v.fecha_venta);
        return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
      })
      .reduce((sum, v) => sum + (v.total_final || 0), 0);
    const totalVentas = AppState.ventas.length;
    const pendientes = AppState.ventas.filter(v => v.estado !== 'finalizada' && v.estado !== 'cancelada').length;
    const totalClientes = parseInt(document.getElementById('total-clientes')?.textContent) || 0;
    this.updateDashboardStats({ ventasDelMes, totalVentas, pendientes, totalClientes });

    const clientList = document.getElementById('ventas-clientes');
    if (clientList) {
      const uniqueClients = [...new Set(AppState.ventas.map(v => v.cliente_nombre).filter(Boolean))];
      clientList.innerHTML = uniqueClients.map(n => `<option value="${n}"></option>`).join('');
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('es-AR');
    } catch {
      return dateStr;
    }
  }

  // ===== OTRAS FUNCIONES =====
  initNewSaleForm() {
    // Inicializar formulario de nueva venta
    this.showServiceTab('vuelo');
    this.updateServicesList();
    this.updateTotals();
  }

  refreshDashboard() {
    this.showLoader('Actualizando dashboard...');
    
    setTimeout(() => {
      this.loadInitialData();
      this.hideLoader();
      this.showNotification('Dashboard actualizado', 'success');
    }, 1000);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  showNotificationsPanel() {
    this.showNotification('Panel de notificaciones en desarrollo', 'info');
  }

  showSettingsPanel() {
    this.showNotification('Panel de configuración en desarrollo', 'info');
  }

  updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;
    
    const indicator = statusElement.querySelector('.status-indicator');
    const text = statusElement.querySelector('.status-text');
    
    if (isConnected) {
      indicator.className = 'status-indicator online';
      text.textContent = 'Conectado';
    } else {
      indicator.className = 'status-indicator offline';
      text.textContent = 'Sin conexión';
    }
  }

  // ===== UTILIDADES =====
  showLoader(message = 'Cargando...') {
    const loader = document.getElementById('app-loader');
    if (loader) {
      const text = loader.querySelector('.loader-text');
      if (text) text.textContent = message;
      loader.style.display = 'flex';
    }
  }

  hideLoader() {
    const loader = document.getElementById('app-loader');
    const app = document.getElementById('app');
    
    if (loader && app) {
      loader.style.display = 'none';
      app.style.display = 'grid';
    }
  }

  showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notifications-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
        <i data-lucide="${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button type="button" onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; padding: 0; margin-left: var(--spacing-md);">
        <i data-lucide="x"></i>
      </button>
    `;
    
    container.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto-remover
    if (duration > 0) {
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
    
    // Re-inicializar iconos
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };
    return icons[type] || 'info';
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'hace menos de 1 hora';
    if (diffInHours < 24) return `hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'hace 1 día';
    if (diffInDays < 7) return `hace ${diffInDays} días`;
    
    return past.toLocaleDateString('es-AR');
  }

  generateSaleNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `NTS-${year}-${timestamp}`;
  }
}

function addSegmentRow() {
  const container = document.getElementById('segments-container');
  if (!container) return;
  const index = container.children.length + 1;

  const row = document.createElement('div');
  row.className = 'segment-row';

  row.innerHTML = `
    <div class="form-group">
      <label>Origen Tramo ${index}</label>
      <input type="text" class="form-control segment-origen" placeholder="Origen">
    </div>
    <div class="form-group">
      <label>Destino Tramo ${index}</label>
      <input type="text" class="form-control segment-destino" placeholder="Destino">
    </div>
    <div class="form-group">
      <label>Aerolínea</label>
      <input type="text" class="form-control segment-aerolinea" placeholder="Aerolínea">
    </div>
    <div class="form-group">
      <label>Número de vuelo</label>
      <input type="text" class="form-control segment-numero" placeholder="AB123">
    </div>
    <div class="form-group">
      <label>Salida</label>
      <input type="datetime-local" class="form-control segment-salida">
    </div>
    <div class="form-group">
      <label>Llegada</label>
      <input type="datetime-local" class="form-control segment-llegada">
    </div>
    <div class="form-group">
      <label>Tiempo total de vuelo</label>
      <input type="text" class="form-control segment-tiempo-total" placeholder="00:00" readonly>
    </div>
    <div class="form-group">
      <label class="checkbox-container" style="margin-top: 1.5rem;">
        <input type="checkbox" class="segment-has-escala">
        <span class="checkmark"></span>
        ¿El tramo tiene escalas?
      </label>
    </div>
    <div class="form-group" style="display: flex; align-items: end;">
      ${index > 1 ? `<button type="button" class="btn btn-danger remove-segment" onclick="removeSegmentRow(this)" title="Eliminar tramo"><i data-lucide="trash-2"></i></button>` : ''}
    </div>
    <div class="escalas-section" style="display: none;">
      <div class="escalas-container"></div>
      <button type="button" class="btn btn-secondary add-escala-btn" style="margin-top:0.5rem;">
        <i data-lucide="plus"></i>
        Agregar escala
      </button>
    </div>
  `;

  container.appendChild(row);

  const updateTotal = () => updateSegmentTiempoTotal(row);
  row.querySelector('.segment-salida').addEventListener('change', updateTotal);
  row.querySelector('.segment-llegada').addEventListener('change', updateTotal);

  const escalaToggle = row.querySelector('.segment-has-escala');
  const escalaSection = row.querySelector('.escalas-section');
  const addEscalaBtn = row.querySelector('.add-escala-btn');

  if (escalaToggle && escalaSection) {
    escalaToggle.addEventListener('change', () => {
      escalaSection.style.display = escalaToggle.checked ? 'block' : 'none';
      if (escalaToggle.checked && !escalaSection.querySelector('.escala-row')) {
        addEscalaRowToSegment(row);
      }
      if (!escalaToggle.checked) {
        escalaSection.querySelector('.escalas-container').innerHTML = '';
        updateTotal();
      }
    });
  }

  addEscalaBtn.addEventListener('click', () => {
    addEscalaRowToSegment(row);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function addEscalaRowToSegment(segmentRow) {
  const container = segmentRow.querySelector('.escalas-container');
  const index = container.children.length + 1;
  const escalaRow = document.createElement('div');
  escalaRow.className = 'escala-row';
  escalaRow.innerHTML = `
    <div class="form-group">
      <label>Escala ${index}</label>
      <input type="text" class="form-control segment-aeropuerto-escala" placeholder="Aeropuerto de escala">
    </div>
    <div class="form-group">
      <label>Duración</label>
      <input type="text" class="form-control segment-duracion-escala" placeholder="01:30">
    </div>
    <div class="form-group" style="display:flex; align-items:end;">
      <button type="button" class="btn btn-danger remove-escala" title="Eliminar escala"><i data-lucide="trash-2"></i></button>
    </div>
  `;
  container.appendChild(escalaRow);

  escalaRow.querySelector('.segment-duracion-escala').addEventListener('input', () => updateSegmentTiempoTotal(segmentRow));
  escalaRow.querySelector('.remove-escala').addEventListener('click', () => removeEscalaRow(escalaRow, segmentRow));

  renumberEscalas(segmentRow);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function removeEscalaRow(escalaRow, segmentRow) {
  escalaRow.remove();
  renumberEscalas(segmentRow);
  updateSegmentTiempoTotal(segmentRow);
  app?.showNotification('🗑️ Escala eliminada', 'info');
}

function renumberEscalas(segmentRow) {
  const container = segmentRow.querySelector('.escalas-container');
  Array.from(container.children).forEach((row, idx) => {
    const label = row.querySelector('label');
    if (label) label.textContent = `Escala ${idx + 1}`;
  });
}

function parseDurationToMinutes(val) {
  const parts = val.split(':').map(Number);
  if (parts.length !== 2) return 0;
  const [h, m] = parts;
  return (isNaN(h) || isNaN(m)) ? 0 : h * 60 + m;
}

function updateSegmentTiempoTotal(row) {
  const salida = row.querySelector('.segment-salida')?.value;
  const llegada = row.querySelector('.segment-llegada')?.value;
  const escalaDuraciones = Array.from(row.querySelectorAll('.segment-duracion-escala'))
    .map(i => parseDurationToMinutes(i.value))
    .reduce((acc, val) => acc + val, 0);

  if (salida && llegada) {
    const start = new Date(salida);
    const end = new Date(llegada);
    let diff = end - start;
    if (!isNaN(diff) && diff >= 0) {
      const totalMins = Math.floor(diff / 60000) + escalaDuraciones;
      const hours = String(Math.floor(totalMins / 60)).padStart(2, '0');
      const minutes = String(totalMins % 60).padStart(2, '0');
      row.querySelector('.segment-tiempo-total').value = `${hours}:${minutes}`;
      return;
    }
  }
  row.querySelector('.segment-tiempo-total').value = '';
}

function removeSegmentRow(button) {
  const row = button.closest('.segment-row');
  row.remove();
  renumberSegments();
  app?.showNotification('🗑️ Tramo eliminado', 'info');
}

function renumberSegments() {
  const container = document.getElementById('segments-container');
  Array.from(container.children).forEach((row, index) => {
    const labels = row.querySelectorAll('label');
    labels[0].textContent = `Origen Tramo ${index + 1}`;
    labels[1].textContent = `Destino Tramo ${index + 1}`;
    const removeBtn = row.querySelector('.remove-segment');
    if (removeBtn) {
      if (index === 0) {
        removeBtn.style.display = 'none';
      } else {
        removeBtn.style.display = 'inline-flex';
      }
    }
  });
}

window.addSegmentRow = addSegmentRow;
window.removeSegmentRow = removeSegmentRow;

document.addEventListener('click', function(e) {
  if (e.target.matches('#add-segment-btn')) {
    e.preventDefault();
    addSegmentRow();
  }
});

// ===== INICIALIZACIÓN =====
let app;

document.addEventListener('DOMContentLoaded', () => {
  app = new NTSApp();
  window.app = app;
});

// ===== EXPORT GLOBAL =====
// "app" se define en DOMContentLoaded y se expone globalmente arriba

console.log('✅ NTS Sistema v2.0 cargado correctamente');
