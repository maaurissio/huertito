export enum CategoriaProducto{
    frutas = 'Frutas Frescas',
    verduras = 'Verduras organicas',
    organicos = 'Productos Orgánicos',
    lacteos = 'Productos Lácteos',
}

export enum RolUsuario{
    cliente = 'Cliente',
    admin = 'Admin',
}

export enum Estado {
    activo = 'Activo',
    inactivo = 'Inactivo',
}

export interface IProducto {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    precio: number; // CAMBIO IMPORTANTE: Debe ser NUMBER para los cálculos
    stock: number;
    categoria: CategoriaProducto; // Usamos el Enum CategoriaProducto
    imagen: string;
    isActivo: Estado; // Usamos el nuevo Enum EstadoProducto
    fechaCreacion: string;
    peso: string;
    fechaActualizacion?: string; 
}
export interface IUsuario{
    id: number;
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono: string;
    direccion: string;
    rol: RolUsuario;
    isActivo: Estado;
}

// Interfaz para la estructura de datos COMPLETA que se guarda en localStorage
export interface IDataProductos {
    productos: IProducto[];
    configuracion: {
        proximoId: number;
        version: string;
        ultimaActualizacion: string;
        categorias: string[]; // Se mantiene string[] porque es el valor directo que devuelve el manager
    }
}

