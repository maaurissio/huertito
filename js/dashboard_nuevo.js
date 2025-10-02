let salesChart;
let topProductsChart;
let salesDistributionChart;

const mockData = {
    stats: {
        revenue: 0,
        orders: 0,
        users: 5,
        products: 3
    },
    salesData: {
        2025: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    recentActivity: [
        { type: 'system', title: 'Sistema iniciado correctamente', time: 'Hace 1 minuto', icon: 'check-circle', color: 'success' },
        { type: 'system', title: 'Base de datos conectada', time: 'Hace 2 minutos', icon: 'database', color: 'info' },
        { type: 'system', title: 'Dashboard cargado', time: 'Hace 3 minutos', icon: 'tachometer-alt', color: 'success' }
    ],
    orders: []
};

// INICIO AUTOMATICO AL CARGAR LA PAGINA
document.addEventListener('DOMContentLoaded', async function() {
    await setupSistemaAutomatico();
    initializeDashboard();
    loadStats();
    initializeCharts();
    loadRecentActivity();
    updateNotificationCount();
});

// FUNCION PRINCIPAL DE SETUP AUTOMATICO
async function setupSistemaAutomatico() {
    console.log('Configurando sistema automaticamente...');
    
    // Verificar si ya hay productos
    const productosExistentes = localStorage.getItem('productosJSON');
    
    if (!productosExistentes) {
        console.log('Creando productos base automaticamente...');
        
        const productos = {
            productos: [
                {
                    id: 1,
                    codigo: "FR001",
                    nombre: "Manzanas Fuji",
                    descripcion: "Manzanas dulces y crujientes",
                    precio: 3200,
                    stock: 45,
                    categoria: "Frutas Frescas",
                    imagen: "img/manzana.webp",
                    estado: "activo",
                    peso: "1kg"
                },
                {
                    id: 2,
                    codigo: "FR002",
                    nombre: "Naranjas Valencia",
                    descripcion: "Naranjas llenas de vitamina C",
                    precio: 2800,
                    stock: 38,
                    categoria: "Frutas Frescas",
                    imagen: "img/naranja.webp",
                    estado: "activo",
                    peso: "1kg"
                },
                {
                    id: 3,
                    codigo: "VR001",
                    nombre: "Zanahorias Organicas",
                    descripcion: "Zanahorias organicas dulces",
                    precio: 2100,
                    stock: 35,
                    categoria: "Verduras Organicas",
                    imagen: "img/zanahorias.webp",
                    estado: "activo",
                    peso: "500g"
                }
            ],
            configuracion: {
                proximoId: 4,
                version: "1.0"
            }
        };
        
        localStorage.setItem('productosJSON', JSON.stringify(productos));
        console.log('Sistema configurado. Productos creados:', productos.productos.length);
    } else {
        console.log('Sistema ya configurado previamente');
    }
}

async function initializeDashboard() {
    console.log('Inicializando Dashboard...');
    
    // Inicializar managers
    if (typeof OrderManager !== 'undefined') {
        window.orderManager = new OrderManager();
    }
    
    if (typeof ShippingConfig !== 'undefined') {
        window.shippingConfig = new ShippingConfig();
    }
    
    if (typeof ProductManager !== 'undefined') {
        window.productManager = new ProductManager();
    }
    
    // Configurar usuario
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado') || '{}');
    
    if (!usuarioLogueado.nombre) {
        const usuarioTemp = {
            nombre: 'Admin',
            rol: 'superusuario',
            email: 'admin@huertohogar.com'
        };
        localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioTemp));
    }
    
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        userAvatar.textContent = usuario.nombre.charAt(0).toUpperCase();
    }
    
    loadStats();
}

async function loadStats() {
    animateCounter('totalSales', 0, '$', true);
    animateCounter('totalOrders', 0);
    animateCounter('totalProducts', mockData.stats.products);
    
    await updateDashboardStats();
}

function animateCounter(elementId, targetValue, prefix = '', isCurrency = false) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
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
        
        if (isCurrency) {
            element.textContent = prefix + Math.floor(currentValue).toLocaleString();
        } else {
            element.textContent = Math.floor(currentValue) + (prefix ? ' ' + prefix : '');
        }
    }, 16);
}

async function updateDashboardStats() {
    try {
        if (window.productManager) {
            const productos = await window.productManager.obtenerTodosLosProductos();
            if (productos && productos.success) {
                const totalProducts = productos.productos.length;
                const element = document.getElementById('totalProducts');
                if (element) {
                    element.textContent = totalProducts;
                }
            }
        }
        
        if (window.orderManager) {
            const orders = window.orderManager.orders || [];
            const totalOrders = orders.length;
            const element = document.getElementById('totalOrders');
            if (element) {
                element.textContent = totalOrders;
            }
        }
    } catch (error) {
        console.log('Error actualizando stats:', error);
    }
}

function initializeCharts() {
    // Chart.js initialization would go here
    console.log('Charts initialized');
}

function loadRecentActivity() {
    console.log('Recent activity loaded');
}

function updateNotificationCount() {
    console.log('Notifications updated');
}

// FUNCIONES DE UTILIDAD PARA DEBUGGING
window.resetearSistema = function() {
    console.log('Reseteando sistema...');
    localStorage.clear();
    location.reload();
};

window.verificarSistema = function() {
    console.log('Verificando sistema:');
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

console.log('Dashboard script cargado correctamente');