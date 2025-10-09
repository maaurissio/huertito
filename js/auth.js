function mostrarNotificacion(mensaje, tipo = 'success', duracion = 4000) {
    // Crear contenedor si no existe
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Crear el toast
    const toastId = 'toast-' + Date.now();
    const iconos = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };

    const toastHTML = `
        <div id="${toastId}" class="toast-notification ${tipo}" role="alert" aria-live="assertive" aria-atomic="true">
            <i class="${iconos[tipo]} toast-icon"></i>
            ${mensaje}
            <button type="button" class="btn-close" aria-label="Close">&times;</button>
        </div>
    `;

    // Insertar el toast
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);

    // Mostrar el toast con animación
    setTimeout(() => {
        toastElement.classList.add('show');
    }, 100);

    // Configurar auto-cierre
    const autoClose = setTimeout(() => {
        cerrarToast(toastElement);
    }, duracion);

    // Configurar botón de cerrar
    const closeBtn = toastElement.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoClose);
        cerrarToast(toastElement);
    });

    return toastElement;
}

function cerrarToast(toastElement) {
    toastElement.classList.remove('show');
    toastElement.classList.add('hide');
    
    setTimeout(() => {
        if (toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
        }
    }, 400);
}

// Base de datos de usuarios ahora manejada por userManager.js
// Este archivo se enfoca solo en la UI y validaciones

const ROLES_ADMIN = ['administrador', 'admin'];

function esRolAdministrador(rol) {
    return typeof rol === 'string' && ROLES_ADMIN.includes(rol.toLowerCase());
}

function esUsuarioAdministrador(usuario) {
    return usuario ? esRolAdministrador(usuario.rol) : false;
}

/**
 * Valida las credenciales del usuario
 * @param {string} usuario - Nombre de usuario o email
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Resultado de la validación
 */
async function validarLogin(usuario, password) {
    console.log('🔵 AUTH: validarLogin iniciado con:', { usuario, password: '***' });
    try {
        console.log('🔵 AUTH: Llamando userManager.validarLogin...');
        const resultado = await userManager.validarLogin(usuario, password);
        console.log('🔵 AUTH: Resultado de userManager:', resultado);
        return resultado;
    } catch (error) {
        console.error('🔴 AUTH: Error en validación:', error);
        const errorResult = { 
            success: false, 
            exito: false,
            mensaje: 'Error de conexión. Intente nuevamente.' 
        };
        console.log('🔴 AUTH: Retornando error result:', errorResult);
        return errorResult;
    }
}

/**
 * Redirige al usuario según su rol después del login
 * @param {Object} usuario - Datos del usuario logueado
 */

function redirigirSegunRol(usuario) {
    console.log('🔵 AUTH: Redirigiendo usuario:', usuario);
    
    if (!usuario) {
        console.error('🔴 AUTH: Usuario es undefined/null en redirigirSegunRol');
        return;
    }
    
    console.log('🔵 AUTH: Rol del usuario:', usuario.rol);
    
    // La sesión ya está guardada por userManager
    // Limpiar página de origen
    localStorage.removeItem('paginaOrigen');
    
    // Determinar la ruta según la ubicación actual
    const currentPath = window.location.pathname;
    console.log('🔵 AUTH: Current path:', currentPath);
    
    if (esUsuarioAdministrador(usuario)) {
        // Solo administradores van al dashboard
        let dashboardPath;
        
        if (currentPath.includes('/pages/client/auth/')) {
            // Estamos en las páginas de auth
            dashboardPath = '../../admin/dashboard.html';
        } else if (currentPath.includes('/pages/')) {
            // Estamos en alguna página dentro de pages
            dashboardPath = '../admin/dashboard.html';
        } else {
            // Estamos en la raíz
            dashboardPath = 'pages/admin/dashboard.html';
        }
        
        console.log('Usuario es administrador, redirigiendo al dashboard:', dashboardPath);
        window.location.href = dashboardPath;
        
    } else {
        // Usuarios normales van al index
        let indexPath;
        
        if (currentPath.includes('/pages/client/auth/')) {
            // Estamos en las páginas de auth
            indexPath = '../../../index.html';
        } else if (currentPath.includes('/pages/')) {
            // Estamos en alguna página dentro de pages
            indexPath = '../../index.html';
        } else {
            // Estamos en la raíz
            indexPath = 'index.html';
        }
        
        console.log('Usuario es cliente, redirigiendo al index:', indexPath);
        window.location.href = indexPath;
    }
}

/**
 * Muestra un mensaje de error en el formulario
 * @param {string} mensaje - Mensaje de error a mostrar
 */


/**
 * Obtiene el usuario actualmente logueado
 * @returns {Object|null} Datos del usuario o null si no está logueado
 */
function obtenerUsuarioLogueado() {
    return userManager.getSesionActiva();
}

/**
 * Cierra la sesión del usuario actual
 */
function cerrarSesion() {
    userManager.cerrarSesion();
    actualizarNavbar(); // Actualizar navbar inmediatamente
    
    // Actualizar botones CTA si existen en la página
    if (typeof updateCTAButtons === 'function') {
        updateCTAButtons();
    }
    
    // Mostrar notificación elegante
    mostrarNotificacion('Sesión cerrada exitosamente', 'success', 3000);
    
    // Redirigir al index después de un pequeño delay para mostrar la notificación
    setTimeout(() => {
        // Determinar la ruta correcta al index según la ubicación actual
        const currentPath = window.location.pathname;
        let indexPath;
        
        if (currentPath.includes('/tienda/')) {
            indexPath = '../../../index.html';
        } else if (currentPath.includes('/auth/')) {
            indexPath = '../../../index.html';
        } else if (currentPath.includes('/info/')) {
            indexPath = '../../../index.html';
        } else if (currentPath.includes('/admin/')) {
            indexPath = '../../../index.html';
        } else {
            indexPath = 'index.html';
        }
        
        window.location.href = indexPath;
    }, 1000);
}

/**
 * Verifica si el usuario tiene permisos de superusuario
 * @returns {boolean} True si es superusuario
 */
function esSuperusuario() {
    const usuario = obtenerUsuarioLogueado();
    return usuario && usuario.rol === 'superusuario';
}

/**
 * Protege una página verificando que el usuario esté logueado
 * @param {string} rolRequerido - Rol mínimo requerido ('usuario' o 'superusuario')
 */
function protegerPagina(rolRequerido = 'usuario') {
    const usuario = obtenerUsuarioLogueado();
    
    if (!usuario) {
        // No hay usuario logueado, redirigir al login
        window.location.href = '../auth/login.html';
        return;
    }
    
    if (rolRequerido === 'superusuario' && usuario.rol !== 'superusuario') {
        // Se requiere superusuario pero el usuario actual no lo es
        mostrarNotificacion('No tienes permisos para acceder a esta página', 'error');
        window.location.href = '../tienda/catalogo.html';
        return;
    }
}

/**
 * Actualiza la navbar según el estado de sesión del usuario
 */
function actualizarNavbar() {
    console.log('Auth: Iniciando actualización de navbar');
    
    // Verificar que userManager esté disponible con límite de reintentos
    if (typeof userManager === 'undefined') {
        // Contar reintentos para evitar bucle infinito
        if (!window.navbarRetryCount) window.navbarRetryCount = 0;
        
        if (window.navbarRetryCount < 10) { // Máximo 10 reintentos
            window.navbarRetryCount++;
            console.warn(`Auth: UserManager no está disponible, reintento ${window.navbarRetryCount}/10 en 50ms...`);
            setTimeout(actualizarNavbar, 50);
            return;
        } else {
            console.error('Auth: UserManager no disponible después de 10 reintentos, usando modo sin autenticación');
            // Mostrar botones de invitado sin verificar estado
            setTimeout(() => {
                const navbarMenu = document.querySelector('#menu .navbar-nav') || 
                                 document.querySelector('#navbar-container #menu .navbar-nav');
                if (navbarMenu) {
                    mostrarMenuInvitado(navbarMenu);
                }
            }, 10);
            return;
        }
    }
    
    // Reset counter si userManager está disponible
    window.navbarRetryCount = 0;
    
    console.log('Auth: UserManager disponible, obteniendo usuario');
    const usuario = obtenerUsuarioLogueado();
    console.log('Auth: Usuario obtenido:', usuario);
    
    // Buscar el menú inmediatamente
    // Buscar el menú en diferentes posibles contenedores
    let navbarMenu = document.querySelector('#menu .navbar-nav');
        
    // Si no se encuentra, intentar con el container del index
    if (!navbarMenu) {
        navbarMenu = document.querySelector('#navbar-container #menu .navbar-nav');
    }
    
    if (!navbarMenu) {
        console.warn('Auth: Navbar no encontrada');
        return;
    }
    
    console.log('Auth: Navbar encontrada, actualizando menú');
    
    if (usuario) {
        console.log('Auth: Mostrando menú de usuario para:', usuario.nombre);
        // Usuario logueado - mostrar menú de usuario
        mostrarMenuUsuario(navbarMenu, usuario);
    } else {
        console.log('Auth: Mostrando menú de invitado');
        // Usuario no logueado - mostrar botones de login/registro
        mostrarMenuInvitado(navbarMenu);
    }
}

/**
 * Muestra el menú para usuarios logueados
 * @param {Element} navbarMenu - Elemento del menú de la navbar
 * @param {Object} usuario - Datos del usuario logueado
 */
function mostrarMenuUsuario(navbarMenu, usuario) {
    // Buscar y eliminar los botones de login/registro si existen
    const loginLink = navbarMenu.querySelector('a[href*="login.html"]');
    const registroLink = navbarMenu.querySelector('a[href*="registro.html"]');
    
    if (loginLink) loginLink.parentElement.remove();
    if (registroLink) registroLink.parentElement.remove();
    
    // Verificar si ya existe el menú de usuario
    if (navbarMenu.querySelector('.user-dropdown')) {
        return; // Ya existe, no duplicar
    }
    
    // Crear dropdown del usuario
    const userDropdown = document.createElement('li');
    userDropdown.className = 'nav-item dropdown user-dropdown';
    
    // Determinar la ruta al perfil según la ubicación actual
    let perfilPath;
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    
    if (currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito')) {
        // Estamos en la página principal
        perfilPath = 'pages/client/tienda/perfil.html';
    } else if (currentPath.includes('/admin/')) {
        // Estamos en área admin
        perfilPath = '../client/tienda/perfil.html';
    } else {
        // Estamos en páginas de cliente
        perfilPath = '../tienda/perfil.html';
    }
    
    // Calcular ruta al dashboard según la ubicación actual
    const pathForDashboard = window.location.pathname;
    let dashboardPath;
    
    if (pathForDashboard.includes('/pages/')) {
        // Estamos en una subcarpeta de pages
        if (pathForDashboard.includes('/client/')) {
            dashboardPath = '../../admin/dashboard.html';
        } else {
            dashboardPath = '../admin/dashboard.html';
        }
    } else {
        // Estamos en la raíz
        dashboardPath = 'pages/admin/dashboard.html';
    }
    
    userDropdown.innerHTML = `
        <a class="nav-link dropdown-toggle text-success fw-semibold" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-user-circle me-1"></i>
            ${usuario.nombre}
        </a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="${perfilPath}"><i class="fas fa-user me-2"></i>Mi Perfil</a></li>
            <li><a class="dropdown-item" href="${perfilPath}?section=pedidos"><i class="fas fa-shopping-bag me-2"></i>Mis Pedidos</a></li>
            <li><a class="dropdown-item" href="${perfilPath}?section=favoritos"><i class="fas fa-heart me-2"></i>Favoritos</a></li>
            <li><a class="dropdown-item" href="${perfilPath}?section=configuracion"><i class="fas fa-cog me-2"></i>Configuración</a></li>
            ${esUsuarioAdministrador(usuario) ? `<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-primary" href="${dashboardPath}"><i class="fas fa-tachometer-alt me-2"></i>Dashboard Admin</a></li>` : ''}
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="cerrarSesion()"><i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión</a></li>
        </ul>
    `;
    
    // Agregar al menú
    navbarMenu.appendChild(userDropdown);
}

/**
 * Muestra el menú para usuarios invitados (no logueados)
 * @param {Element} navbarMenu - Elemento del menú de la navbar
 */
function mostrarMenuInvitado(navbarMenu) {
    console.log('Auth: mostrarMenuInvitado ejecutándose');
    
    // Verificar si ya existen los botones
    if (navbarMenu.querySelector('a[href*="login.html"]')) {
        console.log('Auth: Botones de login ya existen, saliendo');
        return; // Ya existen, no duplicar
    }
    
    // Eliminar dropdown de usuario si existe
    const userDropdown = navbarMenu.querySelector('.user-dropdown');
    if (userDropdown) {
        console.log('Auth: Eliminando dropdown de usuario existente');
        userDropdown.remove();
    }
    
    // Determinar las rutas según la ubicación actual
    let loginPath, registroPath;
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    
    console.log('Auth: Determinando rutas para', { currentPath, currentFile });
    
    if (currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito')) {
        // Estamos en la página principal (index.html)
        loginPath = 'pages/client/auth/login.html';
        registroPath = 'pages/client/auth/registro.html';
    } else {
        // Estamos en una página de cliente
        loginPath = '../auth/login.html';
        registroPath = '../auth/registro.html';
    }
    
    console.log('Auth: Rutas calculadas', { loginPath, registroPath });
    
    // Crear botones de login y registro
    const loginItem = document.createElement('li');
    loginItem.className = 'nav-item';
    loginItem.innerHTML = `<a href="${loginPath}" class="nav-link" onclick="guardarPaginaOrigen()">Iniciar Sesión</a>`;
    
    const registroItem = document.createElement('li');
    registroItem.className = 'nav-item';
    registroItem.innerHTML = `<a href="${registroPath}" class="btn btn-success text-white ms-2" onclick="guardarPaginaOrigen()">Registrarse</a>`;
    
    console.log('Auth: Agregando botones al navbar');
    // Agregar al menú
    navbarMenu.appendChild(loginItem);
    navbarMenu.appendChild(registroItem);
    
    console.log('Auth: Botones agregados exitosamente');
}

/**
 * Guarda la página actual como página de origen para redirección post-login
 */
function guardarPaginaOrigen() {
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    
    // Determinar la ruta de retorno según la página actual
    let rutaRetorno;
    
    if (currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito')) {
        // Desde index, regresar a index usando ruta relativa desde login
        rutaRetorno = '../../../index.html';
    } else if (currentPath.includes('/tienda/')) {
        // Desde páginas de tienda
        rutaRetorno = '../tienda/' + currentFile;
    } else if (currentPath.includes('/info/')) {
        // Desde páginas de info
        rutaRetorno = '../info/' + currentFile;
    } else {
        // Otras páginas, usar ruta por defecto
        rutaRetorno = null;
    }
    
    if (rutaRetorno) {
        localStorage.setItem('paginaOrigen', rutaRetorno);
        console.log('Página de origen guardada:', rutaRetorno);
    }
}

/**
 * Inicializa el sistema de navbar dinámico
 */
function inicializarNavbarDinamico() {
    // Evitar inicialización múltiple
    if (window.navbarInicializado) {
        console.log('Auth: inicializarNavbarDinamico ya fue ejecutado, evitando duplicación');
        return;
    }
    
    window.navbarInicializado = true;
    console.log('Auth: inicializarNavbarDinamico ejecutándose');
    
    // Actualizar navbar al cargar la página
    setTimeout(() => {
        console.log('Auth: Llamando actualizarNavbar desde inicializarNavbarDinamico');
        actualizarNavbar();
    }, 100);
    
    // Escuchar cambios en el localStorage para actualizar en tiempo real
    window.addEventListener('storage', function(e) {
        if (e.key === 'sesionActiva') {
            console.log('Auth: Cambio detectado en sesionActiva, actualizando navbar');
            actualizarNavbar();
        }
    });
    
    // Limpiar página de origen si estamos en login/registro y no venimos de otra página
    limpiarPaginaOrigenSiEsNecesario();
}

/**
 * Limpia la página de origen si estamos en login/registro y no es necesaria
 */
function limpiarPaginaOrigenSiEsNecesario() {
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    
    // Si estamos en login o registro pero no venimos de otra página, limpiar
    if ((currentFile === 'login.html' || currentFile === 'registro.html') && !document.referrer.includes(window.location.hostname)) {
        localStorage.removeItem('paginaOrigen');
    }
}

/**
 * Limpiar página de origen en casos específicos
 */
function limpiarPaginaOrigenSiEsNecesario() {
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    
    // Si estamos en login o registro pero no venimos de otra página, limpiar
    if ((currentFile === 'login.html' || currentFile === 'registro.html') && !document.referrer.includes(window.location.hostname)) {
        localStorage.removeItem('paginaOrigen');
    }
}