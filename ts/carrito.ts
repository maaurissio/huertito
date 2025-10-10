import { ISesionActiva } from './models.js';

type ToastTypeGlobal = 'success' | 'error' | 'info' | 'warning';
type NotificacionTipo = ToastTypeGlobal;

interface CartItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  image?: string;
  stock: number;
  quantity: number;
}

declare global {
  interface Window {
    cartSystem?: CartSystem;
    CartSystem?: typeof CartSystem;
    initializeCartSystem?: typeof initializeCartSystem;
    updateFloatingCartContent?: () => void;
    updateFloatingCartBadge?: () => void;
    openFloatingCart?: () => void;
    closeFloatingCart?: () => void;
  mostrarNotificacion?: (mensaje: string, tipo?: ToastTypeGlobal, duracion?: number) => HTMLElement | null;
    obtenerUsuarioLogueado?: () => ISesionActiva | null;
    updateCartQuantity?: unknown;
    removeFromCart?: unknown;
    proceedToCheckout?: unknown;
  }
}

class CartSystem {
  private cart: CartItem[] = [];

  private userCheckInterval: number | undefined;

  constructor() {
    this.init();
    this.loadCart();
    this.updateCartIcon();
  }

  private init(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.classList.contains('add-to-cart-btn') || target.closest('.add-to-cart-btn')) {
        const buttonElement = target.classList.contains('add-to-cart-btn')
          ? target
          : (target.closest('.add-to-cart-btn') as HTMLElement | null);
        if (buttonElement) {
          this.addToCart(buttonElement);
        }
      }
    });

    this.listenForUserChanges();
  }

  public addToCart(button: HTMLElement): void {
    const dataset = button.dataset;
    const id = dataset.id ?? '';
    if (!id) {
      console.warn('CartSystem: botón sin data-id');
      return;
    }

    const product: CartItem = {
      id,
      name: dataset.name ?? 'Producto',
      price: Number.parseInt(dataset.price ?? '0', 10) || 0,
      stock: Number.parseInt(dataset.stock ?? '0', 10) || 0,
      quantity: 1,
    };

    if (dataset.unit) {
      product.unit = dataset.unit;
    }

    if (dataset.image) {
      product.image = dataset.image;
    }

    const existingProduct = this.cart.find((item) => item.id === product.id);

    if (existingProduct) {
      if (existingProduct.quantity < product.stock) {
        existingProduct.quantity += 1;
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

  private animateButton(button: HTMLElement): void {
    const element = button as HTMLButtonElement;
    const originalContent = element.innerHTML;
    element.innerHTML = '<i class="fas fa-check me-2"></i>Agregado';
    element.classList.add('btn-success-animated');

    window.setTimeout(() => {
      element.innerHTML = originalContent;
      element.classList.remove('btn-success-animated');
    }, 1500);
  }

  public openCart(): void {
    window.openFloatingCart?.();
  }

  public closeCart(): void {
    window.closeFloatingCart?.();
  }

  public renderCart(): void {
    if (typeof window.updateFloatingCartContent === 'function') {
      window.updateFloatingCartContent();
    } else {
      console.warn('updateFloatingCartContent no está disponible');
    }
  }

  public updateQuantity(productId: string, newQuantity: number): void {
    const product = this.cart.find((item) => item.id === productId);
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

  public removeFromCart(productId: string): void {
    const product = this.cart.find((item) => item.id === productId);
    if (!product) {
      console.warn('Producto no encontrado para eliminar:', productId);
      return;
    }

    this.cart = this.cart.filter((item) => item.id !== productId);
    this.saveCart();
    this.updateCartIcon();
    this.renderCart();
    this.showNotification(`${product.name} eliminado del carrito`, 'info');
  }

  public clearCart(): void {
    if (this.cart.length === 0) return;

    if (window.confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
      this.cart = [];
      this.saveCart();
      this.updateCartIcon();
      this.renderCart();
      this.showNotification('Carrito vaciado', 'info');
    }
  }

  public clearCartSilent(): void {
    this.cart = [];
    this.saveCart();
    this.updateCartIcon();
    this.renderCart();
  }

  public checkout(): void {
    if (this.cart.length === 0) {
      this.showNotification('El carrito está vacío', 'warning');
      return;
    }

    window.closeFloatingCart?.();

    const currentPath = window.location.pathname;
    let checkoutPath: string;

    if (currentPath.includes('/client/tienda/')) {
      checkoutPath = 'checkout.html';
    } else if (currentPath.endsWith('index.html') || currentPath.endsWith('/huertito/') || !currentPath.includes('/client/')) {
      checkoutPath = 'pages/client/tienda/checkout.html';
    } else {
      checkoutPath = '../tienda/checkout.html';
    }

    window.location.href = checkoutPath;
  }

  public redirectToLogin(): void {
    localStorage.setItem('paginaOrigen', window.location.pathname);
    this.showNotification('Inicia sesión para finalizar tu compra', 'info');

    window.setTimeout(() => {
      window.location.href = '../auth/login.html';
    }, 1500);
  }

  public getTotal(): number {
    return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  public getTotalItems(): number {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  public formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  }

  private getCurrentUser(): ISesionActiva | null {
    if (typeof window.obtenerUsuarioLogueado === 'function') {
      return window.obtenerUsuarioLogueado();
    }

    try {
      const userData = localStorage.getItem('usuarioLogueado');
      return userData ? (JSON.parse(userData) as ISesionActiva) : null;
    } catch (error) {
      console.error('CartSystem: error obteniendo usuario actual', error);
      return null;
    }
  }

  private getCartKey(): string {
    const user = this.getCurrentUser();
    return user ? `carrito_${user.email}` : 'carrito_guest';
  }

  private saveCart(): void {
    const cartKey = this.getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(this.cart));
  }

  private loadCart(): void {
    const cartKey = this.getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart) as CartItem[];
        this.cart = Array.isArray(items) ? items : [];
      } catch (error) {
        console.error('CartSystem: error cargando carrito', error);
        this.cart = [];
      }
    }
  }

  private transferGuestCart(): void {
    const guestCart = localStorage.getItem('carrito_guest');
    if (!guestCart || !this.getCurrentUser()) {
      return;
    }

    try {
      const guestItems = JSON.parse(guestCart) as CartItem[];
      if (Array.isArray(guestItems) && guestItems.length > 0) {
        guestItems.forEach((guestItem) => {
          const existingItem = this.cart.find((item) => item.id === guestItem.id);
          if (existingItem) {
            existingItem.quantity = Math.min(existingItem.quantity + guestItem.quantity, existingItem.stock);
          } else {
            this.cart.push({ ...guestItem });
          }
        });

        this.saveCart();
        this.updateCartIcon();
        window.updateFloatingCartContent?.();
        window.updateFloatingCartBadge?.();

        localStorage.removeItem('carrito_guest');

        console.log(`Carrito transferido: ${guestItems.length} productos`);
      }
    } catch (error) {
      console.error('Error transfiriendo carrito:', error);
    }
  }

  private listenForUserChanges(): void {
    let currentUser = this.getCurrentUser();
    let lastUserEmail = currentUser?.email ?? null;

    const checkUserChanges = () => {
      const newUser = this.getCurrentUser();
      const newUserEmail = newUser?.email ?? null;

      if (lastUserEmail === newUserEmail) {
        return;
      }

      if (!currentUser && newUser) {
        console.log('Usuario logueado, transfiriendo carrito...');
        currentUser = newUser;
        this.transferGuestCart();
        this.loadCart();
        this.updateCartIcon();
      } else if (currentUser && !newUser) {
        console.log('Usuario deslogueado, cambiando a carrito de invitado...');
        currentUser = null;
        this.cart = [];
        this.loadCart();
        this.updateCartIcon();
        window.updateFloatingCartContent?.();
      }

      lastUserEmail = newUserEmail;
    };

    this.userCheckInterval = window.setInterval(checkUserChanges, 2000);

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === 'user' || event.key === 'currentUser') {
        checkUserChanges();
      }
    });
  }

  public updateCartIcon(): void {
    this.addCartIconToNavbar();

    const cartBadge = document.querySelector('.cart-badge') as HTMLElement | null;
    const totalItems = this.getTotalItems();

    if (cartBadge) {
      if (totalItems > 0) {
        cartBadge.textContent = totalItems > 99 ? '99+' : `${totalItems}`;
        cartBadge.style.display = 'flex';
      } else {
        cartBadge.style.display = 'none';
      }
    }

    window.updateFloatingCartBadge?.();
  }

  private addCartIconToNavbar(): void {
    // Método mantenido por compatibilidad; actualmente no realiza acciones.
  }

  private showNotification(message: string, type: NotificacionTipo = 'success'): void {
    if (typeof window.mostrarNotificacion === 'function') {
      window.mostrarNotificacion(message, type);
    } else {
      console.log(`${String(type).toUpperCase()}: ${message}`);
    }
  }
}

let cartSystem: CartSystem | undefined;

function initializeCartSystem(): void {
  console.log('Inicializando CartSystem...');
  cartSystem = new CartSystem();
  window.cartSystem = cartSystem;

  console.log('CartSystem inicializado:', window.cartSystem);
  console.log('Funciones globales disponibles:', {
    updateCartQuantity: typeof window.updateCartQuantity,
    removeFromCart: typeof window.removeFromCart,
    proceedToCheckout: typeof window.proceedToCheckout,
  });
}

window.CartSystem = CartSystem;
window.initializeCartSystem = initializeCartSystem;

export {};
