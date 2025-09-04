// Función para cargar componentes compartidos
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error('Error cargando componente:', error);
    }
}

// Detectar desde qué ubicación se está ejecutando y ajustar las rutas
function getBasePath() {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/pages/client/tienda/')) {
        // Desde tienda (3 niveles hacia atrás)
        return '../shared/';
    } else if (currentPath.includes('/pages/client/')) {
        // Desde auth o info (2 niveles hacia atrás)  
        return '../shared/';
    } else if (currentPath.includes('/pages/')) {
        // Desde pages (2 niveles hacia atrás)  
        return 'client/shared/';
    } else {
        // Desde raíz
        return 'pages/client/shared/';
    }
}

// Detectar qué navbar cargar según la ubicación
function getNavbarFile() {
    const currentPath = window.location.pathname;
    
    if (currentPath.endsWith('/index.html') || currentPath.endsWith('/')) {
        // Desde index (raíz)
        return 'navbar-index.html';
    } else {
        // Desde cualquier otra página
        return 'navbar.html';
    }
}

// Cargar navbar y footer cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
    const basePath = getBasePath();
    const navbarFile = getNavbarFile();
    
    loadComponent('navbar-container', basePath + navbarFile);
    loadComponent('footer-container', basePath + 'footer.html');
});