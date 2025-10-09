// Importaciones de los tipos y el servicio
import { IProducto, IDataProductos, CategoriaProducto, Estado } from './models';
import { obtenerDatosProductos, guardarDatosProductos } from './servicioDatos';

/**
 * Interfaz para los datos que se reciben desde un formulario
 */
interface IDatosProductoFormulario {
    nombre: string;
    descripcion: string;
    precio: string; // Se recibe como string, pero se convierte a number
    stock: string; // Se recibe como string, pero se convierte a number
    categoria: CategoriaProducto;
    imagen?: string;
    estado?: Estado;
    peso?: string;
}

class ProductManager {
    // Definimos explícitamente el tipo de la caché
    private productosCache: IDataProductos | null = null;

    constructor() {
        // La ruta JSON ya no es necesaria. Se elimina.
    }

    /**
     * Carga los datos completos (productos y configuración)
     * Utiliza el servicio para cargar desde localStorage o inicializar.
     */
    private cargarDatos(): IDataProductos {
        if (this.productosCache) {
            return this.productosCache;
        }

        // Usamos el servicio de datos para obtener la estructura completa
        const data = obtenerDatosProductos();
        this.productosCache = data;
        return data;
    }

    /**
     * Guarda la estructura IDataProductos completa
     */
    private guardarDatos(data: IDataProductos): void {
        guardarDatosProductos(data);
        this.productosCache = data;
    }

    /**
     * Obtener productos activos (para catálogo)
     */
    obtenerProductosActivos(): IProducto[] {
        const data = this.cargarDatos();
        
        // Tipado: data.productos es IProducto[], producto es IProducto
        const productosActivos: IProducto[] = data.productos.filter(
            (producto: IProducto) => producto.isActivo === Estado.activo
        );
        
        return productosActivos;
    }

    /**
     * Obtener productos por categoría
     */
    obtenerProductosPorCategoria(categoria: CategoriaProducto | 'todos'): IProducto[] {
        const productosActivos = this.obtenerProductosActivos();

        if (categoria === 'todos') {
            return productosActivos;
        }
        
        // Tipado: Usamos el Enum CategoriaProducto para la comparación
        return productosActivos.filter(
            (producto: IProducto) => producto.categoria === categoria
        );
    }

    /**
     * Obtener producto por ID
     */
    obtenerProductoPorId(id: number | string): IProducto | undefined {
        const data = this.cargarDatos();
        const idBuscado = typeof id === 'string' ? parseInt(id) : id;
        
        // Usamos find y el tipo IProducto
        return data.productos.find(
            (producto: IProducto) => producto.id === idBuscado
        );
    }

    /**
     * Agregar nuevo producto
     */
    agregarProducto(datosProducto: IDatosProductoFormulario): { success: boolean, mensaje: string, producto?: IProducto } {
        try {
            const data = this.cargarDatos();
            
            // Validar datos del producto (se tipa la función abajo)
            const validacion = this.validarDatosProducto(datosProducto);
            if (!validacion.valido) {
                return { 
                    success: false, 
                    mensaje: 'Datos inválidos: ' + validacion.errores.join(', ') 
                };
            }

            // Crear nuevo producto, asegurando que cumple con IProducto
            const nuevoProducto: IProducto = {
                id: data.configuracion.proximoId,
                codigo: datosProducto.nombre.substring(0, 3).toUpperCase() + data.configuracion.proximoId, // Generación de código simple
                nombre: datosProducto.nombre,
                descripcion: datosProducto.descripcion,
                precio: parseFloat(datosProducto.precio), // Convertimos a Number
                stock: parseInt(datosProducto.stock),     // Convertimos a Number
                categoria: datosProducto.categoria,
                imagen: datosProducto.imagen || 'img/default.jpg',
                isActivo: datosProducto.estado ?? Estado.activo,
                fechaCreacion: new Date().toISOString().substring(0, 10),
                peso: datosProducto.peso || '1kg'
            };

            // Agregar y actualizar configuración
            data.productos.push(nuevoProducto);
            data.configuracion.proximoId++;
            data.configuracion.ultimaActualizacion = new Date().toISOString();

            // Guardar cambios
            this.guardarDatos(data);
            
            this.verificarYDesactivarSinStock(); // Llamada síncrona, ya no es async
            
            return { 
                success: true, 
                mensaje: 'Producto creado exitosamente',
                producto: nuevoProducto 
            };

        } catch (error) {
            console.error('Error agregando producto:', error);
            // Tipamos el error para asegurar que tenga un mensaje
            return { success: false, mensaje: 'Error interno al crear producto: ' + (error as Error).message };
        }
    }

    // ************* Otras funciones refactorizadas (Ejemplo: Actualizar) *************

    /**
     * Actualizar producto existente
     */
    actualizarProducto(productoId: number | string, datosActualizados: IDatosProductoFormulario): { success: boolean, mensaje: string, producto?: IProducto } {
        const idBuscado = typeof productoId === 'string' ? parseInt(productoId) : productoId;
        
        try {
            const data = this.cargarDatos();
            const indiceProducto = data.productos.findIndex(p => p.id === idBuscado);
            
            if (indiceProducto === -1) {
                return { success: false, mensaje: 'Producto no encontrado' };
            }
            
            // Validar datos actualizados
            const validacion = this.validarDatosProducto(datosActualizados);
            if (!validacion.valido) {
                return { success: false, mensaje: 'Datos inválidos: ' + validacion.errores.join(', ') };
            }
            
            const productoOriginal = data.productos[indiceProducto];

            if (!productoOriginal) {
                return { success: false, mensaje: 'Producto no encontrado' };
            }
            
            // Creación del objeto actualizado con tipado IProducto
            const productoActualizado: IProducto = {
                ...productoOriginal,
                nombre: datosActualizados.nombre,
                descripcion: datosActualizados.descripcion,
                precio: parseFloat(datosActualizados.precio),
                stock: parseInt(datosActualizados.stock),
                categoria: datosActualizados.categoria,
                imagen: datosActualizados.imagen || productoOriginal.imagen,
                isActivo: datosActualizados.estado ?? productoOriginal.isActivo,
                peso: datosActualizados.peso || productoOriginal.peso,
                fechaActualizacion: new Date().toISOString().substring(0, 10)
            };
            
            // Actualizar, guardar y verificar
            data.productos[indiceProducto] = productoActualizado;
            data.configuracion.ultimaActualizacion = new Date().toISOString();
            
            this.guardarDatos(data);
            this.verificarYDesactivarSinStock();
            
            return { success: true, producto: productoActualizado, mensaje: 'Producto actualizado exitosamente' };
            
        } catch (error) {
            console.error('ProductManager: Error al actualizar producto:', error);
            return { success: false, mensaje: 'Error al actualizar producto: ' + (error as Error).message };
        }
    }


    /**
     * Verificar y desactivar productos sin stock (Síncrona)
     */
    verificarYDesactivarSinStock(): { success: boolean, productosDesactivados?: number, mensaje?: string } {
        try {
            const data = this.cargarDatos();
            let productosDesactivados = 0;

            data.productos.forEach((producto: IProducto) => {
                if (producto.stock <= 0 && producto.isActivo === Estado.activo) {
                    producto.isActivo = Estado.inactivo;
                    productosDesactivados++;
                    console.log(`Producto ${producto.nombre} desactivado automáticamente por falta de stock`);
                }
            });

            if (productosDesactivados > 0) {
                data.configuracion.ultimaActualizacion = new Date().toISOString();
                this.guardarDatos(data);
            }
            
            return { success: true, productosDesactivados };
            
        } catch (error) {
            console.error('Error verificando stock:', error);
            return { success: false, mensaje: 'Error al verificar stock' };
        }
    }

    /**
     * Obtener todos los productos para el dashboard
     */
    obtenerTodosLosProductos(): IProducto[] {
        const data = this.cargarDatos();
        return data.productos;
    }

    /**
     * Validar datos de producto (tipado)
     */
    validarDatosProducto(datos: IDatosProductoFormulario): { valido: boolean, errores: string[] } {
        const errores: string[] = [];

        if (!datos.nombre || datos.nombre.trim().length < 2) {
            errores.push('El nombre debe tener al menos 2 caracteres');
        }
        // ... (resto de validaciones)
        // Nota: Las validaciones de precio y stock se hacen sobre el string recibido
        
        if (!datos.precio || isNaN(parseFloat(datos.precio)) || parseFloat(datos.precio) <= 0) {
            errores.push('El precio debe ser un número mayor a 0');
        }

        if (!datos.stock || isNaN(parseInt(datos.stock)) || parseInt(datos.stock) < 0) {
            errores.push('El stock debe ser un número mayor o igual a 0');
        }
        
        // Usamos el Enum para validar categoría
        if (!datos.categoria || !Object.values(CategoriaProducto).includes(datos.categoria)) {
            errores.push('Debe seleccionar una categoría válida');
        }

        return { valido: errores.length === 0, errores };
    }

    /**
     * Obtener categorías disponibles
     */
    obtenerCategorias(): string[] {
        const data = this.cargarDatos();
        return data.configuracion.categorias || Object.values(CategoriaProducto);
    }
}

// Crear instancia tipada
const productManager = new ProductManager();

// ===============================================
// FUNCIONES GLOBALES PARA INTEGRACIÓN
// ===============================================

/**
 * Obtener productos para mostrar en catálogo (tipado)
 */
function obtenerProductosCatalogo(categoria: CategoriaProducto | 'todos' = 'todos'): IProducto[] {
    return productManager.obtenerProductosPorCategoria(categoria);
}

// Exportamos el manager y las funciones globales para que puedan ser usadas.
// En TypeScript, necesitas exportar lo que usarás en otros módulos o globalmente.
export { productManager, obtenerProductosCatalogo };
// Nota: Las funciones window.X deben ser redefinidas en el global scope si se compila
// como módulo, o se deja como estaba si se compila como script. Por simplicidad,
// dejaremos la clase y funciones globales para que el compilador las vea.
// Si tu tsconfig usa módulos (como CommonJS o ES6), las funciones window.X
// deben ser movidas fuera de la clase y tipadas con (window as any).X o declaradas
// en un archivo de tipos global.

// **TIP FINAL:** En un entorno simple sin bundler, para que las funciones
// globales funcionen, a veces es más fácil dejar solo la instancia global:
(window as any).productManager = productManager;
// Y tipar las funciones globales del archivo original:
(window as any).obtenerProductosCatalogo = obtenerProductosCatalogo; 

// ************ El resto de funciones globales (verProductos, resetear, etc.) ************
// ************ Se pueden refactorizar de forma similar fuera de la clase ************