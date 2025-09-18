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
        
        document.getElementById(elementId).innerHTML = html;
        
        // Si se cargó la navbar, inicializar el sistema dinámico
        if ((elementId === 'navbar' || elementId === 'navbar-container') && typeof inicializarNavbarDinamico === 'function') {
            inicializarNavbarDinamico();
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