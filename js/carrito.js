// ==========================================
// SISTEMA DE CARRITO DE COMPRAS - HUERTOHOGAR
// ==========================================

class CartSystem {
    constructor() {
        this.cart = [];
        this.init();
        this.loadCart();
        this.updateCartIcon();
    }

    init() {
        // Event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
                const btn = e.target.classList.contains('add-to-cart-btn') ? e.target : e.target.closest('.add-to-cart-btn');
                this.addToCart(btn);
            }
        });

        // NO usar más los selectores del carrito viejo - ahora usa el carrito flotante
        // El carrito flotante se maneja con las funciones globales

        // Escuchar cambios de usuario para transferir carrito
        this.listenForUserChanges();
    }

    addToCart(button) {
        const product = {
            id: button.dataset.id,
            name: button.dataset.name,
            price: parseInt(button.dataset.price),
            unit: button.dataset.unit,
            image: button.dataset.image,
            stock: parseInt(button.dataset.stock),
            quantity: 1
        };

        // Verificar si el producto ya está en el carrito
        const existingProduct = this.cart.find(item => item.id === product.id);

        if (existingProduct) {
            if (existingProduct.quantity < product.stock) {
                existingProduct.quantity++;
                this.showNotification(`${product.name} actualizado en el carrito`, 'success');
            } else {
                this.showNotification(`Stock insuficiente para ${product.name}`, 'warning');
                return;
            }
        } else {
            this.cart.push(product);
            this.showNotification(`${product.name} agregado al carrito`, 'success');
        }

        this.saveCart();
        this.updateCartIcon();
        this.animateButton(button);
    }

    animateButton(button) {
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check me-2"></i>Agregado';
        button.classList.add('btn-success-animated');

        setTimeout(() => {
            button.innerHTML = originalContent;
            button.classList.remove('btn-success-animated');
        }, 1500);
    }

    openCart() {
        // Usar el carrito flotante global en lugar del carrito viejo
        if (typeof openFloatingCart === 'function') {
            openFloatingCart();
        }
    }

    closeCart() {
        // Usar el carrito flotante global en lugar del carrito viejo
        if (typeof closeFloatingCart === 'function') {
            closeFloatingCart();
        }
    }

    renderCart() {
        // Usar la función del carrito flotante en lugar de renderizar el carrito viejo
        if (typeof updateFloatingCartContent === 'function') {
            updateFloatingCartContent();
        } else {
            console.warn('updateFloatingCartContent no está disponible');
        }
    }

    updateQuantity(productId, newQuantity) {
        const product = this.cart.find(item => item.id === productId);
        if (!product) {
            console.warn('Producto no encontrado en carrito:', productId);
            return;
        }

        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        if (newQuantity > product.stock) {
            this.showNotification(`Stock insuficiente para ${product.name}`, 'warning');
            return;
        }

        product.quantity = newQuantity;
        this.saveCart();
        this.updateCartIcon();
        this.renderCart();
    }

    removeFromCart(productId) {
        const product = this.cart.find(item => item.id === productId);
        if (!product) {
            console.warn('Producto no encontrado para eliminar:', productId);
            return;
        }

        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartIcon();
        this.renderCart();
        this.showNotification(`${product.name} eliminado del carrito`, 'info');
    }

    clearCart() {
        if (this.cart.length === 0) return;

        if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
            this.cart = [];
            this.saveCart();
            this.updateCartIcon();
            this.renderCart();
            this.showNotification('Carrito vaciado', 'info');
        }
    }

    // Función para limpiar carrito sin confirmación (para checkout exitoso)
    clearCartSilent() {
        this.cart = [];
        this.saveCart();
        this.updateCartIcon();
        this.renderCart();
    }

    checkout() {
        if (this.cart.length === 0) {
            this.showNotification('El carrito está vacío', 'warning');
            return;
        }

        // Cerrar el carrito flotante
        if (typeof closeFloatingCart === 'function') {
            closeFloatingCart();
        }

        // Determinar la ruta correcta según la ubicación actual
        const currentPath = window.location.pathname;
        let checkoutPath;
        
        if (currentPath.includes('/client/tienda/')) {
            // Ya estamos en la carpeta tienda
            checkoutPath = 'checkout.html';
        } else if (currentPath.endsWith('index.html') || currentPath.endsWith('/huertito/') || !currentPath.includes('/client/')) {
            // Estamos en index.html
            checkoutPath = 'pages/client/tienda/checkout.html';
        } else {
            // Estamos en otra carpeta de client
            checkoutPath = '../tienda/checkout.html';
        }

        // Redirigir a la página de checkout
        window.location.href = checkoutPath;
    }



    redirectToLogin() {
        // Guardar la página actual como origen
        localStorage.setItem('paginaOrigen', window.location.pathname);
        this.showNotification('Inicia sesión para finalizar tu compra', 'info');

        // Redirigir al login
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 1500);
    }

    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getTotalItems() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(price);
    }

    getCurrentUser() {
        // Integración con el sistema de autenticación existente
        if (typeof obtenerUsuarioLogueado === 'function') {
            return obtenerUsuarioLogueado();
        }

        try {
            const userData = localStorage.getItem('usuarioLogueado');
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            return null;
        }
    }

    getCartKey() {
        const user = this.getCurrentUser();
        return user ? `carrito_${user.email}` : 'carrito_guest';
    }

    saveCart() {
        const cartKey = this.getCartKey();
        localStorage.setItem(cartKey, JSON.stringify(this.cart));
    }

    loadCart() {
        const cartKey = this.getCartKey();
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) {
            try {
                this.cart = JSON.parse(savedCart);
            } catch (e) {
                this.cart = [];
            }
        }
    }

    transferGuestCart() {
        // Transferir carrito de invitado a usuario logueado
        const guestCart = localStorage.getItem('carrito_guest');
        if (guestCart && this.getCurrentUser()) {
            try {
                const guestItems = JSON.parse(guestCart);
                if (guestItems.length > 0) {
                    // Combinar con carrito actual
                    guestItems.forEach(guestItem => {
                        const existingItem = this.cart.find(item => item.id === guestItem.id);
                        if (existingItem) {
                            existingItem.quantity = Math.min(existingItem.quantity + guestItem.quantity, existingItem.stock);
                        } else {
                            this.cart.push(guestItem);
                        }
                    });

                    this.saveCart();
                    this.updateCartIcon();
                    
                    // Actualizar el carrito flotante si está disponible
                    if (typeof updateFloatingCartContent === 'function') {
                        updateFloatingCartContent();
                    }
                    if (typeof updateFloatingCartBadge === 'function') {
                        updateFloatingCartBadge();
                    }

                    // Limpiar carrito de invitado
                    localStorage.removeItem('carrito_guest');

                    console.log(`Carrito transferido: ${guestItems.length} productos`);
                }
            } catch (e) {
                console.error('Error transfiriendo carrito:', e);
            }
        }
    }

    listenForUserChanges() {
        // Escuchar cambios en el localStorage para detectar login/logout
        let currentUser = this.getCurrentUser();
        let lastUserCheck = currentUser ? currentUser.email : null;

        // Usar intervalos más eficientes y solo verificar cuando sea necesario
        const checkUserChanges = () => {
            const newUser = this.getCurrentUser();
            const newUserCheck = newUser ? newUser.email : null;

            // Solo procesar si realmente cambió el usuario
            if (lastUserCheck !== newUserCheck) {
                // Detectar login
                if (!currentUser && newUser) {
                    console.log('Usuario logueado, transfiriendo carrito...');
                    currentUser = newUser;
                    this.transferGuestCart();
                    this.loadCart();
                    this.updateCartIcon();
                }

                // Detectar logout
                else if (currentUser && !newUser) {
                    console.log('Usuario deslogueado, cambiando a carrito de invitado...');
                    currentUser = null;
                    this.cart = [];
                    this.loadCart(); // Cargar carrito de invitado si existe
                    this.updateCartIcon();
                    
                    // Actualizar carrito flotante si está disponible
                    if (typeof updateFloatingCartContent === 'function') {
                        updateFloatingCartContent();
                    }
                }

                lastUserCheck = newUserCheck;
            }
        };

        // Verificar cada 2 segundos (menos frecuente para mejor rendimiento)
        setInterval(checkUserChanges, 2000);
        
        // También escuchar el evento de cambio en localStorage para detección inmediata
        window.addEventListener('storage', (e) => {
            if (e.key === 'user' || e.key === 'currentUser') {
                checkUserChanges();
            }
        });
    }

    updateCartIcon() {
        // Agregar icono del carrito a la navbar si no existe
        this.addCartIconToNavbar();

        // Actualizar contador en navbar
        const cartBadge = document.querySelector('.cart-badge');
        const totalItems = this.getTotalItems();

        if (cartBadge) {
            if (totalItems > 0) {
                cartBadge.textContent = totalItems > 99 ? '99+' : totalItems;
                cartBadge.style.display = 'flex';
            } else {
                cartBadge.style.display = 'none';
            }
        }
        
        // Actualizar carrito flotante también
        if (typeof updateFloatingCartBadge === 'function') {
            updateFloatingCartBadge();
        }
    }

    addCartIconToNavbar() {
        // YA NO AGREGAMOS ICONO A LA NAVBAR - USAMOS CARRITO FLOTANTE
        // Esta función ya no hace nada porque el carrito flotante reemplaza al icono de navbar
        return;
    }

    showNotification(message, type = 'success') {
        // Integración con el sistema de notificaciones existente
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion(message, type);
        } else {
            // Fallback básico
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Inicializar el sistema de carrito
let cartSystem;

// Función de inicialización del carrito
function initializeCartSystem() {
    console.log('Inicializando CartSystem...');
    cartSystem = new CartSystem();
    
    // Forzar asignación global
    window.cartSystem = cartSystem;
    
    console.log('CartSystem inicializado:', window.cartSystem);

    // Verificar que las funciones globales estén disponibles
    console.log('Funciones globales disponibles:', {
        updateCartQuantity: typeof window.updateCartQuantity,
        removeFromCart: typeof window.removeFromCart,
        proceedToCheckout: typeof window.proceedToCheckout
    });
}

// Exportar para uso global
window.CartSystem = CartSystem;
window.initializeCartSystem = initializeCartSystem;

// Función de test para debugging (solo para desarrollo)
window.testCartFunctions = function() {
    console.log('=== TEST DE FUNCIONES DEL CARRITO ===');
    console.log('CartSystem existe:', !!window.cartSystem);
    console.log('updateCartQuantity existe:', typeof window.updateCartQuantity);
    console.log('removeFromCart existe:', typeof window.removeFromCart);
    console.log('proceedToCheckout existe:', typeof window.proceedToCheckout);
    
    if (window.cartSystem) {
        console.log('Carrito actual:', window.cartSystem.cart);
        console.log('Total items:', window.cartSystem.getTotalItems());
    }
};

function getCartItems() {
    // Usar la misma lógica que CartSystem para obtener los items del carrito
    if (window.cartSystem) {
        return window.cartSystem.cart;
    }
    
    // Fallback: usar la clave correcta del carrito
    const user = getCurrentUser();
    const cartKey = user ? `carrito_${user.email}` : 'carrito_guest';
    return JSON.parse(localStorage.getItem(cartKey)) || [];
}

function getCurrentUser() {
    // Integración con el sistema de autenticación existente
    if (typeof obtenerUsuarioLogueado === 'function') {
        return obtenerUsuarioLogueado();
    }

    try {
        const userData = localStorage.getItem('usuarioLogueado');
        return userData ? JSON.parse(userData) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Inicializa el carrito flotante global
 */
function initializeFloatingCart() {
    console.log('Inicializando carrito flotante...');
    
    // Event listeners para el carrito flotante
    const floatingBtn = document.getElementById('floatingCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCart');
    
    if (floatingBtn) {
        floatingBtn.addEventListener('click', openFloatingCart);
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeFloatingCart);
    }
    
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeFloatingCart);
    }
    
    // Actualizar el badge del carrito
    updateFloatingCartBadge();
}

/**
 * Abre el carrito flotante
 */
function openFloatingCart() {
    const cartOverlay = document.getElementById('cartOverlay');
    const cartSidebar = document.getElementById('cartSidebar');
    
    if (cartOverlay && cartSidebar) {
        cartOverlay.classList.add('active');
        cartSidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Actualizar contenido del carrito
        updateFloatingCartContent();
    }
}

/**
 * Cierra el carrito flotante
 */
function closeFloatingCart() {
    const cartOverlay = document.getElementById('cartOverlay');
    const cartSidebar = document.getElementById('cartSidebar');
    
    if (cartOverlay && cartSidebar) {
        cartOverlay.classList.remove('active');
        cartSidebar.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Actualiza el badge del carrito flotante
 */
function updateFloatingCartBadge() {
    const badge = document.getElementById('cartBadge');
    
    // Usar el carrito del sistema actual
    const cart = getCartItems();
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    if (badge) {
        badge.textContent = totalItems;
        
        // Mostrar/ocultar badge según la cantidad
        if (totalItems > 0) {
            badge.style.display = 'flex';
            badge.classList.remove('hidden');
        } else {
            badge.style.display = 'none';
            badge.classList.add('hidden');
        }
        
        // Animación de pulso cuando hay items
        if (totalItems > 0) {
            const floatingBtn = document.getElementById('floatingCartBtn');
            if (floatingBtn) {
                floatingBtn.classList.add('pulse');
                setTimeout(() => floatingBtn.classList.remove('pulse'), 600);
            }
        }
    }
}

/**
 * Actualiza el contenido del carrito flotante
 */
function updateFloatingCartContent() {
    const cartBody = document.getElementById('cartBody');
    const cartFooter = document.getElementById('cartFooter');
    
    // Usar el carrito del sistema actual
    const cart = getCartItems();
    
    if (!cartBody || !cartFooter) {
        console.warn('Elementos del carrito flotante no encontrados');
        return;
    }
    
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-shopping-basket fs-1 text-muted mb-3"></i>
                <h6 class="text-muted">Tu carrito está vacío</h6>
                <p class="text-muted small">Agrega productos desde el catálogo</p>
            </div>
        `;
        cartFooter.innerHTML = '';
        return;
    }
    
    // Generar contenido del carrito
    const cartHTML = cart.map(item => {
        const decreaseBtn = `<button class="btn btn-sm btn-outline-secondary" onclick="window.updateCartQuantity('${item.id}', ${item.quantity - 1})" style="width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 14px;">-</button>`;
        const increaseBtn = `<button class="btn btn-sm btn-outline-secondary" onclick="window.updateCartQuantity('${item.id}', ${item.quantity + 1})" style="width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 14px;">+</button>`;
        const deleteBtn = `<button class="btn btn-sm btn-outline-danger" onclick="window.removeFromCart('${item.id}')" style="width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center;"><i class="fas fa-trash" style="font-size: 12px;"></i></button>`;
        
        return `
        <div class="cart-item" style="border-bottom: 1px solid #dee2e6; padding-bottom: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="flex-shrink: 0;">
                    <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                </div>
                <div style="flex: 1;">
                    <h6 style="margin: 0 0 0.5rem 0; font-size: 14px; font-weight: 600;">${item.name}</h6>
                    <p style="margin: 0 0 0.5rem 0; font-size: 12px; color: #6c757d;">$${item.price.toLocaleString()} / ${item.unit}</p>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            ${decreaseBtn}
                            <span style="min-width: 20px; text-align: center; font-weight: 500;">${item.quantity}</span>
                            ${increaseBtn}
                        </div>
                        ${deleteBtn}
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartBody.innerHTML = cartHTML;
    cartFooter.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; border-top: 1px solid #dee2e6; background: #f8f9fa;">
            <strong style="font-size: 16px;">Total: $${total.toLocaleString()}</strong>
        </div>
        <div style="padding: 0 1rem 1rem 1rem;">
            <button class="btn btn-success" onclick="window.proceedToCheckout()" style="width: 100%; padding: 12px; font-weight: 600;">
                <i class="fas fa-credit-card" style="margin-right: 8px;"></i>Proceder al Pago
            </button>
        </div>
    `;
}

// Hacer funciones globales
window.initializeFloatingCart = initializeFloatingCart;
window.openFloatingCart = openFloatingCart;
window.closeFloatingCart = closeFloatingCart;
window.updateFloatingCartBadge = updateFloatingCartBadge;
window.updateFloatingCartContent = updateFloatingCartContent;

// Funciones globales para manejar el carrito desde el HTML
window.updateCartQuantity = function(productId, newQuantity) {
    console.log('updateCartQuantity llamada:', { productId, newQuantity, cartSystemExists: !!window.cartSystem });
    
    if (!window.cartSystem) {
        console.error('CartSystem no está inicializado');
        // Intentar inicializar si no existe
        if (typeof initializeCartSystem === 'function') {
            initializeCartSystem();
        }
        return;
    }
    
    window.cartSystem.updateQuantity(productId, newQuantity);
};

window.removeFromCart = function(productId) {
    console.log('removeFromCart llamada:', { productId, cartSystemExists: !!window.cartSystem });
    
    if (!window.cartSystem) {
        console.error('CartSystem no está inicializado');
        // Intentar inicializar si no existe
        if (typeof initializeCartSystem === 'function') {
            initializeCartSystem();
        }
        return;
    }
    
    window.cartSystem.removeFromCart(productId);
};

window.proceedToCheckout = function() {
    console.log('proceedToCheckout llamada:', { cartSystemExists: !!window.cartSystem });
    
    if (!window.cartSystem) {
        console.error('CartSystem no está inicializado');
        return;
    }
    
    window.cartSystem.checkout();
};

// FORZAR FUNCIONES GLOBALES AL FINAL
console.log('Definiendo funciones globales del carrito...');

// Definir funciones inmediatamente
if (!window.updateCartQuantity) {
    window.updateCartQuantity = function(productId, newQuantity) {
        if (window.cartSystem) {
            window.cartSystem.updateQuantity(productId, newQuantity);
        } else {
            console.warn('CartSystem no disponible');
        }
    };
}

if (!window.removeFromCart) {
    window.removeFromCart = function(productId) {
        if (window.cartSystem) {
            window.cartSystem.removeFromCart(productId);
        } else {
            console.warn('CartSystem no disponible');
        }
    };
}

if (!window.proceedToCheckout) {
    window.proceedToCheckout = function() {
        if (window.cartSystem) {
            window.cartSystem.checkout();
        } else {
            console.warn('CartSystem no disponible');
        }
    };
}

// Debugging de inicialización - DESPUÉS de definir todas las funciones
console.log('=== CARRITO.JS CARGADO ===');
setTimeout(() => {
    console.log('Funciones definidas:', {
        updateCartQuantity: typeof window.updateCartQuantity,
        removeFromCart: typeof window.removeFromCart,
        proceedToCheckout: typeof window.proceedToCheckout,
        testCartFunctions: typeof window.testCartFunctions
    });
}, 100);