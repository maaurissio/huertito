// Función para cargar componentes compartidos
/**
 * Función general para cargar componentes desde archivos HTML
 * @param {string} elementId - ID del elemento donde se insertará el componente
 * @param {string} filePath - Ruta del archivo HTML del componente
 */
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        let html = await response.text();
        
        // Si es la navbar, ajustar las rutas según la ubicación
        if (elementId === 'navbar' || elementId === 'navbar-container') {
            html = adjustNavbarPaths(html);
        }
        
        // Si es el carrito flotante, ajustar las rutas de los iconos
        if (elementId === 'floating-cart' || filePath.includes('carrito-flotante')) {
            html = adjustFloatingCartPaths(html);
        }
        
        document.getElementById(elementId).innerHTML = html;
        
        // Si se cargó la navbar, inicializar el sistema dinámico
        if ((elementId === 'navbar' || elementId === 'navbar-container') && typeof inicializarNavbarDinamico === 'function') {
            inicializarNavbarDinamico();
        }
        
        // Si se cargó el carrito flotante, inicializarlo
        if ((elementId === 'floating-cart' || filePath.includes('carrito-flotante')) && typeof initializeFloatingCart === 'function') {
            initializeFloatingCart();
        }
    } catch (error) {
        console.error(`Error al cargar ${filePath}:`, error);
    }
}

/**
 * Ajusta las rutas de la navbar según la ubicación actual
 * @param {string} html - HTML de la navbar
 * @returns {string} HTML con rutas ajustadas
 */
function adjustNavbarPaths(html) {
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    const isIndex = currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito') || !currentPath.includes('/client/');
    
    console.log('Ajustando rutas navbar:', { currentPath, currentFile, isIndex });
    
    if (isIndex) {
        // Rutas desde index.html - reemplazar TODAS las instancias
        html = html.replace(/href="\.\.\/\.\.\/\.\.\/index\.html"/g, 'href="index.html"');
        html = html.replace(/href="\.\.\/tienda\/catalogo\.html"/g, 'href="pages/client/tienda/catalogo.html"');
        html = html.replace(/href="\.\.\/info\/nosotros\.html"/g, 'href="pages/client/info/nosotros.html"');
        html = html.replace(/href="\.\.\/info\/blog\.html"/g, 'href="pages/client/info/blog.html"');
        
        console.log('Rutas ajustadas para index.html');
    } else {
        console.log('Usando rutas originales para páginas internas');
    }
    
    return html;
}

/**
 * Ajusta las rutas del carrito flotante según la ubicación actual
 * @param {string} html - HTML del carrito flotante
 * @returns {string} HTML con rutas ajustadas
 */
function adjustFloatingCartPaths(html) {
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    const isIndex = currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito') || !currentPath.includes('/client/');
    
    console.log('Ajustando rutas carrito flotante:', { currentPath, currentFile, isIndex });
    
    if (isIndex) {
        // Rutas desde index.html
        html = html.replace(/src="\.\.\/\.\.\/\.\.\/icons\/shopping-basket\.svg"/g, 'src="icons/shopping-basket.svg"');
    } else {
        // Rutas desde páginas internas ya están correctas
        console.log('Usando rutas originales para carrito flotante');
    }
    
    return html;
}

/**
 * Carga automáticamente el carrito flotante en todas las páginas
 */
function loadFloatingCart() {
    // Crear el contenedor del carrito flotante si no existe
    if (!document.getElementById('floating-cart')) {
        const cartContainer = document.createElement('div');
        cartContainer.id = 'floating-cart';
        document.body.appendChild(cartContainer);
    }
    
    // Determinar la ruta correcta según la ubicación
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    const isIndex = currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito') || !currentPath.includes('/client/');
    
    const cartPath = isIndex ? 'pages/client/shared/carrito-flotante.html' : '../shared/carrito-flotante.html';
    
    loadComponent('floating-cart', cartPath);
}