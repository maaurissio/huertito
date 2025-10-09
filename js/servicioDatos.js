// En js/servicioDatos.ts:
import { CategoriaProducto, Estado } from './models.js';
import { productosIniciales } from './datosIniciales.js';
const CLAVE_DATOS_PRODUCTOS = 'productos_huertohogar_data'; // Nueva clave más clara
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
    return {
        ...producto,
        precio: limpiarPrecio(producto.precio),
        stock: limpiarStock(producto.stock),
        isActivo: normalizarEstado(producto.isActivo ?? producto.estado),
    };
}
function normalizarDatos(data) {
    return {
        productos: data.productos.map(normalizarProducto),
        configuracion: {
            ...data.configuracion,
            categorias: data.configuracion.categorias?.length ? data.configuracion.categorias : Object.values(CategoriaProducto),
            ultimaActualizacion: data.configuracion.ultimaActualizacion ?? new Date().toISOString(),
        },
    };
}
// Esta función creará el objeto completo IDataProductos inicial
function crearDatosIniciales() {
    return normalizarDatos({
        productos: productosIniciales,
        configuracion: {
            proximoId: Math.max(...productosIniciales.map(p => p.id)) + 1,
            version: "1.0",
            ultimaActualizacion: new Date().toISOString(),
            // Mapeamos los valores del Enum a strings para la configuración
            categorias: Object.values(CategoriaProducto),
        }
    });
}
export function obtenerDatosProductos() {
    const datosAlmacenados = localStorage.getItem(CLAVE_DATOS_PRODUCTOS);
    if (datosAlmacenados) {
        const datos = JSON.parse(datosAlmacenados);
        const normalizados = normalizarDatos(datos);
        if (normalizados !== datos) {
            guardarDatosProductos(normalizados);
        }
        return normalizados;
    }
    else {
        // Inicializamos, guardamos y devolvemos la versión inicial tipada
        console.log('Inicializando la estructura de datos de productos.');
        const datosIniciales = crearDatosIniciales();
        guardarDatosProductos(datosIniciales);
        return datosIniciales;
    }
}
export function guardarDatosProductos(data) {
    localStorage.setItem(CLAVE_DATOS_PRODUCTOS, JSON.stringify(data));
}
