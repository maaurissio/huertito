import { Estado, RolUsuario } from './models.js';
import { obtenerDatosUsuarios, guardarDatosUsuarios } from './servicioUsuarios.js';
class UserManager {
    constructor() {
        this.usuariosCache = null;
        this.claveSesion = 'sesionActiva';
    }
    cargarDatos() {
        if (this.usuariosCache) {
            return this.usuariosCache;
        }
        const datos = obtenerDatosUsuarios();
        this.usuariosCache = datos;
        return datos;
    }
    persistir(datos) {
        guardarDatosUsuarios(datos);
        this.usuariosCache = datos;
    }
    obtenerTodosLosUsuarios() {
        return this.cargarDatos().usuarios;
    }
    obtenerUsuariosActivos() {
        return this.obtenerTodosLosUsuarios().filter(usuario => usuario.isActivo === Estado.activo);
    }
    validarLogin(identificador, password) {
        const datos = this.cargarDatos();
        const usuario = datos.usuarios.find(u => (u.usuario === identificador || u.email === identificador) &&
            u.password === password &&
            u.isActivo === Estado.activo);
        if (!usuario) {
            return { success: false, mensaje: 'Usuario o contraseña incorrectos' };
        }
        const sesion = {
            id: usuario.id,
            usuario: usuario.usuario,
            email: usuario.email,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol,
            fechaLogin: new Date().toISOString(),
        };
        localStorage.setItem(this.claveSesion, JSON.stringify(sesion));
        return { success: true, usuario };
    }
    obtenerSesionActiva() {
        const sesion = localStorage.getItem(this.claveSesion);
        return sesion ? JSON.parse(sesion) : null;
    }
    getSesionActiva() {
        return this.obtenerSesionActiva();
    }
    cerrarSesion() {
        localStorage.removeItem(this.claveSesion);
    }
    agregarUsuario(datosUsuario) {
        const datos = this.cargarDatos();
        const existe = datos.usuarios.some(usuario => usuario.email === datosUsuario.email || usuario.usuario === datosUsuario.usuario);
        if (existe) {
            return { success: false, mensaje: 'El usuario o email ya existe' };
        }
        const nuevoUsuario = {
            id: datos.configuracion.proximoId,
            email: datosUsuario.email,
            usuario: datosUsuario.usuario,
            password: datosUsuario.password,
            nombre: datosUsuario.nombre,
            apellido: datosUsuario.apellido,
            rol: datosUsuario.rol ?? RolUsuario.cliente,
            isActivo: datosUsuario.estado ?? Estado.activo,
            fechaRegistro: new Date().toISOString().substring(0, 10),
            ...(datosUsuario.telefono ? { telefono: datosUsuario.telefono } : {}),
            ...(datosUsuario.direccion ? { direccion: datosUsuario.direccion } : {}),
        };
        datos.usuarios.push(nuevoUsuario);
        datos.configuracion.proximoId += 1;
        datos.configuracion.ultimaActualizacion = new Date().toISOString();
        this.persistir(datos);
        return { success: true, mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario };
    }
    actualizarUsuario(id, datosActualizados) {
        const datos = this.cargarDatos();
        const indice = datos.usuarios.findIndex(usuario => usuario.id === id);
        if (indice === -1) {
            return { success: false, mensaje: 'Usuario no encontrado' };
        }
        const usuarioActual = datos.usuarios[indice];
        if (!usuarioActual) {
            return { success: false, mensaje: 'Usuario no encontrado' };
        }
        const usuarioActualizado = {
            ...usuarioActual,
            email: datosActualizados.email ?? usuarioActual.email,
            usuario: datosActualizados.usuario ?? usuarioActual.usuario,
            password: datosActualizados.password ?? usuarioActual.password,
            nombre: datosActualizados.nombre ?? usuarioActual.nombre,
            apellido: datosActualizados.apellido ?? usuarioActual.apellido,
            rol: datosActualizados.rol ?? usuarioActual.rol,
            isActivo: datosActualizados.estado ?? usuarioActual.isActivo,
            ...(datosActualizados.telefono !== undefined ? { telefono: datosActualizados.telefono } : {}),
            ...(datosActualizados.direccion !== undefined ? { direccion: datosActualizados.direccion } : {}),
            fechaRegistro: usuarioActual.fechaRegistro,
            ultimaActualizacion: new Date().toISOString(),
        };
        datos.usuarios[indice] = usuarioActualizado;
        datos.configuracion.ultimaActualizacion = new Date().toISOString();
        this.persistir(datos);
        const sesion = this.obtenerSesionActiva();
        if (sesion && sesion.id === id) {
            localStorage.setItem(this.claveSesion, JSON.stringify({ ...sesion, ...usuarioActualizado }));
        }
        return { success: true, mensaje: 'Usuario actualizado correctamente', usuario: usuarioActualizado };
    }
    eliminarUsuario(id) {
        const datos = this.cargarDatos();
        const indice = datos.usuarios.findIndex(usuario => usuario.id === id);
        if (indice === -1) {
            return { success: false, mensaje: 'Usuario no encontrado' };
        }
        const usuario = datos.usuarios[indice];
        if (!usuario) {
            return { success: false, mensaje: 'Usuario no encontrado' };
        }
        const administradoresActivos = datos.usuarios.filter(u => u.rol === RolUsuario.administrador && u.isActivo === Estado.activo);
        if (usuario.rol === RolUsuario.administrador && administradoresActivos.length <= 1) {
            return { success: false, mensaje: 'No se puede eliminar el último administrador activo' };
        }
        datos.usuarios.splice(indice, 1);
        datos.configuracion.ultimaActualizacion = new Date().toISOString();
        this.persistir(datos);
        return { success: true, mensaje: 'Usuario eliminado correctamente' };
    }
    restaurarDatosIniciales() {
        this.usuariosCache = null;
        localStorage.removeItem('usuarios_huertohogar_data');
        this.cargarDatos();
    }
}
const userManager = new UserManager();
export { userManager };
window.userManager = userManager;
