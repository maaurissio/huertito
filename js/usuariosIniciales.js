import { Estado, RolUsuario } from './models.js';
export const usuariosIniciales = [
    {
        id: 1,
        email: 'mauri@huertohogar.com',
        usuario: 'maurisio',
        password: 'mauri123',
        nombre: 'Mauricio',
        apellido: 'Gajardo',
        rol: RolUsuario.administrador,
        isActivo: Estado.activo,
        estado: Estado.activo,
        fechaRegistro: '2025-01-01',
    },
    {
        id: 2,
        email: 'vixo@huertohogar.com',
        usuario: 'minipekka',
        password: 'vixo123',
        nombre: 'Vicente',
        apellido: 'Colicheo',
        rol: RolUsuario.administrador,
        isActivo: Estado.activo,
        estado: Estado.activo,
        fechaRegistro: '2025-01-15',
    },
    {
        id: 3,
        email: 'wacoldo@gmail.com',
        usuario: 'wacoldo',
        password: 'wa123',
        nombre: 'Wacoldo',
        apellido: 'Diogenes',
        rol: RolUsuario.cliente,
        isActivo: Estado.activo,
        estado: Estado.activo,
        fechaRegistro: '2025-02-01',
    },
];
export const datosUsuariosIniciales = {
    usuarios: usuariosIniciales,
    configuracion: {
        proximoId: 4,
        version: '1.0',
        ultimaActualizacion: '2024-01-01T00:00:00Z',
    },
};
//# sourceMappingURL=usuariosIniciales.js.map