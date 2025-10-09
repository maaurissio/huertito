// En js/servicioDatos.ts:

import { IDataProductos, IProducto, CategoriaProducto } from './models';
import { productosIniciales } from './datosIniciales'; 

const CLAVE_DATOS_PRODUCTOS = 'productos_huertohogar_data'; // Nueva clave más clara

// Esta función creará el objeto completo IDataProductos inicial
function crearDatosIniciales(): IDataProductos {
    return {
        productos: productosIniciales,
        configuracion: {
            proximoId: Math.max(...productosIniciales.map(p => p.id)) + 1,
            version: "1.0",
            ultimaActualizacion: new Date().toISOString(),
            // Mapeamos los valores del Enum a strings para la configuración
            categorias: Object.values(CategoriaProducto), 
        }
    };
}

export function obtenerDatosProductos(): IDataProductos {
    const datosAlmacenados = localStorage.getItem(CLAVE_DATOS_PRODUCTOS);

    if (datosAlmacenados) {
        // Tipamos el JSON parseado directamente
        return JSON.parse(datosAlmacenados) as IDataProductos; 
    } else {
        // Inicializamos, guardamos y devolvemos la versión inicial tipada
        console.log('Inicializando la estructura de datos de productos.');
        const datosIniciales = crearDatosIniciales();
        guardarDatosProductos(datosIniciales);
        return datosIniciales;
    }
}

export function guardarDatosProductos(data: IDataProductos): void {
    localStorage.setItem(CLAVE_DATOS_PRODUCTOS, JSON.stringify(data));
}