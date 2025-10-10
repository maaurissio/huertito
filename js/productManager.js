import { CategoriaProducto, Estado } from './models.js';
import { obtenerDatosProductos, guardarDatosProductos } from './servicioDatos.js';
export class ProductManager {
    constructor() {
        this.productosCache = null;
    }
    cargarDatosInternos() {
        if (this.productosCache) {
            return this.productosCache;
        }
        const data = obtenerDatosProductos();
        this.productosCache = data;
        return data;
    }
    guardarDatos(data) {
        guardarDatosProductos(data);
        this.productosCache = data;
    }
    cargarDatos() {
        return this.cargarDatosInternos();
    }
    obtenerProductosActivos() {
        const data = this.cargarDatosInternos();
        return data.productos.filter((producto) => (producto.estado ?? producto.isActivo) === Estado.activo);
    }
    obtenerDatosCompletos() {
        return this.cargarDatosInternos();
    }
    obtenerProductosPorCategoria(categoria) {
        const productosActivos = this.obtenerProductosActivos();
        if (categoria === 'todos') {
            return productosActivos;
        }
        return productosActivos.filter((producto) => producto.categoria === categoria);
    }
    obtenerProductoPorId(id) {
        const idBuscado = typeof id === 'string' ? Number.parseInt(id, 10) : id;
        const data = this.cargarDatosInternos();
        return data.productos.find((producto) => producto.id === idBuscado);
    }
    obtenerTodosLosProductos() {
        const data = this.cargarDatosInternos();
        return data.productos;
    }
    agregarProducto(datosProducto) {
        try {
            const data = this.cargarDatosInternos();
            const validacion = this.validarDatosProducto(datosProducto);
            if (!validacion.valido) {
                return {
                    success: false,
                    mensaje: 'Datos inválidos: ' + validacion.errores.join(', '),
                };
            }
            const estadoProducto = datosProducto.estado ?? datosProducto.isActivo ?? Estado.activo;
            const nuevoProducto = {
                id: data.configuracion.proximoId,
                codigo: (datosProducto.nombre ?? 'PRD').substring(0, 3).toUpperCase() + data.configuracion.proximoId,
                nombre: datosProducto.nombre ?? 'Producto sin nombre',
                descripcion: datosProducto.descripcion ?? '',
                precio: Number.parseFloat(String(datosProducto.precio ?? 0)),
                stock: Number.parseInt(String(datosProducto.stock ?? 0), 10),
                categoria: datosProducto.categoria ?? CategoriaProducto.frutas,
                imagen: datosProducto.imagen ?? 'img/default.jpg',
                isActivo: estadoProducto,
                estado: estadoProducto,
                fechaCreacion: new Date().toISOString().substring(0, 10),
                peso: datosProducto.peso ?? '1kg',
            };
            data.productos.push(nuevoProducto);
            data.configuracion.proximoId += 1;
            data.configuracion.ultimaActualizacion = new Date().toISOString();
            this.guardarDatos(data);
            this.verificarYDesactivarSinStock();
            return {
                success: true,
                mensaje: 'Producto creado exitosamente',
                producto: nuevoProducto,
            };
        }
        catch (error) {
            console.error('Error agregando producto:', error);
            const mensaje = error instanceof Error ? error.message : 'Desconocido';
            return { success: false, mensaje: 'Error interno al crear producto: ' + mensaje };
        }
    }
    actualizarProducto(productoId, datosActualizados) {
        const idBuscado = typeof productoId === 'string' ? Number.parseInt(productoId, 10) : productoId;
        try {
            const data = this.cargarDatosInternos();
            const indiceProducto = data.productos.findIndex((p) => p.id === idBuscado);
            if (indiceProducto === -1) {
                return { success: false, mensaje: 'Producto no encontrado' };
            }
            const validacion = this.validarDatosProducto(datosActualizados);
            if (!validacion.valido) {
                return {
                    success: false,
                    mensaje: 'Datos inválidos: ' + validacion.errores.join(', '),
                };
            }
            const productoOriginal = data.productos[indiceProducto];
            if (!productoOriginal) {
                return { success: false, mensaje: 'Producto no encontrado' };
            }
            const estadoProducto = datosActualizados.estado ??
                datosActualizados.isActivo ??
                productoOriginal.estado ??
                productoOriginal.isActivo;
            const productoActualizado = {
                ...productoOriginal,
                nombre: datosActualizados.nombre ?? productoOriginal.nombre,
                descripcion: datosActualizados.descripcion ?? productoOriginal.descripcion,
                precio: Number.parseFloat(String(datosActualizados.precio ?? productoOriginal.precio)),
                stock: Number.parseInt(String(datosActualizados.stock ?? productoOriginal.stock), 10),
                categoria: datosActualizados.categoria ?? productoOriginal.categoria,
                imagen: datosActualizados.imagen ?? productoOriginal.imagen,
                isActivo: estadoProducto,
                estado: estadoProducto,
                peso: datosActualizados.peso ?? productoOriginal.peso ?? '1kg',
                fechaActualizacion: new Date().toISOString().substring(0, 10),
            };
            data.productos[indiceProducto] = productoActualizado;
            data.configuracion.ultimaActualizacion = new Date().toISOString();
            this.guardarDatos(data);
            this.verificarYDesactivarSinStock();
            return {
                success: true,
                mensaje: 'Producto actualizado exitosamente',
                producto: productoActualizado,
            };
        }
        catch (error) {
            console.error('ProductManager: Error al actualizar producto:', error);
            const mensaje = error instanceof Error ? error.message : 'Desconocido';
            return { success: false, mensaje: 'Error al actualizar producto: ' + mensaje };
        }
    }
    verificarYDesactivarSinStock() {
        try {
            const data = this.cargarDatosInternos();
            let productosDesactivados = 0;
            data.productos.forEach((producto) => {
                if (producto.stock <= 0 && (producto.estado ?? producto.isActivo) === Estado.activo) {
                    producto.isActivo = Estado.inactivo;
                    producto.estado = Estado.inactivo;
                    productosDesactivados += 1;
                }
            });
            if (productosDesactivados > 0) {
                data.configuracion.ultimaActualizacion = new Date().toISOString();
                this.guardarDatos(data);
            }
            return { success: true, mensaje: `${productosDesactivados} productos desactivados automáticamente` };
        }
        catch (error) {
            console.error('Error verificando stock:', error);
            const mensaje = error instanceof Error ? error.message : 'Desconocido';
            return { success: false, mensaje: 'Error al verificar stock: ' + mensaje };
        }
    }
    obtenerCategorias() {
        const data = this.cargarDatosInternos();
        return data.configuracion.categorias ?? Object.values(CategoriaProducto);
    }
    desactivarProducto(productoId) {
        const idBuscado = typeof productoId === 'string' ? Number.parseInt(productoId, 10) : productoId;
        try {
            const data = this.cargarDatosInternos();
            const producto = data.productos.find((p) => p.id === idBuscado);
            if (!producto) {
                return { success: false, mensaje: 'Producto no encontrado' };
            }
            producto.isActivo = Estado.inactivo;
            producto.estado = Estado.inactivo;
            data.configuracion.ultimaActualizacion = new Date().toISOString();
            this.guardarDatos(data);
            return { success: true, mensaje: 'Producto desactivado exitosamente', producto };
        }
        catch (error) {
            console.error('Error al desactivar producto:', error);
            const mensaje = error instanceof Error ? error.message : 'Desconocido';
            return { success: false, mensaje: 'Error al desactivar producto: ' + mensaje };
        }
    }
    activarProducto(productoId) {
        const idBuscado = typeof productoId === 'string' ? Number.parseInt(productoId, 10) : productoId;
        try {
            const data = this.cargarDatosInternos();
            const producto = data.productos.find((p) => p.id === idBuscado);
            if (!producto) {
                return { success: false, mensaje: 'Producto no encontrado' };
            }
            producto.isActivo = Estado.activo;
            producto.estado = Estado.activo;
            data.configuracion.ultimaActualizacion = new Date().toISOString();
            this.guardarDatos(data);
            return { success: true, mensaje: 'Producto activado exitosamente', producto };
        }
        catch (error) {
            console.error('Error al activar producto:', error);
            const mensaje = error instanceof Error ? error.message : 'Desconocido';
            return { success: false, mensaje: 'Error al activar producto: ' + mensaje };
        }
    }
    validarDatosProducto(datos) {
        const errores = [];
        if (!datos.nombre || datos.nombre.trim().length < 2) {
            errores.push('El nombre debe tener al menos 2 caracteres');
        }
        if (!datos.precio || Number.isNaN(Number.parseFloat(String(datos.precio))) || Number.parseFloat(String(datos.precio)) <= 0) {
            errores.push('El precio debe ser un número mayor a 0');
        }
        if (!datos.stock || Number.isNaN(Number.parseInt(String(datos.stock), 10)) || Number.parseInt(String(datos.stock), 10) < 0) {
            errores.push('El stock debe ser un número mayor o igual a 0');
        }
        if (!datos.categoria || !Object.values(CategoriaProducto).includes(datos.categoria)) {
            errores.push('Debe seleccionar una categoría válida');
        }
        return { valido: errores.length === 0, errores };
    }
}
const productManager = new ProductManager();
export function obtenerProductosCatalogo(categoria = 'todos') {
    return productManager.obtenerProductosPorCategoria(categoria);
}
window.productManager = productManager;
window.ProductManager = ProductManager;
window.obtenerProductosCatalogo = obtenerProductosCatalogo;
//# sourceMappingURL=productManager.js.map