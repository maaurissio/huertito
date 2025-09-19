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

        // Cerrar carrito
        document.getElementById('closeCart')?.addEventListener('click', () => this.closeCart());
        document.getElementById('cartOverlay')?.addEventListener('click', () => this.closeCart());

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
        this.renderCart();
        document.getElementById('cartSidebar').classList.add('cart-active');
        document.getElementById('cartOverlay').classList.add('cart-overlay-active');
        document.body.style.overflow = 'hidden';
    }

    closeCart() {
        document.getElementById('cartSidebar').classList.remove('cart-active');
        document.getElementById('cartOverlay').classList.remove('cart-overlay-active');
        document.body.style.overflow = '';
    }

    renderCart() {
        const cartBody = document.getElementById('cartBody');
        const cartFooter = document.getElementById('cartFooter');

        if (this.cart.length === 0) {
            cartBody.innerHTML = `
                <div class="empty-cart text-center py-5">
                    <i class="fas fa-shopping-cart text-muted mb-3" style="font-size: 4rem;"></i>
                    <h5 class="text-muted">Tu carrito está vacío</h5>
                    <p class="text-muted small">Agrega algunos productos frescos para comenzar</p>
                </div>
            `;
            cartFooter.innerHTML = '';
            return;
        }

        // Renderizar productos
        let cartHTML = '<div class="cart-items p-3">';
        let total = 0;

        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            cartHTML += `
                <div class="cart-item mb-3 p-3 bg-light rounded-3">
                    <div class="row align-items-center">
                        <div class="col-3">
                            <img src="${item.image}" class="img-fluid rounded" alt="${item.name}" style="height: 60px; object-fit: cover;">
                        </div>
                        <div class="col-6">
                            <h6 class="mb-1 fw-semibold">${item.name}</h6>
                            <small class="text-muted">${this.formatPrice(item.price)}${item.unit}</small>
                        </div>
                        <div class="col-3">
                            <div class="d-flex align-items-center justify-content-end mb-2">
                                <button class="btn btn-sm btn-outline-secondary cart-quantity-btn me-1" onclick="cartSystem.updateQuantity('${item.id}', ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="fw-semibold mx-2">${item.quantity}</span>
                                <button class="btn btn-sm btn-outline-secondary cart-quantity-btn ms-1" onclick="cartSystem.updateQuantity('${item.id}', ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="text-end mb-1">
                                <small class="text-success fw-semibold">${this.formatPrice(itemTotal)}</small>
                            </div>
                            <div class="text-end">
                                <button class="btn btn-sm btn-link text-danger p-0" onclick="cartSystem.removeFromCart('${item.id}')" title="Eliminar producto">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        cartHTML += '</div>';
        cartBody.innerHTML = cartHTML;

        // Renderizar footer
        const user = this.getCurrentUser();
        const checkoutButton = user ?
            '<button class="btn btn-success w-100 mb-2" onclick="cartSystem.checkout()"><i class="fas fa-credit-card me-2"></i>Finalizar Compra</button>' :
            '<button class="btn btn-warning w-100 mb-2" onclick="cartSystem.redirectToLogin()"><i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión para Comprar</button>';

        cartFooter.innerHTML = `
            <div class="cart-total p-4 border-top">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="h5 mb-0">Total:</span>
                    <span class="h4 mb-0 text-success fw-bold">${this.formatPrice(total)}</span>
                </div>
                <div class="mb-2">
                    <small class="text-muted">
                        <i class="fas fa-box me-1"></i>
                        ${this.getTotalItems()} producto${this.getTotalItems() !== 1 ? 's' : ''}
                    </small>
                </div>
                ${checkoutButton}
                <button class="btn btn-outline-secondary w-100" onclick="cartSystem.clearCart()">
                    <i class="fas fa-trash me-2"></i>Vaciar Carrito
                </button>
            </div>
        `;
    }

    updateQuantity(productId, newQuantity) {
        const product = this.cart.find(item => item.id === productId);
        if (!product) return;

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
        if (!product) return;

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

    checkout() {
        const user = this.getCurrentUser();
        if (!user) {
            this.redirectToLogin();
            return;
        }

        if (this.cart.length === 0) {
            this.showNotification('El carrito está vacío', 'warning');
            return;
        }

        // Guardar la información del pedido en el localStorage
        const orderData = {
            user: {
                nombre: user.nombre,
                email: user.email
            },
            total: this.getTotal(),
            items: this.cart
        };

        // Guardar los datos de la compra en el localStorage
        localStorage.setItem('orderData', JSON.stringify(orderData));

        // Vaciar el carrito
        this.cart = [];
        this.saveCart();
        this.updateCartIcon();
        this.closeCart();

        // Redirigir a boleta.html
        window.location.href = '../../../pages/client/tienda/boleta.html';

        this.showNotification('¡Pedido realizado exitosamente!', 'success');
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

                    // Limpiar carrito de invitado
                    localStorage.removeItem('carrito_guest');

                    this.showNotification('Carrito transferido exitosamente', 'success');
                }
            } catch (e) {
                console.error('Error transfiriendo carrito:', e);
            }
        }
    }

    listenForUserChanges() {
        // Escuchar cambios en el localStorage para detectar login/logout
        let currentUser = this.getCurrentUser();

        setInterval(() => {
            const newUser = this.getCurrentUser();

            // Detectar login
            if (!currentUser && newUser) {
                currentUser = newUser;
                this.transferGuestCart();
                this.loadCart();
                this.updateCartIcon();
            }

            // Detectar logout
            if (currentUser && !newUser) {
                currentUser = null;
                this.cart = [];
                this.loadCart(); // Cargar carrito de invitado si existe
                this.updateCartIcon();
            }
        }, 1000);
    }

    updateCartIcon() {
        // Agregar icono del carrito a la navbar si no existe
        this.addCartIconToNavbar();

        // Actualizar contador
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
    }

    addCartIconToNavbar() {
        // Esperar a que la navbar se cargue
        setTimeout(() => {
            const navbar = document.querySelector('.navbar-nav');
            if (!navbar) return;

            // Verificar si ya existe el icono del carrito
            if (document.querySelector('.cart-icon-container')) return;

            // Crear icono del carrito
            const cartIcon = document.createElement('li');
            cartIcon.className = 'nav-item cart-icon-container';
            cartIcon.innerHTML = `
                <button class="nav-link btn btn-link position-relative" onclick="cartSystem.openCart()" style="border: none; background: none;" title="Abrir carrito">
                    <i class="fas fa-shopping-cart text-success fs-5"></i>
                    <span class="cart-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display: none;">
                        0
                    </span>
                </button>
            `;

            // Insertar antes del último elemento (botones de login/registro o menú de usuario)
            const lastItem = navbar.lastElementChild;
            navbar.insertBefore(cartIcon, lastItem);

        }, 500);
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
    cartSystem = new CartSystem();

    // Inicializar navbar dinámico si existe la función
    if (typeof inicializarNavbarDinamico === 'function') {
        inicializarNavbarDinamico();
    }
}

// Exportar para uso global
window.CartSystem = CartSystem;
window.initializeCartSystem = initializeCartSystem;

function getCartItems() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}
