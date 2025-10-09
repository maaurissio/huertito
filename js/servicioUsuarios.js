import { datosUsuariosIniciales } from './usuariosIniciales.js';
const CLAVE_DATOS_USUARIOS = 'usuarios_huertohogar_data';
function clonarDatos(datos) {
    return {
        usuarios: datos.usuarios.map(usuario => ({ ...usuario })),
        configuracion: { ...datos.configuracion },
    };
}
function crearDatosIniciales() {
    return clonarDatos(datosUsuariosIniciales);
}
export function obtenerDatosUsuarios() {
    const datosAlmacenados = localStorage.getItem(CLAVE_DATOS_USUARIOS);
    if (datosAlmacenados) {
        return JSON.parse(datosAlmacenados);
    }
    const datosIniciales = crearDatosIniciales();
    guardarDatosUsuarios(datosIniciales);
    return datosIniciales;
}
export function guardarDatosUsuarios(datos) {
    localStorage.setItem(CLAVE_DATOS_USUARIOS, JSON.stringify(datos));
}
