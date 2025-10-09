import { IDataUsuarios } from './models.js';
import { datosUsuariosIniciales } from './usuariosIniciales.js';

const CLAVE_DATOS_USUARIOS = 'usuarios_huertohogar_data';

function clonarDatos(datos: IDataUsuarios): IDataUsuarios {
    return {
        usuarios: datos.usuarios.map(usuario => ({ ...usuario })),
        configuracion: { ...datos.configuracion },
    };
}

function crearDatosIniciales(): IDataUsuarios {
    return clonarDatos(datosUsuariosIniciales);
}

export function obtenerDatosUsuarios(): IDataUsuarios {
    const datosAlmacenados = localStorage.getItem(CLAVE_DATOS_USUARIOS);

    if (datosAlmacenados) {
        return JSON.parse(datosAlmacenados) as IDataUsuarios;
    }

    const datosIniciales = crearDatosIniciales();
    guardarDatosUsuarios(datosIniciales);
    return datosIniciales;
}

export function guardarDatosUsuarios(datos: IDataUsuarios): void {
    localStorage.setItem(CLAVE_DATOS_USUARIOS, JSON.stringify(datos));
}
