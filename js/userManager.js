class UserManager {
    constructor() {
        this.usuariosCache = null;
        // Determinar la ruta del JSON según la ubicación actual
        this.rutaJSON = this.determinarRutaJSON();
    }

    /**
     * Determina la ruta correcta al archivo JSON según la ubicación actual
     */
    determinarRutaJSON() {
        const currentPath = window.location.pathname;
        console.log('UserManager: Determinando ruta JSON para:', currentPath);
        
        // Intentar con ruta absoluta simple primero
        const simpleUrl = '/data/users.json';
        console.log('UserManager: Usando ruta JSON simple:', simpleUrl);
        return simpleUrl;
    }


     // Cargar usuarios desde localStorage o JSON
    async cargarUsuarios() {
        try {
            if (this.usuariosCache) {
                console.log('UserManager: Usando caché de usuarios');
                return this.usuariosCache;
            }

            // Primero intentar cargar desde localStorage (usuarios creados por dashboard)
            const usuariosLocal = localStorage.getItem('usuariosJSON');
            if (usuariosLocal) {
                try {
                    const data = JSON.parse(usuariosLocal);
                    if (data && data.usuarios && Array.isArray(data.usuarios)) {
                        console.log('UserManager: Usuarios cargados desde localStorage:', data.usuarios.length, 'usuarios');
                        this.usuariosCache = data;
                        return data;
                    }
                } catch (error) {
                    console.warn('UserManager: Error parseando usuarios de localStorage:', error);
                }
            }

            // Si no hay en localStorage, intentar cargar desde JSON
            console.log('UserManager: Intentando cargar usuarios desde:', this.rutaJSON);
            const response = await fetch(this.rutaJSON);
            if (!response.ok) {
                throw new Error(`Error al cargar usuarios: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            // Sincronizar con localStorage para futuras creaciones
            localStorage.setItem('usuariosJSON', JSON.stringify(data));
            this.usuariosCache = data;
            console.log('UserManager: Usuarios cargados desde JSON y sincronizados:', data.usuarios.length, 'usuarios');
            return data;
        } catch (error) {
            console.error('UserManager: Error cargando usuarios:', error);
            // Fallback a usuarios por defecto
            console.log('UserManager: Usando usuarios por defecto e inicializando localStorage');
            const usuariosPorDefecto = this.getUsuariosPorDefecto();
            localStorage.setItem('usuariosJSON', JSON.stringify(usuariosPorDefecto));
            this.usuariosCache = usuariosPorDefecto;
            return usuariosPorDefecto;
        }
    }

    /**
     * Usuarios por defecto si falla la carga del JSON
     */
    getUsuariosPorDefecto() {
        return {
            usuarios: [
                {
                    id: 1,
                    email: "admin@huertohogar.com",
                    usuario: "admin",
                    password: "admin123",
                    nombre: "Administrador",
                    apellido: "Sistema",
                    rol: "administrador",
                    fechaRegistro: new Date().toISOString().split('T')[0],
                    estado: "activo"
                }
            ],
            configuracion: {
                proximoId: 2,
                version: "1.0",
                ultimaActualizacion: new Date().toISOString()
            }
        };
    }

    /**
     * Validar login de usuario
     */
    async validarLogin(usuario, password) {
        console.log('UserManager: Iniciando validación de login para:', usuario);
        
        try {
            const data = await this.cargarUsuarios();
            console.log('UserManager: Datos de usuarios cargados:', data);
            
            // Buscar por usuario o email
            const usuarioEncontrado = data.usuarios.find(u => 
                (u.usuario === usuario || u.email === usuario) && 
                u.password === password &&
                u.estado === 'activo'
            );

            console.log('UserManager: Usuario encontrado:', !!usuarioEncontrado);

            if (usuarioEncontrado) {
                // Guardar sesión
                const sesion = {
                    id: usuarioEncontrado.id,
                    usuario: usuarioEncontrado.usuario,
                    email: usuarioEncontrado.email,
                    nombre: usuarioEncontrado.nombre,
                    apellido: usuarioEncontrado.apellido,
                    rol: usuarioEncontrado.rol,
                    fechaLogin: new Date().toISOString()
                };
                
                localStorage.setItem('sesionActiva', JSON.stringify(sesion));
                console.log('UserManager: Login exitoso para usuario:', sesion.usuario);
                return { exito: true, success: true, usuario: sesion };
            }

            console.log('UserManager: Login falló - credenciales incorrectas');
            return { exito: false, success: false, mensaje: 'Usuario o contraseña incorrectos' };
            
        } catch (error) {
            console.error('UserManager: Error en validarLogin:', error);
            return { 
                exito: false, 
                success: false, 
                mensaje: 'Error de conexión. Verifique su conexión a internet.' 
            };
        }
    }

    /**
     * Agregar nuevo usuario
     */
    async agregarUsuario(datosUsuario) {
        try {
            const data = await this.cargarUsuarios();
            
            // Validar que no exista el usuario o email
            const existe = data.usuarios.find(u => 
                u.usuario === datosUsuario.usuario || 
                u.email === datosUsuario.email
            );
            
            if (existe) {
                return { 
                    success: false, 
                    mensaje: 'El usuario o email ya existe' 
                };
            }

            // Crear nuevo usuario
            const nuevoUsuario = {
                id: data.configuracion.proximoId,
                email: datosUsuario.email,
                usuario: datosUsuario.usuario,
                password: datosUsuario.password,
                nombre: datosUsuario.nombre,
                apellido: datosUsuario.apellido || '',
                rol: datosUsuario.rol || 'vendedor',
                fechaRegistro: new Date().toISOString().split('T')[0],
                estado: 'activo'
            };

            // Agregar a la lista
            data.usuarios.push(nuevoUsuario);
            data.configuracion.proximoId++;
            data.configuracion.ultimaActualizacion = new Date().toISOString();

            // Guardar cambios
            await this.guardarUsuarios(data);
            
            return { 
                success: true, 
                mensaje: 'Usuario creado exitosamente',
                usuario: nuevoUsuario 
            };

        } catch (error) {
            console.error('Error agregando usuario:', error);
            return { 
                success: false, 
                mensaje: 'Error interno al crear usuario' 
            };
        }
    }

    /**
     * Guardar usuarios en localStorage
     */
    async guardarUsuarios(data) {
        try {
            // Guardar en localStorage como fuente principal
            localStorage.setItem('usuariosJSON', JSON.stringify(data));
            this.usuariosCache = data;
            
            console.log('UserManager: Usuarios guardados exitosamente en localStorage');
            console.log('UserManager: Total de usuarios:', data.usuarios.length);
            return { success: true };
        } catch (error) {
            console.error('Error guardando usuarios:', error);
            return { success: false, error };
        }
    }

    /**
     * Obtener sesión activa
     */
    getSesionActiva() {
        const sesion = localStorage.getItem('sesionActiva');
        return sesion ? JSON.parse(sesion) : null;
    }

    /**
     * Cerrar sesión
     */
    cerrarSesion() {
        localStorage.removeItem('sesionActiva');
    }

    /**
     * Listar todos los usuarios (solo para admin)
     */
    async listarUsuarios() {
        const data = await this.cargarUsuarios();
        return data.usuarios.map(u => ({
            id: u.id,
            usuario: u.usuario,
            email: u.email,
            nombre: u.nombre,
            apellido: u.apellido,
            rol: u.rol,
            fechaRegistro: u.fechaRegistro,
            estado: u.estado
        }));
    }

    /**
     * Actualizar usuario existente
     */
    async actualizarUsuario(usuarioId, datosActualizados) {
        console.log('UserManager: Actualizando usuario ID:', usuarioId);
        
        try {
            const data = await this.cargarUsuarios();
            const indiceUsuario = data.usuarios.findIndex(u => u.id === usuarioId);
            
            if (indiceUsuario === -1) {
                throw new Error('Usuario no encontrado');
            }
            
            // Mantener algunos campos originales
            const usuarioOriginal = data.usuarios[indiceUsuario];
            const usuarioActualizado = {
                ...usuarioOriginal,
                ...datosActualizados,
                id: usuarioOriginal.id, // Preservar ID
                fechaRegistro: usuarioOriginal.fechaRegistro, // Preservar fecha registro
                ultimaActualizacion: new Date().toISOString()
            };
            
            // Actualizar en el array
            data.usuarios[indiceUsuario] = usuarioActualizado;
            
            // Guardar los cambios
            await this.guardarUsuarios(data);
            
            // Actualizar también la sesión activa si es el mismo usuario
            const sesionActiva = this.getSesionActiva();
            if (sesionActiva && sesionActiva.id === usuarioId) {
                const nuevaSesion = {
                    ...sesionActiva,
                    ...datosActualizados,
                    fechaLogin: sesionActiva.fechaLogin // Preservar fecha de login
                };
                localStorage.setItem('sesionActiva', JSON.stringify(nuevaSesion));
            }
            
            console.log('UserManager: Usuario actualizado exitosamente');
            return { 
                exito: true, 
                usuario: usuarioActualizado 
            };
            
        } catch (error) {
            console.error('UserManager: Error al actualizar usuario:', error);
            return { 
                exito: false, 
                mensaje: 'Error al actualizar usuario: ' + error.message 
            };
        }
    }

    /**
     * Obtener todos los usuarios para el dashboard
     */
    async obtenerUsuarios() {
        try {
            const data = await this.cargarUsuarios();
            return {
                success: true,
                usuarios: data.usuarios || []
            };
        } catch (error) {
            console.error('UserManager: Error al obtener usuarios:', error);
            return {
                success: false,
                mensaje: 'Error al cargar usuarios',
                usuarios: []
            };
        }
    }

    /**
     * Eliminar usuario
     */
    async eliminarUsuario(usuarioId) {
        try {
            const data = await this.cargarUsuarios();
            const indice = data.usuarios.findIndex(u => u.id === parseInt(usuarioId));
            
            if (indice === -1) {
                return {
                    success: false,
                    mensaje: 'Usuario no encontrado'
                };
            }

            // Eliminar usuario
            const usuarioEliminado = data.usuarios.splice(indice, 1)[0];
            data.configuracion.ultimaActualizacion = new Date().toISOString();

            // Guardar cambios
            await this.guardarUsuarios(data);
            
            return {
                success: true,
                mensaje: `Usuario ${usuarioEliminado.nombre} eliminado exitosamente`
            };
            
        } catch (error) {
            console.error('UserManager: Error al eliminar usuario:', error);
            return {
                success: false,
                mensaje: 'Error interno al eliminar usuario'
            };
        }
    }

    /**
     * Validar datos de usuario
     */
    validarDatosUsuario(datos) {
        const errores = [];

        if (!datos.usuario || datos.usuario.length < 3) {
            errores.push('El usuario debe tener al menos 3 caracteres');
        }

        if (!datos.email || !this.validarEmail(datos.email)) {
            errores.push('Debe proporcionar un email válido');
        }

        if (!datos.password || datos.password.length < 6) {
            errores.push('La contraseña debe tener al menos 6 caracteres');
        }

        if (!datos.nombre || datos.nombre.trim().length < 2) {
            errores.push('El nombre debe tener al menos 2 caracteres');
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    }

    /**
     * Validar formato de email
     */
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    async resetearSistemaUsuarios() {
        console.log('UserManager: Reseteando sistema de usuarios...');
        
        try {
            // Limpiar caché y localStorage
            this.usuariosCache = null;
            localStorage.removeItem('usuariosJSON');
            
            // Forzar recarga desde JSON
            const data = await this.cargarUsuarios();
            
            console.log('UserManager: Sistema reseteado exitosamente');
            console.log('UserManager: Usuarios cargados:', data.usuarios.length);
            
            return {
                success: true,
                mensaje: `Sistema reseteado. ${data.usuarios.length} usuarios cargados desde JSON`,
                usuarios: data.usuarios
            };
        } catch (error) {
            console.error('UserManager: Error al resetear sistema:', error);
            return {
                success: false,
                mensaje: 'Error al resetear sistema de usuarios'
            };
        }
    }

    /**
     * Verificar origen de usuarios actual
     */
    verificarOrigenUsuarios() {
        const usuariosLocal = localStorage.getItem('usuariosJSON');
        if (usuariosLocal) {
            return {
                origen: 'localStorage',
                mensaje: 'Usando usuarios desde localStorage (dashboard)'
            };
        } else {
            return {
                origen: 'json',
                mensaje: 'Se cargarán usuarios desde users.json'
            };
        }
    }
}

// Crear instancia global
const userManager = new UserManager();

/**
 * Resetear usuarios desde JSON - usar en consola del navegador
 */
window.resetearUsuarios = async function() {
    console.log('🔄 Reseteando usuarios desde JSON...');
    const resultado = await userManager.resetearSistemaUsuarios();
    console.log(resultado.success ? '✅' : '❌', resultado.mensaje);
    if (resultado.success) {
        console.table(resultado.usuarios.map(u => ({
            ID: u.id,
            Usuario: u.usuario,
            Email: u.email,
            Nombre: `${u.nombre} ${u.apellido}`,
            Rol: u.rol
        })));
    }
    return resultado;
};

/**
 * Ver usuarios actuales - usar en consola del navegador
 */
window.verUsuarios = async function() {
    console.log('👥 Usuarios actuales:');
    const data = await userManager.cargarUsuarios();
    console.table(data.usuarios.map(u => ({
        ID: u.id,
        Usuario: u.usuario,
        Email: u.email,
        Nombre: `${u.nombre} ${u.apellido}`,
        Rol: u.rol,
        Estado: u.estado
    })));
    
    const origen = userManager.verificarOrigenUsuarios();
    console.log('📍 Origen:', origen.mensaje);
    return data.usuarios;
};

/**
 * Limpiar localStorage de usuarios - usar en consola del navegador
 */
window.limpiarUsuarios = function() {
    localStorage.removeItem('usuariosJSON');
    localStorage.removeItem('sesionActiva');
    console.log('🧹 localStorage de usuarios limpiado');
    console.log('💡 Recarga la página para cargar usuarios desde JSON');
};