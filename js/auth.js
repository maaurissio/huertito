/**
 * Sistema de Autenticación - HuertoHogar
 * Maneja login, validación de usuarios y redirecciones por rol
 */

/**
 * Sistema de Notificaciones Toast
 */
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

// Base de datos simulada de usuarios
const usuarios = {
    // Superusuarios (admin)
    'admin@huerthogar.com': {
        password: 'admin123',
        rol: 'superusuario',
        nombre: 'Administrador'
    },
    'mauricio@huerthogar.com': {
        password: 'mauricio123',
        rol: 'superusuario', 
        nombre: 'Mauricio'
    },
    // Usuarios normales
    'juan@correo.com': {
        password: 'juan123',
        rol: 'usuario',
        nombre: 'Juan Pérez'
    },
    'maria@correo.com': {
        password: 'maria123',
        rol: 'usuario',
        nombre: 'María González'
    },
    'cliente@test.com': {
        password: 'test123',
        rol: 'usuario',
        nombre: 'Cliente Test'
    }
};

/**
 * Valida las credenciales de login
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} Resultado de la validación
 */
function validarLogin(email, password) {
    const usuario = usuarios[email.toLowerCase()];
    
    if (!usuario) {
        return { valido: false, mensaje: 'Usuario no encontrado' };
    }
    
    if (usuario.password !== password) {
        return { valido: false, mensaje: 'Contraseña incorrecta' };
    }
    
    return { 
        valido: true, 
        usuario: {
            email: email,
            nombre: usuario.nombre,
            rol: usuario.rol
        }
    };
}

/**
 * Redirige al usuario según su rol y página de origen
 * @param {Object} usuario - Datos del usuario autenticado
 */
function redirigirSegunRol(usuario) {
    // Guardar información del usuario en localStorage
    localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
    
    // Obtener la página de origen desde localStorage
    const paginaOrigen = localStorage.getItem('paginaOrigen');
    
    if (usuario.rol === 'superusuario') {
        // Los superusuarios siempre van al dashboard, a menos que especifiquen otra cosa
        if (paginaOrigen && paginaOrigen !== 'login' && paginaOrigen !== 'registro') {
            // Si venían de una página específica, redirigir ahí
            localStorage.removeItem('paginaOrigen');
            window.location.href = paginaOrigen;
        } else {
            // Ir al dashboard por defecto
            window.location.href = '../../admin/dashboard.html';
        }
    } else {
        // Usuarios normales
        if (paginaOrigen && paginaOrigen !== 'login' && paginaOrigen !== 'registro') {
            // Regresar a la página de origen
            localStorage.removeItem('paginaOrigen');
            window.location.href = paginaOrigen;
        } else {
            // Ir al catálogo por defecto
            window.location.href = '../tienda/catalogo.html';
        }
    }
}

/**
 * Muestra un mensaje de error en el formulario
 * @param {string} mensaje - Mensaje de error a mostrar
 */
function mostrarError(mensaje) {
    // Buscar si ya existe un mensaje de error
    let errorDiv = document.querySelector('.error-message');
    
    if (errorDiv) {
        errorDiv.remove();
    }
    
    // Crear nuevo mensaje de error
    errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger error-message mt-3';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${mensaje}
    `;
    
    // Insertar antes del botón de submit
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(errorDiv, submitBtn);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.remove();
        }
    }, 5000);
}

/**
 * Obtiene el usuario actualmente logueado
 * @returns {Object|null} Datos del usuario o null si no está logueado
 */
function obtenerUsuarioLogueado() {
    const usuarioData = localStorage.getItem('usuarioLogueado');
    return usuarioData ? JSON.parse(usuarioData) : null;
}

/**
 * Cierra la sesión del usuario actual
 */
function cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    actualizarNavbar(); // Actualizar navbar inmediatamente
    
    // Mostrar notificación elegante
    mostrarNotificacion('Sesión cerrada exitosamente', 'success', 3000);
    
    // No redirigir - mantenerse en la página actual
    // La navbar ya se habrá actualizado para mostrar los botones de login/registro
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
    const usuario = obtenerUsuarioLogueado();
    
    // Esperar a que la navbar se cargue
    setTimeout(() => {
        // Buscar el menú en diferentes posibles contenedores
        let navbarMenu = document.querySelector('#menu .navbar-nav');
        
        // Si no se encuentra, intentar con el container del index
        if (!navbarMenu) {
            navbarMenu = document.querySelector('#navbar-container #menu .navbar-nav');
        }
        
        if (!navbarMenu) {
            console.warn('Navbar no encontrada, reintentando...');
            setTimeout(actualizarNavbar, 500);
            return;
        }
        
        if (usuario) {
            // Usuario logueado - mostrar menú de usuario
            mostrarMenuUsuario(navbarMenu, usuario);
        } else {
            // Usuario no logueado - mostrar botones de login/registro
            mostrarMenuInvitado(navbarMenu);
        }
    }, 100);
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
            ${usuario.rol === 'superusuario' ? '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-primary" href="../../admin/dashboard.html"><i class="fas fa-tachometer-alt me-2"></i>Dashboard Admin</a></li>' : ''}
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="cerrarSesion()"><i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión</a></li>
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
    // Verificar si ya existen los botones
    if (navbarMenu.querySelector('a[href*="login.html"]')) {
        return; // Ya existen, no duplicar
    }
    
    // Eliminar dropdown de usuario si existe
    const userDropdown = navbarMenu.querySelector('.user-dropdown');
    if (userDropdown) {
        userDropdown.remove();
    }
    
    // Determinar las rutas según la ubicación actual
    let loginPath, registroPath;
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    
    if (currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito')) {
        // Estamos en la página principal (index.html)
        loginPath = 'pages/client/auth/login.html';
        registroPath = 'pages/client/auth/registro.html';
    } else {
        // Estamos en una página de cliente
        loginPath = '../auth/login.html';
        registroPath = '../auth/registro.html';
    }
    
    // Crear botones de login y registro
    const loginItem = document.createElement('li');
    loginItem.className = 'nav-item';
    loginItem.innerHTML = `<a href="${loginPath}" class="nav-link" onclick="guardarPaginaOrigen()">Iniciar Sesión</a>`;
    
    const registroItem = document.createElement('li');
    registroItem.className = 'nav-item';
    registroItem.innerHTML = `<a href="${registroPath}" class="btn btn-success text-white ms-2" onclick="guardarPaginaOrigen()">Registrarse</a>`;
    
    // Agregar al menú
    navbarMenu.appendChild(loginItem);
    navbarMenu.appendChild(registroItem);
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
    // Actualizar navbar al cargar la página
    actualizarNavbar();
    
    // Escuchar cambios en el localStorage para actualizar en tiempo real
    window.addEventListener('storage', function(e) {
        if (e.key === 'usuarioLogueado') {
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
 * Inicializa el sistema de login cuando se carga la página
 */
function inicializarLogin() {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.warn('Formulario de login no encontrado');
        return;
    }
    
    // Manejar el envío del formulario
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validaciones básicas
        if (!email || !password) {
            mostrarError('Por favor completa todos los campos');
            return;
        }
        
        // Validar credenciales
        const resultado = validarLogin(email, password);
        
        if (resultado.valido) {
            // Login exitoso - mostrar loading
            const submitBtn = document.querySelector('button[type="submit"]');
            const textOriginal = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
            submitBtn.disabled = true;
            
            // Simular delay de servidor
            setTimeout(() => {
                redirigirSegunRol(resultado.usuario);
            }, 1500);
            
        } else {
            // Mostrar error
            mostrarError(resultado.mensaje);
        }
    });
}

/**
 * Función para mostrar credenciales de prueba (solo para desarrollo)
 */
function mostrarCredencialesPrueba() {
    console.log('=== CREDENCIALES DE PRUEBA - HUERTO HOGAR ===');
    console.log('');
    console.log('🔑 SUPERUSUARIOS (Dashboard Admin):');
    console.log('   admin@huerthogar.com / admin123');
    console.log('   mauricio@huerthogar.com / mauricio123');
    console.log('');
    console.log('👤 USUARIOS NORMALES (Tienda):');
    console.log('   juan@correo.com / juan123');
    console.log('   maria@correo.com / maria123'); 
    console.log('   cliente@test.com / test123');
    console.log('');
    console.log('💡 Tip: Copia y pega cualquiera de estas credenciales para probar');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarLogin();
    
    // Mostrar credenciales en consola para testing (solo en desarrollo)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        mostrarCredencialesPrueba();
    }
});