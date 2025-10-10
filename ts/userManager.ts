import { Estado, IDataUsuarios, IUsuario, RolUsuario, ISesionActiva } from './models.js';
import { obtenerDatosUsuarios, guardarDatosUsuarios } from './servicioUsuarios.js';

export interface ResultadoOperacionUsuario<T = unknown> {
  success: boolean;
  mensaje: string;
  usuario?: IUsuario;
  data?: T;
}

export interface ResultadoLogin {
  success: boolean;
  mensaje?: string;
  usuario?: IUsuario;
}

export class UserManager {
  private usuariosCache: IDataUsuarios | null = null;
  private readonly claveSesion = 'sesionActiva';

  private cargarDatosInternos(): IDataUsuarios {
    if (this.usuariosCache) {
      return this.usuariosCache;
    }
    const datos = obtenerDatosUsuarios();
    this.usuariosCache = datos;
    return datos;
  }

  private persistir(datos: IDataUsuarios): void {
    guardarDatosUsuarios(datos);
    this.usuariosCache = datos;
  }

  public cargarDatos(): IDataUsuarios {
    return this.cargarDatosInternos();
  }

  public obtenerTodosLosUsuarios(): IUsuario[] {
    return this.cargarDatosInternos().usuarios;
  }

  public obtenerUsuariosActivos(): IUsuario[] {
    return this.obtenerTodosLosUsuarios().filter((usuario) => (usuario.estado ?? usuario.isActivo) === Estado.activo);
  }

  public validarLogin(identificador: string, password: string): ResultadoLogin {
    const datos = this.cargarDatosInternos();
    const usuario = datos.usuarios.find(
      (u) =>
        (u.usuario === identificador || u.email === identificador) &&
        u.password === password &&
        (u.estado ?? u.isActivo) === Estado.activo,
    );

    if (!usuario) {
      return { success: false, mensaje: 'Usuario o contraseña incorrectos' };
    }

    const sesion: ISesionActiva = {
      id: usuario.id,
      usuario: usuario.usuario,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      fechaLogin: new Date().toISOString(),
      ...(usuario.telefono ? { telefono: usuario.telefono } : {}),
      ...(usuario.direccion ? { direccion: usuario.direccion } : {}),
    };
    localStorage.setItem(this.claveSesion, JSON.stringify(sesion));
    return { success: true, usuario };
  }

  public obtenerSesionActiva(): ISesionActiva | null {
    const sesion = localStorage.getItem(this.claveSesion);
    if (!sesion) {
      return null;
    }
    try {
      return JSON.parse(sesion) as ISesionActiva;
    } catch (error) {
      console.error('UserManager: Error parseando sesión activa', error);
      localStorage.removeItem(this.claveSesion);
      return null;
    }
  }

  public getSesionActiva(): ISesionActiva | null {
    return this.obtenerSesionActiva();
  }

  public cerrarSesion(): void {
    localStorage.removeItem(this.claveSesion);
  }

  public agregarUsuario(datosUsuario: Partial<IUsuario>): ResultadoOperacionUsuario {
    const datos = this.cargarDatosInternos();
    const existe = datos.usuarios.some(
      (usuario) => usuario.email === datosUsuario.email || usuario.usuario === datosUsuario.usuario,
    );
    if (existe) {
      return { success: false, mensaje: 'El usuario o email ya existe' };
    }

    const nuevoUsuario: IUsuario = {
      id: datos.configuracion.proximoId,
      email: datosUsuario.email ?? '',
      usuario: datosUsuario.usuario ?? '',
      password: datosUsuario.password ?? '',
      nombre: datosUsuario.nombre ?? '',
      apellido: datosUsuario.apellido ?? '',
      rol: datosUsuario.rol ?? RolUsuario.cliente,
      isActivo: datosUsuario.estado ?? datosUsuario.isActivo ?? Estado.activo,
      estado: datosUsuario.estado ?? datosUsuario.isActivo ?? Estado.activo,
      fechaRegistro: new Date().toISOString().substring(0, 10),
      favoritos: datosUsuario.favoritos ?? [],
      pedidos: datosUsuario.pedidos ?? [],
      ...(datosUsuario.telefono ? { telefono: datosUsuario.telefono } : {}),
      ...(datosUsuario.direccion ? { direccion: datosUsuario.direccion } : {}),
      ...(datosUsuario.fechaNacimiento ? { fechaNacimiento: datosUsuario.fechaNacimiento } : {}),
      ...(datosUsuario.avatar ? { avatar: datosUsuario.avatar } : {}),
    };

    datos.usuarios.push(nuevoUsuario);
    datos.configuracion.proximoId += 1;
    datos.configuracion.ultimaActualizacion = new Date().toISOString();
    this.persistir(datos);

    return {
      success: true,
      mensaje: 'Usuario creado exitosamente',
      usuario: nuevoUsuario,
    };
  }

  public actualizarUsuario(id: number, datosActualizados: Partial<IUsuario>): ResultadoOperacionUsuario {
    const datos = this.cargarDatosInternos();
    const indice = datos.usuarios.findIndex((usuario) => usuario.id === id);
    if (indice === -1) {
      return { success: false, mensaje: 'Usuario no encontrado' };
    }

    const usuarioActual = datos.usuarios[indice];
    if (!usuarioActual) {
      return { success: false, mensaje: 'Usuario no encontrado' };
    }

    const usuarioActualizado: IUsuario = {
      ...usuarioActual,
      email: datosActualizados.email ?? usuarioActual.email,
      usuario: datosActualizados.usuario ?? usuarioActual.usuario,
      password: datosActualizados.password ?? usuarioActual.password,
      nombre: datosActualizados.nombre ?? usuarioActual.nombre,
      apellido: datosActualizados.apellido ?? usuarioActual.apellido,
      rol: datosActualizados.rol ?? usuarioActual.rol,
      isActivo: datosActualizados.estado ?? datosActualizados.isActivo ?? usuarioActual.isActivo,
      estado: datosActualizados.estado ?? datosActualizados.isActivo ?? usuarioActual.estado ?? usuarioActual.isActivo,
  favoritos: datosActualizados.favoritos ?? usuarioActual.favoritos ?? [],
  pedidos: datosActualizados.pedidos ?? usuarioActual.pedidos ?? [],
      ultimaActualizacion: new Date().toISOString(),
      ...(usuarioActual.fechaRegistro ? { fechaRegistro: usuarioActual.fechaRegistro } : {}),
      ...(datosActualizados.telefono !== undefined ? { telefono: datosActualizados.telefono } : {}),
      ...(datosActualizados.direccion !== undefined ? { direccion: datosActualizados.direccion } : {}),
      ...(datosActualizados.fechaNacimiento !== undefined
        ? { fechaNacimiento: datosActualizados.fechaNacimiento }
        : {}),
      ...(datosActualizados.avatar !== undefined ? { avatar: datosActualizados.avatar } : {}),
    };

    datos.usuarios[indice] = usuarioActualizado;
    datos.configuracion.ultimaActualizacion = new Date().toISOString();
    this.persistir(datos);

    const sesion = this.obtenerSesionActiva();
    if (sesion && sesion.id === id) {
      const sesionActualizada: ISesionActiva = {
        ...sesion,
        nombre: usuarioActualizado.nombre,
        apellido: usuarioActualizado.apellido,
        rol: usuarioActualizado.rol,
        ...(usuarioActualizado.telefono ? { telefono: usuarioActualizado.telefono } : {}),
        ...(usuarioActualizado.direccion ? { direccion: usuarioActualizado.direccion } : {}),
      };
      localStorage.setItem(this.claveSesion, JSON.stringify(sesionActualizada));
    }

    return { success: true, mensaje: 'Usuario actualizado correctamente', usuario: usuarioActualizado };
  }

  public eliminarUsuario(id: number): ResultadoOperacionUsuario {
    const datos = this.cargarDatosInternos();
    const indice = datos.usuarios.findIndex((usuario) => usuario.id === id);
    if (indice === -1) {
      return { success: false, mensaje: 'Usuario no encontrado' };
    }

    const usuario = datos.usuarios[indice];
    if (!usuario) {
      return { success: false, mensaje: 'Usuario no encontrado' };
    }

    const administradoresActivos = datos.usuarios.filter(
      (u) => (u.rol === RolUsuario.administrador || u.rol === RolUsuario.vendedor) && (u.estado ?? u.isActivo) === Estado.activo,
    );

    if (usuario.rol === RolUsuario.administrador && administradoresActivos.length <= 1) {
      return { success: false, mensaje: 'No se puede eliminar el último administrador activo' };
    }

    datos.usuarios.splice(indice, 1);
    datos.configuracion.ultimaActualizacion = new Date().toISOString();
    this.persistir(datos);

    return { success: true, mensaje: 'Usuario eliminado correctamente' };
  }

  public restaurarDatosIniciales(): void {
    this.usuariosCache = null;
    localStorage.removeItem('usuarios_huertohogar_data');
    this.cargarDatosInternos();
  }
}

const userManager = new UserManager();

export { userManager };

declare global {
  interface Window {
    userManager: UserManager;
  }
}

window.userManager = userManager;
