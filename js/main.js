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
  }
};

// ===== INICIALIZACIÓN =====
class NTSApp {
  constructor() {
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
      if (typeof window.supabase !== 'undefined') {
        AppState.supabase = window.supabase.createClient(
          APP_CONFIG.supabase.url,
          APP_CONFIG.supabase.key
        );
        
        // Test connection
        const { data, error } = await AppState.supabase.auth.getSession();
        
        if (!error || error.message.includes('session_not_found')) {
          AppState.isConnected = true;
          console.log('✅ Supabase conectado');
          this.updateConnectionStatus(true);
        }
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
        .select('id, nombre, email, telefono')
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
    if (!input) return;

    let datalist = document.getElementById('clientes-datalist');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'clientes-datalist';
      document.body.appendChild(datalist);
    }

    datalist.innerHTML = AppState.clientes
      .map(c => `<option value="${c.nombre}" data-id="${c.id}" data-email="${c.email || ''}" data-telefono="${c.telefono || ''}"></option>`)
      .join('');

    input.setAttribute('list', 'clientes-datalist');

    input.addEventListener('input', function () {
      const option = [...datalist.options].find(o => o.value.toLowerCase() === this.value.toLowerCase());
      if (option) {
        const emailField = document.getElementById('cliente-email');
        const telField = document.getElementById('cliente-telefono');
        if (emailField) emailField.value = option.dataset.email;
        if (telField) telField.value = option.dataset.telefono;
        AppState.currentSale.client.id = option.dataset.id;
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
    const docTipo = document.getElementById('cliente-doc-tipo')?.value;
    const dni = document.getElementById('cliente-dni')?.value?.trim();
    const pasaporte = document.getElementById('cliente-pasaporte')?.value?.trim();

    if (!nombre) {
      this.showNotification('Por favor ingrese el nombre del cliente', 'warning');
      document.getElementById('cliente-nombre')?.focus();
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
    if (serviceType === 'vuelo') {
      const container = document.getElementById('segments-container');
      if (container && !container.children.length) {
        addSegmentRow();
      }
    }
  }

  addService(serviceType) {
    const serviceData = this.getServiceData(serviceType);
    
    if (!this.validateServiceData(serviceData, serviceType)) {
      return;
    }
    
    // Agregar servicio al estado
    serviceData.id = Date.now();
    serviceData.type = serviceType;
    AppState.currentSale.services.push(serviceData);
    
    // Actualizar UI
    this.updateServicesList();
    this.updateTotals();
    this.clearServiceForm(serviceType);
    
    this.showNotification(`${serviceType} agregado correctamente`, 'success');
  }

  getServiceData(serviceType) {
    const baseData = {
      costo: parseFloat(document.getElementById(`${serviceType}-costo`)?.value) || 0,
      precio: parseFloat(document.getElementById(`${serviceType}-precio`)?.value) || 0
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

        let tipo_itinerario = 'ida_vuelta';
        if (segmentos.length <= 1) {
          tipo_itinerario = 'solo_ida';
        } else if (origen && destino && origen !== destino) {
          tipo_itinerario = 'multi_ciudad';
        }

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
            <button type="button" class="btn-icon" onclick="app.removeService(${service.id})" title="Eliminar servicio">
              <i data-lucide="trash-2"></i>
            </button>
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
      this.showLoader('Creando venta...');
      
      // Validar datos completos
      if (!this.validateSaleData()) {
        this.hideLoader();
        return;
      }
      
      // Crear venta
      const saleData = this.buildSaleData();
      
      if (AppState.isConnected) {
        await this.createSaleInDB(saleData);
      } else {
        this.createSaleLocally(saleData);
      }
      
      this.showNotification('Venta creada exitosamente', 'success');
      this.resetSaleForm();
      this.showTab('dashboard');
      
    } catch (error) {
      console.error('Error creando venta:', error);
      this.showNotification('Error al crear la venta', 'error');
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
    const vendedorId = parseInt(document.getElementById('vendedor-select-nts')?.value) || null;
    return {
      numero_venta: this.generateSaleNumber(),
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
    const { data: venta, error: ventaError } = await AppState.supabase
      .from('ventas')
      .insert({
        numero_venta: saleData.numero_venta,
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
            tiene_escalas: servicio.tieneEscalas
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
    }
  }

  createSaleLocally(saleData) {
    const sales = JSON.parse(localStorage.getItem('nts_sales') || '[]');
    sales.push({ ...saleData, id: Date.now() });
    localStorage.setItem('nts_sales', JSON.stringify(sales));
    console.log('Venta guardada localmente:', saleData);
  }

  resetSaleForm() {
    AppState.currentSale = {
      client: {},
      trip: {},
      services: [],
      totals: { subtotal: 0, descuentos: 0, total: 0 },
      fechaVenta: null
    };
    
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
