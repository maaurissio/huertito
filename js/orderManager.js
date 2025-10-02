class OrderManager {
    constructor() {
        this.orders = this.loadOrders();
    }

    loadOrders() {
        try {
            const saved = localStorage.getItem('ordersData');
            if (saved) {
                const data = JSON.parse(saved);
                return data.orders || [];
            }
        } catch (error) {
            console.warn('OrderManager: Error cargando pedidos:', error);
        }
        return [];
    }

    saveOrders() {
        try {
            const data = {
                orders: this.orders,
                lastUpdated: new Date().toISOString(),
                totalOrders: this.orders.length
            };
            localStorage.setItem('ordersData', JSON.stringify(data));
            console.log('OrderManager: Pedidos guardados:', this.orders.length);
            return true;
        } catch (error) {
            console.error('OrderManager: Error guardando pedidos:', error);
            return false;
        }
    }

    createOrder(orderData) {
        try {
            const newOrder = {
                id: this.generateOrderId(),
                date: new Date().toISOString(),
                status: 'pendiente',
                customer: {
                    name: `${orderData.contact.firstName} ${orderData.contact.lastName}`,
                    email: orderData.contact.email,
                    phone: orderData.contact.phone
                },
                shipping: {
                    address: orderData.shipping.address,
                    city: orderData.shipping.city,
                    region: orderData.shipping.region,
                    zipCode: orderData.shipping.zipCode,
                    notes: orderData.shipping.notes || '',
                    cost: orderData.shippingCost || 0,
                    isFree: orderData.shipping.isFree || false
                },
                items: orderData.items.map(item => ({
                    id: item.id || '',
                    name: item.name || item.nombre,
                    price: parseFloat(item.price || item.precio || 0),
                    quantity: parseInt(item.quantity || item.cantidad || 1),
                    total: (parseFloat(item.price || item.precio || 0) * parseInt(item.quantity || item.cantidad || 1))
                })),
                totals: {
                    subtotal: orderData.subtotal || 0,
                    shipping: orderData.shippingCost || 0,
                    total: orderData.total || 0
                },
                type: orderData.type || 'guest',
                paymentMethod: 'pending'
            };

            this.updateProductStock(newOrder.items);

            this.orders.unshift(newOrder);
            this.saveOrders();

            console.log('OrderManager: Nuevo pedido creado:', newOrder.id);
            return { success: true, order: newOrder };
            
        } catch (error) {
            console.error('OrderManager: Error creando pedido:', error);
            return { success: false, error: error.message };
        }
    }

    updateProductStock(orderItems) {
        try {
            console.log('🔄 OrderManager: Iniciando actualización de stock...');
            const productManager = new ProductManager();
            const products = productManager.getProducts();
            console.log('📦 OrderManager: Productos cargados:', products.length);
            
            let stockUpdated = false;
            orderItems.forEach(item => {
                console.log(`🔍 Buscando producto: ID=${item.id}, Código=${item.codigo}, Cantidad=${item.quantity}`);
                
                let product = products.find(p => p.id == item.id);
                
                if (!product && item.codigo) {
                    product = products.find(p => p.codigo === item.codigo);
                }
                
                if (!product) {
                    console.warn(`❌ Producto no encontrado: ID=${item.id}, Código=${item.codigo}`);
                    return;
                }
                
                const stockAnterior = product.stock;
                const newStock = Math.max(0, product.stock - item.quantity);
                if (product.stock !== newStock) {
                    console.log(`🔄 Actualizando stock: ${product.nombre} - ${item.quantity} unidades. Stock anterior: ${stockAnterior}, Stock nuevo: ${newStock}`);
                    product.stock = newStock;
                    stockUpdated = true;
                } else {
                    console.log(`ℹ️ Sin cambios para: ${product.nombre} (stock: ${stockAnterior})`);
                }
            });

            if (stockUpdated) {
                console.log('💾 OrderManager: Guardando productos actualizados...');
                const resultado = productManager.saveProducts(products);
                if (resultado.success) {
                    console.log('✅ OrderManager: Stock de productos actualizado correctamente en localStorage');
                } else {
                    console.error('❌ OrderManager: Error al guardar productos');
                }
            } else {
                console.log('ℹ️ OrderManager: No se necesitaron actualizaciones de stock');
            }
        } catch (error) {
            console.error('❌ OrderManager: Error actualizando stock:', error);
        }
    }

    /**
     * Generar ID único para pedido
     */
    generateOrderId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD-${timestamp}-${random}`;
    }

    /**
     * Obtener todos los pedidos
     */
    getAllOrders() {
        return this.orders;
    }

    /**
     * Obtener pedido por ID
     */
    getOrderById(orderId) {
        return this.orders.find(order => order.id === orderId);
    }

    /**
     * Actualizar estado de pedido
     */
    updateOrderStatus(orderId, newStatus) {
        const order = this.getOrderById(orderId);
        if (order) {
            order.status = newStatus;
            order.updatedAt = new Date().toISOString();
            this.saveOrders();
            return { success: true, order };
        }
        return { success: false, message: 'Pedido no encontrado' };
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(price);
    }

    /**
     * Obtener estadísticas de pedidos
     */
    getOrderStats() {
        const totalOrders = this.orders.length;
        const totalRevenue = this.orders.reduce((sum, order) => sum + order.totals.total, 0);
        
        const statusCount = this.orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        return {
            totalOrders,
            totalRevenue,
            statusCount,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        };
    }

    /**
     * Formatear precio
     */
    formatPrice(price) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(price);
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Resetear todos los pedidos (para testing)
     */
    resetOrders() {
        this.orders = [];
        localStorage.removeItem('ordersData');
        console.log('OrderManager: Todos los pedidos eliminados');
        return { success: true, message: 'Pedidos reseteados exitosamente' };
    }
}

// Crear instancia global
const orderManager = new OrderManager();

// Funciones globales para debugging
window.verPedidos = function() {
    console.log('📦 Pedidos actuales:');
    const orders = orderManager.getAllOrders();
    console.table(orders.map(order => ({
        ID: order.id,
        Cliente: order.customer.name,
        Email: order.customer.email,
        Total: orderManager.formatPrice(order.totals.total),
        Estado: order.status,
        Fecha: orderManager.formatDate(order.date)
    })));
    return orders;
};

window.resetearPedidos = function() {
    const result = orderManager.resetOrders();
    console.log(result.success ? '✅' : '❌', result.message);
    return result;
};

window.estadisticasPedidos = function() {
    const stats = orderManager.getOrderStats();
    console.log('📊 Estadísticas de pedidos:');
    console.table(stats);
    return stats;
};