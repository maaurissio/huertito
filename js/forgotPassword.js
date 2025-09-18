/**
 * Sistema de Recuperación de Contraseña
 * Maneja la validación y envío de solicitudes de recuperación
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner-border');
    const successMessage = document.getElementById('successMessage');
    
    // Validación de email en tiempo real
    emailInput.addEventListener('input', function() {
        validateEmail();
    });
    
    emailInput.addEventListener('blur', function() {
        validateEmail();
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateEmail()) {
            handleForgotPassword();
        }
    });
    
    /**
     * Valida el formato y contenido del email
     * @returns {boolean} True si el email es válido
     */
    function validateEmail() {
        const email = emailInput.value.trim();
        const emailError = document.getElementById('emailError');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Limpiar errores previos
        emailError.classList.add('d-none');
        emailInput.classList.remove('is-invalid');
        
        if (!email) {
            showFieldError('email', 'El correo electrónico es requerido');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            showFieldError('email', 'Ingresa un correo electrónico válido');
            return false;
        }
        
        if (email.length > 254) {
            showFieldError('email', 'El correo electrónico es demasiado largo');
            return false;
        }
        
        // Validaciones adicionales
        const localPart = email.split('@')[0];
        const domainPart = email.split('@')[1];
        
        if (localPart.length > 64) {
            showFieldError('email', 'El nombre de usuario del correo es demasiado largo');
            return false;
        }
        
        if (domainPart && domainPart.length > 253) {
            showFieldError('email', 'El dominio del correo es demasiado largo');
            return false;
        }
        
        // Verificar caracteres especiales válidos
        const validLocalRegex = /^[a-zA-Z0-9._%-]+$/;
        if (!validLocalRegex.test(localPart)) {
            showFieldError('email', 'El correo contiene caracteres no válidos');
            return false;
        }
        
        return true;
    }
    
    /**
     * Muestra mensaje de error en un campo específico
     * @param {string} fieldId - ID del campo
     * @param {string} message - Mensaje de error
     */
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        
        field.classList.add('is-invalid');
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }
    
    /**
     * Maneja el proceso de recuperación de contraseña
     */
    function handleForgotPassword() {
        const email = emailInput.value.trim();
        
        // Mostrar estado de carga
        setLoadingState(true);
        
        // Simular envío de email (aquí conectarías con tu backend)
        setTimeout(() => {
            // Verificar si el email existe en los usuarios predefinidos de auth.js
            const usuarioExiste = verificarEmailEnSistema(email);
            
            if (usuarioExiste) {
                // Email encontrado - generar y guardar código de verificación
                const codigoVerificacion = generarCodigoVerificacion();
                guardarCodigoVerificacion(email, codigoVerificacion);
                
                mostrarNotificacion('Se ha enviado un código de verificación a tu correo', 'success');
                
                // Simular que se envió un email (en producción aquí harías la llamada a tu API)
                console.log('📧 Email de recuperación enviado a:', email);
                console.log('🔑 Código generado:', codigoVerificacion);
                console.log('⏰ Expira en 15 minutos');
                
                // CÓDIGOS DE PRUEBA PARA TESTING LOCAL
                console.log('🧪 CÓDIGOS DE PRUEBA:');
                console.log('   - admin@huerthogar.com → 123456');
                console.log('   - mauricio@huerthogar.com → 111111'); 
                console.log('   - juan@correo.com → 222222');
                console.log('   - maria@correo.com → 333333');
                console.log('   - cliente@test.com → 444444');
                
                // Redirigir a página de verificación después de un momento
                setTimeout(() => {
                    window.location.href = `verificarCodigo.html?email=${encodeURIComponent(email)}`;
                }, 1500);
                
            } else {
                // Email no encontrado
                mostrarNotificacion('No existe una cuenta asociada a este correo electrónico', 'error');
                console.log('❌ Emails válidos para prueba:');
                console.log('   - admin@huerthogar.com');
                console.log('   - mauricio@huerthogar.com');
                console.log('   - juan@correo.com');
                console.log('   - maria@correo.com');
                console.log('   - cliente@test.com');
            }
            
            // Resetear estado de carga
            setLoadingState(false);
            
        }, 2000);
    }
    
    /**
     * Controla el estado de carga del formulario
     * @param {boolean} loading - True para mostrar carga
     */
    function setLoadingState(loading) {
        if (loading) {
            form.classList.add('loading');
            btnText.textContent = 'Enviando...';
            spinner.classList.remove('d-none');
            submitBtn.disabled = true;
        } else {
            form.classList.remove('loading');
            btnText.textContent = 'Enviar enlace de recuperación';
            spinner.classList.add('d-none');
            submitBtn.disabled = false;
        }
    }
    
    /**
     * Muestra el mensaje de éxito y oculta el formulario
     */
    function showSuccessMessage() {
        successMessage.classList.remove('d-none');
        form.style.display = 'none';
    }
    
    /**
     * Genera un código de verificación de 6 dígitos
     * @returns {string} Código de 6 dígitos
     */
    function generarCodigoVerificacion() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    /**
     * Verifica si el email existe en el sistema de autenticación
     * @param {string} email - Email a verificar
     * @returns {boolean} True si el email existe
     */
    function verificarEmailEnSistema(email) {
        // Lista de usuarios del sistema auth.js
        const usuariosValidos = {
            'admin@huerthogar.com': true,
            'mauricio@huerthogar.com': true,
            'juan@correo.com': true,
            'maria@correo.com': true,
            'cliente@test.com': true
        };
        
        return usuariosValidos.hasOwnProperty(email.toLowerCase());
    }
    
    /**
     * Guarda el código de verificación temporalmente en localStorage
     * Con códigos de prueba predefinidos para testing
     * @param {string} email - Email del usuario
     * @param {string} codigo - Código de verificación
     */
    function guardarCodigoVerificacion(email, codigo) {
        // Códigos de prueba predefinidos para testing local
        const codigosPrueba = {
            'admin@huerthogar.com': '123456',
            'mauricio@huerthogar.com': '111111',
            'juan@correo.com': '222222',
            'maria@correo.com': '333333',
            'cliente@test.com': '444444'
        };
        
        // Usar código de prueba si existe, sino usar el generado
        const codigoFinal = codigosPrueba[email.toLowerCase()] || codigo;
        
        const codigoData = {
            email: email,
            codigo: codigoFinal,
            timestamp: Date.now(),
            expiresIn: 15 * 60 * 1000 // 15 minutos
        };
        
        localStorage.setItem('codigoRecuperacion', JSON.stringify(codigoData));
        
        // Log para debugging
        console.log('💾 Código guardado:', codigoFinal, 'para', email);
    }
});