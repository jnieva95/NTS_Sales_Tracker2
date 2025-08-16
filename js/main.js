// ===== MAIN.JS - APLICACIÓN PRINCIPAL NTS V2.0 =====
// Incluye manejo de tramos de vuelo y búsqueda de clientes

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
  
  // Datos de la venta actual
  currentSale: {
    client: {},
    trip: {},
    services: [],
    totals: {
      subtotal: 0,
      discounts: 0,
      total: 0
    }
  }
};

// ===== ENUM tipo_itinerario =====
// Valores aceptados por la base de datos y sus posibles equivalencias
const TIPO_ITINERARIO_MAP = {
  ida: 'ida',
  solo_ida: 'ida',
  one_way: 'ida',
  ida_vuelta: 'ida_vuelta',
  ida_y_vuelta: 'ida_vuelta',
  round_trip: 'ida_vuelta',
  vuelta: 'ida_vuelta',
  multitramo: 'multitramo',
  multi_city: 'multitramo',
  multiples_destinos: 'multitramo',
  multi_tramo: 'multitramo',
  stopover: 'stopover',
  escala: 'stopover',
  conexion: 'stopover'
};

function getValidTipoItinerario(value) {
  if (!value) return 'ida_vuelta';
  const normalized = value.toLowerCase().trim();
  return TIPO_ITINERARIO_MAP[normalized] || 'ida_vuelta';
}

function updateVueloTypeSelect() {
  const select = document.getElementById('vuelo-tipo');
  if (!select) return;
  select.innerHTML = '';
  const options = [
    { value: 'ida', label: '✈️ Solo Ida' },
    { value: 'ida_vuelta', label: '✈️🔄 Ida y Vuelta' },
    { value: 'multitramo', label: '✈️🗺️ Multitramo' },
    { value: 'stopover', label: '✈️⏸️ Con Escala' }
  ];
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    select.appendChild(o);
  });
  select.value = 'ida_vuelta';
}

// Generar descripción automática para vuelos garantizando un valor válido
function generateVueloDescripcion(servicioData) {
  const origen = servicioData.origen || '';
  const destino = servicioData.destino || '';
  const aerolinea = servicioData.aerolinea || '';
  const tipoItinerario = servicioData.tipo_itinerario || 'ida_vuelta';

  if (servicioData.descripcion && servicioData.descripcion.trim()) {
    return servicioData.descripcion.trim();
  }

  let descripcion = '';
  if (origen && destino) {
    switch (tipoItinerario) {
      case 'ida':
        descripcion = `Vuelo ${origen} → ${destino}`;
        break;
      case 'ida_vuelta':
        descripcion = `Vuelo ${origen} ⇄ ${destino}`;
        break;
      case 'multitramo':
        descripcion = `Vuelo multitramo desde ${origen}`;
        break;
      case 'stopover':
        descripcion = `Vuelo ${origen} → ${destino} (con escala)`;
        break;
      default:
        descripcion = `Vuelo ${origen} → ${destino}`;
    }
    if (aerolinea) {
      descripcion += ` - ${aerolinea}`;
    }
    if (servicioData.pasajeros && servicioData.pasajeros > 1) {
      descripcion += ` (${servicioData.pasajeros} pax)`;
    }
  } else {
    descripcion = `Vuelo${aerolinea ? ' - ' + aerolinea : ''}`;
  }
  return descripcion;
}

// Validar datos obligatorios del vuelo y probar generación de descripción
function validateVueloData(servicioData) {
  const errors = [];
  if (!servicioData.origen || servicioData.origen.trim() === '') {
    errors.push('Origen es obligatorio');
  }
  if (!servicioData.destino || servicioData.destino.trim() === '') {
    errors.push('Destino es obligatorio');
  }
  if (!servicioData.precio_venta || servicioData.precio_venta <= 0) {
    errors.push('Precio debe ser mayor a 0');
  }

  const descripcionTest = generateVueloDescripcion(servicioData);
  if (!descripcionTest || descripcionTest.trim() === '') {
    errors.push('No se puede generar descripción válida');
  }

  return {
    isValid: errors.length === 0,
    errors,
    descripcionGenerada: descripcionTest
  };
}

// Exponer helpers para depuración
window.TIPO_ITINERARIO_MAP = TIPO_ITINERARIO_MAP;
window.getValidTipoItinerario = getValidTipoItinerario;
window.updateVueloTypeSelect = updateVueloTypeSelect;
window.generateVueloDescripcion = generateVueloDescripcion;
window.validateVueloData = validateVueloData;

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
        // Incluir la API key en cada petición para evitar errores de autenticación
        AppState.supabase = window.supabase.createClient(
          APP_CONFIG.supabase.url,
          APP_CONFIG.supabase.key,
          {
            global: {
              headers: {
                apikey: APP_CONFIG.supabase.key,
                Authorization: `Bearer ${APP_CONFIG.supabase.key}`
              }
            }
          }
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

    // Configurar header actions
    this.setupHeaderActions();

    // Configurar formulario de cliente
    this.setupClientDocumentFields();
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

    // Login con GitHub
    const loginGitHubBtn = document.getElementById('login-github-btn');
    if (loginGitHubBtn) {
      loginGitHubBtn.addEventListener('click', () => this.loginWithGitHub());
    }
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
        this.setupClientAutocomplete();
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

  async loadClientes(search = '') {
    try {
      if (!AppState.isConnected) return;
      let query = AppState.supabase
        .from('clientes')
        .select('id, nombre, email, telefono, dni, dni_expiracion, pasaporte, pasaporte_expiracion');
      if (search) {
        query = query.ilike('nombre', `%${search}%`);
      } else {
        query = query.order('nombre');
      }
      const { data, error } = await query;
      if (error) throw error;
      AppState.clientes = data || [];
      this.updateClientDatalist();
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  }

  updateClientDatalist() {
    const input = document.getElementById('cliente-nombre');
    if (!input) return;

    let datalist = document.getElementById('clientes-datalist');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'clientes-datalist';
      document.body.appendChild(datalist);
      input.setAttribute('list', 'clientes-datalist');
    }

    datalist.innerHTML = AppState.clientes
      .map(c => `<option value="${c.nombre}" data-id="${c.id}" data-email="${c.email || ''}" data-telefono="${c.telefono || ''}" data-dni="${c.dni || ''}" data-dni-exp="${c.dni_expiracion || ''}" data-pasaporte="${c.pasaporte || ''}" data-pasaporte-exp="${c.pasaporte_expiracion || ''}"></option>`)
      .join('');
  }

  setupClientAutocomplete() {
    const input = document.getElementById('cliente-nombre');
    if (!input) return;

    const datalistId = 'clientes-datalist';
    let datalist = document.getElementById(datalistId);
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = datalistId;
      document.body.appendChild(datalist);
    }
    input.setAttribute('list', datalistId);

    // Cargar listado inicial
    this.loadClientes();

    input.addEventListener('input', async () => {
      const term = input.value.trim();
      if (term.length >= 2) {
        await this.loadClientes(term);
      } else {
        datalist.innerHTML = '';
      }
    });

    input.addEventListener('change', () => {
      const option = [...datalist.options].find(o => o.value.toLowerCase() === input.value.toLowerCase());
      if (option) {
        const emailField = document.getElementById('cliente-email');
        const telField = document.getElementById('cliente-telefono');
        if (emailField) emailField.value = option.dataset.email;
        if (telField) telField.value = option.dataset.telefono;
        AppState.currentSale.client.id = option.dataset.id;
        if (option.dataset.dni) {
          this.setDocType('dni');
          const dniField = document.getElementById('cliente-dni');
          if (dniField) dniField.value = option.dataset.dni;
          const dniExp = document.getElementById('cliente-dni-exp');
          if (dniExp && option.dataset.dniExp) dniExp.value = option.dataset.dniExp;
        } else if (option.dataset.pasaporte) {
          this.setDocType('pasaporte');
          const passField = document.getElementById('cliente-pasaporte');
          if (passField) passField.value = option.dataset.pasaporte;
          const passExp = document.getElementById('cliente-pasaporte-exp');
          if (passExp && option.dataset.pasaporteExp) passExp.value = option.dataset.pasaporteExp;
        }
      }
    });
  }

  setupClientDocumentFields() {
    const docRadios = document.querySelectorAll('input[name="cliente-doc"]');
    const dniInput = document.getElementById('cliente-dni');
    const pasaporteInput = document.getElementById('cliente-pasaporte');

    docRadios.forEach(radio => {
      radio.addEventListener('change', () => this.setDocType(radio.value));
    });

    this.setDocType(document.querySelector('input[name="cliente-doc"]:checked')?.value || 'dni');

    if (dniInput) {
      dniInput.addEventListener('change', () => this.populateClientByDocument('dni', dniInput.value.trim()));
    }
    if (pasaporteInput) {
      pasaporteInput.addEventListener('change', () => this.populateClientByDocument('pasaporte', pasaporteInput.value.trim()));
    }
  }

  setDocType(type) {
    const dniFields = document.getElementById('dni-fields');
    const passFields = document.getElementById('pasaporte-fields');
    const dniRadio = document.querySelector('input[name="cliente-doc"][value="dni"]');
    const passRadio = document.querySelector('input[name="cliente-doc"][value="pasaporte"]');
    const dniNumber = document.getElementById('cliente-dni');
    const dniExp = document.getElementById('cliente-dni-exp');
    const passNumber = document.getElementById('cliente-pasaporte');
    const passExp = document.getElementById('cliente-pasaporte-exp');

    if (type === 'pasaporte') {
      if (passRadio) passRadio.checked = true;
      if (dniFields) dniFields.style.display = 'none';
      if (passFields) passFields.style.display = 'block';
      if (dniNumber) dniNumber.required = false;
      if (dniExp) dniExp.required = false;
      if (passNumber) passNumber.required = true;
      if (passExp) passExp.required = true;
    } else {
      if (dniRadio) dniRadio.checked = true;
      if (dniFields) dniFields.style.display = 'block';
      if (passFields) passFields.style.display = 'none';
      if (dniNumber) dniNumber.required = true;
      if (dniExp) dniExp.required = true;
      if (passNumber) passNumber.required = false;
      if (passExp) passExp.required = false;
    }
  }

  async populateClientByDocument(type, value) {
    if (!value) return;
    let client = AppState.clientes.find(c => c[type] === value);
    if (!client && AppState.isConnected) {
      try {
        const { data } = await AppState.supabase
          .from('clientes')
          .select('id, nombre, email, telefono, dni, dni_expiracion, pasaporte, pasaporte_expiracion')
          .eq(type, value)
          .maybeSingle();
        if (data) {
          client = data;
          AppState.clientes.push(data);
          this.updateClientDatalist();
        }
      } catch (e) {
        console.error('Error buscando cliente por documento:', e);
      }
    }

    if (client) {
      const nameField = document.getElementById('cliente-nombre');
      const emailField = document.getElementById('cliente-email');
      const telField = document.getElementById('cliente-telefono');
      if (nameField) nameField.value = client.nombre || '';
      if (emailField) emailField.value = client.email || '';
      if (telField) telField.value = client.telefono || '';
      AppState.currentSale.client.id = client.id;
      if (type === 'dni' && client.dni_expiracion) {
        const dniExpField = document.getElementById('cliente-dni-exp');
        if (dniExpField) dniExpField.value = client.dni_expiracion;
      }
      if (type === 'pasaporte' && client.pasaporte_expiracion) {
        const passExpField = document.getElementById('cliente-pasaporte-exp');
        if (passExpField) passExpField.value = client.pasaporte_expiracion;
      }
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
    if (!nombre) {
      this.showNotification('Por favor ingrese el nombre del cliente', 'warning');
      document.getElementById('cliente-nombre')?.focus();
      return false;
    }

    const docType = document.querySelector('input[name="cliente-doc"]:checked')?.value || 'dni';
    let numero = '';
    let expiracion = '';

    if (docType === 'dni') {
      numero = document.getElementById('cliente-dni')?.value?.trim();
      expiracion = document.getElementById('cliente-dni-exp')?.value;
      if (!numero || !expiracion) {
        this.showNotification('Complete número y fecha de expiración del DNI', 'warning');
        document.getElementById('cliente-dni')?.focus();
        return false;
      }
    } else {
      numero = document.getElementById('cliente-pasaporte')?.value?.trim();
      expiracion = document.getElementById('cliente-pasaporte-exp')?.value;
      if (!numero || !expiracion) {
        this.showNotification('Complete número y fecha de expiración del pasaporte', 'warning');
        document.getElementById('cliente-pasaporte')?.focus();
        return false;
      }
    }

    AppState.currentSale.client = {
      ...AppState.currentSale.client,
      nombre: nombre,
      email: document.getElementById('cliente-email')?.value?.trim(),
      telefono: document.getElementById('cliente-telefono')?.value?.trim(),
      documento_tipo: docType,
      documento_numero: numero,
      documento_expiracion: expiracion
    };

    return true;
  }

  validateTripStep() {
    const fechaInicio = document.getElementById('fecha-viaje-inicio')?.value;
    
    if (!fechaInicio) {
      this.showNotification('Por favor seleccione la fecha de inicio del viaje', 'warning');
      document.getElementById('fecha-viaje-inicio')?.focus();
      return false;
    }
    
    // Guardar datos del viaje
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
              <label for="vuelo-origen">Origen *</label>
              <input type="text" id="vuelo-origen" class="form-control" placeholder="Buenos Aires (BUE)" required>
            </div>
            <div class="form-group">
              <label for="vuelo-destino">Destino *</label>
              <input type="text" id="vuelo-destino" class="form-control" placeholder="Miami (MIA)" required>
            </div>
            <div class="form-group">
              <label for="vuelo-precio">Precio *</label>
              <input type="number" id="vuelo-precio" class="form-control" placeholder="1500" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label for="vuelo-precio-costo">Precio Costo</label>
              <input type="number" id="vuelo-precio-costo" class="form-control precio-costo-nts" placeholder="0.00" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="vuelo-pasajeros">Pasajeros</label>
              <input type="number" id="vuelo-pasajeros" class="form-control" value="1" min="1">
            </div>
            <div class="form-group">
              <label for="vuelo-tipo">Tipo Itinerario</label>
              <select id="vuelo-tipo" class="form-control"></select>
            </div>
            <div class="form-group full-width">
              <label for="vuelo-descripcion">Descripción</label>
              <input type="text" id="vuelo-descripcion" class="form-control" placeholder="Descripción del vuelo">
            </div>
            <div class="form-group full-width">
              <label><strong>Tramos del Vuelo</strong></label>
              <div id="segments-container"></div>
              <button type="button" class="btn btn-secondary" id="add-segment-btn" style="margin-top: var(--spacing-sm);">
                Agregar tramo
              </button>
            </div>
          </div>
        <div class="form-actions" style="margin-top: var(--spacing-lg);">
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
      updateVueloTypeSelect();
      const container = document.getElementById('segments-container');
      const addBtn = document.getElementById('add-segment-btn');
      if (!container || !addBtn) return;

      const addSegment = () => {
        container.appendChild(this.createSegmentRow());
      };

      addBtn.addEventListener('click', addSegment);
      addSegment();

      container.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-segment')) {
          e.target.closest('.segment-row')?.remove();
        }
      });
    }
  }

  createSegmentRow() {
    const row = document.createElement('div');
    row.className = 'segment-row';
    row.innerHTML = `
      <div class="segment-section main-fields">
        <input type="text" class="form-control segment-origen" placeholder="Origen">
        <input type="text" class="form-control segment-destino" placeholder="Destino">
        <input type="text" class="form-control segment-aerolinea" placeholder="Aerolínea">
        <input type="text" class="form-control segment-numero-vuelo" placeholder="N° Vuelo">
        <input type="text" class="form-control segment-clase" placeholder="Clase">
        <input type="datetime-local" class="form-control segment-salida" placeholder="Salida">
        <input type="datetime-local" class="form-control segment-llegada" placeholder="Llegada">
        <label class="segment-scale-toggle"><input type="checkbox" class="segment-escala"> Escala</label>
      </div>
      <div class="segment-section escala-fields">
        <input type="text" class="form-control segment-aeropuerto-escala" placeholder="Aeropuerto de escala">
        <input type="text" class="form-control segment-duracion-escala" placeholder="Duración de escala">
        <input type="text" class="form-control segment-tiempo-siguiente" placeholder="Tiempo hasta próximo vuelo">
      </div>
      <div class="segment-section">
        <input type="text" class="form-control segment-observaciones" placeholder="Observaciones">
      </div>
      <button type="button" class="btn btn-danger remove-segment">&times;</button>
    `;

    const escalaToggle = row.querySelector('.segment-escala');
    const escalaFields = row.querySelector('.escala-fields');
    escalaToggle.addEventListener('change', () => {
      escalaFields.style.display = escalaToggle.checked ? 'grid' : 'none';
    });

    return row;
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
    const price = parseFloat(document.getElementById(`${serviceType}-precio`)?.value) || 0;
    const baseData = {
      precio: price,
      precio_venta: price
    };
    
    switch (serviceType) {
      case 'vuelo':
        const segmentRows = document.querySelectorAll('#segments-container .segment-row');
        const segmentos = Array.from(segmentRows).map((row, index) => ({
          numero_segmento: index + 1,
          aeropuerto_origen: row.querySelector('.segment-origen')?.value?.trim(),
          aeropuerto_destino: row.querySelector('.segment-destino')?.value?.trim(),
          aerolinea: row.querySelector('.segment-aerolinea')?.value?.trim(),
          numero_vuelo: row.querySelector('.segment-numero-vuelo')?.value?.trim(),
          clase: row.querySelector('.segment-clase')?.value?.trim(),
          fecha_hora_salida_local: row.querySelector('.segment-salida')?.value || null,
          fecha_hora_llegada_local: row.querySelector('.segment-llegada')?.value || null,
          fecha_hora_salida_utc: row.querySelector('.segment-salida')?.value ? new Date(row.querySelector('.segment-salida').value).toISOString() : null,
          fecha_hora_llegada_utc: row.querySelector('.segment-llegada')?.value ? new Date(row.querySelector('.segment-llegada').value).toISOString() : null,
          tiene_escala: row.querySelector('.segment-escala')?.checked || false,
          aeropuerto_escala: row.querySelector('.segment-aeropuerto-escala')?.value?.trim() || null,
          duracion_escala: row.querySelector('.segment-duracion-escala')?.value?.trim() || null,
          tiempo_hasta_siguiente_vuelo: row.querySelector('.segment-tiempo-siguiente')?.value?.trim() || null,
          observaciones: row.querySelector('.segment-observaciones')?.value?.trim() || null
        }));

        const origen = document.getElementById('vuelo-origen')?.value?.trim();
        const destino = document.getElementById('vuelo-destino')?.value?.trim();
        const descripcionManual = document.getElementById('vuelo-descripcion')?.value?.trim() || '';
        const pasajeros = parseInt(document.getElementById('vuelo-pasajeros')?.value) || 1;
        const tipoItinerario = getValidTipoItinerario(document.getElementById('vuelo-tipo')?.value);
        let aerolinea = document.getElementById('vuelo-aerolinea')?.value?.trim() || '';
        if (!aerolinea && segmentos.length > 0) {
          aerolinea = segmentos[0].aerolinea || '';
        }
        const tempData = { origen, destino, aerolinea, tipo_itinerario: tipoItinerario, pasajeros, descripcion: descripcionManual };
        const descripcionFinal = generateVueloDescripcion(tempData);

        return {
          ...baseData,
          precio_costo: parseFloat(document.getElementById('vuelo-precio-costo')?.value) || 0,
          origen,
          destino,
          pasajeros,
          tipo_itinerario: tipoItinerario,
          aerolinea,
          descripcion: descripcionFinal,
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
    console.log(`🔍 Validando datos del servicio ${serviceType}:`, serviceData);

    if (serviceType === 'vuelo') {
      const validation = validateVueloData(serviceData);
      if (!validation.isValid) {
        console.error('Errores de validación:', validation.errors);
        this.showNotification('Errores: ' + validation.errors.join(', '), 'warning');
        return false;
      }
      if (!serviceData.segmentos || serviceData.segmentos.length === 0) {
        this.showNotification('Agregue al menos un tramo de vuelo', 'warning');
        return false;
      }
      const invalid = serviceData.segmentos.some(s => !s.aeropuerto_origen || !s.aeropuerto_destino);
      if (invalid) {
        this.showNotification('Complete origen y destino en todos los tramos', 'warning');
        return false;
      }
      return true;
    }

    if (!serviceData.precio_venta || serviceData.precio_venta <= 0) {
      this.showNotification('Por favor ingrese un precio de venta válido', 'warning');
      return false;
    }

    switch (serviceType) {
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
              <div class="service-price">${this.formatCurrency(this.getServicePrice(service))}</div>
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
        return `${icon} ${service.descripcion}`;
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

  getServicePrice(servicio) {
    return servicio.precio_venta || servicio.precio || 0;
  }

  updateTotals() {
    const subtotal = AppState.currentSale.services.reduce((sum, s) => sum + this.getServicePrice(s), 0);
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
    
    form.querySelectorAll('input, select').forEach(field => {
      if (field.tagName === 'INPUT' && field.type === 'number' && field.hasAttribute('value')) {
        field.value = field.getAttribute('value');
      } else {
        field.value = '';
      }
    });

    if (serviceType === 'vuelo') {
      const container = document.getElementById('segments-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(this.createSegmentRow());
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
    
    if (AppState.currentSale.services.length === 0) {
      this.showNotification('Debe agregar al menos un servicio', 'warning');
      AppState.currentStep = 3;
      this.updateStepForm();
      return false;
    }
    
    return true;
  }

  buildSaleData() {
    return {
      numero_venta: this.generateSaleNumber(),
      cliente: AppState.currentSale.client,
      viaje: AppState.currentSale.trip,
      servicios: AppState.currentSale.services,
      totales: AppState.currentSale.totals,
      fecha_creacion: new Date().toISOString(),
      vendedor_id: AppState.user?.id ? parseInt(AppState.user.id, 10) : 1,
      estado: 'pendiente',
      estado_pago: 'no_pagado'
    };
  }

  async createSaleInDB(saleData) {
    if (!AppState.supabase) return;
    console.log('Creando venta en DB:', saleData);
    const { data: venta, error: ventaError } = await AppState.supabase
      .from('ventas')
      .insert({
        numero_venta: saleData.numero_venta,
        cliente_id: saleData.cliente.id ? parseInt(saleData.cliente.id, 10) : null,
        vendedor_id: saleData.vendedor_id,
        fecha_venta: new Date().toISOString().slice(0, 10),
        fecha_viaje_inicio: saleData.viaje.fechaInicio || null,
        fecha_viaje_fin: saleData.viaje.fechaFin || null,
        observaciones: saleData.viaje.observaciones || null,
        total_final: saleData.totales.total,
        total_pagado: 0,
        saldo_pendiente: saleData.totales.total,
        comision_vendedor: 0,
        estado: saleData.estado,
        estado_pago: saleData.estado_pago,
        forma_pago_principal: saleData.forma_pago_principal || null
      })
      .select()
      .single();

    if (ventaError) {
      console.error('Error creando venta:', ventaError.message, ventaError.details);
      throw ventaError;
    }

    for (const servicio of saleData.servicios) {
      await this.createServiceInDB(venta.id, servicio);
    }
  }

  async createServiceInDB(ventaId, servicio) {
    if (!AppState.supabase) return;

    try {
      console.log(`Creando servicio ${servicio.type} para venta ${ventaId}:`, servicio);

      if (servicio.type === 'vuelo') {
        const descripcionFinal = servicio.descripcion && servicio.descripcion.trim()
          ? servicio.descripcion.trim()
          : generateVueloDescripcion(servicio);

        const vueloData = {
          venta_id: ventaId,
          descripcion: descripcionFinal,
          origen: servicio.origen || 'No especificado',
          destino: servicio.destino || 'No especificado',
          tipo_itinerario: getValidTipoItinerario(servicio.tipo_itinerario)
        };

        if (servicio.pasajeros) vueloData.pasajeros = servicio.pasajeros;
        if (servicio.aerolinea) vueloData.aerolinea = servicio.aerolinea;
        if (servicio.clase_vuelo) vueloData.clase_vuelo = servicio.clase_vuelo;
        if (servicio.precio_venta !== undefined) vueloData.precio_venta = servicio.precio_venta;
        if (servicio.precio !== undefined && vueloData.precio_venta === undefined) vueloData.precio_venta = servicio.precio;
        if (servicio.precio_costo) vueloData.precio_costo = servicio.precio_costo;
        if (servicio.proveedor_id) vueloData.proveedor_id = servicio.proveedor_id;
        if (servicio.itinerario_observaciones) vueloData.itinerario_observaciones = servicio.itinerario_observaciones;

        console.log('Datos del vuelo para DB (sin fecha):', vueloData);

        const { data: vuelo, error: vueloError } = await AppState.supabase
          .from('venta_vuelos')
          .insert(vueloData)
          .select()
          .single();

        if (vueloError) {
          console.error('Error creando vuelo:', vueloError);
          throw new Error(`Error creando vuelo: ${vueloError.message}`);
        }

        if (servicio.segmentos && servicio.segmentos.length > 0) {
          await this.createFlightSegments(vuelo.id, servicio.segmentos);
        }

      } else if (servicio.type === 'hotel') {
        const hotelData = {
          venta_id: ventaId,
          nombre: servicio.nombre || servicio.hotel_nombre || ''
        };

        if (servicio.ciudad || servicio.hotel_ciudad) hotelData.ciudad = servicio.ciudad || servicio.hotel_ciudad;
        if (servicio.checkin || servicio.fecha_checkin) hotelData.fecha_checkin = servicio.checkin || servicio.fecha_checkin;
        if (servicio.checkout || servicio.fecha_checkout) hotelData.fecha_checkout = servicio.checkout || servicio.fecha_checkout;
        if (servicio.huespedes) hotelData.huespedes = servicio.huespedes;
        if (servicio.precio_venta) hotelData.precio_venta = servicio.precio_venta;
        if (servicio.precio_costo) hotelData.precio_costo = servicio.precio_costo;
        if (servicio.proveedor_id) hotelData.proveedor_id = servicio.proveedor_id;

        const { error: hotelError } = await AppState.supabase
          .from('venta_hoteles')
          .insert(hotelData);

        if (hotelError) {
          console.error('Error creando hotel:', hotelError);
          throw new Error(`Error creando hotel: ${hotelError.message}`);
        }

      } else if (servicio.type === 'traslado') {
        const trasladoData = {
          venta_id: ventaId,
          origen: servicio.origen || '',
          destino: servicio.destino || ''
        };

        if (servicio.fecha || servicio.fecha_traslado) trasladoData.fecha = servicio.fecha || servicio.fecha_traslado;
        if (servicio.hora) trasladoData.hora = servicio.hora;
        if (servicio.pasajeros) trasladoData.pasajeros = servicio.pasajeros;
        if (servicio.precio_venta) trasladoData.precio_venta = servicio.precio_venta;
        if (servicio.precio_costo) trasladoData.precio_costo = servicio.precio_costo;
        if (servicio.proveedor_id) trasladoData.proveedor_id = servicio.proveedor_id;

        const { error: trasladoError } = await AppState.supabase
          .from('venta_traslados')
          .insert(trasladoData);

        if (trasladoError) {
          console.error('Error creando traslado:', trasladoError);
          throw new Error(`Error creando traslado: ${trasladoError.message}`);
        }

      } else if (servicio.type === 'excursion') {
        const excursionData = {
          venta_id: ventaId,
          nombre: servicio.nombre || servicio.nombre_excursion || ''
        };

        if (servicio.fecha || servicio.fecha_excursion) excursionData.fecha = servicio.fecha || servicio.fecha_excursion;
        if (servicio.destino) excursionData.destino = servicio.destino;
        if (servicio.duracion) excursionData.duracion = servicio.duracion;
        if (servicio.participantes) excursionData.participantes = servicio.participantes;
        if (servicio.precio_venta) excursionData.precio_venta = servicio.precio_venta;
        if (servicio.precio_costo) excursionData.precio_costo = servicio.precio_costo;
        if (servicio.proveedor_id) excursionData.proveedor_id = servicio.proveedor_id;

        const { error: excursionError } = await AppState.supabase
          .from('venta_excursiones')
          .insert(excursionData);

        if (excursionError) {
          console.error('Error creando excursión:', excursionError);
          throw new Error(`Error creando excursión: ${excursionError.message}`);
        }
      }

      console.log(`Servicio ${servicio.type} creado exitosamente`);

    } catch (error) {
      console.error(`Error creando servicio ${servicio.type}:`, error);
      throw error;
    }
  }

  async createFlightSegments(vueloId, segmentos) {
    if (!AppState.supabase || !segmentos || segmentos.length === 0) return;

    try {
      console.log('Creando segmentos para vuelo:', vueloId, segmentos);

      const segmentosData = segmentos
        .filter(seg => seg.aeropuerto_origen && seg.aeropuerto_destino)
        .map((seg, index) => {
          const segmentData = {
            venta_vuelo_id: vueloId,
            numero_segmento: seg.numero_segmento || index + 1,
            aeropuerto_origen: seg.aeropuerto_origen || seg.origen || '',
            aeropuerto_destino: seg.aeropuerto_destino || seg.destino || ''
          };

          if (seg.fecha_hora_salida_local) segmentData.fecha_hora_salida_local = seg.fecha_hora_salida_local;
          if (seg.fecha_hora_llegada_local) segmentData.fecha_hora_llegada_local = seg.fecha_hora_llegada_local;
          if (seg.fecha_hora_salida_utc) segmentData.fecha_hora_salida_utc = seg.fecha_hora_salida_utc;
          if (seg.fecha_hora_llegada_utc) segmentData.fecha_hora_llegada_utc = seg.fecha_hora_llegada_utc;
          if (seg.aerolinea) segmentData.aerolinea = seg.aerolinea;
          if (seg.numero_vuelo) segmentData.numero_vuelo = seg.numero_vuelo;
          if (seg.clase) segmentData.clase = seg.clase;
          if (seg.tiene_escala !== undefined) segmentData.tiene_escala = seg.tiene_escala;
          if (seg.aeropuerto_escala) segmentData.aeropuerto_escala = seg.aeropuerto_escala;
          if (seg.duracion_escala) segmentData.duracion_escala = seg.duracion_escala;
          if (seg.tiempo_hasta_siguiente_vuelo) segmentData.tiempo_hasta_siguiente_vuelo = seg.tiempo_hasta_siguiente_vuelo;
          if (seg.observaciones) segmentData.observaciones = seg.observaciones;

          return segmentData;
        });

      if (segmentosData.length > 0) {
        console.log('Datos de segmentos para insertar:', segmentosData);

        const { data, error: segError } = await AppState.supabase
          .from('vuelo_segmentos')
          .insert(segmentosData)
          .select();

        if (segError) {
          console.error('Error creando segmentos:', segError);
          throw new Error(`Error creando segmentos: ${segError.message}`);
        }

        console.log(`${segmentosData.length} segmentos creados exitosamente:`, data);
      }

    } catch (error) {
      console.error('Error en createFlightSegments:', error);
      throw error;
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
      totals: { subtotal: 0, descuentos: 0, total: 0 }
    };
    
    AppState.currentStep = 1;
    this.updateStepForm();
    this.updateServicesList();
    this.updateTotals();
    
    // Limpiar formularios
    document.querySelectorAll('.form-control').forEach(input => {
      input.value = '';
    });
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

  async loginWithGitHub() {
    if (!AppState.supabase) return;
    try {
      const { error } = await AppState.supabase.auth.signInWithOAuth({
        provider: 'github'
      });
      if (error) {
        console.error('Error al iniciar sesión con GitHub:', error);
        this.showNotification('Error al iniciar sesión con GitHub', 'error');
      }
    } catch (err) {
      console.error('Error al iniciar sesión con GitHub:', err);
      this.showNotification('Error al iniciar sesión con GitHub', 'error');
    }
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

// ===== INICIALIZACIÓN =====
let app;

document.addEventListener('DOMContentLoaded', () => {
  app = new NTSApp();
  // Exponer la instancia para manejar eventos desde el HTML
  window.app = app;
  console.log('✅ NTS Sistema v2.0 cargado correctamente');
});
