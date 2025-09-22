// Variables globales
let salesChart;
let topProductsChart;
let salesDistributionChart;

// Datos simulados
const mockData = {
    stats: {
        revenue: 0,
        orders: 0,
        users: 5, // Actualizado con el número real de usuarios
        products: 9 // Actualizado con el número real de productos
    },
    salesData: {
        2025: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        2024: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        2023: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadStats();
    initializeCharts();
    loadRecentActivity();
    updateNotificationCount();
});

// Funciones principales
function initializeDashboard() {
    console.log('🚀 Inicializando Dashboard Admin...');
    
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
    console.log('Cargando datos del dashboard...');
    
    // Mostrar bienvenida
    setTimeout(() => {
        showToast('Dashboard Listo', `¡Bienvenido ${usuario.nombre}! Todas las funciones están disponibles.`, 'success', 3000);
    }, 500);
    
    console.log('✅ Dashboard inicializado correctamente');
}

function loadStats() {
    // Animar contadores
    animateCounter('totalSales', 2847320, '$', true);
    animateCounter('totalOrders', 1247);
    animateCounter('totalUsers', mockData.stats.users);
    animateCounter('totalProducts', mockData.stats.products);
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
        case 'products':
            console.log('🛍️ Cargando productos...');
            loadProductsTable();
            break;
        case 'users':
            console.log('👥 Cargando usuarios...');
            loadUsersTable();
            break;
        case 'orders':
            console.log('📦 Cargando pedidos...');
            loadOrdersTable();
            break;
        case 'analytics':
            console.log('📊 Cargando analytics...');
            initializeAnalyticsCharts();
            break;
    }
    
    // Cargar datos específicos de la sección
    switch(sectionName) {
        case 'products':
            loadProductsTable();
            break;
        case 'users':
            loadUsersTable();
            break;
        case 'orders':
            loadOrdersTable();
            break;
        case 'analytics':
            loadAnalyticsCharts();
            break;
    }
}

function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (mockData.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    <i class="fas fa-box fa-3x mb-3 d-block"></i>
                    No hay productos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    mockData.products.forEach(product => {
        const statusClass = product.status === 'Activo' ? 'success' : 
                          product.status === 'Agotado' ? 'danger' : 'warning';
        
        // Mapear imagen exacta del catálogo basada en el nombre del producto
        let imagePath = '../../img/';
        if (product.name.includes('Manzana')) imagePath += 'manzana.webp';
        else if (product.name.includes('Naranja')) imagePath += 'naranja.webp';
        else if (product.name.includes('Plátano')) imagePath += 'platanos.webp';
        else if (product.name.includes('Zanahoria')) imagePath += 'zanahorias.webp';
        else if (product.name.includes('Espinaca')) imagePath += 'espinaca.webp';
        else if (product.name.includes('Pimiento')) imagePath += 'pimientos.webp';
        else imagePath += 'manzana.webp'; // imagen por defecto
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${product.id}</strong></td>
            <td>
                <img src="${imagePath}" 
                     alt="${product.name}" 
                     style="width: 45px; height: 45px; object-fit: cover; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            </td>
            <td><strong>${product.name}</strong></td>
            <td style="color: var(--success-color); font-weight: 600;">$${product.price.toLocaleString('es-CL')} CLP</td>
            <td>
                <span class="badge bg-light text-dark border">${product.stock} unidades</span>
            </td>
            <td>
                <span class="badge bg-info">${product.category}</span>
            </td>
            <td><span class="badge bg-${statusClass}">${product.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct('${product.id}')" title="Editar producto">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${product.id}')" title="Eliminar producto">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
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
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (mockData.orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fas fa-shopping-cart fa-3x mb-3 d-block"></i>
                    No hay pedidos registrados aún
                </td>
            </tr>
        `;
        return;
    }
    
    mockData.orders.forEach(order => {
        const statusClass = order.status === 'Completado' ? 'success' : 
                          order.status === 'Pendiente' ? 'warning' : 'danger';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.date}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="badge bg-${statusClass}">${order.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-info me-1" onclick="viewOrder(${order.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="editOrder(${order.id})">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
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

function deleteProduct(id) {
    showToast('Confirmar Eliminación', `¿Eliminar producto ${id}?`, 'warning');
    setTimeout(() => {
        showToast('Producto Eliminado', `Producto ${id} eliminado correctamente`, 'success');
        loadProductsTable();
    }, 2000);
}

function addUser() {
    showToast('Agregar Usuario', 'Función en desarrollo. Próximamente disponible.', 'info');
}

function editUser(id) {
    showToast('Editar Usuario', `Editando usuario con ID: ${id}`, 'info');
}

function deleteUser(id) {
    showToast('Confirmar Eliminación', `¿Eliminar usuario ${id}?`, 'warning');
    setTimeout(() => {
        showToast('Usuario Eliminado', `Usuario ${id} eliminado correctamente`, 'success');
        loadUsersTable();
    }, 2000);
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