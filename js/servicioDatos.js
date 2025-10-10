import { CategoriaProducto, Estado } from './models.js';
import { productosIniciales } from './datosIniciales.js';
const CLAVE_DATOS_PRODUCTOS = 'productos_huertohogar_data';
function normalizarEstado(valor) {
    if (valor === Estado.activo || valor === Estado.inactivo) {
        return valor;
    }
    if (typeof valor === 'string') {
        const lower = valor.toLowerCase();
        if (lower === Estado.activo.toLowerCase()) {
            return Estado.activo;
        }
        if (lower === Estado.inactivo.toLowerCase()) {
            return Estado.inactivo;
        }
    }
    return Estado.activo;
}
function limpiarPrecio(valor) {
    if (typeof valor === 'number' && !Number.isNaN(valor)) {
        return valor;
    }
    if (typeof valor === 'string') {
        const limpio = valor
            .replace(/[^0-9,.-]/g, '')
            .replace(/,(?=.*\d{3}\b)/g, '')
            .replace(',', '.');
        const numero = Number.parseFloat(limpio);
        if (!Number.isNaN(numero)) {
            return numero;
        }
    }
    return 0;
}
function limpiarStock(valor) {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
        return Math.max(0, Math.trunc(valor));
    }
    if (typeof valor === 'string') {
        const numero = Number.parseInt(valor, 10);
        if (!Number.isNaN(numero)) {
            return Math.max(0, numero);
        }
    }
    return 0;
}
function normalizarProducto(producto) {
    const estadoNormalizado = normalizarEstado(producto.isActivo ?? producto.estado);
    const base = {
        id: producto.id ?? 0,
        codigo: producto.codigo ?? `PR${Date.now()}`,
        nombre: producto.nombre ?? 'Producto sin nombre',
        descripcion: producto.descripcion ?? '',
        precio: limpiarPrecio(producto.precio),
        stock: limpiarStock(producto.stock),
        imagen: producto.imagen ?? 'img/default.jpg',
        categoria: producto.categoria ?? CategoriaProducto.frutas,
        isActivo: estadoNormalizado,
        estado: estadoNormalizado,
        peso: producto.peso ?? '1kg',
    };
    if (producto.fechaCreacion) {
        base.fechaCreacion = producto.fechaCreacion;
    }
    if (producto.fechaActualizacion) {
        base.fechaActualizacion = producto.fechaActualizacion;
    }
    return base;
}
function normalizarDatos(data) {
    return {
        productos: data.productos.map((producto) => normalizarProducto(producto)),
        configuracion: {
            ...data.configuracion,
            categorias: data.configuracion.categorias?.length
                ? data.configuracion.categorias
                : Object.values(CategoriaProducto),
            ultimaActualizacion: data.configuracion.ultimaActualizacion ?? new Date().toISOString(),
        },
    };
}
function crearDatosIniciales() {
    const configuracion = {
        proximoId: Math.max(...productosIniciales.map((p) => p.id)) + 1,
        version: '1.0',
        ultimaActualizacion: new Date().toISOString(),
        categorias: Object.values(CategoriaProducto),
    };
    return normalizarDatos({
        productos: productosIniciales,
        configuracion,
    });
}
function clonarDatos(data) {
    return {
        productos: data.productos.map((producto) => ({ ...producto })),
        configuracion: { ...data.configuracion },
    };
}
export function obtenerDatosProductos() {
    const datosAlmacenados = localStorage.getItem(CLAVE_DATOS_PRODUCTOS);
    if (datosAlmacenados) {
        const datos = JSON.parse(datosAlmacenados);
        const normalizados = normalizarDatos(datos);
        if (normalizados !== datos) {
            guardarDatosProductos(normalizados);
        }
        return clonarDatos(normalizados);
    }
    const datosIniciales = crearDatosIniciales();
    guardarDatosProductos(datosIniciales);
    return clonarDatos(datosIniciales);
}
export function guardarDatosProductos(data) {
    localStorage.setItem(CLAVE_DATOS_PRODUCTOS, JSON.stringify(data));
}
export function actualizarDatosProductos(transformer) {
    const actual = obtenerDatosProductos();
    const actualizado = transformer(actual);
    guardarDatosProductos(actualizado);
    return actualizado;
}
//# sourceMappingURL=servicioDatos.js.map