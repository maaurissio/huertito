import { ResultadoLogin, userManager } from './userManager.js';
import { ISesionActiva, IUsuario, RolUsuario } from './models.js';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type UsuarioConRol = Pick<IUsuario, 'rol'> | ISesionActiva | (ISesionActiva & Partial<IUsuario>) | null | undefined;

interface ResultadoLoginExtendido extends ResultadoLogin {
  exito?: boolean;
}

declare global {
  interface Window {
    navbarRetryCount?: number;
    navbarInicializado?: boolean;
    updateCTAButtons?: () => void;
    loadComponent?: (containerId: string, path: string) => void;
    loadFloatingCart?: () => void;
    initializeCartSystem?: () => void;
    updateFloatingCartBadge?: () => void;
    mostrarNotificacion?: typeof mostrarNotificacion;
    cerrarToast?: typeof cerrarToast;
    validarLogin?: typeof validarLogin;
    redirigirSegunRol?: typeof redirigirSegunRol;
    obtenerUsuarioLogueado?: typeof obtenerUsuarioLogueado;
    cerrarSesion?: typeof cerrarSesion;
    esSuperusuario?: typeof esSuperusuario;
    protegerPagina?: typeof protegerPagina;
    actualizarNavbar?: typeof actualizarNavbar;
    mostrarMenuUsuario?: typeof mostrarMenuUsuario;
    mostrarMenuInvitado?: typeof mostrarMenuInvitado;
    guardarPaginaOrigen?: typeof guardarPaginaOrigen;
    inicializarNavbarDinamico?: typeof inicializarNavbarDinamico;
    limpiarPaginaOrigenSiEsNecesario?: typeof limpiarPaginaOrigenSiEsNecesario;
  }
}

const ROLES_ADMIN: Array<RolUsuario | string> = ['administrador', 'admin'];

function mostrarNotificacion(mensaje: string, tipo: ToastType = 'success', duracion = 4000): HTMLElement | null {
  let toastContainer = document.querySelector('.toast-container') as HTMLElement | null;
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toastId = `toast-${Date.now()}`;
  const iconos: Record<ToastType, string> = {
    success: 'fas fa-check-circle',
    error: 'fas fa-times-circle',
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle',
  };

  const toastHTML = `
        <div id="${toastId}" class="toast-notification ${tipo}" role="alert" aria-live="assertive" aria-atomic="true">
            <i class="${iconos[tipo]} toast-icon"></i>
            ${mensaje}
            <button type="button" class="btn-close" aria-label="Close">&times;</button>
        </div>
    `;

  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  const toastElement = document.getElementById(toastId);
  if (!toastElement) {
    return null;
  }

  setTimeout(() => {
    toastElement.classList.add('show');
  }, 100);

  const autoClose = window.setTimeout(() => {
    cerrarToast(toastElement);
  }, duracion);

  const closeBtn = toastElement.querySelector('.btn-close');
  closeBtn?.addEventListener('click', () => {
    window.clearTimeout(autoClose);
    cerrarToast(toastElement);
  });

  return toastElement;
}

function cerrarToast(toastElement: Element | null): void {
  if (!toastElement) {
    return;
  }

  toastElement.classList.remove('show');
  toastElement.classList.add('hide');

  window.setTimeout(() => {
    if (toastElement.parentNode) {
      toastElement.parentNode.removeChild(toastElement);
    }
  }, 400);
}

function esRolAdministrador(rol: string | RolUsuario | undefined | null): boolean {
  return typeof rol === 'string' && ROLES_ADMIN.includes(rol.toLowerCase());
}

function esUsuarioAdministrador(usuario: UsuarioConRol): boolean {
  return usuario ? esRolAdministrador(usuario.rol) : false;
}

async function validarLogin(usuario: string, password: string): Promise<ResultadoLoginExtendido> {
  console.log('🔵 AUTH: validarLogin iniciado con:', { usuario, password: '***' });
  try {
    console.log('🔵 AUTH: Llamando userManager.validarLogin...');
    const resultado = await userManager.validarLogin(usuario, password);
    console.log('🔵 AUTH: Resultado de userManager:', resultado);
    return resultado;
  } catch (error) {
    console.error('🔴 AUTH: Error en validación:', error);
    const errorResult: ResultadoLoginExtendido = {
      success: false,
      exito: false,
      mensaje: 'Error de conexión. Intente nuevamente.',
    };
    console.log('🔴 AUTH: Retornando error result:', errorResult);
    return errorResult;
  }
}

function redirigirSegunRol(usuario: IUsuario | ISesionActiva | null | undefined): void {
  console.log('🔵 AUTH: Redirigiendo usuario:', usuario);

  if (!usuario) {
    console.error('🔴 AUTH: Usuario es undefined/null en redirigirSegunRol');
    return;
  }

  console.log('🔵 AUTH: Rol del usuario:', usuario.rol);

  localStorage.removeItem('paginaOrigen');

  const currentPath = window.location.pathname;
  console.log('🔵 AUTH: Current path:', currentPath);

  if (esUsuarioAdministrador(usuario)) {
    let dashboardPath: string;

    if (currentPath.includes('/pages/client/auth/')) {
      dashboardPath = '../../admin/dashboard.html';
    } else if (currentPath.includes('/pages/')) {
      dashboardPath = '../admin/dashboard.html';
    } else {
      dashboardPath = 'pages/admin/dashboard.html';
    }

    console.log('Usuario es administrador, redirigiendo al dashboard:', dashboardPath);
    window.location.href = dashboardPath;
  } else {
    let indexPath: string;

    if (currentPath.includes('/pages/client/auth/')) {
      indexPath = '../../../index.html';
    } else if (currentPath.includes('/pages/')) {
      indexPath = '../../index.html';
    } else {
      indexPath = 'index.html';
    }

    console.log('Usuario es cliente, redirigiendo al index:', indexPath);
    window.location.href = indexPath;
  }
}

function obtenerUsuarioLogueado(): ISesionActiva | null {
  return userManager.getSesionActiva();
}

function cerrarSesion(): void {
  userManager.cerrarSesion();
  actualizarNavbar();

  window.updateCTAButtons?.();

  mostrarNotificacion('Sesión cerrada exitosamente', 'success', 3000);

  window.setTimeout(() => {
    const currentPath = window.location.pathname;
    let indexPath: string;

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

function esSuperusuario(): boolean {
  const usuario = obtenerUsuarioLogueado();
  return !!usuario && (usuario.rol as unknown as string)?.toLowerCase() === 'superusuario';
}

function protegerPagina(rolRequerido: 'usuario' | 'superusuario' = 'usuario'): void {
  const usuario = obtenerUsuarioLogueado();

  if (!usuario) {
    window.location.href = '../auth/login.html';
    return;
  }

  if (rolRequerido === 'superusuario' && (usuario.rol as unknown as string)?.toLowerCase() !== 'superusuario') {
    mostrarNotificacion('No tienes permisos para acceder a esta página', 'error');
    window.location.href = '../tienda/catalogo.html';
  }
}

function actualizarNavbar(): void {
  console.log('Auth: Iniciando actualización de navbar');

  if (typeof window.userManager === 'undefined') {
    window.navbarRetryCount = (window.navbarRetryCount ?? 0) + 1;

    if (window.navbarRetryCount <= 10) {
      console.warn(`Auth: UserManager no está disponible, reintento ${window.navbarRetryCount}/10 en 50ms...`);
      window.setTimeout(actualizarNavbar, 50);
      return;
    }

    console.error('Auth: UserManager no disponible después de 10 reintentos, usando modo sin autenticación');
    window.setTimeout(() => {
      const navbarMenu =
        (document.querySelector('#menu .navbar-nav') as HTMLElement | null) ||
        (document.querySelector('#navbar-container #menu .navbar-nav') as HTMLElement | null);
      if (navbarMenu) {
        mostrarMenuInvitado(navbarMenu);
      }
    }, 10);
    return;
  }

  window.navbarRetryCount = 0;

  console.log('Auth: UserManager disponible, obteniendo usuario');
  const usuario = obtenerUsuarioLogueado();
  console.log('Auth: Usuario obtenido:', usuario);

  let navbarMenu = document.querySelector('#menu .navbar-nav') as HTMLElement | null;

  if (!navbarMenu) {
    navbarMenu = document.querySelector('#navbar-container #menu .navbar-nav') as HTMLElement | null;
  }

  if (!navbarMenu) {
    console.warn('Auth: Navbar no encontrada');
    return;
  }

  console.log('Auth: Navbar encontrada, actualizando menú');

  if (usuario) {
  console.log('Auth: Mostrando menú de usuario para:', usuario.nombre);
  mostrarMenuUsuario(navbarMenu, usuario);
  } else {
    console.log('Auth: Mostrando menú de invitado');
    mostrarMenuInvitado(navbarMenu);
  }
}

function mostrarMenuUsuario(navbarMenu: HTMLElement, usuario: IUsuario | ISesionActiva): void {
  const loginLink = navbarMenu.querySelector('a[href*="login.html"]');
  const registroLink = navbarMenu.querySelector('a[href*="registro.html"]');

  loginLink?.parentElement?.remove();
  registroLink?.parentElement?.remove();

  if (navbarMenu.querySelector('.user-dropdown')) {
    return;
  }

  const userDropdown = document.createElement('li');
  userDropdown.className = 'nav-item dropdown user-dropdown';

  let perfilPath: string;
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop();

  if (currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito')) {
    perfilPath = 'pages/client/tienda/perfil.html';
  } else if (currentPath.includes('/admin/')) {
    perfilPath = '../client/tienda/perfil.html';
  } else {
    perfilPath = '../tienda/perfil.html';
  }

  const pathForDashboard = window.location.pathname;
  let dashboardPath: string;

  if (pathForDashboard.includes('/pages/')) {
    if (pathForDashboard.includes('/client/')) {
      dashboardPath = '../../admin/dashboard.html';
    } else {
      dashboardPath = '../admin/dashboard.html';
    }
  } else {
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

  navbarMenu.appendChild(userDropdown);
}

function mostrarMenuInvitado(navbarMenu: HTMLElement): void {
  console.log('Auth: mostrarMenuInvitado ejecutándose');

  if (navbarMenu.querySelector('a[href*="login.html"]')) {
    console.log('Auth: Botones de login ya existen, saliendo');
    return;
  }

  const userDropdown = navbarMenu.querySelector('.user-dropdown');
  if (userDropdown) {
    console.log('Auth: Eliminando dropdown de usuario existente');
    userDropdown.remove();
  }

  let loginPath: string;
  let registroPath: string;
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop();

  console.log('Auth: Determinando rutas para', { currentPath, currentFile });

  if (currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito')) {
    loginPath = 'pages/client/auth/login.html';
    registroPath = 'pages/client/auth/registro.html';
  } else {
    loginPath = '../auth/login.html';
    registroPath = '../auth/registro.html';
  }

  console.log('Auth: Rutas calculadas', { loginPath, registroPath });

  const loginItem = document.createElement('li');
  loginItem.className = 'nav-item';
  loginItem.innerHTML = `<a href="${loginPath}" class="nav-link" onclick="guardarPaginaOrigen()">Iniciar Sesión</a>`;

  const registroItem = document.createElement('li');
  registroItem.className = 'nav-item';
  registroItem.innerHTML = `<a href="${registroPath}" class="btn btn-success text-white ms-2" onclick="guardarPaginaOrigen()">Registrarse</a>`;

  console.log('Auth: Agregando botones al navbar');
  navbarMenu.appendChild(loginItem);
  navbarMenu.appendChild(registroItem);

  console.log('Auth: Botones agregados exitosamente');
}

function guardarPaginaOrigen(): void {
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop();

  let rutaRetorno: string | null;

  if (currentFile === 'index.html' || currentPath.endsWith('/huertito/') || currentPath.endsWith('/huertito')) {
    rutaRetorno = '../../../index.html';
  } else if (currentPath.includes('/tienda/')) {
    rutaRetorno = `../tienda/${currentFile ?? ''}`;
  } else if (currentPath.includes('/info/')) {
    rutaRetorno = `../info/${currentFile ?? ''}`;
  } else {
    rutaRetorno = null;
  }

  if (rutaRetorno) {
    localStorage.setItem('paginaOrigen', rutaRetorno);
    console.log('Página de origen guardada:', rutaRetorno);
  }
}

function inicializarNavbarDinamico(): void {
  if (window.navbarInicializado) {
    console.log('Auth: inicializarNavbarDinamico ya fue ejecutado, evitando duplicación');
    return;
  }

  window.navbarInicializado = true;
  console.log('Auth: inicializarNavbarDinamico ejecutándose');

  window.setTimeout(() => {
    console.log('Auth: Llamando actualizarNavbar desde inicializarNavbarDinamico');
    actualizarNavbar();
  }, 100);

  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === 'sesionActiva') {
      console.log('Auth: Cambio detectado en sesionActiva, actualizando navbar');
      actualizarNavbar();
    }
  });

  limpiarPaginaOrigenSiEsNecesario();
}

function limpiarPaginaOrigenSiEsNecesario(): void {
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop();

  if ((currentFile === 'login.html' || currentFile === 'registro.html') && !document.referrer.includes(window.location.hostname)) {
    localStorage.removeItem('paginaOrigen');
  }
}

window.mostrarNotificacion = mostrarNotificacion;
window.cerrarToast = cerrarToast;
window.validarLogin = validarLogin;
window.redirigirSegunRol = redirigirSegunRol;
window.obtenerUsuarioLogueado = obtenerUsuarioLogueado;
window.cerrarSesion = cerrarSesion;
window.esSuperusuario = esSuperusuario;
window.protegerPagina = protegerPagina;
window.actualizarNavbar = actualizarNavbar;
window.mostrarMenuUsuario = mostrarMenuUsuario;
window.mostrarMenuInvitado = mostrarMenuInvitado;
window.guardarPaginaOrigen = guardarPaginaOrigen;
window.inicializarNavbarDinamico = inicializarNavbarDinamico;
window.limpiarPaginaOrigenSiEsNecesario = limpiarPaginaOrigenSiEsNecesario;

export {};
