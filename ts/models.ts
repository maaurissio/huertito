export enum CategoriaProducto {
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

export interface IProductoConfiguracion {
  proximoId: number;
  version?: string;
  ultimaActualizacion: string;
  categorias: string[];
}

export interface IProducto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
  categoria: CategoriaProducto | string;
  isActivo: Estado;
  estado?: Estado;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  peso?: string;
}

export interface IDataProductos {
  productos: IProducto[];
  configuracion: IProductoConfiguracion;
}

export interface IUsuarioConfiguracion {
  proximoId: number;
  version?: string;
  ultimaActualizacion: string;
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
  estado?: Estado;
  telefono?: string;
  direccion?: string;
  fechaRegistro?: string;
  ultimaActualizacion?: string;
  fechaNacimiento?: string;
  avatar?: string;
  favoritos?: Array<{
    id: string | number;
    nombre: string;
    descripcion?: string;
    precio: number;
    imagen: string;
  }>;
  pedidos?: Array<{
    id: string | number;
    fecha: string;
    estado: string;
    total: number;
  }>;
}

export interface IDataUsuarios {
  usuarios: IUsuario[];
  configuracion: IUsuarioConfiguracion;
}

export interface ISesionActiva {
  id: number;
  usuario: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  fechaLogin: string;
  telefono?: string;
  direccion?: string;
}
