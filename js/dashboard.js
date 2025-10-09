let salesChart;
let topProductsChart;
let salesDistributionChart;

const mockData = {
    stats: {
        revenue: 0,
        orders: 0,
        users: 5,
        products: 9
    },
    salesData: {
        2025: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    recentActivity: [
        { type: 'system', title: 'Sistema iniciado correctamente', time: 'Hace 1 minuto', icon: 'check-circle', color: 'success' },
        { type: 'system', title: 'Base de datos conectada', time: 'Hace 2 minutos', icon: 'database', color: 'info' },
        { type: 'system', title: 'Dashboard cargado', time: 'Hace 3 minutos', icon: 'tachometer-alt', color: 'success' }
    ],
    products: [
        { id: 'FR001', name: 'Manzanas Fuji', category: 'Frutas', price: 2500, stock: 50, status: 'Activo' },
        { id: 'FR002', name: 'Naranjas Valencia', category: 'Frutas', price: 2200, stock: 40, status: 'Activo' },
        { id: 'FR003', name: 'Plátanos Cavendish', category: 'Frutas', price: 1800, stock: 60, status: 'Activo' },
        { id: 'VR001', name: 'Zanahorias Orgánicas', category: 'Verduras', price: 1500, stock: 35, status: 'Activo' },
        { id: 'VR002', name: 'Espinacas Frescas', category: 'Verduras', price: 1200, stock: 25, status: 'Activo' },
        { id: 'VR003', name: 'Pimientos Tricolores', category: 'Verduras', price: 2800, stock: 30, status: 'Activo' },
        { id: 'PO001', name: 'Miel Orgánica', category: 'Orgánicos', price: 4500, stock: 20, status: 'Activo' },
        { id: 'PO003', name: 'Quinua Orgánica', category: 'Orgánicos', price: 3200, stock: 15, status: 'Activo' },
        { id: 'PL001', name: 'Leche Entera', category: 'Lácteos', price: 1100, stock: 45, status: 'Activo' }
    ],
    users: [
        { id: 1, name: 'Administrador', email: 'admin@huerthogar.com', role: 'Superusuario', date: '2024-01-01', status: 'Activo' },
        { id: 2, name: 'Mauricio', email: 'mauricio@huerthogar.com', role: 'Superusuario', date: '2024-01-05', status: 'Activo' },
        { id: 3, name: 'Juan Pérez', email: 'juan@correo.com', role: 'Cliente', date: '2024-02-15', status: 'Activo' },
        { id: 4, name: 'María González', email: 'maria@correo.com', role: 'Cliente', date: '2024-03-10', status: 'Activo' },
        { id: 5, name: 'Cliente Test', email: 'cliente@test.com', role: 'Cliente', date: '2024-03-20', status: 'Activo' }
    ],
    orders: []
};

document.addEventListener('DOMContentLoaded', async function() {
    await setupAutomatico();
    initializeDashboard();
    loadStats();
    initializeCharts();
    loadRecentActivity();
    updateNotificationCount();
});

// Setup automatico del sistema
async function setupAutomatico() {
    const productosExistentes = localStorage.getItem('productosJSON');
    
    if (!productosExistentes) {
        console.log('Inicializando productos mediante ProductManager...');

        if (typeof productManager === 'undefined') {
            console.error('ProductManager no está disponible en dashboard.');
            return;
        }

        try {
            const datos = productManager.obtenerDatosCompletos();

            // Normalizar rutas de imágenes a formato esperado por el dashboard
            datos.productos.forEach(producto => {
                if (producto.imagen && !producto.imagen.startsWith('http')) {
                    if (!producto.imagen.startsWith('img/')) {
                        if (producto.imagen.includes('img/')) {
                            const nombreArchivo = producto.imagen.split('img/')[1];
                            producto.imagen = 'img/' + nombreArchivo;
                        } else {
                            producto.imagen = 'img/default.jpg';
                        }
                    }
                }
            });

            localStorage.setItem('productosJSON', JSON.stringify(datos));
            console.log('Productos cargados desde ProductManager:', datos.productos.length);
        } catch (error) {
            console.warn('Error obteniendo datos desde ProductManager:', error);
        }
    } else {
        console.log('Productos ya existen en localStorage');
    }
}

// Funciones principales
function initializeDashboard() {
    console.log('🚀 Inicializando Dashboard Admin...');
    
    // Inicializar managers necesarios
    if (typeof OrderManager !== 'undefined') {
        window.orderManager = new OrderManager();
    } else {
    }
    
    if (typeof ShippingConfig !== 'undefined') {
        window.shippingConfig = new ShippingConfig();
    }
    
    if (typeof ProductManager !== 'undefined') {
        window.productManager = new ProductManager();
    }
    
    // Verificar autenticación
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado') || '{}');
    
    // Si no hay usuario logueado, crear uno temporal para pruebas
    if (!usuarioLogueado.nombre) {
        const usuarioTemp = {
            nombre: 'Admin',
            rol: 'superusuario',
            email: 'admin@huertohogar.com'
        };
        localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioTemp));
        console.log('Usuario temporal creado para pruebas');
    }
    
    // Actualizar avatar con inicial del usuario
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    document.querySelector('.user-avatar').textContent = usuario.nombre.charAt(0).toUpperCase();
    
    // Cargar datos iniciales
    loadStats();
}

async function loadStats() {
    // Animar contadores con datos simulados
    animateCounter('totalSales', 0, '$', true);
    animateCounter('totalOrders', 0);
    animateCounter('totalProducts', mockData.stats.products);
    
    // Actualizar usuarios con datos reales
    await updateDashboardStats();
}

function animateCounter(elementId, targetValue, prefix = '', isCurrency = false) {
    const element = document.getElementById(elementId);
    const startValue = 0;
    const duration = 2000;
    const step = targetValue / (duration / 16);
    let currentValue = startValue;
    
    const timer = setInterval(() => {
        currentValue += step;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        
        let displayValue = Math.floor(currentValue);
        if (isCurrency) {
            displayValue = displayValue.toLocaleString();
        }
        element.textContent = prefix + displayValue;
    }, 16);
}

function initializeCharts() {
    // Gráfico de ventas
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Ventas 2025',
                data: mockData.salesData[2025],
                borderColor: '#4299e1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4299e1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
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
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';
    
    mockData.recentActivity.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon ${activity.color}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Funciones de navegación
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

function showSection(sectionName) {
    console.log('🔄 Cambiando a sección:', sectionName);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(`${sectionName}Section`);
    console.log('🎯 Elemento encontrado:', targetSection);
    
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('✅ Sección activada:', sectionName);
    } else {
        console.error('❌ No se encontró la sección:', `${sectionName}Section`);
    }
    
    // Actualizar navegación activa
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Agregar clase active al enlace clickeado
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        console.log('🔗 Enlace activado');
    }
    
    // Actualizar título
    const titles = {
        dashboard: 'Dashboard Overview',
        products: 'Gestión de Productos',
        users: 'Gestión de Usuarios',
        orders: 'Gestión de Pedidos',
        analytics: 'Analytics y Reportes',
        settings: 'Configuración del Sistema'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionName];
    
    // Cargar datos específicos de cada sección
    switch(sectionName) {
        case 'dashboard':
            console.log('Cargando dashboard...');
            updateDashboardStats();
            break;
        case 'products':
            console.log('Cargando productos...');
            loadProductsTable();
            break;
        case 'users':
            console.log('Cargando usuarios...');
            loadUsersTable();
            updateDashboardStats(); // Actualizar también las estadísticas
            break;
        case 'orders':
            console.log('Cargando pedidos...');
            loadOrdersTable();
            break;
        case 'analytics':
            console.log('Cargando analytics...');
            initializeAnalyticsCharts();
            break;
    }
}

// Función para cargar productos dinámicamente
async function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <i class="fas fa-spinner fa-spin fa-2x mb-2"></i>
                <br>Cargando productos...
            </td>
        </tr>
    `;

    try {
        // Obtener productos desde productManager
        const resultado = await productManager.obtenerTodosLosProductos();
        
        if (!resultado.success || resultado.productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-muted">
                        <i class="fas fa-box fa-3x mb-3 d-block"></i>
                        No hay productos registrados
                        <br>
                        <button class="btn btn-success btn-sm mt-2" onclick="showAddProductModal()">
                            <i class="fas fa-plus me-1"></i>Agregar primer producto
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        resultado.productos.forEach(product => {
            const statusClass = product.estado === 'activo' ? 'success' : 
                              product.stock === 0 ? 'danger' : 'warning';
            
            const statusText = product.estado === 'activo' ? 
                             (product.stock === 0 ? 'Agotado' : 'Activo') : 'Inactivo';
            
            const row = document.createElement('tr');
            
            // Corregir ruta de imagen para dashboard
            let imagenSrc = product.imagen;
            if (imagenSrc.startsWith('../../../img/')) {
                // Convertir de ruta del catálogo a ruta del dashboard
                imagenSrc = imagenSrc.replace('../../../img/', '../../img/');
            } else if (imagenSrc.startsWith('img/')) {
                // Si es ruta directa, agregar ../../
                imagenSrc = '../../' + imagenSrc;
            }
            
            row.innerHTML = `
                <td><strong>PR${String(product.id).padStart(3, '0')}</strong></td>
                <td>
                    <img src="${imagenSrc}" 
                         alt="${product.nombre}" 
                         style="width: 45px; height: 45px; object-fit: cover; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                         onerror="this.src='../../img/default.jpg';">
                </td>
                <td><strong>${product.nombre}</strong></td>
                <td style="color: var(--success-color); font-weight: 600;">$${product.precio.toLocaleString('es-CL')} CLP</td>
                <td>
                    <span class="badge ${product.stock <= 5 ? 'bg-warning' : 'bg-light text-dark border'}">${product.stock} unidades</span>
                </td>
                <td>
                    <span class="badge bg-info">${product.categoria}</span>
                </td>
                <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info" onclick="viewProduct(${product.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="editProduct(${product.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="replenishStock(${product.id})" title="Reponer Stock">
                            <i class="fas fa-plus"></i>
                        </button>
                        ${product.estado === 'activo' ? 
                            `<button class="btn btn-outline-warning" onclick="deactivateProduct(${product.id})" title="Desactivar">
                                <i class="fas fa-power-off"></i>
                            </button>` :
                            `<button class="btn btn-outline-success" onclick="activateProduct(${product.id})" title="Activar">
                                <i class="fas fa-play"></i>
                            </button>`
                        }
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Actualizar contador de productos en stats
        updateProductCount(resultado.productos.length);

    } catch (error) {
        console.error('Error cargando productos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <br>Error al cargar productos
                    <br>
                    <button class="btn btn-outline-secondary btn-sm mt-2" onclick="loadProductsTable()">
                        <i class="fas fa-redo me-1"></i>Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    if (mockData.users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fas fa-users fa-3x mb-3 d-block"></i>
                    No hay usuarios registrados
                </td>
            </tr>
        `;
        return;
    }
    
    mockData.users.forEach(user => {
        const statusClass = user.status === 'Activo' ? 'success' : 'danger';
        const roleClass = user.role === 'Superusuario' ? 'primary' : 'secondary';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge bg-${roleClass}">${user.role}</span></td>
            <td>${user.date}</td>
            <td><span class="badge bg-${statusClass}">${user.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadOrdersTable() {
    console.log('Dashboard: Iniciando carga de tabla de pedidos...');
    
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) {
        console.error('Dashboard: No se encontró elemento ordersTableBody');
        return;
    }
    
    // Verificar que orderManager esté disponible
    if (!window.orderManager) {
        console.error('Dashboard: orderManager no está disponible');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <br>Sistema de pedidos no inicializado
                    <br><small>Recarga la página para intentar nuevamente</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    // Cargar pedidos desde orderManager
    console.log('Dashboard: Obteniendo pedidos...');
    const orders = window.orderManager.getAllOrders();
    console.log('Dashboard: Pedidos obtenidos:', orders.length);
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fas fa-shopping-cart fa-3x mb-3 d-block"></i>
                    No hay pedidos registrados aún
                    <br><small>Los pedidos aparecerán aquí cuando los clientes completen sus compras</small>
                </td>
            </tr>
        `;
        
        // Actualizar contador de pedidos en stats
        updateOrderCount(0);
        return;
    }
    
    console.log('Dashboard: Renderizando', orders.length, 'pedidos...');
    
    orders.forEach(order => {
        const statusClass = getStatusClass(order.status);
        const statusText = getStatusText(order.status);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <code class="text-primary">${order.id}</code>
            </td>
            <td>
                <div>
                    <strong>${order.customer.name}</strong>
                    <br><small class="text-muted">${order.customer.email}</small>
                </div>
            </td>
            <td>
                <small>${window.orderManager.formatDate(order.date)}</small>
            </td>
            <td>
                <strong class="text-success">${window.orderManager.formatPrice(order.totals.total)}</strong>
                <br><small class="text-muted">${order.items.length} item(s)</small>
            </td>
            <td>
                <span class="badge bg-${statusClass}">${statusText}</span>
            </td>
            <td>
                <small class="text-muted">${order.paymentMethod || 'Transferencia'}</small>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-info" onclick="viewOrder('${order.id}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="editOrderStatus('${order.id}')" title="Cambiar estado">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Actualizar contador de pedidos en stats
    updateOrderCount(orders.length);
    console.log('Dashboard: Tabla de pedidos renderizada exitosamente');
}

// Función para obtener clase CSS del estado
function getStatusClass(status) {
    switch(status) {
        case 'pendiente': return 'warning';
        case 'procesando': return 'info';
        case 'enviado': return 'primary';
        case 'entregado': return 'success';
        case 'cancelado': return 'danger';
        default: return 'secondary';
    }
}

// Función para obtener texto del estado
function getStatusText(status) {
    switch(status) {
        case 'pendiente': return 'Pendiente';
        case 'procesando': return 'Procesando';
        case 'enviado': return 'Enviado';
        case 'entregado': return 'Entregado';
        case 'cancelado': return 'Cancelado';
        default: return status;
    }
}

// Función para actualizar contador de pedidos en stats
function updateOrderCount(count) {
    const orderCountElement = document.querySelector('#ordersSection .stat-card .stat-number');
    if (orderCountElement) {
        orderCountElement.textContent = count;
    }
    
    // También buscar en la sección general de stats
    const generalOrderCount = document.querySelector('[data-stat="orders"] .stat-number');
    if (generalOrderCount) {
        generalOrderCount.textContent = count;
    }
}

// Ver detalles de pedido
function viewOrder(orderId) {
    const order = orderManager.getOrderById(orderId);
    if (!order) {
        showToast('Error', 'Pedido no encontrado', 'error');
        return;
    }
    
    // Crear modal con detalles del pedido
    const modalContent = `
        <div class="modal fade" id="orderDetailsModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-receipt me-2"></i>Detalles del Pedido ${order.id}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary">Información del Cliente</h6>
                                <p><strong>Nombre:</strong> ${order.customer.name}</p>
                                <p><strong>Email:</strong> ${order.customer.email}</p>
                                <p><strong>Teléfono:</strong> ${order.customer.phone}</p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary">Información del Pedido</h6>
                                <p><strong>Estado:</strong> <span class="badge bg-${getStatusClass(order.status)}">${getStatusText(order.status)}</span></p>
                                <p><strong>Fecha:</strong> ${orderManager.formatDate(order.date)}</p>
                                <p><strong>Tipo:</strong> ${order.type === 'guest' ? 'Invitado' : 'Usuario registrado'}</p>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <h6 class="text-primary">Dirección de Envío</h6>
                        <p>${order.shipping.address}<br>
                           ${order.shipping.city}, ${order.shipping.region}<br>
                           Código Postal: ${order.shipping.zipCode}</p>
                        ${order.shipping.notes ? `<p><strong>Notas:</strong> ${order.shipping.notes}</p>` : ''}
                        
                        <hr>
                        
                        <h6 class="text-primary">Productos</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Precio</th>
                                        <th>Cantidad</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.items.map(item => `
                                        <tr>
                                            <td>${item.name}</td>
                                            <td>${orderManager.formatPrice(item.price)}</td>
                                            <td>${item.quantity}</td>
                                            <td>${orderManager.formatPrice(item.total)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="row mt-3">
                            <div class="col-md-6 offset-md-6">
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Subtotal:</strong></td>
                                        <td class="text-end">${orderManager.formatPrice(order.totals.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Envío:</strong></td>
                                        <td class="text-end">${order.shipping.isFree ? 'Gratis' : orderManager.formatPrice(order.totals.shipping)}</td>
                                    </tr>
                                    <tr class="table-success">
                                        <td><strong>Total:</strong></td>
                                        <td class="text-end"><strong>${orderManager.formatPrice(order.totals.total)}</strong></td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="editOrderStatus('${order.id}')">
                            <i class="fas fa-edit me-1"></i>Cambiar Estado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('orderDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}

// Editar estado de pedido
function editOrderStatus(orderId) {
    const order = orderManager.getOrderById(orderId);
    if (!order) {
        showToast('Error', 'Pedido no encontrado', 'error');
        return;
    }
    
    const states = [
        { value: 'pendiente', text: 'Pendiente' },
        { value: 'procesando', text: 'Procesando' },
        { value: 'enviado', text: 'Enviado' },
        { value: 'entregado', text: 'Entregado' },
        { value: 'cancelado', text: 'Cancelado' }
    ];
    
    const optionsHtml = states.map(state => 
        `<option value="${state.value}" ${state.value === order.status ? 'selected' : ''}>${state.text}</option>`
    ).join('');
    
    const modalContent = `
        <div class="modal fade" id="editOrderStatusModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>Cambiar Estado del Pedido
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editOrderStatusForm">
                            <div class="mb-3">
                                <label class="form-label">Pedido ID:</label>
                                <input type="text" class="form-control" value="${order.id}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Cliente:</label>
                                <input type="text" class="form-control" value="${order.customer.name}" readonly>
                            </div>
                            <div class="mb-3">
                                <label for="newStatus" class="form-label">Nuevo Estado:</label>
                                <select class="form-select" id="newStatus" required>
                                    ${optionsHtml}
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveOrderStatus('${orderId}')">
                            <i class="fas fa-save me-1"></i>Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('editOrderStatusModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editOrderStatusModal'));
    modal.show();
}

// Guardar nuevo estado del pedido
function saveOrderStatus(orderId) {
    const newStatus = document.getElementById('newStatus').value;
    
    const result = orderManager.updateOrderStatus(orderId, newStatus);
    
    if (result.success) {
        showToast('Éxito', 'Estado del pedido actualizado correctamente', 'success');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderStatusModal'));
        if (modal) modal.hide();
        
        // Cerrar modal de detalles si está abierto
        const detailsModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
        if (detailsModal) detailsModal.hide();
        
        // Recargar tabla
        loadOrdersTable();
    } else {
        showToast('Error', result.message || 'Error al actualizar el estado', 'error');
    }
}

function loadAnalyticsCharts() {
    // Solo cargar si no están ya inicializados
    if (!topProductsChart) {
        setTimeout(() => {
            const topProductsCtx = document.getElementById('topProductsChart').getContext('2d');
            topProductsChart = new Chart(topProductsCtx, {
                type: 'bar',
                data: {
                    labels: ['Miel Orgánica', 'Quinua Orgánica', 'Pimientos', 'Manzanas', 'Naranjas'],
                    datasets: [{
                        label: 'Precio (CLP)',
                        data: [4500, 3200, 2800, 2500, 2200],
                        backgroundColor: [
                            '#48bb78',
                            '#4299e1',
                            '#ed8936',
                            '#f56565',
                            '#9f7aea'
                        ]
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
                                    return '$' + value.toLocaleString('es-CL') + ' CLP';
                                }
                            }
                        }
                    }
                }
            });

            const salesDistCtx = document.getElementById('salesDistributionChart').getContext('2d');
            salesDistributionChart = new Chart(salesDistCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Frutas', 'Verduras', 'Orgánicos', 'Lácteos'],
                    datasets: [{
                        data: [3, 3, 2, 1], // Cantidad de productos por categoría
                        backgroundColor: [
                            '#48bb78',
                            '#4299e1',
                            '#ed8936',
                            '#f56565'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }, 100);
    }
}

// Sistema de notificaciones dinámicas
function showToast(title, message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    const toastId = 'toast_' + Date.now();
    
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-title">${title}</span>
            <button class="toast-close" data-toast-id="${toastId}" style="z-index: 10000;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    toast.id = toastId;
    container.appendChild(toast);
    
    // Agregar event listener específico para este toast
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeToastById(toastId);
    });
    
    // Animar entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto-cerrar
    setTimeout(() => {
        closeToastById(toastId);
    }, duration);
}

function closeToastById(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.remove('show');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

function closeToast(button) {
    // Función legacy - redirigir a la nueva función
    const toastId = button.getAttribute('data-toast-id');
    if (toastId) {
        closeToastById(toastId);
    }
}

// Funciones de utilidad
function updateSalesChart(year) {
    salesChart.data.datasets[0].data = mockData.salesData[year];
    salesChart.data.datasets[0].label = `Ventas ${year}`;
    salesChart.update();
}

function updateNotificationCount() {
    const count = 3; // Mantener fijo en 3
    document.getElementById('notificationCount').textContent = count;
}

/**
 * Actualizar estadísticas del dashboard con datos reales
 */
async function updateDashboardStats() {
    try {
        // Obtener usuarios reales
        const resultado = await userManager.obtenerUsuarios();
        if (resultado.success) {
            const totalUsers = resultado.usuarios.length;
            const activeUsers = resultado.usuarios.filter(u => u.estado === 'activo').length;
            
            // Actualizar contador de usuarios totales
            const totalUsersElement = document.getElementById('totalUsers');
            if (totalUsersElement) {
                totalUsersElement.textContent = totalUsers.toLocaleString();
            }
            
            console.log('Dashboard: Estadísticas actualizadas -', totalUsers, 'usuarios totales,', activeUsers, 'activos');
        }
    } catch (error) {
        console.error('Dashboard: Error actualizando estadísticas:', error);
    }
}

function showNotifications() {
    // Mostrar las notificaciones
    showToast('Notificaciones', 'Sistema iniciado correctamente<br>Base de datos conectada<br>Dashboard cargado', 'info', 4000);
    
    // Ocultar el contador de notificaciones (el "3")
    const notificationBadge = document.getElementById('notificationCount');
    if (notificationBadge) {
        notificationBadge.style.display = 'none';
        console.log('✅ Notificaciones marcadas como leídas');
    }
}

function showUserMenu() {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado') || '{}');
    showToast('Información del Usuario', `${usuarioLogueado.nombre}<br>Rol: ${usuarioLogueado.rol}<br>Email: ${usuarioLogueado.email}`, 'info', 4000);
}

function logout() {
    // Mostrar modal de confirmación
    const logoutModal = new bootstrap.Modal(document.getElementById('logoutModal'));
    logoutModal.show();
}

function confirmLogout() {
    // Cerrar el modal
    const logoutModal = bootstrap.Modal.getInstance(document.getElementById('logoutModal'));
    logoutModal.hide();
    
    // Mostrar toast de despedida
    showToast('Cerrando Sesión', 'Hasta pronto! Redirigiendo...', 'success', 2000);
    
    // Remover datos del usuario y redirigir
    setTimeout(() => {
        localStorage.removeItem('usuarioLogueado');
        window.location.href = '../client/auth/login.html';
    }, 2000);
}

// Funciones CRUD (con notificaciones dinámicas)
function addProduct() {
    showToast('Agregar Producto', 'Función en desarrollo. Próximamente disponible.', 'info');
}

function editProduct(id) {
    showToast('Editar Producto', `Editando producto con ID: ${id}`, 'info');
}

// Desactivar producto
async function deactivateProduct(id) {
    try {
        const result = await productManager.desactivarProducto(id);
        
        if (result.success) {
            showToast('Éxito', result.mensaje, 'success');
            loadProductsTable();
        } else {
            showToast('Error', result.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error desactivando producto:', error);
        showToast('Error', 'Error al desactivar el producto', 'error');
    }
}

// Activar producto
async function activateProduct(id) {
    try {
        const result = await productManager.activarProducto(id);
        
        if (result.success) {
            showToast('Éxito', result.mensaje, 'success');
            loadProductsTable();
        } else {
            showToast('Error', result.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error activando producto:', error);
        showToast('Error', 'Error al activar el producto', 'error');
    }
}

function addUser() {
    showAddUserModal();
}

function editUser(id) {
    showToast('Editar Usuario', `Función de edición en desarrollo para usuario ID: ${id}`, 'info');
}

function viewUser(id) {
    // Función deshabilitada - no hacer nada
    console.log('Ver usuario:', id);
}

function deleteUser(id) {
    // Función deshabilitada - no hacer nada
    console.log('Eliminar usuario:', id);
}

// Analytics Charts Initialization
function initializeAnalyticsCharts() {
    // Category Chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Frutas', 'Verduras', 'Hierbas', 'Semillas'],
                datasets: [{
                    data: [35, 30, 20, 15],
                    backgroundColor: [
                        '#48bb78',
                        '#ed8936',
                        '#4299e1',
                        '#f56565'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Users Chart
    const usersCtx = document.getElementById('usersChart');
    if (usersCtx) {
        new Chart(usersCtx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Usuarios Activos',
                    data: [1200, 1350, 1400, 1550, 1620, 1720],
                    borderColor: '#4299e1',
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Modal Functions
function showAddProductModal() {
    showToast('Agregar Producto', 'Abriendo formulario para agregar nuevo producto', 'info');
}

function showAddUserModal() {
    showToast('Agregar Usuario', 'Abriendo formulario para agregar nuevo usuario', 'info');
}

// Filter Functions
function filterOrders() {
    const filter = document.getElementById('orderStatusFilter').value;
    showToast('Filtrar Pedidos', `Filtrando por estado: ${filter || 'Todos'}`, 'info');
    loadOrdersTable();
}

function updateAnalytics() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    showToast('Actualizando Analytics', `Período: ${startDate} - ${endDate}`, 'info');
    initializeAnalyticsCharts();
}

function viewOrder(id) {
    showToast('Ver Pedido', `Mostrando detalles del pedido #${id}`, 'info');
}

function editOrder(id) {
    showToast('Editar Pedido', `Editando pedido #${id}`, 'info');
}

function filterOrders(status) {
    showToast('Filtrar Pedidos', `Filtrando pedidos por: ${status}`, 'info');
}

function exportOrders() {
    showToast('Exportar Datos', 'Exportando pedidos a CSV...', 'success');
}

// Responsive
window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('collapsed');
        document.getElementById('mainContent').classList.add('expanded');
    }
});

// Función de prueba para depuración
function testShowProducts() {
    console.log('🧪 PRUEBA: Mostrando sección de productos...');
    showSection('products');
}

// Verificar que el script se carga
console.log('✅ Dashboard.js cargado correctamente');
console.log('🔍 Versión de prueba con logs de depuración activos');

// Función para forzar mostrar productos si hay problemas
function forceShowProducts() {
    console.log('🔧 FORZANDO mostrar productos...');
    
    // Ocultar todas las secciones manualmente
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Mostrar solo productos
    const productsSection = document.getElementById('productsSection');
    if (productsSection) {
        productsSection.style.display = 'block';
        productsSection.classList.add('active');
        console.log('✅ Productos mostrado forzadamente');
        loadProductsTable();
    } else {
        console.error('❌ No se encontró productsSection');
    }
}

// ============================================================================
// GESTIÓN DE USUARIOS - Integración con UserManager
// ============================================================================

/**
 * Mostrar modal para agregar usuario
 */
function showAddUserModal() {
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    
    // Limpiar formulario
    document.getElementById('addUserForm').reset();
    document.getElementById('addUserMessage').innerHTML = '';
    
    modal.show();
}

/**
 * Cargar tabla de usuarios desde userManager
 */
async function loadUsersTable() {
    try {
        console.log('Dashboard: Cargando tabla de usuarios...');
        const resultado = await userManager.obtenerUsuarios();
        const tableBody = document.getElementById('usersTableBody');
        
        if (!tableBody) {
            console.error('Dashboard: No se encontró usersTableBody');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (!resultado.success || resultado.usuarios.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        <i class="fas fa-users fa-3x mb-3 d-block"></i>
                        No hay usuarios registrados
                    </td>
                </tr>
            `;
            return;
        }

        console.log('Dashboard: Mostrando', resultado.usuarios.length, 'usuarios');
        
        resultado.usuarios.forEach(usuario => {
            const row = `
                <tr>
                    <td>${usuario.id}</td>
                    <td>${usuario.nombre} ${usuario.apellido || ''}</td>
                    <td>${usuario.email}</td>
                    <td>
                        <span class="badge ${usuario.rol === 'administrador' ? 'bg-danger' : 'bg-primary'}">
                            ${usuario.rol}
                        </span>
                    </td>
                    <td>${usuario.fechaRegistro}</td>
                    <td>
                        <span class="badge ${usuario.estado === 'activo' ? 'bg-success' : 'bg-danger'}">
                            ${usuario.estado}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-info" onclick="viewUser(${usuario.id})" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger ${usuario.rol === 'administrador' ? 'disabled' : ''}" 
                                    onclick="deleteUser(${usuario.id})" title="Eliminar"
                                    ${usuario.rol === 'administrador' ? 'disabled' : ''}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
        
        console.log(`✅ Tabla de usuarios cargada: ${usuarios.length} usuarios`);
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showUserMessage('Error cargando usuarios', 'danger');
    }
}

/**
 * Manejar envío del formulario de nuevo usuario
 */
async function handleAddUserForm(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('addUserBtn');
    const originalText = submitBtn.innerHTML;
    
    // Mostrar loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Creando...';
    submitBtn.disabled = true;
    
    try {
        // Recopilar datos del formulario
        const datosUsuario = {
            nombre: document.getElementById('userNombre').value.trim(),
            apellido: document.getElementById('userApellido').value.trim(),
            email: document.getElementById('userEmail').value.trim(),
            usuario: document.getElementById('userUsuario').value.trim(),
            password: document.getElementById('userPassword').value,
            rol: document.getElementById('userRol').value
        };
        
        // Validar datos
        const validacion = userManager.validarDatosUsuario(datosUsuario);
        if (!validacion.valido) {
            showUserMessage(validacion.errores.join('<br>'), 'danger');
            return;
        }
        
        // Crear usuario
        const resultado = await userManager.agregarUsuario(datosUsuario);
        
        if (resultado.success) {
            showUserMessage(resultado.mensaje, 'success');
            
            // Cerrar modal después de un delay
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
                loadUsersTable(); // Recargar tabla
            }, 1500);
            
        } else {
            showUserMessage(resultado.mensaje, 'danger');
        }
        
    } catch (error) {
        console.error('Error creando usuario:', error);
        showUserMessage('Error interno al crear usuario', 'danger');
    } finally {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Mostrar mensaje en el modal de usuario
 */
function showUserMessage(mensaje, tipo) {
    const messageDiv = document.getElementById('addUserMessage');
    messageDiv.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

/**
 * Funciones para gestión de usuarios
 */
function editUser(id) {
    // Por ahora mostramos un toast informativo sobre editar usuario
    showToast('Editar Usuario', `Función de edición en desarrollo para usuario ID: ${id}`, 'info');
}

function viewUser(id) {
    const userManager = new UserManager();
    const users = userManager.getAllUsers();
    const user = users.find(u => u.id === id);
    
    if (!user) {
        showToast('Error', 'Usuario no encontrado', 'error');
        return;
    }
    
    // Llenar los datos del modal
    document.getElementById('viewUserId').textContent = user.id;
    document.getElementById('viewUserName').textContent = user.nombre;
    document.getElementById('viewUserEmail').textContent = user.email;
    document.getElementById('viewUserRole').textContent = user.rol || 'Cliente';
    document.getElementById('viewUserPhone').textContent = user.telefono || 'No especificado';
    document.getElementById('viewUserAddress').textContent = user.direccion || 'No especificada';
    
    // Formatear fecha de registro si existe
    let fechaRegistro = 'No especificada';
    if (user.fechaRegistro) {
        const fecha = new Date(user.fechaRegistro);
        fechaRegistro = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    document.getElementById('viewUserCreatedAt').textContent = fechaRegistro;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('viewUserModal'));
    modal.show();
}

function deleteUser(id) {
    const userManager = new UserManager();
    const users = userManager.getAllUsers();
    const user = users.find(u => u.id === id);
    
    if (!user) {
        showToast('Error', 'Usuario no encontrado', 'error');
        return;
    }
    
    // Llenar los datos del modal de confirmación
    document.getElementById('deleteUserName').textContent = user.nombre;
    document.getElementById('deleteUserId').textContent = user.id;
    document.getElementById('deleteUserEmail').textContent = user.email;
    document.getElementById('deleteUserRole').textContent = user.rol || 'Cliente';
    
    // Guardar el ID del usuario a eliminar
    window.userToDelete = id;
    
    // Mostrar el modal de confirmación
    const modal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
    modal.show();
}

function editUserFromView() {
    // Cerrar el modal de ver detalles
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewUserModal'));
    viewModal.hide();
    
    // Obtener el ID del usuario actual
    const userId = document.getElementById('viewUserId').textContent;
    
    // Llamar a la función de editar
    editUser(userId);
}

function confirmDeleteUser() {
    const userManager = new UserManager();
    const userId = window.userToDelete;
    
    if (!userId) {
        showToast('Error', 'No se puede eliminar el usuario', 'error');
        return;
    }
    
    try {
        // Intentar eliminar el usuario
        const result = userManager.deleteUser(userId);
        
        if (result.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
            modal.hide();
            
            // Mostrar mensaje de éxito
            showToast('Usuario Eliminado', 'El usuario ha sido eliminado correctamente', 'success');
            
            // Actualizar la tabla de usuarios
            loadUsersTable();
            
            // Limpiar la variable temporal
            window.userToDelete = null;
        } else {
            showToast('Error', result.message || 'No se pudo eliminar el usuario', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        showToast('Error', 'Error interno al eliminar el usuario', 'error');
    }
}

// ===============================================
// FUNCIONES PARA GESTIÓN DE PRODUCTOS
// ===============================================

// Función para actualizar contador de productos en stats
function updateProductCount(count) {
    const productCountElement = document.querySelector('[data-stat="products"]');
    if (productCountElement) {
        productCountElement.textContent = count;
    }
}

// Mostrar modal para agregar producto
function showAddProductModal() {
    const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
    modal.show();
}

// Ver detalles de producto
async function viewProduct(id) {
    try {
        const producto = await productManager.obtenerProductoPorId(id);
        if (producto) {
            showToast('Detalles del Producto', 
                `<strong>${producto.nombre}</strong><br>
                 Precio: $${producto.precio.toLocaleString('es-CL')} CLP<br>
                 Stock: ${producto.stock} unidades<br>
                 Categoría: ${producto.categoria}<br>
                 Estado: ${producto.estado}`, 
                'info', 5000);
        }
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        showToast('Error', 'No se pudo obtener la información del producto', 'error');
    }
}

// Editar producto
async function editProduct(id) {
    try {
        const producto = await productManager.obtenerProductoPorId(id);
        if (producto) {
            // Llenar formulario de edición
            document.getElementById('editProductId').value = producto.id;
            document.getElementById('editProductName').value = producto.nombre;
            document.getElementById('editProductDescription').value = producto.descripcion;
            document.getElementById('editProductPrice').value = producto.precio;
            document.getElementById('editProductStock').value = producto.stock;
            document.getElementById('editProductCategory').value = producto.categoria;
            document.getElementById('editProductWeight').value = producto.peso;
            document.getElementById('editProductStatus').value = producto.estado;
            
            // Mostrar imagen actual
            const currentImg = document.getElementById('currentImg');
            if (currentImg && producto.imagen) {
                currentImg.src = producto.imagen;
                document.getElementById('currentImage').style.display = 'block';
            }
            
            // Limpiar vista previa
            document.getElementById('editImagePreview').style.display = 'none';
            document.getElementById('editProductImage').value = '';
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error obteniendo producto para editar:', error);
        showToast('Error', 'No se pudo cargar el producto para editar', 'error');
    }
}

// Eliminar producto
async function deleteProduct(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        try {
            const resultado = await productManager.eliminarProducto(id);
            if (resultado.success) {
                showToast('Éxito', resultado.mensaje, 'success');
                loadProductsTable(); // Recargar tabla
            } else {
                showToast('Error', resultado.mensaje, 'error');
            }
        } catch (error) {
            console.error('Error eliminando producto:', error);
            showToast('Error', 'No se pudo eliminar el producto', 'error');
        }
    }
}

// Manejar formulario de agregar producto
async function handleAddProductForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Procesar archivo de imagen
    const imageFile = formData.get('productImage');
    let imagePath = null;
    
    if (imageFile && imageFile.size > 0) {
        imagePath = await processImageFile(imageFile);
        if (!imagePath) {
            showToast('Error', 'Error procesando la imagen', 'error');
            return;
        }
        
        // Verificar si la imagen existe en la carpeta img/
        const imageExists = await checkImageExists(imagePath);
        if (!imageExists) {
            const confirmSave = confirm(
                `⚠️ ADVERTENCIA: La imagen no se encontró en la carpeta img/\n\n` +
                `¿Deseas guardar el producto de todas formas?\n\n` +
                `- SÍ: El producto se guardará pero mostrará imagen por defecto\n` +
                `- NO: Cancela y copia primero la imagen`
            );
            
            if (!confirmSave) {
                showToast('Info', 'Producto no guardado. Copia primero la imagen a la carpeta img/', 'info');
                return;
            }
        }
    }
    
    const productData = {
        nombre: formData.get('productName'),
        descripcion: formData.get('productDescription'),
        precio: formData.get('productPrice'),
        stock: formData.get('productStock'),
        categoria: formData.get('productCategory'),
        peso: formData.get('productWeight'),
        imagen: imagePath || '../../../img/default.jpg' // Usar imagen por defecto si no se selecciona ninguna
    };
    
    try {
        const resultado = await productManager.agregarProducto(productData);
        if (resultado.success) {
            showToast('Éxito', resultado.mensaje, 'success');
            event.target.reset(); // Limpiar formulario
            // Limpiar vista previa
            document.getElementById('imagePreview').style.display = 'none';
            bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
            loadProductsTable(); // Recargar tabla
        } else {
            showToast('Error', resultado.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error agregando producto:', error);
        showToast('Error', 'No se pudo agregar el producto', 'error');
    }
}

// Función para verificar si una imagen existe
async function checkImageExists(imagePath) {
    if (!imagePath) return false;
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = imagePath;
    });
}

// Manejar formulario de editar producto
async function handleEditProductForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productId = formData.get('productId');
    
    // Procesar archivo de imagen si se seleccionó uno nuevo
    const imageFile = formData.get('productImage');
    let imagePath = null;
    
    if (imageFile && imageFile.size > 0) {
        imagePath = await processImageFile(imageFile);
        if (!imagePath) {
            showToast('Error', 'Error procesando la imagen', 'error');
            return;
        }
    }
    
    // Obtener producto actual para preservar imagen si no se cambia
    const productos = await productManager.cargarProductos();
    const productoActual = productos.productos.find(p => p.id == productId);
    
    const productData = {
        nombre: formData.get('productName'),
        descripcion: formData.get('productDescription'),
        precio: formData.get('productPrice'),
        stock: formData.get('productStock'),
        categoria: formData.get('productCategory'),
        peso: formData.get('productWeight'),
        imagen: imagePath || productoActual?.imagen || '../../../img/default.jpg', // Mantener imagen actual si no se cambia
        estado: formData.get('productStatus')
    };
    
    try {
        const resultado = await productManager.actualizarProducto(productId, productData);
        if (resultado.success) {
            showToast('Éxito', resultado.mensaje, 'success');
            bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
            loadProductsTable(); // Recargar tabla
        } else {
            showToast('Error', resultado.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error actualizando producto:', error);
        showToast('Error', 'No se pudo actualizar el producto', 'error');
    }
}

// Agregar event listener para los formularios de productos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUserForm);
    }
    
    // Formularios de productos
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProductForm);
    }
    
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
        editProductForm.addEventListener('submit', handleEditProductForm);
    }
    
    // Formulario de configuración de envío
    const shippingConfigForm = document.getElementById('shippingConfigForm');
    if (shippingConfigForm) {
        shippingConfigForm.addEventListener('submit', handleShippingConfigForm);
        // Cargar configuración actual
        loadShippingConfig();
    }
    
    // Vista previa de imágenes
    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.addEventListener('change', handleImagePreview);
    }
    
    const editProductImageInput = document.getElementById('editProductImage');
    if (editProductImageInput) {
        editProductImageInput.addEventListener('change', handleEditImagePreview);
    }
});

// Funciones para manejar vistas previas de imágenes
function handleImagePreview(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewContainer.style.display = 'none';
    }
}

function handleEditImagePreview(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('editImagePreview');
    const previewImg = document.getElementById('editPreviewImg');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewContainer.style.display = 'none';
    }
}

// Función para generar nombre único de archivo
function generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const cleanName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${cleanName}_${timestamp}.${extension}`;
}

// Función para procesar archivo de imagen
async function processImageFile(file) {
    if (!file) return null;
    
    // Generar nombre único para evitar conflictos
    const uniqueFileName = generateUniqueFileName(file.name);
    
    // Mostrar modal con instrucciones
    showImageInstructions(file.name, uniqueFileName);
    
    // Retornar la ruta que se usará en el catálogo
    return `../../../img/${uniqueFileName}`;
}

// Función para mostrar instrucciones de imagen
function showImageInstructions(originalName, newName) {
    // Actualizar contenido del modal
    document.getElementById('originalFileName').textContent = originalName;
    document.getElementById('newFileName').textContent = newName;
    
    // Guardar el nombre para la función de copiar
    window.currentImageName = newName;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('imageInstructionsModal'));
    modal.show();
    
    console.log(`📸 Imagen: ${originalName} -> ${newName}`);
}

// Función para copiar nombre al clipboard
function copyToClipboard() {
    if (window.currentImageName) {
        navigator.clipboard.writeText(window.currentImageName).then(() => {
            showToast('Éxito', 'Nombre copiado al portapapeles', 'success', 2000);
        }).catch(() => {
            // Fallback para navegadores que no soportan clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = window.currentImageName;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Éxito', 'Nombre copiado al portapapeles', 'success', 2000);
        });
    }
}

// Función para abrir carpeta de imágenes (solo funciona en algunos navegadores)
function openImageFolder() {
    showToast('Info', 'Navega manualmente a: c:\\Users\\mauri\\Desktop\\huertito\\img\\', 'info', 5000);
}

// ===============================================
// FUNCIONES PARA CONFIGURACIÓN DE ENVÍO
// ===============================================

/**
 * Cargar configuración de envío en el formulario
 */
function loadShippingConfig() {
    try {
        const config = shippingConfig.getConfig();
        
        document.getElementById('shippingBaseCost').value = config.baseCost;
        document.getElementById('freeShippingThreshold').value = config.freeShippingThreshold;
        document.getElementById('enableFreeShipping').checked = config.enableFreeShipping;
        
        console.log('Dashboard: Configuración de envío cargada');
    } catch (error) {
        console.error('Dashboard: Error cargando configuración de envío:', error);
    }
}

/**
 * Manejar envío del formulario de configuración de envío
 */
async function handleShippingConfigForm(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const baseCost = parseInt(document.getElementById('shippingBaseCost').value);
        const freeShippingThreshold = parseInt(document.getElementById('freeShippingThreshold').value);
        const enableFreeShipping = document.getElementById('enableFreeShipping').checked;
        
        // Validaciones
        if (baseCost < 0) {
            showToast('Error', 'El costo base de envío no puede ser negativo', 'error');
            return;
        }
        
        if (freeShippingThreshold < 0) {
            showToast('Error', 'El umbral de envío gratis no puede ser negativo', 'error');
            return;
        }
        
        if (enableFreeShipping && freeShippingThreshold <= baseCost) {
            showToast('Advertencia', 'El umbral de envío gratis debería ser mayor al costo base', 'warning');
        }
        
        // Guardar configuración
        const result = shippingConfig.saveConfig({
            baseCost,
            freeShippingThreshold,
            enableFreeShipping
        });
        
        if (result.success) {
            showToast('Éxito', result.message, 'success');
        } else {
            showToast('Error', result.message, 'error');
        }
        
    } catch (error) {
        console.error('Dashboard: Error guardando configuración de envío:', error);
        showToast('Error', 'Error al guardar la configuración', 'error');
    }
}

// Función para reponer stock
async function replenishStock(productId) {
    try {
        // Obtener información del producto
        const resultado = await productManager.obtenerTodosLosProductos();
        if (!resultado.success) {
            showToast('Error', 'No se pudo obtener información del producto', 'error');
            return;
        }
        
        const producto = resultado.productos.find(p => p.id === parseInt(productId));
        if (!producto) {
            showToast('Error', 'Producto no encontrado', 'error');
            return;
        }
        
        // Crear modal para solicitar cantidad
        // Corregir ruta de imagen para dashboard
        let imagenSrc = producto.imagen;
        if (imagenSrc.startsWith('../../../img/')) {
            imagenSrc = imagenSrc.replace('../../../img/', '../../img/');
        } else if (imagenSrc.startsWith('img/')) {
            imagenSrc = '../../' + imagenSrc;
        }
        
        const modalContent = `
            <div class="modal fade" id="replenishStockModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-plus me-2"></i>Reponer Stock
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <img src="${imagenSrc}" alt="${producto.nombre}" 
                                     style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px;"
                                     onerror="this.src='../../img/default.jpg';">
                                <h6 class="mt-2">${producto.nombre}</h6>
                                <p class="text-muted">Stock actual: <strong>${producto.stock} unidades</strong></p>
                            </div>
                            
                            <form id="replenishStockForm">
                                <div class="mb-3">
                                    <label for="stockAmount" class="form-label">Cantidad a agregar:</label>
                                    <input type="number" class="form-control" id="stockAmount" 
                                           min="1" max="1000" value="10" required>
                                    <div class="form-text">Ingresa la cantidad de unidades que deseas agregar al inventario</div>
                                </div>
                                
                                <div class="alert alert-info">
                                    <i class="fas fa-calculator me-2"></i>
                                    Nuevo stock será: <strong id="newStockPreview">${producto.stock + 10}</strong> unidades
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-success" onclick="confirmStockReplenishment(${productId})">
                                <i class="fas fa-plus me-1"></i>Reponer Stock
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior si existe
        const existingModal = document.getElementById('replenishStockModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar nuevo modal al body
        document.body.insertAdjacentHTML('beforeend', modalContent);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('replenishStockModal'));
        modal.show();
        
        // Actualizar preview cuando cambie la cantidad
        document.getElementById('stockAmount').addEventListener('input', function(e) {
            const newAmount = parseInt(e.target.value) || 0;
            const newStock = producto.stock + newAmount;
            document.getElementById('newStockPreview').textContent = newStock;
        });
        
    } catch (error) {
        console.error('Error abriendo modal de reponer stock:', error);
        showToast('Error', 'Error al abrir el modal de reponer stock', 'error');
    }
}

// Confirmar reposición de stock
async function confirmStockReplenishment(productId) {
    try {
        const stockAmount = parseInt(document.getElementById('stockAmount').value);
        
        if (!stockAmount || stockAmount <= 0) {
            showToast('Error', 'Ingresa una cantidad válida', 'error');
            return;
        }
        
        // Obtener producto actual
        const resultado = await productManager.obtenerTodosLosProductos();
        if (!resultado.success) {
            showToast('Error', 'No se pudo obtener información del producto', 'error');
            return;
        }
        
        const producto = resultado.productos.find(p => p.id === parseInt(productId));
        if (!producto) {
            showToast('Error', 'Producto no encontrado', 'error');
            return;
        }
        
        // Calcular nuevo stock
        const nuevoStock = producto.stock + stockAmount;
        
        // Actualizar producto
        const datosActualizados = {
            ...producto,
            stock: nuevoStock
        };
        
        const resultadoActualizacion = await productManager.actualizarProducto(productId, datosActualizados);
        
        if (resultadoActualizacion.success) {
            showToast('Éxito', `Stock actualizado: +${stockAmount} unidades (Total: ${nuevoStock})`, 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('replenishStockModal'));
            if (modal) modal.hide();
            
            // Recargar tabla de productos
            loadProductsTable();
        } else {
            showToast('Error', resultadoActualizacion.mensaje || 'Error al actualizar el stock', 'error');
        }
        
    } catch (error) {
        console.error('Error reponiendo stock:', error);
        showToast('Error', 'Error al reponer el stock', 'error');
    }
}

// Funciones de utilidad
window.resetearSistema = function() {
    console.log('Reseteando sistema...');
    localStorage.clear();
    location.reload();
};

window.verificarSistema = function() {
    console.log('Estado del sistema:');
    const productos = localStorage.getItem('productosJSON');
    console.log('Productos en localStorage:', productos ? 'SI' : 'NO');
    
    if (productos) {
        try {
            const data = JSON.parse(productos);
            console.log('Cantidad de productos:', data.productos?.length || 0);
        } catch (error) {
            console.log('Error parseando productos:', error);
        }
    }
};
