class ProductManager {
    constructor() {
        this.productosCache = null;
        // Determinar la ruta del JSON según la ubicación actual
        this.rutaJSON = this.determinarRutaJSON();
    }

    /**
     * Determina la ruta correcta al archivo JSON según la ubicación actual
     */
    determinarRutaJSON() {
        const currentPath = window.location.pathname;
        console.log('ProductManager: Determinando ruta JSON para:', currentPath);
        
        if (currentPath.includes('/client/') || currentPath.includes('\\client\\') || 
            currentPath.includes('catalogo.html') || currentPath.includes('tienda')) {
            const relativaUrl = '../../../data/products.json';
            console.log('ProductManager: Usando ruta JSON relativa para catálogo:', relativaUrl);
            return relativaUrl;
        }
        
        const relativaUrl = '../../data/products.json';
        console.log('ProductManager: Usando ruta JSON relativa para dashboard:', relativaUrl);
        return relativaUrl;
    }

    async cargarProductos() {
        try {
            if (this.productosCache) {
                console.log('ProductManager: Usando caché de productos');
                return this.productosCache;
            }

            // SIEMPRE verificar localStorage primero
            const productosLocal = localStorage.getItem('productosJSON');
            
            if (productosLocal) {
                try {
                    const data = JSON.parse(productosLocal);
                    if (data && data.productos && Array.isArray(data.productos)) {
                        console.log('ProductManager: Productos cargados desde localStorage:', data.productos.length, 'productos');
                        this.productosCache = data;
                        return data;
                    }
                } catch (parseError) {
                    console.warn('ProductManager: Error parseando localStorage, usando defecto');
                }
            }

            // Si no hay localStorage, usar productos por defecto
            console.log('ProductManager: Usando productos por defecto (localStorage vacio)');
            const productosDefecto = this.getProductosPorDefecto();
            this.productosCache = productosDefecto;
            return productosDefecto;
            
        } catch (error) {
            console.error('ProductManager: Error en ProductManager:', error);
            console.log('ProductManager: Usando productos por defecto como fallback');
            const productosDefecto = this.getProductosPorDefecto();
            this.productosCache = productosDefecto;
            return productosDefecto;
        }
    }

    /**
     * Productos por defecto si falla la carga del JSON
     */
    getProductosPorDefecto() {
        return {
            productos: [
                {
                    id: 1,
                    codigo: "FR001",
                    nombre: "Manzanas Fuji",
                    descripcion: "Manzanas Fuji dulces y crujientes, cultivadas sin pesticidas. Ideales para toda la familia.",
                    precio: 3200,
                    stock: 45,
                    categoria: "Frutas Frescas",
                    imagen: "img/manzana.webp",
                    estado: "activo",
                    fechaCreacion: "2025-01-01",
                    peso: "1kg"
                },
                {
                    id: 2,
                    codigo: "FR002",
                    nombre: "Naranjas Valencia",
                    descripcion: "Naranjas valencianas llenas de vitamina C. Perfectas para zumos frescos y postres naturales.",
                    precio: 2800,
                    stock: 38,
                    categoria: "Frutas Frescas",
                    imagen: "img/naranja.webp",
                    estado: "activo",
                    fechaCreacion: "2025-01-02",
                    peso: "1kg"
                },
                {
                    id: 3,
                    codigo: "VR001",
                    nombre: "Zanahorias Orgánicas",
                    descripcion: "Zanahorias orgánicas dulces y crujientes, ricas en betacaroteno.",
                    precio: 2100,
                    stock: 35,
                    categoria: "Verduras Orgánicas",
                    imagen: "img/zanahorias.webp",
                    estado: "activo",
                    fechaCreacion: "2025-01-03",
                    peso: "500g"
                }
            ],
            configuracion: {
                proximoId: 4,
                version: "1.0",
                ultimaActualizacion: new Date().toISOString(),
                categorias: ["Frutas Frescas", "Verduras Orgánicas", "Productos Orgánicos", "Productos Lácteos"]
            }
        };
    }

    /**
     * Obtener productos activos (para catálogo)
     */
    async obtenerProductosActivos() {
        try {
            const data = await this.cargarProductos();
            console.log('ProductManager: Datos cargados en obtenerProductosActivos:', data);
            console.log('ProductManager: Tipo de data.productos:', typeof data.productos);
            console.log('ProductManager: Array.isArray(data.productos):', Array.isArray(data.productos));
            console.log('ProductManager: data.productos:', data.productos);
            
            if (!data || !data.productos || !Array.isArray(data.productos)) {
                console.error('ProductManager: Estructura de datos inválida');
                return [];
            }
            
            const productosActivos = data.productos.filter(producto => producto.estado === 'activo');
            console.log('ProductManager: Productos activos filtrados:', productosActivos);
            return productosActivos;
        } catch (error) {
            console.error('ProductManager: Error obteniendo productos activos:', error);
            return [];
        }
    }

    /**
     * Obtener productos por categoría
     */
    async obtenerProductosPorCategoria(categoria) {
        try {
            const productosActivos = await this.obtenerProductosActivos();
            if (categoria === 'todos') {
                return productosActivos;
            }
            return productosActivos.filter(producto => producto.categoria === categoria);
        } catch (error) {
            console.error('ProductManager: Error obteniendo productos por categoría:', error);
            return [];
        }
    }

    /**
     * Obtener producto por ID
     */
    async obtenerProductoPorId(id) {
        try {
            const data = await this.cargarProductos();
            return data.productos.find(producto => producto.id === parseInt(id));
        } catch (error) {
            console.error('ProductManager: Error obteniendo producto por ID:', error);
            return null;
        }
    }

    /**
     * Agregar nuevo producto
     */
    async agregarProducto(datosProducto) {
        try {
            const data = await this.cargarProductos();
            
            // Validar datos del producto
            const validacion = this.validarDatosProducto(datosProducto);
            if (!validacion.valido) {
                return { 
                    success: false, 
                    mensaje: 'Datos inválidos: ' + validacion.errores.join(', ') 
                };
            }

            // Crear nuevo producto
            const nuevoProducto = {
                id: data.configuracion.proximoId,
                nombre: datosProducto.nombre,
                descripcion: datosProducto.descripcion,
                precio: parseFloat(datosProducto.precio),
                stock: parseInt(datosProducto.stock),
                categoria: datosProducto.categoria,
                imagen: datosProducto.imagen || 'img/default.jpg',
                estado: datosProducto.estado || 'activo',
                fechaCreacion: new Date().toISOString().split('T')[0],
                peso: datosProducto.peso || '1kg'
            };

            // Agregar a la lista
            data.productos.push(nuevoProducto);
            data.configuracion.proximoId++;
            data.configuracion.ultimaActualizacion = new Date().toISOString();

            // Guardar cambios
            await this.guardarProductos(data);
            
            return { 
                success: true, 
                mensaje: 'Producto creado exitosamente',
                producto: nuevoProducto 
            };

        } catch (error) {
            console.error('Error agregando producto:', error);
            return { 
                success: false, 
                mensaje: 'Error interno al crear producto' 
            };
        }
    }

    /**
     * Actualizar producto existente
     */
    async actualizarProducto(productoId, datosActualizados) {
        console.log('ProductManager: Actualizando producto ID:', productoId);
        
        try {
            const data = await this.cargarProductos();
            const indiceProducto = data.productos.findIndex(p => p.id === parseInt(productoId));
            
            if (indiceProducto === -1) {
                throw new Error('Producto no encontrado');
            }
            
            // Validar datos actualizados
            const validacion = this.validarDatosProducto(datosActualizados);
            if (!validacion.valido) {
                return { 
                    success: false, 
                    mensaje: 'Datos inválidos: ' + validacion.errores.join(', ') 
                };
            }
            
            // Mantener algunos campos originales
            const productoOriginal = data.productos[indiceProducto];
            const productoActualizado = {
                ...productoOriginal,
                nombre: datosActualizados.nombre,
                descripcion: datosActualizados.descripcion,
                precio: parseFloat(datosActualizados.precio),
                stock: parseInt(datosActualizados.stock),
                categoria: datosActualizados.categoria,
                imagen: datosActualizados.imagen || productoOriginal.imagen,
                estado: datosActualizados.estado || productoOriginal.estado,
                peso: datosActualizados.peso || productoOriginal.peso,
                fechaActualizacion: new Date().toISOString().split('T')[0]
            };
            
            // Actualizar en el array
            data.productos[indiceProducto] = productoActualizado;
            data.configuracion.ultimaActualizacion = new Date().toISOString();
            
            // Guardar los cambios
            await this.guardarProductos(data);
            
            // Verificar automáticamente productos sin stock
            await this.verificarYDesactivarSinStock();
            
            console.log('ProductManager: Producto actualizado exitosamente');
            return { 
                success: true, 
                producto: productoActualizado,
                mensaje: 'Producto actualizado exitosamente'
            };
            
        } catch (error) {
            console.error('ProductManager: Error al actualizar producto:', error);
            return { 
                success: false, 
                mensaje: 'Error al actualizar producto: ' + error.message 
            };
        }
    }

    /**
     * Desactivar producto (reemplaza eliminación)
     */
    async desactivarProducto(productoId) {
        try {
            const data = await this.cargarProductos();
            const producto = data.productos.find(p => p.id === parseInt(productoId));
            
            if (!producto) {
                return {
                    success: false,
                    mensaje: 'Producto no encontrado'
                };
            }

            // Cambiar estado a inactivo
            producto.estado = 'inactivo';
            data.configuracion.ultimaActualizacion = new Date().toISOString();

            // Guardar cambios
            await this.guardarProductos(data);
            
            return {
                success: true,
                mensaje: `Producto ${producto.nombre} desactivado exitosamente`
            };
            
        } catch (error) {
            console.error('ProductManager: Error al desactivar producto:', error);
            return {
                success: false,
                mensaje: 'Error interno al desactivar producto'
            };
        }
    }

    /**
     * Activar producto
     */
    async activarProducto(productoId) {
        try {
            const data = await this.cargarProductos();
            const producto = data.productos.find(p => p.id === parseInt(productoId));
            
            if (!producto) {
                return {
                    success: false,
                    mensaje: 'Producto no encontrado'
                };
            }

            // Cambiar estado a activo
            producto.estado = 'activo';
            data.configuracion.ultimaActualizacion = new Date().toISOString();

            // Guardar cambios
            await this.guardarProductos(data);
            
            return {
                success: true,
                mensaje: `Producto ${producto.nombre} activado exitosamente`
            };
            
        } catch (error) {
            console.error('ProductManager: Error al activar producto:', error);
            return {
                success: false,
                mensaje: 'Error interno al activar producto'
            };
        }
    }

    /**
     * Verificar y desactivar productos sin stock
     */
    async verificarYDesactivarSinStock() {
        try {
            const data = await this.cargarProductos();
            let productosDesactivados = 0;
            
            data.productos.forEach(producto => {
                if (producto.stock <= 0 && producto.estado === 'activo') {
                    producto.estado = 'inactivo';
                    productosDesactivados++;
                    console.log(`ProductManager: Producto ${producto.nombre} desactivado automáticamente por falta de stock`);
                }
            });

            if (productosDesactivados > 0) {
                data.configuracion.ultimaActualizacion = new Date().toISOString();
                await this.guardarProductos(data);
            }
            
            return {
                success: true,
                productosDesactivados
            };
            
        } catch (error) {
            console.error('ProductManager: Error verificando stock:', error);
            return {
                success: false,
                mensaje: 'Error al verificar stock'
            };
        }
    }

    /**
     * Obtener todos los productos para el dashboard (incluye activos e inactivos)
     */
    async obtenerTodosLosProductos() {
        try {
            const data = await this.cargarProductos();
            return {
                success: true,
                productos: data.productos || []
            };
        } catch (error) {
            console.error('ProductManager: Error al obtener productos:', error);
            return {
                success: false,
                mensaje: 'Error al cargar productos',
                productos: []
            };
        }
    }

    /**
     * Obtener solo productos activos para el catálogo
     */
    async obtenerProductosActivos() {
        try {
            const data = await this.cargarProductos();
            const productosActivos = data.productos.filter(producto => producto.estado === 'activo');
            return {
                success: true,
                productos: productosActivos || []
            };
        } catch (error) {
            console.error('ProductManager: Error al obtener productos activos:', error);
            return {
                success: false,
                mensaje: 'Error al cargar productos activos',
                productos: []
            };
        }
    }

    /**
     * Guardar productos en localStorage
     */
    async guardarProductos(data) {
        try {
            // Guardar en localStorage como fuente principal
            localStorage.setItem('productosJSON', JSON.stringify(data));
            this.productosCache = data;
            
            console.log('ProductManager: Productos guardados exitosamente en localStorage');
            console.log('ProductManager: Total de productos:', data.productos.length);
            return { success: true };
        } catch (error) {
            console.error('Error guardando productos:', error);
            return { success: false, error };
        }
    }

    /**
     * Validar datos de producto
     */
    validarDatosProducto(datos) {
        const errores = [];

        if (!datos.nombre || datos.nombre.trim().length < 2) {
            errores.push('El nombre debe tener al menos 2 caracteres');
        }

        if (!datos.descripcion || datos.descripcion.trim().length < 10) {
            errores.push('La descripción debe tener al menos 10 caracteres');
        }

        if (!datos.precio || isNaN(parseFloat(datos.precio)) || parseFloat(datos.precio) <= 0) {
            errores.push('El precio debe ser un número mayor a 0');
        }

        if (!datos.stock || isNaN(parseInt(datos.stock)) || parseInt(datos.stock) < 0) {
            errores.push('El stock debe ser un número mayor o igual a 0');
        }

        if (!datos.categoria || datos.categoria.trim().length < 2) {
            errores.push('Debe seleccionar una categoría válida');
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    }

    /**
     * Obtener categorías disponibles
     */
    async obtenerCategorias() {
        try {
            const data = await this.cargarProductos();
            return data.configuracion.categorias || ['general'];
        } catch (error) {
            console.error('ProductManager: Error obteniendo categorías:', error);
            return ['general'];
        }
    }

    /**
     * Resetear sistema de productos - fuerza carga desde JSON
     */
    async resetearSistemaProductos() {
        console.log('ProductManager: Reseteando sistema de productos...');
        
        try {
            // Limpiar caché y localStorage
            this.productosCache = null;
            localStorage.removeItem('productosJSON');
            
            // Forzar recarga desde JSON
            const data = await this.cargarProductos();
            
            console.log('ProductManager: Sistema reseteado exitosamente');
            console.log('ProductManager: Productos cargados:', data.productos.length);
            
            return {
                success: true,
                mensaje: `Sistema reseteado. ${data.productos.length} productos cargados desde JSON`,
                productos: data.productos
            };
        } catch (error) {
            console.error('ProductManager: Error al resetear sistema:', error);
            return {
                success: false,
                mensaje: 'Error al resetear sistema de productos'
            };
        }
    }

    /**
     * Verificar origen de productos actual
     */
    verificarOrigenProductos() {
        const productosLocal = localStorage.getItem('productosJSON');
        if (productosLocal) {
            return {
                origen: 'localStorage',
                mensaje: 'Usando productos desde localStorage (dashboard)'
            };
        } else {
            return {
                origen: 'json',
                mensaje: 'Se cargarán productos desde products.json'
            };
        }
    }

    saveProducts(productos) {
        try {
            const data = {
                productos: productos,
                configuracion: {
                    version: "1.0",
                    proximoId: Math.max(...productos.map(p => p.id)) + 1
                }
            };
            localStorage.setItem('productosJSON', JSON.stringify(data));
            this.productosCache = data;
            console.log('ProductManager: Productos guardados en localStorage');
            return { success: true };
        } catch (error) {
            console.error('ProductManager: Error guardando productos:', error);
            return { success: false, error };
        }
    }

    getProducts() {
        try {
            const productosLocal = localStorage.getItem('productosJSON');
            if (productosLocal) {
                const data = JSON.parse(productosLocal);
                return data.productos || [];
            }
            return [];
        } catch (error) {
            console.error('ProductManager: Error obteniendo productos:', error);
            return [];
        }
    }
}

// Crear instancia global
const productManager = new ProductManager();

// ===============================================
// FUNCIONES GLOBALES PARA DEBUGGING Y GESTIÓN
// ===============================================

/**
 * Resetear productos desde JSON - usar en consola del navegador
 */
window.resetearProductos = async function() {
    console.log('🔄 Reseteando productos desde JSON...');
    const resultado = await productManager.resetearSistemaProductos();
    console.log(resultado.success ? '✅' : '❌', resultado.mensaje);
    if (resultado.success) {
        console.table(resultado.productos.map(p => ({
            ID: p.id,
            Nombre: p.nombre,
            Precio: `$${p.precio}`,
            Stock: p.stock,
            Categoría: p.categoria,
            Estado: p.estado
        })));
    }
    return resultado;
};

/**
 * Ver productos actuales - usar en consola del navegador
 */
window.verProductos = async function() {
    console.log('🛍️ Productos actuales:');
    const data = await productManager.cargarProductos();
    console.table(data.productos.map(p => ({
        ID: p.id,
        Nombre: p.nombre,
        Precio: `$${p.precio}`,
        Stock: p.stock,
        Categoría: p.categoria,
        Estado: p.estado
    })));
    
    const origen = productManager.verificarOrigenProductos();
    console.log('📍 Origen:', origen.mensaje);
    return data.productos;
};

/**
 * Limpiar localStorage de productos - usar en consola del navegador
 */
window.limpiarProductos = function() {
    localStorage.removeItem('productosJSON');
    console.log('🧹 localStorage de productos limpiado');
    console.log('💡 Recarga la página para cargar productos desde JSON');
};

// ===============================================
// FUNCIONES PARA INTEGRACIÓN CON CATÁLOGO
// ===============================================

/**
 * Obtener productos para mostrar en catálogo
 */
async function obtenerProductosCatalogo(categoria = 'todos') {
    return await productManager.obtenerProductosPorCategoria(categoria);
}

/**
 * Formatear precio para mostrar
 */
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(precio);
}

/**
 * Generar HTML de producto para catálogo
 */
function generarHTMLProducto(producto) {
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card product-card h-100 border-0 shadow-sm">
                <div class="product-image-container">
                    <img src="${producto.imagen}" class="card-img-top product-image" alt="${producto.nombre}">
                    <div class="product-overlay">
                        <button class="btn btn-success btn-sm" onclick="agregarAlCarrito(${producto.id})">
                            <i class="fas fa-shopping-cart me-1"></i>Agregar
                        </button>
                        <button class="btn btn-outline-light btn-sm ms-2" onclick="verDetalle(${producto.id})">
                            <i class="fas fa-eye me-1"></i>Ver más
                        </button>
                    </div>
                    ${producto.stock <= 5 ? '<div class="stock-badge bg-warning">¡Pocos disponibles!</div>' : ''}
                    ${producto.stock === 0 ? '<div class="stock-badge bg-danger">Agotado</div>' : ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">${producto.nombre}</h6>
                        <span class="badge bg-secondary">${producto.categoria}</span>
                    </div>
                    <p class="card-text small text-muted flex-grow-1">${producto.descripcion}</p>
                    <div class="product-footer mt-auto">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="price-container">
                                <span class="price">${formatearPrecio(producto.precio)}</span>
                                <small class="text-muted d-block">${producto.peso}</small>
                            </div>
                            <small class="text-muted">Stock: ${producto.stock}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}