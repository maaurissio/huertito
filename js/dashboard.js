// @ts-nocheck
import { Estado } from './models.js';
let cachedOrders = [];
let stockModalInstance = null;
let stockFormInitialized = false;
let currentStockProductId = null;
let editUserModalInstance = null;
let currentEditingUserId = null;
let orderStatusModalInstance = null;
let orderStatusFormInitialized = false;
let currentOrderStatusOrderId = null;
document.addEventListener('DOMContentLoaded', async function () {
    await setupAutomatico();
    initializeDashboard();
    initializeFormHandlers();
    loadStats();
    initializeCharts();
    loadRecentActivity();
    updateNotificationCount();
});
function showDashboardToast(message, variant = 'info') {
    const container = document.getElementById('toastContainer') ?? (() => {
        const newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.className = 'toast-container';
        document.body.appendChild(newContainer);
        return newContainer;
    })();
    const toast = document.createElement('div');
    toast.className = `toast-notification ${variant}`;
    toast.innerHTML = `
        <i class="fas ${variant === 'success' ? 'fa-check-circle' : variant === 'error' ? 'fa-times-circle' : variant === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} toast-icon"></i>
        ${message}
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    window.setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        window.setTimeout(() => toast.remove(), 400);
    }, 3500);
}
function initializeFormHandlers() {
    setupProductFormHandlers();
    setupStockModalHandlers();
    setupUserFormHandlers();
    setupOrderFilters();
    setupOrderStatusFormHandlers();
}
function setupProductFormHandlers() {
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm && !editProductForm.dataset.dashboardReady) {
        editProductForm.addEventListener('submit', handleEditProductForm);
        editProductForm.dataset.dashboardReady = 'true';
    }
}
function setupStockModalHandlers() {
    const stockForm = document.getElementById('productStockForm');
    if (stockForm && !stockFormInitialized) {
        stockForm.addEventListener('submit', handleStockUpdateSubmit);
        stockFormInitialized = true;
    }
}
function setupUserFormHandlers() {
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm && !editUserForm.dataset.dashboardReady) {
        editUserForm.addEventListener('submit', handleEditUserForm);
        editUserForm.dataset.dashboardReady = 'true';
    }
}
function setupOrderFilters() {
    const statusFilter = document.getElementById('orderStatusFilter');
    if (statusFilter && !statusFilter.dataset.dashboardReady) {
        statusFilter.addEventListener('change', filterOrders);
        statusFilter.dataset.dashboardReady = 'true';
    }
}
function setupOrderStatusFormHandlers() {
    const form = document.getElementById('orderStatusForm');
    if (form && !orderStatusFormInitialized) {
        form.addEventListener('submit', handleOrderStatusSubmit);
        orderStatusFormInitialized = true;
    }
}
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
                        }
                        else {
                            producto.imagen = 'img/default.jpg';
                        }
                    }
                }
            });
            localStorage.setItem('productosJSON', JSON.stringify(datos));
            console.log('Productos cargados desde ProductManager:', datos.productos.length);
        }
        catch (error) {
            console.warn('Error obteniendo datos desde ProductManager:', error);
        }
    }
    else {
        console.log('Productos ya existen en localStorage');
    }
}
// Funciones principales
function initializeDashboard() {
    console.log('🚀 Inicializando Dashboard Admin...');
    // Inicializar managers necesarios
    if (typeof OrderManager !== 'undefined') {
        window.orderManager = new OrderManager();
    }
    else {
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
                        callback: function (value) {
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
    }
    else {
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
    switch (sectionName) {
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
    if (!tbody)
        return;
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
            const estadoProducto = (producto.estado ?? producto.isActivo ?? Estado.activo).toString().toLowerCase();
            const estaActivo = estadoProducto === Estado.activo.toLowerCase();
            const statusClass = !estaActivo ? 'secondary' : (Number(producto.stock) === 0 ? 'danger' : 'success');
            const statusText = !estaActivo ? 'Inactivo' : (Number(producto.stock) === 0 ? 'Agotado' : 'Activo');
            const row = document.createElement('tr');
            let imagenSrc = producto.imagen ?? 'img/default.jpg';
            if (imagenSrc.startsWith('../../../img/')) {
                imagenSrc = imagenSrc.replace('../../../img/', '../../img/');
            }
            else if (imagenSrc.startsWith('img/')) {
                imagenSrc = `../../${imagenSrc}`;
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
                <td style="color: var(--success-color); font-weight: 600;">$${Number(producto.precio ?? 0).toLocaleString('es-CL')} CLP</td>
                <td>
                    <span class="badge ${Number(producto.stock) <= 5 ? 'bg-warning' : 'bg-light text-dark border'}">${producto.stock} unidades</span>
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
                        ${estaActivo
                ? `<button class="btn btn-outline-warning" onclick="deactivateProduct(${producto.id})" title="Desactivar">\n                                    <i class="fas fa-ban"></i>\n                                </button>`
                : `<button class="btn btn-outline-success" onclick="activateProduct(${producto.id})" title="Activar">\n                                    <i class="fas fa-check"></i>\n                                </button>`}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        updateProductCount(listaProductos.length);
    }
    catch (error) {
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
function updateProductCount(count) {
    const totalProducts = document.getElementById('totalProducts');
    if (totalProducts) {
        totalProducts.textContent = count.toString();
    }
}
function handleEditProductForm(event) {
    event.preventDefault();
    const idInput = document.getElementById('editProductId');
    if (!idInput) {
        showDashboardToast('No se encontró el formulario del producto', 'error');
        return;
    }
    const productId = Number.parseInt(idInput.value, 10);
    const manager = window.productManager;
    if (!manager?.obtenerProductoPorId) {
        showDashboardToast('Gestor de productos no disponible', 'error');
        return;
    }
    const producto = manager.obtenerProductoPorId(productId);
    if (!producto) {
        showDashboardToast('Producto no encontrado', 'error');
        return;
    }
    const nombre = document.getElementById('editProductName')?.value.trim() ?? producto.nombre;
    const descripcion = document.getElementById('editProductDescription')?.value.trim() ?? producto.descripcion;
    const categoria = document.getElementById('editProductCategory')?.value ?? producto.categoria;
    const peso = document.getElementById('editProductWeight')?.value || producto.peso;
    const estadoSeleccionado = document.getElementById('editProductStatus')?.value ?? producto.estado ?? Estado.activo;
    const precio = Number.parseFloat(document.getElementById('editProductPrice')?.value ?? String(producto.precio ?? 0));
    const stock = Number.parseInt(document.getElementById('editProductStock')?.value ?? String(producto.stock ?? 0), 10);
    if (!nombre) {
        showDashboardToast('El nombre del producto es obligatorio', 'warning');
        return;
    }
    if (Number.isNaN(precio) || precio <= 0) {
        showDashboardToast('Ingresa un precio válido', 'warning');
        return;
    }
    if (Number.isNaN(stock) || stock < 0) {
        showDashboardToast('El stock debe ser mayor o igual a 0', 'warning');
        return;
    }
    const payload = buildProductUpdatePayload(producto, {
        nombre,
        descripcion,
        precio,
        stock,
        categoria,
        peso,
        estado: estadoSeleccionado
    });
    const resultado = manager.actualizarProducto(producto.id, payload);
    if (resultado?.success) {
        showDashboardToast(resultado.mensaje ?? 'Producto actualizado', 'success');
        const modalElement = document.getElementById('editProductModal');
        const modalInstance = modalElement ? bootstrap.Modal.getInstance(modalElement) : null;
        modalInstance?.hide();
        loadProductsTable();
    }
    else {
        showDashboardToast(resultado?.mensaje ?? 'No se pudo actualizar el producto', 'error');
    }
}
function handleStockUpdateSubmit(event) {
    event.preventDefault();
    const manager = window.productManager;
    if (!manager?.obtenerProductoPorId) {
        showDashboardToast('Gestor de productos no disponible', 'error');
        return;
    }
    const quantityInput = document.getElementById('stockQuantity');
    const productIdInput = document.getElementById('stockProductId');
    if (!quantityInput || !productIdInput) {
        showDashboardToast('Formulario de stock incompleto', 'error');
        return;
    }
    const unidades = Number.parseInt(quantityInput.value, 10);
    if (Number.isNaN(unidades) || unidades <= 0) {
        showDashboardToast('Ingresa una cantidad válida', 'warning');
        return;
    }
    const productId = Number.parseInt(productIdInput.value, 10);
    const producto = manager.obtenerProductoPorId(productId);
    if (!producto) {
        showDashboardToast('Producto no encontrado', 'error');
        return;
    }
    const nuevoStock = Number(producto.stock ?? 0) + unidades;
    const payload = buildProductUpdatePayload(producto, {
        stock: nuevoStock,
        estado: Estado.activo
    });
    const resultado = manager.actualizarProducto(producto.id, payload);
    if (resultado?.success) {
        showDashboardToast(`Stock actualizado a ${nuevoStock} unidades`, 'success');
        const modalElement = document.getElementById('stockModal');
        const modalInstance = modalElement ? bootstrap.Modal.getInstance(modalElement) : null;
        modalInstance?.hide();
        currentStockProductId = null;
        loadProductsTable();
    }
    else {
        showDashboardToast(resultado?.mensaje ?? 'No se pudo actualizar el stock', 'error');
    }
}
function normalizeEstado(value, defaultEstado = Estado.activo) {
    if (typeof value !== 'string') {
        return defaultEstado;
    }
    const lower = value.toLowerCase();
    if (lower === 'activo' || lower === Estado.activo.toLowerCase()) {
        return Estado.activo;
    }
    if (lower === 'inactivo' || lower === Estado.inactivo.toLowerCase()) {
        return Estado.inactivo;
    }
    return value;
}
function buildProductUpdatePayload(producto, overrides = {}) {
    const estado = normalizeEstado(overrides.estado ?? producto.estado ?? producto.isActivo ?? Estado.activo);
    return {
        nombre: overrides.nombre ?? producto.nombre ?? 'Producto',
        descripcion: overrides.descripcion ?? producto.descripcion ?? '',
        precio: Number(overrides.precio ?? producto.precio ?? 0),
        stock: Number(overrides.stock ?? producto.stock ?? 0),
        categoria: overrides.categoria ?? producto.categoria ?? 'General',
        imagen: overrides.imagen ?? producto.imagen ?? 'img/default.jpg',
        peso: overrides.peso ?? producto.peso ?? '',
        estado,
        isActivo: estado
    };
}
function handleEditUserForm(event) {
    event.preventDefault();
    const manager = window.userManager;
    if (!manager?.actualizarUsuario) {
        showDashboardToast('Gestor de usuarios no disponible', 'error');
        return;
    }
    const idInput = document.getElementById('editUserId');
    if (!idInput) {
        showDashboardToast('Formulario de usuario incompleto', 'error');
        return;
    }
    const userId = Number.parseInt(idInput.value, 10);
    if (Number.isNaN(userId)) {
        showDashboardToast('Identificador de usuario inválido', 'error');
        return;
    }
    const nombre = document.getElementById('editUserNombre')?.value.trim();
    const apellido = document.getElementById('editUserApellido')?.value.trim();
    const email = document.getElementById('editUserEmail')?.value.trim();
    const usuario = document.getElementById('editUserUsuario')?.value.trim();
    const telefono = document.getElementById('editUserTelefono')?.value.trim();
    const rol = document.getElementById('editUserRol')?.value ?? 'cliente';
    const estadoSeleccionado = document.getElementById('editUserEstado')?.value ?? Estado.activo;
    if (!nombre || !email || !usuario) {
        showDashboardToast('Nombre, email y usuario son obligatorios', 'warning');
        return;
    }
    const estado = normalizeEstado(estadoSeleccionado, Estado.activo);
    const resultado = manager.actualizarUsuario(userId, {
        nombre,
        apellido,
        email,
        usuario,
        telefono,
        rol,
        estado,
        isActivo: estado
    });
    if (resultado?.success) {
        showDashboardToast('Usuario actualizado correctamente', 'success');
        editUserModalInstance?.hide();
        currentEditingUserId = null;
        loadUsersTable();
    }
    else {
        showDashboardToast(resultado?.mensaje ?? 'No se pudo actualizar el usuario', 'error');
    }
}
function handleOrderStatusSubmit(event) {
    event.preventDefault();
    const manager = window.orderManager;
    if (!manager?.updateOrderStatus) {
        showDashboardToast('Gestor de pedidos no disponible', 'error');
        return;
    }
    const idInput = document.getElementById('orderStatusOrderId');
    const select = document.getElementById('orderStatusSelect');
    if (!idInput || !select) {
        showDashboardToast('Formulario de estado de pedido incompleto', 'error');
        return;
    }
    const orderId = idInput.value || currentOrderStatusOrderId;
    if (!orderId) {
        showDashboardToast('No se encontró el pedido a actualizar', 'error');
        return;
    }
    const estadoSeleccionado = select.value?.toLowerCase() ?? '';
    const estadosValidos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
    if (!estadoSeleccionado || !estadosValidos.includes(estadoSeleccionado)) {
        showDashboardToast('Selecciona un estado válido', 'warning');
        return;
    }
    const resultado = manager.updateOrderStatus(orderId, estadoSeleccionado);
    if (resultado?.success) {
        showDashboardToast('Estado del pedido actualizado', 'success');
        currentOrderStatusOrderId = null;
        const modalElement = document.getElementById('orderStatusModal');
        const modalInstance = modalElement ? bootstrap.Modal.getInstance(modalElement) ?? bootstrap.Modal.getOrCreateInstance(modalElement) : orderStatusModalInstance;
        modalInstance?.hide();
        orderStatusModalInstance = modalInstance;
        loadOrdersTable();
    }
    else {
        showDashboardToast('No se pudo actualizar el estado del pedido', 'error');
    }
}
function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody)
        return;
    const manager = window.orderManager;
    tbody.innerHTML = '';
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fas fa-clipboard-list fa-2x mb-2 d-block"></i>
                    No se encontraron pedidos para el filtro seleccionado
                </td>
            </tr>
        `;
        return;
    }
    orders.forEach(order => {
        const status = typeof order.status === 'string' ? order.status.toLowerCase() : 'pendiente';
        const statusClass = getStatusClass(status);
        const statusText = getStatusText(status);
        const customer = order.customer ?? {};
        const orderId = typeof order.id === 'string' ? order.id : String(order.id ?? '');
        const totals = order.totals ?? {};
        const totalPrice = totals.total ?? 0;
        const items = Array.isArray(order.items) ? order.items : [];
        const dateDisplay = manager?.formatDate ? manager.formatDate(order.date ?? new Date().toISOString()) : new Date(order.date ?? Date.now()).toLocaleDateString('es-CL');
        const priceDisplay = manager?.formatPrice ? manager.formatPrice(totalPrice) : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(totalPrice);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><code class="text-primary">${orderId}</code></td>
            <td>
                <strong>${customer.name ?? 'Cliente'}</strong>
                <br><small class="text-muted">${customer.email ?? ''}</small>
            </td>
            <td><small>${dateDisplay}</small></td>
            <td>
                <strong class="text-success">${priceDisplay}</strong>
                <br><small class="text-muted">${items.length} item(s)</small>
            </td>
            <td><span class="badge bg-${statusClass} text-uppercase">${statusText}</span></td>
            <td>${order.paymentMethod ?? 'Transferencia'}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-info" onclick="viewOrder('${orderId}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-primary" onclick="editOrderStatus('${orderId}')" title="Cambiar estado">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}
function updateOrderCount(count) {
    const element = document.getElementById('totalOrders');
    if (element) {
        element.textContent = count.toString();
    }
}
// Función para cargar usuarios dinámicamente
async function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody)
        return;
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
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
                    <td colspan="7" class="text-center py-4 text-muted">
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
            const estadoUsuario = (usuario.estado ?? usuario.isActivo ?? Estado.activo).toString().toLowerCase();
            const estaActivo = estadoUsuario === Estado.activo.toLowerCase();
            const statusClass = estaActivo ? 'success' : 'secondary';
            const statusText = estaActivo ? 'Activo' : 'Inactivo';
            const telefono = usuario.telefono ?? 'No registrado';
            const fechaRegistro = usuario.fechaRegistro
                ? new Date(usuario.fechaRegistro).toLocaleDateString('es-CL')
                : 'Sin registro';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${usuario.id}</strong></td>
                <td><strong>${usuario.nombre} ${usuario.apellido ?? ''}</strong></td>
                <td>${usuario.email}</td>
                <td>${telefono}</td>
                <td>${fechaRegistro}</td>
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
                        ${estaActivo
                ? `<button class="btn btn-outline-warning" onclick="deactivateUser(${usuario.id})" title="Desactivar">\n                                    <i class="fas fa-ban"></i>\n                                </button>`
                : `<button class="btn btn-outline-success" onclick="activateUser(${usuario.id})" title="Activar">\n                                    <i class="fas fa-check"></i>\n                                </button>`}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    catch (error) {
        console.error('Error cargando usuarios:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
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
    if (!tbody)
        return;
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <i class="fas fa-spinner fa-spin fa-2x mb-2"></i>
                <br>Cargando pedidos...
            </td>
        </tr>
    `;
    try {
        const manager = window.orderManager ?? (typeof OrderManager !== 'undefined' ? new OrderManager() : null);
        if (!manager) {
            throw new Error('Gestor de pedidos no disponible');
        }
        if (!window.orderManager) {
            window.orderManager = manager;
        }
        const pedidos = manager.getAllOrders ? manager.getAllOrders() : [];
        cachedOrders = Array.isArray(pedidos) ? pedidos : [];
        if (cachedOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
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
        renderOrdersTable(cachedOrders);
        updateOrderCount(cachedOrders.length);
    }
    catch (error) {
        console.error('Error cargando pedidos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
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
                        callback: function (value) {
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
                        callback: function (value) {
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
    }
    catch (error) {
        console.error('Error actualizando estadísticas del dashboard:', error);
    }
}
// Funciones de vista detallada
function viewProduct(productId) {
    const producto = productManager.obtenerProductoPorId(productId);
    if (!producto) {
        showDashboardToast('Producto no encontrado', 'error');
        return;
    }
    const modalId = 'productDetailsModal';
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }
    const imagen = producto.imagen?.startsWith('http') ? producto.imagen : `../../${producto.imagen ?? 'img/default.jpg'}`;
    const html = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title"><i class="fas fa-box-open me-2"></i>${producto.nombre}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-4">
                            <div class="col-md-4 text-center">
                                <img src="${imagen}" alt="${producto.nombre}" class="img-fluid rounded shadow-sm" onerror="this.src='../../img/default.jpg';">
                                <div class="mt-3">
                                    <span class="badge bg-info">${producto.categoria}</span>
                                </div>
                            </div>
                            <div class="col-md-8">
                                <p><strong>Precio:</strong> $${Number(producto.precio ?? 0).toLocaleString('es-CL')}</p>
                                <p><strong>Stock:</strong> ${producto.stock} unidades</p>
                                <p><strong>Estado:</strong> ${(producto.estado ?? Estado.activo)}</p>
                                <p><strong>Peso:</strong> ${producto.peso ?? 'N/D'}</p>
                                <p><strong>Descripción:</strong><br>${producto.descripcion ?? 'Sin descripción'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="editProduct(${producto.id})">
                            <i class="fas fa-edit me-1"></i>Editar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}
function viewUser(userId) {
    const usuario = userManager.obtenerTodosLosUsuarios().find((u) => u.id === userId);
    if (!usuario) {
        showDashboardToast('Usuario no encontrado', 'error');
        return;
    }
    const modalId = 'userDetailsModal';
    document.getElementById(modalId)?.remove();
    const html = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-user me-2"></i>${usuario.nombre} ${usuario.apellido ?? ''}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Email:</strong> ${usuario.email}</p>
                        <p><strong>Teléfono:</strong> ${usuario.telefono ?? 'No registrado'}</p>
                        <p><strong>Rol:</strong> ${usuario.rol}</p>
                        <p><strong>Estado:</strong> ${usuario.estado ?? usuario.isActivo ?? Estado.activo}</p>
                        <p><strong>Fecha de registro:</strong> ${usuario.fechaRegistro ? new Date(usuario.fechaRegistro).toLocaleDateString('es-CL') : 'Sin registro'}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="editUser(${usuario.id})">
                            <i class="fas fa-edit me-1"></i>Editar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}
function viewOrder(orderId) {
    const manager = window.orderManager;
    const order = cachedOrders.find((o) => String(o.id) === String(orderId));
    if (!order) {
        showDashboardToast('Pedido no encontrado', 'error');
        return;
    }
    const modalId = 'orderDetailsModal';
    document.getElementById(modalId)?.remove();
    const items = Array.isArray(order.items) ? order.items : [];
    const htmlItems = items.map(item => `
        <tr>
            <td>${item.name ?? item.nombre}</td>
            <td>${item.quantity}</td>
            <td>${manager?.formatPrice ? manager.formatPrice(item.total ?? 0) : item.total}</td>
        </tr>
    `).join('');
    const html = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title"><i class="fas fa-receipt me-2"></i>Pedido ${orderId}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6 class="text-muted">Cliente</h6>
                                <p class="mb-1"><strong>${order.customer?.name ?? 'Cliente'}</strong></p>
                                <p class="mb-1">${order.customer?.email ?? ''}</p>
                                <p class="mb-0">${order.customer?.phone ?? ''}</p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-muted">Detalles</h6>
                                <p class="mb-1">Estado: <span class="badge bg-${getStatusClass(order.status)}">${getStatusText(order.status)}</span></p>
                                <p class="mb-1">Fecha: ${manager?.formatDate ? manager.formatDate(order.date) : new Date(order.date).toLocaleString()}</p>
                                <p class="mb-0">Total: ${manager?.formatPrice ? manager.formatPrice(order.totals?.total ?? 0) : order.totals?.total}</p>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>${htmlItems}</tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="editOrderStatus('${orderId}')">
                            <i class="fas fa-edit me-1"></i>Cambiar estado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}
// Funciones de edición
function editProduct(productId) {
    const producto = productManager.obtenerProductoPorId(productId);
    if (!producto) {
        showDashboardToast('Producto no encontrado', 'error');
        return;
    }
    const modalElement = document.getElementById('editProductModal');
    if (!modalElement) {
        showDashboardToast('Modal de edición no disponible', 'error');
        return;
    }
    document.getElementById('editProductId').value = String(producto.id);
    document.getElementById('editProductName').value = producto.nombre ?? '';
    document.getElementById('editProductPrice').value = String(producto.precio ?? 0);
    document.getElementById('editProductStock').value = String(producto.stock ?? 0);
    document.getElementById('editProductCategory').value = producto.categoria ?? '';
    document.getElementById('editProductDescription').value = producto.descripcion ?? '';
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}
function editUser(userId) {
    setupUserFormHandlers();
    const manager = window.userManager;
    if (!manager?.obtenerTodosLosUsuarios) {
        showDashboardToast('Gestor de usuarios no disponible', 'error');
        return;
    }
    const usuarios = manager.obtenerTodosLosUsuarios();
    const usuario = usuarios.find((u) => u.id === userId);
    if (!usuario) {
        showDashboardToast('Usuario no encontrado', 'error');
        return;
    }
    const modalElement = document.getElementById('editUserModal');
    if (!modalElement) {
        showDashboardToast('Modal de edición de usuario no disponible', 'error');
        return;
    }
    currentEditingUserId = usuario.id;
    document.getElementById('editUserId').value = String(usuario.id ?? '');
    document.getElementById('editUserNombre').value = usuario.nombre ?? '';
    document.getElementById('editUserApellido').value = usuario.apellido ?? '';
    document.getElementById('editUserEmail').value = usuario.email ?? '';
    document.getElementById('editUserUsuario').value = usuario.usuario ?? '';
    document.getElementById('editUserTelefono').value = usuario.telefono ?? '';
    document.getElementById('editUserRol').value = usuario.rol ?? 'cliente';
    document.getElementById('editUserEstado').value = (usuario.estado ?? usuario.isActivo ?? Estado.activo).toString().toLowerCase();
    editUserModalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    editUserModalInstance.show();
}
function editOrder(orderId) {
    // Lógica para editar pedido
    console.log('Editar pedido:', orderId);
    // Aquí puedes abrir un modal o redirigir a otra página para editar el pedido
}
// Funciones de activación/desactivación
function activateProduct(productId) {
    const manager = window.productManager;
    if (!manager?.activarProducto) {
        showDashboardToast('Gestor de productos no disponible', 'error');
        return;
    }
    const resultado = manager.activarProducto(productId);
    if (resultado?.success) {
        showDashboardToast(resultado.mensaje ?? 'Producto activado correctamente', 'success');
        loadProductsTable();
    }
    else {
        showDashboardToast(resultado?.mensaje ?? 'No se pudo activar el producto', 'error');
    }
}
function deactivateProduct(productId) {
    const manager = window.productManager;
    if (!manager?.desactivarProducto) {
        showDashboardToast('Gestor de productos no disponible', 'error');
        return;
    }
    const resultado = manager.desactivarProducto(productId);
    if (resultado?.success) {
        showDashboardToast(resultado.mensaje ?? 'Producto desactivado', 'info');
        loadProductsTable();
    }
    else {
        showDashboardToast(resultado?.mensaje ?? 'No se pudo desactivar el producto', 'error');
    }
}
function activateUser(userId) {
    const manager = window.userManager;
    if (!manager?.actualizarUsuario) {
        showDashboardToast('Gestor de usuarios no disponible', 'error');
        return;
    }
    const estado = normalizeEstado(Estado.activo);
    const resultado = manager.actualizarUsuario(userId, { estado, isActivo: estado });
    if (resultado?.success) {
        showDashboardToast('Usuario activado', 'success');
        loadUsersTable();
    }
    else {
        showDashboardToast(resultado?.mensaje ?? 'No se pudo activar el usuario', 'error');
    }
}
function deactivateUser(userId) {
    const manager = window.userManager;
    if (!manager?.actualizarUsuario) {
        showDashboardToast('Gestor de usuarios no disponible', 'error');
        return;
    }
    const estado = normalizeEstado(Estado.inactivo);
    const resultado = manager.actualizarUsuario(userId, { estado, isActivo: estado });
    if (resultado?.success) {
        showDashboardToast('Usuario desactivado', 'info');
        loadUsersTable();
    }
    else {
        showDashboardToast(resultado?.mensaje ?? 'No se pudo desactivar el usuario', 'error');
    }
}
function activateOrder(orderId) {
    const manager = window.orderManager;
    if (!manager?.updateOrderStatus)
        return;
    const { success } = manager.updateOrderStatus(orderId, 'procesando');
    if (success) {
        showDashboardToast('Pedido marcado como procesando', 'success');
        loadOrdersTable();
    }
    else {
        showDashboardToast('No se pudo actualizar el pedido', 'error');
    }
}
function deactivateOrder(orderId) {
    const manager = window.orderManager;
    if (!manager?.updateOrderStatus)
        return;
    const { success } = manager.updateOrderStatus(orderId, 'cancelado');
    if (success) {
        showDashboardToast('Pedido cancelado', 'info');
        loadOrdersTable();
    }
    else {
        showDashboardToast('No se pudo cancelar el pedido', 'error');
    }
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
function replenishStock(productId) {
    setupStockModalHandlers();
    const manager = window.productManager;
    if (!manager?.obtenerProductoPorId) {
        showDashboardToast('Gestor de productos no disponible', 'error');
        return;
    }
    const producto = manager.obtenerProductoPorId(productId);
    if (!producto) {
        showDashboardToast('Producto no encontrado', 'error');
        return;
    }
    const modalElement = document.getElementById('stockModal');
    if (!modalElement) {
        const cantidad = window.prompt('¿Cuántas unidades deseas agregar?', '10');
        if (!cantidad)
            return;
        const unidades = Number.parseInt(cantidad, 10);
        if (Number.isNaN(unidades) || unidades <= 0) {
            showDashboardToast('Ingresa un número válido', 'warning');
            return;
        }
        const nuevoStock = Number(producto.stock ?? 0) + unidades;
        const resultado = manager.actualizarProducto(producto.id, buildProductUpdatePayload(producto, { stock: nuevoStock, estado: Estado.activo }));
        if (resultado?.success) {
            showDashboardToast(`Stock actualizado a ${nuevoStock} unidades`, 'success');
            loadProductsTable();
        }
        else {
            showDashboardToast(resultado?.mensaje ?? 'No se pudo actualizar el stock', 'error');
        }
        return;
    }
    currentStockProductId = producto.id;
    document.getElementById('stockProductId').value = String(producto.id);
    const productNameElement = document.getElementById('stockProductName');
    if (productNameElement) {
        productNameElement.textContent = producto.nombre ?? `Producto #${producto.id}`;
    }
    const currentStockElement = document.getElementById('stockCurrentStock');
    if (currentStockElement) {
        currentStockElement.textContent = `${producto.stock ?? 0} unidades`;
    }
    const quantityInput = document.getElementById('stockQuantity');
    if (quantityInput) {
        quantityInput.value = '10';
        quantityInput.focus();
    }
    stockModalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    stockModalInstance.show();
}
function getStatusClass(status) {
    switch ((status ?? '').toLowerCase()) {
        case 'procesando':
            return 'info';
        case 'enviado':
            return 'primary';
        case 'entregado':
        case 'completado':
            return 'success';
        case 'cancelado':
            return 'danger';
        default:
            return 'warning';
    }
}
function getStatusText(status) {
    switch ((status ?? '').toLowerCase()) {
        case 'pendiente':
            return 'Pendiente';
        case 'procesando':
            return 'Procesando';
        case 'enviado':
            return 'Enviado';
        case 'entregado':
            return 'Entregado';
        case 'cancelado':
            return 'Cancelado';
        default:
            return 'Pendiente';
    }
}
function editOrderStatus(orderId) {
    const manager = window.orderManager;
    if (!manager?.updateOrderStatus) {
        showDashboardToast('Gestor de pedidos no disponible', 'error');
        return;
    }
    const order = cachedOrders.find((o) => String(o.id) === String(orderId));
    if (!order) {
        showDashboardToast('Pedido no encontrado', 'error');
        return;
    }
    const modalElement = document.getElementById('orderStatusModal');
    if (!modalElement) {
        const opciones = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
        const seleccion = window.prompt(`Estado actual: ${order.status}. Ingresa el nuevo estado (${opciones.join(', ')}):`, String(order.status ?? 'pendiente'));
        if (!seleccion)
            return;
        const estadoPrompt = seleccion.toLowerCase();
        if (!opciones.includes(estadoPrompt)) {
            showDashboardToast('Estado inválido', 'warning');
            return;
        }
        const resultadoPrompt = manager.updateOrderStatus(orderId, estadoPrompt);
        if (resultadoPrompt?.success) {
            showDashboardToast('Estado actualizado', 'success');
            loadOrdersTable();
        }
        else {
            showDashboardToast('No se pudo actualizar el estado', 'error');
        }
        return;
    }
    setupOrderStatusFormHandlers();
    currentOrderStatusOrderId = String(orderId);
    document.getElementById('orderStatusOrderId').value = String(orderId);
    const orderCodeElement = document.getElementById('orderStatusCode');
    if (orderCodeElement) {
        orderCodeElement.textContent = String(order.id ?? orderId);
    }
    const customerElement = document.getElementById('orderStatusCustomer');
    if (customerElement) {
        const customer = order.customer ?? {};
        customerElement.textContent = `${customer.name ?? 'Cliente'}${customer.email ? ` • ${customer.email}` : ''}`;
    }
    const currentStatusElement = document.getElementById('orderStatusCurrent');
    if (currentStatusElement) {
        currentStatusElement.innerHTML = `<span class="badge bg-${getStatusClass(order.status)}">${getStatusText(order.status)}</span>`;
    }
    const select = document.getElementById('orderStatusSelect');
    if (select) {
        const currentStatus = (order.status ?? 'pendiente').toString().toLowerCase();
        select.value = currentStatus;
    }
    orderStatusModalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    orderStatusModalInstance.show();
}
function filterOrders() {
    const filter = document.getElementById('orderStatusFilter')?.value ?? '';
    if (!filter) {
        renderOrdersTable(cachedOrders);
        return;
    }
    const filtrados = cachedOrders.filter((order) => String(order.status ?? '').toLowerCase() === filter.toLowerCase());
    renderOrdersTable(filtrados);
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
    showAddOrderModal,
    replenishStock,
    editOrderStatus,
    filterOrders
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.dashboardAPI = dashboardAPI;
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
//# sourceMappingURL=dashboard.js.map