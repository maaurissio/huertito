import { datosUsuariosIniciales } from './usuariosIniciales.js';
const CLAVE_DATOS_USUARIOS = 'usuarios_huertohogar_data';
function clonarDatos(datos) {
    return {
        usuarios: datos.usuarios.map((usuario) => ({ ...usuario })),
        configuracion: { ...datos.configuracion },
    };
}
function crearDatosIniciales() {
    return clonarDatos(datosUsuariosIniciales);
}
export function obtenerDatosUsuarios() {
    const datosAlmacenados = localStorage.getItem(CLAVE_DATOS_USUARIOS);
    if (datosAlmacenados) {
        const datos = JSON.parse(datosAlmacenados);
        return clonarDatos(datos);
    }
    const datosIniciales = crearDatosIniciales();
    guardarDatosUsuarios(datosIniciales);
    return clonarDatos(datosIniciales);
}
export function guardarDatosUsuarios(datos) {
    localStorage.setItem(CLAVE_DATOS_USUARIOS, JSON.stringify(datos));
}
export function actualizarDatosUsuarios(transformer) {
    const actual = obtenerDatosUsuarios();
    const actualizado = transformer(actual);
    guardarDatosUsuarios(actualizado);
    return actualizado;
}
export function actualizarUsuarioEnCache(usuarioActualizado) {
    actualizarDatosUsuarios((datos) => {
        const indice = datos.usuarios.findIndex((usuario) => usuario.id === usuarioActualizado.id);
        if (indice >= 0) {
            datos.usuarios[indice] = { ...usuarioActualizado };
        }
        return datos;
    });
}
//# sourceMappingURL=servicioUsuarios.js.map