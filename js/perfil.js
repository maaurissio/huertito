/**
 * ==========================================
 * PERFIL DE USUARIO - HUERTOHOGAR
 * JavaScript para la página de perfil del usuario
 * ==========================================
 */

// Variables globales
let currentUser = null;

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Cargar componentes compartidos
    if (typeof loadComponent === 'function') {
        loadComponent('navbar-container', '../shared/navbar.html');
        loadComponent('footer-container', '../shared/footer.html');
    }
    
    // Inicializar después de un breve delay para que los componentes se carguen
    setTimeout(() => {
        // Verificar autenticación
        if (!verificarAutenticacion()) {
            window.location.href = '../../index.html';
            return;
        }

        // Cargar información del usuario
        cargarInformacionUsuario();
        
        // Configurar navegación por URL
        configurarNavegacionURL();
        
        // Configurar listeners de eventos
        configurarEventListeners();
        
        // Mostrar sección inicial
        mostrarSeccionInicial();
    }, 100);
});

/**
 * Verificar si el usuario está autenticado
 */
function verificarAutenticacion() {
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

/**
 * Cargar información del usuario en la interfaz
 */
function cargarInformacionUsuario() {
    if (!currentUser) return;

    // Actualizar nombre de usuario (nombre completo)
    const userNameElemento = document.getElementById('userName');
    if (userNameElemento) {
        const nombreCompleto = `${currentUser.nombre || ''} ${currentUser.apellido || ''}`.trim();
        userNameElemento.textContent = nombreCompleto || 'Usuario';
    }

    // Actualizar email
    const emailElementos = document.querySelectorAll('#userEmail, #profileEmail');
    emailElementos.forEach(elemento => {
        if (elemento) {
            elemento.textContent = currentUser.email || '';
            if (elemento.tagName === 'INPUT') {
                elemento.value = currentUser.email || '';
            }
        }
    });

    // Actualizar teléfono si existe
    const telefonoElemento = document.getElementById('profilePhone');
    if (telefonoElemento) {
        telefonoElemento.value = currentUser.telefono || '';
    }

    // Actualizar dirección si existe
    const direccionElemento = document.getElementById('profileAddress');
    if (direccionElemento) {
        direccionElemento.value = currentUser.direccion || '';
    }

    // Actualizar nombre en formulario
    const nombreElemento = document.getElementById('profileName');
    if (nombreElemento) {
        nombreElemento.value = currentUser.nombre || '';
    }

    // Actualizar apellidos en formulario (usando apellido desde JSON)
    const apellidosElemento = document.getElementById('profileLastName');
    if (apellidosElemento) {
        apellidosElemento.value = currentUser.apellido || '';
    }

    // Actualizar fecha de nacimiento
    const fechaNacElemento = document.getElementById('profileBirthDate');
    if (fechaNacElemento) {
        fechaNacElemento.value = currentUser.fechaNacimiento || '';
    }

    // Actualizar fecha de registro
    const joinDateElemento = document.getElementById('joinDate');
    if (joinDateElemento && currentUser.fechaRegistro) {
        const fecha = new Date(currentUser.fechaRegistro);
        joinDateElemento.textContent = fecha.getFullYear();
    }

    // Actualizar avatar
    const avatarElemento = document.getElementById('profileImage');
    if (avatarElemento) {
        avatarElemento.src = currentUser.avatar || '../../../img/usuario-avatar.webp';
    }
}

/**
 * Configurar navegación basada en URL
 */
function configurarNavegacionURL() {
    // Escuchar cambios en la URL
    window.addEventListener('popstate', function() {
        mostrarSeccionActual();
    });
}

/**
 * Mostrar sección inicial basada en URL o por defecto
 */
function mostrarSeccionInicial() {
    const urlParams = new URLSearchParams(window.location.search);
    const seccion = urlParams.get('section');
    
    if (seccion) {
        mostrarSeccion(seccion);
    } else {
        mostrarSeccion('general');
    }
}

/**
 * Mostrar sección actual basada en URL
 */
function mostrarSeccionActual() {
    const urlParams = new URLSearchParams(window.location.search);
    const seccion = urlParams.get('section') || 'general';
    mostrarSeccion(seccion);
}

/**
 * Mostrar una sección específica del perfil
 */
function mostrarSeccion(seccionId) {
    // Ocultar todas las secciones
    const secciones = document.querySelectorAll('.profile-section');
    secciones.forEach(seccion => {
        seccion.classList.remove('active');
    });

    // Mostrar la sección seleccionada
    const seccionActiva = document.getElementById(seccionId);
    if (seccionActiva) {
        seccionActiva.classList.add('active');
    }

    // Actualizar navegación activa
    actualizarNavegacionActiva(seccionId);

    // Actualizar URL sin recargar la página
    const nuevaURL = `${window.location.pathname}?section=${seccionId}`;
    window.history.pushState({ section: seccionId }, '', nuevaURL);

    // Cargar contenido específico de la sección
    cargarContenidoSeccion(seccionId);
}

/**
 * Actualizar el estado activo de la navegación
 */
function actualizarNavegacionActiva(seccionId) {
    // Remover active de todos los enlaces
    const enlaces = document.querySelectorAll('.sidebar .nav-link');
    enlaces.forEach(enlace => {
        enlace.classList.remove('active');
    });

    // Agregar active al enlace correspondiente
    const enlaceActivo = document.querySelector(`[onclick="mostrarSeccion('${seccionId}')"]`);
    if (enlaceActivo) {
        enlaceActivo.classList.add('active');
    }
}

/**
 * Cargar contenido específico de cada sección
 */
function cargarContenidoSeccion(seccionId) {
    switch (seccionId) {
        case 'pedidos':
            cargarPedidos();
            break;
        case 'favoritos':
            cargarFavoritos();
            break;
        case 'general':
            // Ya se carga en la inicialización
            break;
        case 'configuracion':
            // Configuración ya está en el HTML
            break;
        default:
            console.log('Sección no reconocida:', seccionId);
    }
}

/**
 * Cargar lista de pedidos del usuario
 */
function cargarPedidos() {
    const pedidos = currentUser.pedidos || [];
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
    pedidos.forEach(pedido => {
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

/**
 * Cargar lista de productos favoritos
 */
function cargarFavoritos() {
    const favoritos = currentUser.favoritos || [];
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
    favoritos.forEach(producto => {
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

/**
 * Configurar todos los event listeners
 */
function configurarEventListeners() {
    // Formulario de perfil
    const formPerfil = document.getElementById('profileForm');
    if (formPerfil) {
        formPerfil.addEventListener('submit', guardarPerfil);
    }

    // Formulario de contraseña
    const formPassword = document.getElementById('passwordForm');
    if (formPassword) {
        formPassword.addEventListener('submit', cambiarPassword);
    }

    // Upload de imagen de perfil
    const inputImagen = document.getElementById('profileImageInput');
    if (inputImagen) {
        inputImagen.addEventListener('change', cambiarImagenPerfil);
    }

    // Cerrar sesión
    const btnCerrarSesion = document.getElementById('logoutBtn');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', cerrarSesion);
    }

    // Eliminar cuenta
    const btnEliminarCuenta = document.getElementById('deleteAccountBtn');
    if (btnEliminarCuenta) {
        btnEliminarCuenta.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
            modal.show();
        });
    }

    // Confirmar eliminación de cuenta
    const btnConfirmarEliminacion = document.getElementById('confirmDeleteBtn');
    if (btnConfirmarEliminacion) {
        btnConfirmarEliminacion.addEventListener('click', eliminarCuenta);
    }
}

/**
 * Guardar cambios del perfil
 */
async function guardarPerfil(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Preparar datos actualizados - usar 'apellido' (singular) para coincidir con JSON
    const datosActualizados = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellidos'), // Nota: del formulario viene 'apellidos' pero guardamos como 'apellido'
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        fechaNacimiento: formData.get('fechaNacimiento'),
        direccion: formData.get('direccion')
    };

    // Mostrar estado de carga
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;

    try {
        // Actualizar usando UserManager (esto sincroniza con JSON y localStorage)
        const resultado = await userManager.actualizarUsuario(currentUser.id, datosActualizados);
        
        if (resultado.exito) {
            // Actualizar currentUser local
            currentUser = {
                ...currentUser,
                ...datosActualizados
            };
            
            // Mostrar mensaje de éxito
            mostrarMensaje('Perfil actualizado correctamente', 'success');
            
            // Recargar información en la interfaz
            cargarInformacionUsuario();
            
            // Actualizar navbar también
            if (typeof actualizarNavbar === 'function') {
                actualizarNavbar();
            }
            
            submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Guardado!';
            submitBtn.classList.remove('btn-success');
            submitBtn.classList.add('btn-primary');
            
        } else {
            throw new Error(resultado.mensaje || 'Error al actualizar perfil');
        }
        
    } catch (error) {
        console.error('Error al guardar perfil:', error);
        mostrarMensaje('Error al guardar los cambios: ' + error.message, 'error');
        
        submitBtn.innerHTML = '<i class="fas fa-times"></i> Error';
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-danger');
    }
    
    // Restaurar botón después de un momento
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.classList.remove('btn-primary', 'btn-danger');
        submitBtn.classList.add('btn-success');
        submitBtn.disabled = false;
    }, 2000);
}

/**
 * Cambiar contraseña del usuario
 */
async function cambiarPassword(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const passwordActual = formData.get('currentPassword');
    const passwordNueva = formData.get('newPassword');
    const passwordConfirm = formData.get('confirmPassword');

    // Validaciones
    if (passwordActual !== currentUser.password) {
        mostrarMensaje('La contraseña actual es incorrecta', 'danger');
        return;
    }

    if (passwordNueva !== passwordConfirm) {
        mostrarMensaje('Las contraseñas nuevas no coinciden', 'danger');
        return;
    }

    if (passwordNueva.length < 6) {
        mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres', 'danger');
        return;
    }

    // Mostrar estado de carga
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    submitBtn.disabled = true;

    try {
        // Actualizar contraseña usando UserManager
        const resultado = await userManager.actualizarUsuario(currentUser.id, { 
            password: passwordNueva 
        });
        
        if (resultado.exito) {
            // Actualizar password local
            currentUser.password = passwordNueva;
            
            // Limpiar formulario
            event.target.reset();
            
            mostrarMensaje('Contraseña actualizada correctamente', 'success');
            
            submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Actualizada!';
            submitBtn.classList.remove('btn-success');
            submitBtn.classList.add('btn-primary');
            
        } else {
            throw new Error(resultado.mensaje || 'Error al actualizar contraseña');
        }
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarMensaje('Error al cambiar la contraseña: ' + error.message, 'error');
        
        submitBtn.innerHTML = '<i class="fas fa-times"></i> Error';
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-danger');
    }
    
    // Restaurar botón después de un momento
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.classList.remove('btn-primary', 'btn-danger');
        submitBtn.classList.add('btn-success');
        submitBtn.disabled = false;
    }, 2000);
}

/**
 * Cambiar imagen de perfil
 */
function cambiarImagenPerfil(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    // Validar tipo de archivo
    if (!archivo.type.startsWith('image/')) {
        mostrarMensaje('Por favor selecciona una imagen válida', 'danger');
        return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
        mostrarMensaje('La imagen no debe superar los 5MB', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const nuevaImagen = e.target.result;
        
        // Actualizar imagen en la interfaz
        const imgElemento = document.getElementById('profileImage');
        if (imgElemento) {
            imgElemento.src = nuevaImagen;
        }

        // Guardar en el usuario
        currentUser.avatar = nuevaImagen;
        localStorage.setItem('sesionActiva', JSON.stringify(currentUser));
        
        mostrarMensaje('Imagen de perfil actualizada', 'success');
    };

    reader.readAsDataURL(archivo);
}

/**
 * Cerrar sesión del usuario
 */
function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '../../index.html';
}

/**
 * Eliminar cuenta del usuario
 */
function eliminarCuenta() {
    // Limpiar todos los datos del usuario
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('isLoggedIn');
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal'));
    if (modal) {
        modal.hide();
    }
    
    // Redirigir con mensaje
    alert('Tu cuenta ha sido eliminada exitosamente.');
    window.location.href = '../../index.html';
}

/**
 * Funciones auxiliares
 */

function getBadgeColor(estado) {
    const colores = {
        'pendiente': 'warning',
        'procesando': 'info',
        'enviado': 'primary',
        'entregado': 'success',
        'cancelado': 'danger'
    };
    return colores[estado] || 'secondary';
}

function verDetallePedido(pedidoId) {
    // Implementar modal o navegación a detalle del pedido
    console.log('Ver detalle del pedido:', pedidoId);
    mostrarMensaje('Funcionalidad en desarrollo', 'info');
}

function eliminarFavorito(productoId) {
    if (!currentUser.favoritos) return;
    
    currentUser.favoritos = currentUser.favoritos.filter(p => p.id !== productoId);
    localStorage.setItem('sesionActiva', JSON.stringify(currentUser));
    
    cargarFavoritos();
    mostrarMensaje('Producto eliminado de favoritos', 'success');
}

function agregarAlCarrito(productoId) {
    // Implementar lógica de carrito
    console.log('Agregar al carrito:', productoId);
    mostrarMensaje('Producto agregado al carrito', 'success');
}

function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear toast o alert para mostrar mensajes
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Hacer funciones globales para uso en onclick
window.mostrarSeccion = mostrarSeccion;
window.verDetallePedido = verDetallePedido;
window.eliminarFavorito = eliminarFavorito;
window.agregarAlCarrito = agregarAlCarrito;