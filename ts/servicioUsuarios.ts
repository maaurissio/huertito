import { datosUsuariosIniciales } from './usuariosIniciales.js';
import { IDataUsuarios, IUsuario } from './models.js';

const CLAVE_DATOS_USUARIOS = 'usuarios_huertohogar_data';

function clonarDatos(datos: IDataUsuarios): IDataUsuarios {
  return {
    usuarios: datos.usuarios.map((usuario) => ({ ...usuario })),
    configuracion: { ...datos.configuracion },
  };
}

function crearDatosIniciales(): IDataUsuarios {
  return clonarDatos(datosUsuariosIniciales);
}

export function obtenerDatosUsuarios(): IDataUsuarios {
  const datosAlmacenados = localStorage.getItem(CLAVE_DATOS_USUARIOS);
  if (datosAlmacenados) {
    const datos: IDataUsuarios = JSON.parse(datosAlmacenados);
    return clonarDatos(datos);
  }

  const datosIniciales = crearDatosIniciales();
  guardarDatosUsuarios(datosIniciales);
  return clonarDatos(datosIniciales);
}

export function guardarDatosUsuarios(datos: IDataUsuarios): void {
  localStorage.setItem(CLAVE_DATOS_USUARIOS, JSON.stringify(datos));
}

export function actualizarDatosUsuarios(transformer: (datos: IDataUsuarios) => IDataUsuarios): IDataUsuarios {
  const actual = obtenerDatosUsuarios();
  const actualizado = transformer(actual);
  guardarDatosUsuarios(actualizado);
  return actualizado;
}

export function actualizarUsuarioEnCache(usuarioActualizado: IUsuario): void {
  actualizarDatosUsuarios((datos) => {
    const indice = datos.usuarios.findIndex((usuario) => usuario.id === usuarioActualizado.id);
    if (indice >= 0) {
      datos.usuarios[indice] = { ...usuarioActualizado };
    }
    return datos;
  });
}
