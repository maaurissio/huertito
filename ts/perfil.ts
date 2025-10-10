import { userManager } from './userManager.js';

// Bootstrap puede no tener tipos disponibles globalmente en este contexto
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const bootstrap: any;

declare global {
  interface Window {
    mostrarSeccion?: typeof mostrarSeccion;
    verDetallePedido?: typeof verDetallePedido;
    eliminarFavorito?: typeof eliminarFavorito;
    agregarAlCarrito?: typeof agregarAlCarrito;
    loadComponent?: (containerId: string, path: string) => void;
    loadFloatingCart?: () => void;
    initializeCartSystem?: () => void;
    updateFloatingCartBadge?: () => void;
    actualizarNavbar?: () => void;
  }
}

let currentUser: any = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Perfil: DOM cargado, iniciando...');

  if (typeof window.loadComponent === 'function') {
    window.loadComponent('navbar-container', '../shared/navbar.html');
    window.loadComponent('footer-container', '../shared/footer.html');
  }

  window.setTimeout(() => {
    console.log('Perfil: Iniciando configuración...');

    if (!verificarAutenticacion()) {
      console.warn('Perfil: Usuario no autenticado, redirigiendo...');
      window.location.href = '../../../index.html';
      return;
    }

    cargarInformacionUsuario();
    configurarNavegacionURL();
    configurarEventListeners();

    if (typeof window.loadFloatingCart === 'function') {
      window.loadFloatingCart();
    }

    window.setTimeout(() => {
      window.initializeCartSystem?.();
      window.updateFloatingCartBadge?.();
    }, 200);

    window.setTimeout(() => {
      mostrarSeccionInicial();
    }, 100);
  }, 150);
});

if (document.readyState === 'complete') {
  console.log('Perfil: Página ya cargada, iniciando inmediatamente...');
  window.setTimeout(() => {
    if (!document.querySelector('.profile-section.active')) {
      mostrarSeccionInicial();
    }
  }, 100);
}

function verificarAutenticacion(): boolean {
  const usuario = localStorage.getItem('sesionActiva');
  if (!usuario) {
    return false;
  }

  try {
    currentUser = JSON.parse(usuario);
    return true;
  } catch (error) {
    console.error('Error al parsear datos del usuario:', error);
    localStorage.removeItem('sesionActiva');
    return false;
  }
}

function cargarInformacionUsuario(): void {
  if (!currentUser) return;

  const userNameElemento = document.getElementById('userName');
  if (userNameElemento) {
    const nombreCompleto = `${currentUser.nombre || ''} ${currentUser.apellido || ''}`.trim();
    userNameElemento.textContent = nombreCompleto || 'Usuario';
  }

  const emailElementos = document.querySelectorAll('#userEmail, #profileEmail');
  emailElementos.forEach((elemento) => {
    const el = elemento as HTMLElement;
    if (el.tagName === 'INPUT') {
      (el as HTMLInputElement).value = currentUser.email || '';
    } else {
      el.textContent = currentUser.email || '';
    }
  });

  const telefonoElemento = document.getElementById('profilePhone') as HTMLInputElement | null;
  if (telefonoElemento) {
    telefonoElemento.value = currentUser.telefono || '';
  }

  const direccionElemento = document.getElementById('profileAddress') as HTMLInputElement | null;
  if (direccionElemento) {
    direccionElemento.value = currentUser.direccion || '';
  }

  const nombreElemento = document.getElementById('profileName') as HTMLInputElement | null;
  if (nombreElemento) {
    nombreElemento.value = currentUser.nombre || '';
  }

  const apellidosElemento = document.getElementById('profileLastName') as HTMLInputElement | null;
  if (apellidosElemento) {
    apellidosElemento.value = currentUser.apellido || '';
  }

  const fechaNacElemento = document.getElementById('profileBirthDate') as HTMLInputElement | null;
  if (fechaNacElemento) {
    fechaNacElemento.value = currentUser.fechaNacimiento || '';
  }

  const joinDateElemento = document.getElementById('joinDate');
  if (joinDateElemento && currentUser.fechaRegistro) {
    const fecha = new Date(currentUser.fechaRegistro);
    joinDateElemento.textContent = `${fecha.getFullYear()}`;
  }

  const avatarElemento = document.getElementById('profileImage') as HTMLImageElement | null;
  if (avatarElemento) {
    if (currentUser.avatar) {
      avatarElemento.src = currentUser.avatar;
    } else {
      const iniciales = `${currentUser.nombre?.charAt(0) || ''}${currentUser.apellido?.charAt(0) || ''}`;
      avatarElemento.src = `https://ui-avatars.com/api/?name=${iniciales}&background=28a745&color=fff&size=128&rounded=true`;
    }
  }
}

function configurarNavegacionURL(): void {
  window.addEventListener('popstate', (event: PopStateEvent) => {
    console.log('Perfil: Navegación con popstate detectada');
    const state = event.state as { section?: string } | null;
    if (state?.section) {
      mostrarSeccion(state.section);
    } else {
      mostrarSeccionActual();
    }
  });

  window.addEventListener('hashchange', () => {
    console.log('Perfil: Cambio de hash detectado');
    mostrarSeccionActual();
  });
}

function mostrarSeccionInicial(): void {
  window.setTimeout(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const seccion = urlParams.get('section') || 'general';

    console.log('Perfil: Inicializando con sección:', seccion);
    console.log('Perfil: URL actual:', window.location.href);

    const sidebar = document.querySelector('.sidebar');
    const secciones = document.querySelectorAll('.profile-section');

    if (sidebar && secciones.length > 0) {
      mostrarSeccion(seccion);
    } else {
      console.warn('Perfil: Elementos del DOM no están listos, reintentando...');
      window.setTimeout(() => mostrarSeccionInicial(), 200);
    }
  }, 100);
}

function mostrarSeccionActual(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const seccion = urlParams.get('section') || 'general';
  console.log('Perfil: Mostrando sección actual desde URL:', seccion);
  mostrarSeccion(seccion);
}

function mostrarSeccion(seccionId: string): void {
  console.log('Perfil: Mostrando sección:', seccionId);

  const secciones = document.querySelectorAll('.profile-section');
  secciones.forEach((seccion) => {
    seccion.classList.remove('active');
  });

  const seccionActiva = document.getElementById(seccionId);
  if (seccionActiva) {
    seccionActiva.classList.add('active');
    console.log('Perfil: Sección activada:', seccionId);
  } else {
    console.warn('Perfil: No se encontró la sección:', seccionId);
  }

  actualizarNavegacionActiva(seccionId);

  if (document.readyState === 'complete') {
    const nuevaURL = `${window.location.pathname}?section=${seccionId}`;
    window.history.pushState({ section: seccionId }, '', nuevaURL);
  }

  cargarContenidoSeccion(seccionId);
}

function actualizarNavegacionActiva(seccionId: string): void {
  console.log('Perfil: Actualizando navegación para:', seccionId);

  window.setTimeout(() => {
    const enlaces = document.querySelectorAll('.sidebar .nav-link');
    console.log('Perfil: Enlaces encontrados:', enlaces.length);

    enlaces.forEach((enlace) => {
      enlace.classList.remove('active');
    });

    const enlaceActivo = document.querySelector(`[onclick="mostrarSeccion('${seccionId}')"]`);
    if (enlaceActivo) {
      enlaceActivo.classList.add('active');
      console.log('Perfil: Enlace activado para:', seccionId);
    } else {
      console.warn('Perfil: No se encontró enlace para:', seccionId);

      enlaces.forEach((enlace) => {
        const texto = enlace.textContent?.toLowerCase() ?? '';
        if (
          (seccionId === 'general' && texto.includes('perfil')) ||
          (seccionId === 'pedidos' && texto.includes('pedidos')) ||
          (seccionId === 'favoritos' && texto.includes('favoritos')) ||
          (seccionId === 'configuracion' && texto.includes('configuración'))
        ) {
          enlace.classList.add('active');
          console.log('Perfil: Enlace activado por fallback para:', seccionId);
        }
      });
    }
  }, 50);
}

function cargarContenidoSeccion(seccionId: string): void {
  switch (seccionId) {
    case 'pedidos':
      cargarPedidos();
      break;
    case 'favoritos':
      cargarFavoritos();
      break;
    case 'general':
    case 'configuracion':
    default:
      break;
  }
}

function cargarPedidos(): void {
  const pedidos: any[] = currentUser?.pedidos || [];
  const contenedorPedidos = document.getElementById('ordersList');

  if (!contenedorPedidos) return;

  if (pedidos.length === 0) {
    contenedorPedidos.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h4>No tienes pedidos aún</h4>
                <p>Cuando realices tu primera compra, aparecerá aquí.</p>
                <a href="catalogo.html" class="btn btn-success">
                    <i class="fas fa-shopping-cart me-2"></i>
                    Comenzar a comprar
                </a>
            </div>
        `;
    return;
  }

  let html = '';
  pedidos.forEach((pedido) => {
    html += `
            <div class="order-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">Pedido #${pedido.id}</h6>
                        <p class="text-muted mb-2">${new Date(pedido.fecha).toLocaleDateString()}</p>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-${getBadgeColor(pedido.estado)}">${pedido.estado}</span>
                            <span class="text-muted">$${pedido.total}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetallePedido('${pedido.id}')">
                        Ver detalles
                    </button>
                </div>
            </div>
        `;
  });

  contenedorPedidos.innerHTML = html;
}

function cargarFavoritos(): void {
  const favoritos: any[] = currentUser?.favoritos || [];
  const contenedorFavoritos = document.getElementById('favoritesList');

  if (!contenedorFavoritos) return;

  if (favoritos.length === 0) {
    contenedorFavoritos.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h4>No tienes favoritos guardados</h4>
                <p>Agrega productos a favoritos para encontrarlos fácilmente.</p>
                <a href="catalogo.html" class="btn btn-success">
                    <i class="fas fa-search me-2"></i>
                    Explorar productos
                </a>
            </div>
        `;
    return;
  }

  let html = '<div class="row g-3">';
  favoritos.forEach((producto) => {
    html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}" style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title">${producto.nombre}</h6>
                        <p class="card-text text-muted small flex-grow-1">${producto.descripcion}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-success">$${producto.precio}</span>
                            <div>
                                <button class="btn btn-sm btn-outline-danger me-1" onclick="eliminarFavorito('${producto.id}')">
                                    <i class="fas fa-heart-broken"></i>
                                </button>
                                <button class="btn btn-sm btn-success" onclick="agregarAlCarrito('${producto.id}')">
                                    <i class="fas fa-cart-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  });
  html += '</div>';

  contenedorFavoritos.innerHTML = html;
}

function configurarEventListeners(): void {
  console.log('Perfil: Configurando event listeners...');

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (
      target?.matches('.sidebar .nav-link') ||
      target?.closest('.sidebar .nav-link')
    ) {
      event.preventDefault();
      event.stopPropagation();

      const button = target.matches('.sidebar .nav-link') ? target : target.closest('.sidebar .nav-link');
      const onclick = button?.getAttribute('onclick') ?? '';

      console.log('Perfil: Click detectado en botón navegación:', onclick);

      if (onclick.includes('mostrarSeccion')) {
        const match = onclick.match(/mostrarSeccion\('([^']+)'\)/);
        const seccion = match?.[1];
        if (seccion) {
          console.log('Perfil: Navegando a sección:', seccion);
          mostrarSeccion(seccion);
        }
      }
    }
  });

  const formPerfil = document.getElementById('profileForm') as HTMLFormElement | null;
  if (formPerfil) {
    formPerfil.addEventListener('submit', guardarPerfil);
  }

  const formPassword = document.getElementById('passwordForm') as HTMLFormElement | null;
  if (formPassword) {
    formPassword.addEventListener('submit', cambiarPassword);
  }

  const inputImagen = document.getElementById('profileImageInput') as HTMLInputElement | null;
  if (inputImagen) {
    inputImagen.addEventListener('change', cambiarImagenPerfil);
  }

  const btnCerrarSesion = document.getElementById('logoutBtn');
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', cerrarSesionPerfil);
  }

  const btnEliminarCuenta = document.getElementById('deleteAccountBtn');
  if (btnEliminarCuenta) {
    btnEliminarCuenta.addEventListener('click', () => {
      const modalElement = document.getElementById('deleteAccountModal');
      if (!modalElement) return;
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    });
  }

  const btnConfirmarEliminacion = document.getElementById('confirmDeleteBtn');
  if (btnConfirmarEliminacion) {
    btnConfirmarEliminacion.addEventListener('click', eliminarCuenta);
  }
}

async function guardarPerfil(event: Event): Promise<void> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);

  const datosActualizados = {
    nombre: (formData.get('nombre') as string | null) ?? '',
    apellido: (formData.get('apellidos') as string | null) ?? '',
    email: (formData.get('email') as string | null) ?? '',
    telefono: (formData.get('telefono') as string | null) ?? '',
    fechaNacimiento: (formData.get('fechaNacimiento') as string | null) ?? '',
    direccion: (formData.get('direccion') as string | null) ?? '',
  };

  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (!submitBtn) {
    return;
  }
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  submitBtn.disabled = true;

  try {
    const resultado = await userManager.actualizarUsuario(currentUser.id, datosActualizados);

    if (resultado.success) {
      currentUser = {
        ...currentUser,
        ...datosActualizados,
      };

      mostrarMensaje('Perfil actualizado correctamente', 'success');
      cargarInformacionUsuario();
      window.actualizarNavbar?.();

      submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Guardado!';
      submitBtn.classList.remove('btn-success');
      submitBtn.classList.add('btn-primary');
    } else {
      throw new Error(resultado.mensaje || 'Error al actualizar perfil');
    }
  } catch (error) {
    console.error('Error al guardar perfil:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al actualizar perfil';
    mostrarMensaje(`Error al guardar los cambios: ${mensaje}`, 'danger');

    submitBtn.innerHTML = '<i class="fas fa-times"></i> Error';
    submitBtn.classList.remove('btn-success');
    submitBtn.classList.add('btn-danger');
  }

  window.setTimeout(() => {
    submitBtn.innerHTML = originalText;
    submitBtn.classList.remove('btn-primary', 'btn-danger');
    submitBtn.classList.add('btn-success');
    submitBtn.disabled = false;
  }, 2000);
}

async function cambiarPassword(event: Event): Promise<void> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const passwordActual = formData.get('currentPassword') as string | null;
  const passwordNueva = formData.get('newPassword') as string | null;
  const passwordConfirm = formData.get('confirmPassword') as string | null;

  if (passwordActual !== currentUser.password) {
    mostrarMensaje('La contraseña actual es incorrecta', 'danger');
    return;
  }

  if (passwordNueva !== passwordConfirm) {
    mostrarMensaje('Las contraseñas nuevas no coinciden', 'danger');
    return;
  }

  if (!passwordNueva || passwordNueva.length < 6) {
    mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres', 'danger');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (!submitBtn) {
    return;
  }
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
  submitBtn.disabled = true;

  try {
    const resultado = await userManager.actualizarUsuario(currentUser.id, {
      password: passwordNueva,
    });

    if (resultado.success) {
      currentUser.password = passwordNueva;
      form.reset();

      mostrarMensaje('Contraseña actualizada correctamente', 'success');

      submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Actualizada!';
      submitBtn.classList.remove('btn-success');
      submitBtn.classList.add('btn-primary');
    } else {
      throw new Error(resultado.mensaje || 'Error al actualizar contraseña');
    }
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al cambiar contraseña';
    mostrarMensaje(`Error al cambiar la contraseña: ${mensaje}`, 'danger');

    submitBtn.innerHTML = '<i class="fas fa-times"></i> Error';
    submitBtn.classList.remove('btn-success');
    submitBtn.classList.add('btn-danger');
  }

  window.setTimeout(() => {
    submitBtn.innerHTML = originalText;
    submitBtn.classList.remove('btn-primary', 'btn-danger');
    submitBtn.classList.add('btn-success');
    submitBtn.disabled = false;
  }, 2000);
}

function cambiarImagenPerfil(event: Event): void {
  const input = event.target as HTMLInputElement;
  const archivo = input.files?.[0];
  if (!archivo) return;

  if (!archivo.type.startsWith('image/')) {
    mostrarMensaje('Por favor selecciona una imagen válida', 'danger');
    return;
  }

  if (archivo.size > 5 * 1024 * 1024) {
    mostrarMensaje('La imagen no debe superar los 5MB', 'danger');
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    const nuevaImagen = ev.target?.result as string | undefined;
    if (!nuevaImagen) return;

    const imgElemento = document.getElementById('profileImage') as HTMLImageElement | null;
    if (imgElemento) {
      imgElemento.src = nuevaImagen;
    }

    currentUser.avatar = nuevaImagen;
    localStorage.setItem('sesionActiva', JSON.stringify(currentUser));

    mostrarMensaje('Imagen de perfil actualizada', 'success');
  };

  reader.readAsDataURL(archivo);
}

function cerrarSesionPerfil(): void {
  console.log('Perfil: Cerrando sesión...');
  localStorage.removeItem('sesionActiva');
  localStorage.removeItem('isLoggedIn');

  const currentPath = window.location.pathname;
  let redirectPath = '../../../index.html';

  if (currentPath.includes('/tienda/')) {
    redirectPath = '../../../index.html';
  }

  console.log('Perfil: Redirigiendo a:', redirectPath);
  window.location.href = redirectPath;
}

function eliminarCuenta(): void {
  localStorage.removeItem('sesionActiva');
  localStorage.removeItem('isLoggedIn');

  const modalElement = document.getElementById('deleteAccountModal');
  if (modalElement) {
    const modalInstance = bootstrap.Modal.getInstance(modalElement) ?? new bootstrap.Modal(modalElement);
    modalInstance.hide();
  }

  window.alert('Tu cuenta ha sido eliminada exitosamente.');
  window.location.href = '../../../index.html';
}

function getBadgeColor(estado: string): string {
  const colores: Record<string, string> = {
    pendiente: 'warning',
    procesando: 'info',
    enviado: 'primary',
    entregado: 'success',
    cancelado: 'danger',
  };
  return colores[estado] || 'secondary';
}

function verDetallePedido(pedidoId: string): void {
  console.log('Ver detalle del pedido:', pedidoId);
  mostrarMensaje('Funcionalidad en desarrollo', 'info');
}

function eliminarFavorito(productoId: string): void {
  if (!currentUser?.favoritos) return;

  currentUser.favoritos = currentUser.favoritos.filter((p: any) => p.id !== productoId);
  localStorage.setItem('sesionActiva', JSON.stringify(currentUser));

  cargarFavoritos();
  mostrarMensaje('Producto eliminado de favoritos', 'success');
}

function agregarAlCarrito(productoId: string): void {
  console.log('Agregar al carrito:', productoId);
  mostrarMensaje('Producto agregado al carrito', 'success');
}

function mostrarMensaje(mensaje: string, tipo: string = 'info'): void {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
  alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  document.body.appendChild(alertDiv);

  window.setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

window.mostrarSeccion = mostrarSeccion;
window.verDetallePedido = verDetallePedido;
window.eliminarFavorito = eliminarFavorito;
window.agregarAlCarrito = agregarAlCarrito;

export {};
