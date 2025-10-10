export enum CategoriaProducto{
    frutas = 'Frutas Frescas',
    verduras = 'Verduras organicas',
    organicos = 'Productos Orgánicos',
    lacteos = 'Productos Lácteos',
}

export enum RolUsuario {
    administrador = 'administrador',
    cliente = 'cliente',
    vendedor = 'vendedor',
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
    precio: number;
    stock: number;
    categoria: CategoriaProducto;
    imagen: string;
    isActivo: Estado;
    fechaCreacion: string;
    peso: string;
    fechaActualizacion?: string; 
}
export interface IUsuario {
    id: number;
    email: string;
    usuario: string;
    password: string;
    nombre: string;
    apellido: string;
    rol: RolUsuario;
    isActivo: Estado;
    fechaRegistro: string;
    telefono?: string;
    direccion?: string;
    ultimaActualizacion?: string;
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

export interface IDataUsuarios {
    usuarios: IUsuario[];
    configuracion: {
        proximoId: number;
        version: string;
        ultimaActualizacion: string;
    }
}

