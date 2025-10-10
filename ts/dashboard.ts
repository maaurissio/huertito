// @ts-nocheck

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
        const productos = await productManager.obtenerTodosLosProductos();
        const listaProductos = Array.isArray(productos) ? productos : [];

        if (listaProductos.length === 0) {
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
        listaProductos.forEach(producto => {
            const estadoProducto = (producto.estado || producto.isActivo || '').toString().toLowerCase();
            const estaActivo = estadoProducto === 'activo';
            const statusClass = !estaActivo ? 'secondary' : (producto.stock === 0 ? 'danger' : 'success');
            const statusText = !estaActivo ? 'Inactivo' : (producto.stock === 0 ? 'Agotado' : 'Activo');
            
            const row = document.createElement('tr');
            
            // Corregir ruta de imagen para dashboard
            let imagenSrc = producto.imagen;
            if (imagenSrc.startsWith('../../../img/')) {
                // Convertir de ruta del catálogo a ruta del dashboard
                imagenSrc = imagenSrc.replace('../../../img/', '../../img/');
            } else if (imagenSrc.startsWith('img/')) {
                // Si es ruta directa, agregar ../../
                imagenSrc = '../../' + imagenSrc;
            }
            
            row.innerHTML = `
                <td><strong>PR${String(producto.id).padStart(3, '0')}</strong></td>
                <td>
                    <img src="${imagenSrc}" 
                         alt="${producto.nombre}" 
                         style="width: 45px; height: 45px; object-fit: cover; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                         onerror="this.src='../../img/default.jpg';">
                </td>
                <td><strong>${producto.nombre}</strong></td>
                <td style="color: var(--success-color); font-weight: 600;">$${Number(producto.precio).toLocaleString('es-CL')} CLP</td>
                <td>
                    <span class="badge ${producto.stock <= 5 ? 'bg-warning' : 'bg-light text-dark border'}">${producto.stock} unidades</span>
                </td>
                <td>
                    <span class="badge bg-info">${producto.categoria}</span>
                </td>
                <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info" onclick="viewProduct(${producto.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="editProduct(${producto.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="replenishStock(${producto.id})" title="Reponer Stock">
                            <i class="fas fa-plus"></i>
                        </button>
                        ${
                            estaActivo
                                ? `<button class="btn btn-outline-warning" onclick="deactivateProduct(${producto.id})" title="Desactivar">\n                                    <i class="fas fa-ban"></i>\n                                </button>`
                                : `<button class="btn btn-outline-success" onclick="activateProduct(${producto.id})" title="Activar">\n                                    <i class="fas fa-check"></i>\n                                </button>`
                        }
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error cargando productos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    Error cargando productos
                    <br>
                    <button class="btn btn-primary btn-sm mt-2" onclick="location.reload()">
                        <i class="fas fa-sync-alt me-1"></i>Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Función para cargar usuarios dinámicamente
async function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <i class="fas fa-spinner fa-spin fa-2x mb-2"></i>
                <br>Cargando usuarios...
            </td>
        </tr>
    `;

    try {
        // Obtener usuarios desde userManager
        const usuarios = await userManager.obtenerTodosLosUsuarios();
        const listaUsuarios = Array.isArray(usuarios) ? usuarios : [];

        if (listaUsuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        <i class="fas fa-users fa-3x mb-3 d-block"></i>
                        No hay usuarios registrados
                        <br>
                        <button class="btn btn-success btn-sm mt-2" onclick="showAddUserModal()">
                            <i class="fas fa-plus me-1"></i>Agregar primer usuario
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        listaUsuarios.forEach(usuario => {
            const estadoUsuario = (usuario.estado || '').toString().toLowerCase();
            const estaActivo = estadoUsuario === 'activo';
            const statusClass = !estaActivo ? 'secondary' : 'success';
            const statusText = !estaActivo ? 'Inactivo' : 'Activo';
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><strong>${usuario.id}</strong></td>
                <td><strong>${usuario.nombre}</strong></td>
                <td>${usuario.email}</td>
                <td>${usuario.rol}</td>
                <td>
                    <span class="badge bg-${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info" onclick="viewUser(${usuario.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="editUser(${usuario.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${
                            estaActivo
                                ? `<button class="btn btn-outline-warning" onclick="deactivateUser(${usuario.id})" title="Desactivar">\n                                    <i class="fas fa-ban"></i>\n                                </button>`
                                : `<button class="btn btn-outline-success" onclick="activateUser(${usuario.id})" title="Activar">\n                                    <i class="fas fa-check"></i>\n                                </button>`
                        }
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    Error cargando usuarios
                    <br>
                    <button class="btn btn-primary btn-sm mt-2" onclick="location.reload()">
                        <i class="fas fa-sync-alt me-1"></i>Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Función para cargar pedidos dinámicamente
async function loadOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <i class="fas fa-spinner fa-spin fa-2x mb-2"></i>
                <br>Cargando pedidos...
            </td>
        </tr>
    `;

    try {
        // Obtener pedidos desde orderManager
        const pedidos = await orderManager.obtenerTodosLosPedidos();
        const listaPedidos = Array.isArray(pedidos) ? pedidos : [];

        if (listaPedidos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-muted">
                        <i class="fas fa-shopping-cart fa-3x mb-3 d-block"></i>
                        No hay pedidos registrados
                        <br>
                        <button class="btn btn-success btn-sm mt-2" onclick="showAddOrderModal()">
                            <i class="fas fa-plus me-1"></i>Agregar primer pedido
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        listaPedidos.forEach(pedido => {
            const estadoPedido = (pedido.estado || '').toString().toLowerCase();
            const estaActivo = estadoPedido === 'activo';
            const statusClass = !estaActivo ? 'secondary' : (pedido.pagado ? 'success' : 'warning');
            const statusText = !estaActivo ? 'Inactivo' : (pedido.pagado ? 'Pagado' : 'Pendiente');
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><strong>OD${String(pedido.id).padStart(5, '0')}</strong></td>
                <td><strong>${pedido.cliente}</strong></td>
                <td>${pedido.fecha}</td>
                <td style="color: var(--success-color); font-weight: 600;">$${Number(pedido.total).toLocaleString('es-CL')} CLP</td>
                <td>
                    <span class="badge bg-${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info" onclick="viewOrder(${pedido.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="editOrder(${pedido.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${
                            estaActivo
                                ? `<button class="btn btn-outline-warning" onclick="deactivateOrder(${pedido.id})" title="Desactivar">\n                                    <i class="fas fa-ban"></i>\n                                </button>`
                                : `<button class="btn btn-outline-success" onclick="activateOrder(${pedido.id})" title="Activar">\n                                    <i class="fas fa-check"></i>\n                                </button>`
                        }
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    Error cargando pedidos
                    <br>
                    <button class="btn btn-primary btn-sm mt-2" onclick="location.reload()">
                        <i class="fas fa-sync-alt me-1"></i>Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Función para inicializar gráficos de analytics
function initializeAnalyticsCharts() {
    // Gráfico de ventas por categoría
    const ctxCategorySales = document.getElementById('categorySalesChart').getContext('2d');
    new Chart(ctxCategorySales, {
        type: 'bar',
        data: {
            labels: mockData.categorySales.map(cs => cs.categoria),
            datasets: [{
                label: 'Ventas por Categoría',
                data: mockData.categorySales.map(cs => cs.total),
                backgroundColor: 'rgba(66, 153, 225, 0.6)',
                borderColor: '#4299e1',
                borderWidth: 2
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
            }
        }
    });
    
    // Gráfico de órdenes por estado
    const ctxOrderStatus = document.getElementById('orderStatusChart').getContext('2d');
    new Chart(ctxOrderStatus, {
        type: 'pie',
        data: {
            labels: mockData.orderStatus.map(os => os.estado),
            datasets: [{
                label: 'Órdenes por Estado',
                data: mockData.orderStatus.map(os => os.cantidad),
                backgroundColor: [
                    '#68c3a3',
                    '#f6b93b',
                    '#e57373',
                    '#64b5f6'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        padding: 15
                    }
                }
            }
        }
    });
    
    // Gráfico de usuarios registrados por mes
    const ctxUserGrowth = document.getElementById('userGrowthChart').getContext('2d');
    new Chart(ctxUserGrowth, {
        type: 'line',
        data: {
            labels: mockData.userGrowth.map(ug => ug.mes),
            datasets: [{
                label: 'Crecimiento de Usuarios',
                data: mockData.userGrowth.map(ug => ug.total),
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
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
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Funciones de actualización de estadísticas
async function updateDashboardStats() {
    try {
        // Obtener estadísticas actualizadas
        const stats = await fetch('/api/dashboard/stats').then(res => res.json());
        
        // Actualizar contadores
        document.getElementById('totalSales').textContent = '$' + stats.totalSales.toLocaleString();
        document.getElementById('totalOrders').textContent = stats.totalOrders.toString();
        document.getElementById('totalProducts').textContent = stats.totalProducts.toString();
        document.getElementById('totalUsers').textContent = stats.totalUsers.toString();
        
        // Actualizar gráfico de ventas
        if (salesChart) {
            salesChart.data.datasets[0].data = stats.ventasMensuales;
            salesChart.update();
        }
    } catch (error) {
        console.error('Error actualizando estadísticas del dashboard:', error);
    }
}

// Funciones de vista detallada
function viewProduct(productId) {
    // Redirigir a la página de detalles del producto
    window.location.href = `producto_detalle.html?id=${productId}`;
}

function viewUser(userId) {
    // Redirigir a la página de detalles del usuario
    window.location.href = `usuario_detalle.html?id=${userId}`;
}

function viewOrder(orderId) {
    // Redirigir a la página de detalles del pedido
    window.location.href = `pedido_detalle.html?id=${orderId}`;
}

// Funciones de edición
function editProduct(productId) {
    // Lógica para editar producto
    console.log('Editar producto:', productId);
    // Aquí puedes abrir un modal o redirigir a otra página para editar el producto
}

function editUser(userId) {
    // Lógica para editar usuario
    console.log('Editar usuario:', userId);
    // Aquí puedes abrir un modal o redirigir a otra página para editar el usuario
}

function editOrder(orderId) {
    // Lógica para editar pedido
    console.log('Editar pedido:', orderId);
    // Aquí puedes abrir un modal o redirigir a otra página para editar el pedido
}

// Funciones de activación/desactivación
function activateProduct(productId) {
    // Lógica para activar producto
    console.log('Activar producto:', productId);
    // Aquí puedes llamar a la API para activar el producto y luego actualizar la tabla
}

function deactivateProduct(productId) {
    // Lógica para desactivar producto
    console.log('Desactivar producto:', productId);
    // Aquí puedes llamar a la API para desactivar el producto y luego actualizar la tabla
}

function activateUser(userId) {
    // Lógica para activar usuario
    console.log('Activar usuario:', userId);
    // Aquí puedes llamar a la API para activar el usuario y luego actualizar la tabla
}

function deactivateUser(userId) {
    // Lógica para desactivar usuario
    console.log('Desactivar usuario:', userId);
    // Aquí puedes llamar a la API para desactivar el usuario y luego actualizar la tabla
}

function activateOrder(orderId) {
    // Lógica para activar pedido
    console.log('Activar pedido:', orderId);
    // Aquí puedes llamar a la API para activar el pedido y luego actualizar la tabla
}

function deactivateOrder(orderId) {
    // Lógica para desactivar pedido
    console.log('Desactivar pedido:', orderId);
    // Aquí puedes llamar a la API para desactivar el pedido y luego actualizar la tabla
}

// Funciones de modal
function showAddProductModal() {
    // Lógica para mostrar modal de agregar producto
    console.log('Mostrar modal para agregar producto');
}

function showAddUserModal() {
    // Lógica para mostrar modal de agregar usuario
    console.log('Mostrar modal para agregar usuario');
}

function showAddOrderModal() {
    // Lógica para mostrar modal de agregar pedido
    console.log('Mostrar modal para agregar pedido');
}

// Exponer API necesaria para los manejadores declarados en el HTML
const dashboardAPI = {
    toggleSidebar,
    showSection,
    loadProductsTable,
    loadUsersTable,
    loadOrdersTable,
    initializeAnalyticsCharts,
    updateDashboardStats,
    viewProduct,
    viewUser,
    viewOrder,
    editProduct,
    editUser,
    editOrder,
    activateProduct,
    deactivateProduct,
    activateUser,
    deactivateUser,
    activateOrder,
    deactivateOrder,
    showAddProductModal,
    showAddUserModal,
    showAddOrderModal
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).dashboardAPI = dashboardAPI;
Object.assign(window, dashboardAPI);

// Ejemplo de mockData para pruebas
const mockData = {
    stats: {
        products: 150,
        orders: 75,
        users: 30,
        sales: 5000
    },
    salesData: {
        2025: [120, 150, 180, 200, 170, 220, 250, 300, 280, 320, 350, 400]
    },
    recentActivity: [
        { icon: 'box', title: 'Nuevo producto agregado', time: 'Hace 2 horas', color: 'success' },
        { icon: 'user-plus', title: 'Nuevo usuario registrado', time: 'Hace 1 día', color: 'info' },
        { icon: 'shopping-cart', title: 'Nuevo pedido recibido', time: 'Hace 3 días', color: 'warning' }
    ],
    categorySales: [
        { categoria: 'Electrónica', total: 1500 },
        { categoria: 'Ropa', total: 800 },
        { categoria: 'Hogar', total: 600 },
        { categoria: 'Juguetes', total: 400 }
    ],
    orderStatus: [
        { estado: 'Pendiente', cantidad: 20 },
        { estado: 'Pagado', cantidad: 50 },
        { estado: 'Enviado', cantidad: 10 },
        { estado: 'Cancelado', cantidad: 5 }
    ],
    userGrowth: [
        { mes: 'Ene', total: 5 },
        { mes: 'Feb', total: 10 },
        { mes: 'Mar', total: 15 },
        { mes: 'Abr', total: 20 },
        { mes: 'May', total: 25 },
        { mes: 'Jun', total: 30 },
        { mes: 'Jul', total: 35 },
        { mes: 'Ago', total: 40 },
        { mes: 'Sep', total: 45 },
        { mes: 'Oct', total: 50 },
        { mes: 'Nov', total: 55 },
        { mes: 'Dic', total: 60 }
    ]
};
