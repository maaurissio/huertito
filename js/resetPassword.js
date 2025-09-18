/**
 * Sistema de Restablecimiento de Contraseña
 * Maneja la validación y actualización de contraseña
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner-border');
    const emailDisplay = document.getElementById('emailDisplay');
    
    // Elementos de validación
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const lengthReq = document.getElementById('lengthReq');
    const upperReq = document.getElementById('upperReq');
    const lowerReq = document.getElementById('lowerReq');
    const numberReq = document.getElementById('numberReq');
    
    let email = '';
    
    // Inicializar página
    initializePage();
    
    // Event listeners
    newPasswordInput.addEventListener('input', handlePasswordInput);
    confirmPasswordInput.addEventListener('input', handleConfirmInput);
    form.addEventListener('submit', handleSubmit);
    
    /**
     * Inicializa la página verificando autorización
     */
    function initializePage() {
        // Obtener email de la URL
        const urlParams = new URLSearchParams(window.location.search);
        email = urlParams.get('email');
        
        if (!email) {
            mostrarNotificacion('Error: Acceso no autorizado', 'error');
            setTimeout(() => {
                window.location.href = 'olvidoContrasena.html';
            }, 2000);
            return;
        }
        
        // Verificar si la verificación fue completada
        const verificacion = obtenerVerificacionCompleta();
        if (!verificacion || verificacion.email !== email) {
            mostrarNotificacion('Debes verificar el código primero', 'error');
            setTimeout(() => {
                window.location.href = 'olvidoContrasena.html';
            }, 2000);
            return;
        }
        
        // Mostrar email
        emailDisplay.textContent = email;
        
        // Enfocar primer campo
        newPasswordInput.focus();
    }
    
    /**
     * Maneja la entrada de la nueva contraseña
     */
    function handlePasswordInput() {
        const password = newPasswordInput.value;
        
        // Validar fortaleza
        validatePasswordStrength(password);
        
        // Limpiar error
        clearPasswordError();
        
        // Revalidar confirmación si existe
        if (confirmPasswordInput.value) {
            handleConfirmInput();
        }
    }
    
    /**
     * Maneja la entrada de confirmación de contraseña
     */
    function handleConfirmInput() {
        const password = newPasswordInput.value;
        const confirm = confirmPasswordInput.value;
        
        clearConfirmError();
        
        if (confirm && password !== confirm) {
            showConfirmError('Las contraseñas no coinciden');
        }
    }
    
    /**
     * Maneja el envío del formulario
     */
    function handleSubmit(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const newPassword = newPasswordInput.value;
        
        // Mostrar loading
        setLoadingState(true);
        
        // Simular cambio de contraseña (en producción sería llamada a API)
        setTimeout(() => {
            if (updateUserPassword(email, newPassword)) {
                // Limpiar datos de recuperación
                limpiarDatosRecuperacion();
                
                mostrarNotificacion('Contraseña actualizada exitosamente', 'success');
                
                // Redirigir al login
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } else {
                mostrarNotificacion('Error al actualizar la contraseña', 'error');
                setLoadingState(false);
            }
        }, 2000);
    }
    
    /**
     * Valida la fortaleza de la contraseña
     */
    function validatePasswordStrength(password) {
        let score = 0;
        let feedback = [];
        
        // Verificar longitud
        const hasLength = password.length >= 8;
        updateRequirement(lengthReq, hasLength);
        if (hasLength) score++;
        
        // Verificar mayúscula
        const hasUpper = /[A-Z]/.test(password);
        updateRequirement(upperReq, hasUpper);
        if (hasUpper) score++;
        
        // Verificar minúscula
        const hasLower = /[a-z]/.test(password);
        updateRequirement(lowerReq, hasLower);
        if (hasLower) score++;
        
        // Verificar número
        const hasNumber = /\d/.test(password);
        updateRequirement(numberReq, hasNumber);
        if (hasNumber) score++;
        
        // Bonificaciones adicionales
        if (password.length >= 12) score += 0.5;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 0.5;
        
        // Actualizar barra de fortaleza
        updateStrengthBar(score);
    }
    
    /**
     * Actualiza el indicador de un requisito
     */
    function updateRequirement(element, isValid) {
        const icon = element.querySelector('i');
        if (isValid) {
            icon.className = 'fas fa-check text-success me-2';
            element.classList.add('text-success');
            element.classList.remove('text-danger');
        } else {
            icon.className = 'fas fa-times text-danger me-2';
            element.classList.add('text-danger');
            element.classList.remove('text-success');
        }
    }
    
    /**
     * Actualiza la barra de fortaleza
     */
    function updateStrengthBar(score) {
        const percentage = Math.min(100, (score / 4) * 100);
        strengthBar.style.width = percentage + '%';
        
        if (score < 2) {
            strengthBar.className = 'progress-bar bg-danger';
            strengthText.textContent = 'Débil';
            strengthText.className = 'text-danger';
        } else if (score < 3) {
            strengthBar.className = 'progress-bar bg-warning';
            strengthText.textContent = 'Media';
            strengthText.className = 'text-warning';
        } else if (score < 4) {
            strengthBar.className = 'progress-bar bg-info';
            strengthText.textContent = 'Buena';
            strengthText.className = 'text-info';
        } else {
            strengthBar.className = 'progress-bar bg-success';
            strengthText.textContent = 'Fuerte';
            strengthText.className = 'text-success';
        }
    }
    
    /**
     * Valida todo el formulario
     */
    function validateForm() {
        const password = newPasswordInput.value;
        const confirm = confirmPasswordInput.value;
        let isValid = true;
        
        // Validar contraseña
        if (!password) {
            showPasswordError('La contraseña es requerida');
            isValid = false;
        } else if (password.length < 8) {
            showPasswordError('La contraseña debe tener al menos 8 caracteres');
            isValid = false;
        } else if (!/[A-Z]/.test(password)) {
            showPasswordError('La contraseña debe contener al menos una mayúscula');
            isValid = false;
        } else if (!/[a-z]/.test(password)) {
            showPasswordError('La contraseña debe contener al menos una minúscula');
            isValid = false;
        } else if (!/\d/.test(password)) {
            showPasswordError('La contraseña debe contener al menos un número');
            isValid = false;
        }
        
        // Validar confirmación
        if (!confirm) {
            showConfirmError('Confirma tu contraseña');
            isValid = false;
        } else if (password !== confirm) {
            showConfirmError('Las contraseñas no coinciden');
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Actualiza la contraseña del usuario en el sistema
     * @param {string} email - Email del usuario
     * @param {string} newPassword - Nueva contraseña
     * @returns {boolean} True si se actualizó correctamente
     */
    function updateUserPassword(email, newPassword) {
        try {
            // Lista de usuarios válidos del sistema auth.js
            const usuariosValidos = [
                'admin@huerthogar.com',
                'mauricio@huerthogar.com', 
                'juan@correo.com',
                'maria@correo.com',
                'cliente@test.com'
            ];
            
            const emailLower = email.toLowerCase();
            
            if (!usuariosValidos.includes(emailLower)) {
                console.error('Usuario no válido para recuperación:', email);
                return false;
            }
            
            // Simular actualización de contraseña
            // En producción aquí harías la llamada a tu API/backend
            console.log('🔒 Contraseña actualizada exitosamente para:', email);
            console.log('🔑 Nueva contraseña:', newPassword);
            console.log('📅 Fecha de cambio:', new Date().toISOString());
            
            // Guardar registro local para debugging (opcional)
            const passwordChange = {
                email: email,
                timestamp: new Date().toISOString(),
                success: true
            };
            
            // Guardar en localStorage para referencia (en desarrollo)
            const passwordHistory = JSON.parse(localStorage.getItem('passwordChanges') || '[]');
            passwordHistory.push(passwordChange);
            localStorage.setItem('passwordChanges', JSON.stringify(passwordHistory));
            
            return true;
            
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            return false;
        }
    }
    
    /**
     * Obtiene los datos de verificación completa
     */
    function obtenerVerificacionCompleta() {
        try {
            const verificacionData = localStorage.getItem('verificacionCompleta');
            if (!verificacionData) return null;
            
            const data = JSON.parse(verificacionData);
            const now = Date.now();
            
            // Verificar si ha expirado (10 minutos)
            if (now - data.timestamp > data.expiresIn) {
                localStorage.removeItem('verificacionCompleta');
                return null;
            }
            
            return data;
        } catch (error) {
            localStorage.removeItem('verificacionCompleta');
            return null;
        }
    }
    
    /**
     * Limpia todos los datos de recuperación
     */
    function limpiarDatosRecuperacion() {
        localStorage.removeItem('codigoRecuperacion');
        localStorage.removeItem('verificacionCompleta');
    }
    
    /**
     * Muestra error en contraseña
     */
    function showPasswordError(message) {
        const errorElement = document.getElementById('passwordError');
        newPasswordInput.classList.add('is-invalid');
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }
    
    /**
     * Limpia error de contraseña
     */
    function clearPasswordError() {
        const errorElement = document.getElementById('passwordError');
        newPasswordInput.classList.remove('is-invalid');
        errorElement.classList.add('d-none');
    }
    
    /**
     * Muestra error en confirmación
     */
    function showConfirmError(message) {
        const errorElement = document.getElementById('confirmError');
        confirmPasswordInput.classList.add('is-invalid');
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }
    
    /**
     * Limpia error de confirmación
     */
    function clearConfirmError() {
        const errorElement = document.getElementById('confirmError');
        confirmPasswordInput.classList.remove('is-invalid');
        errorElement.classList.add('d-none');
    }
    
    /**
     * Controla el estado de carga
     */
    function setLoadingState(loading) {
        if (loading) {
            form.classList.add('loading');
            btnText.textContent = 'Actualizando...';
            spinner.classList.remove('d-none');
            submitBtn.disabled = true;
        } else {
            form.classList.remove('loading');
            btnText.textContent = 'Establecer Nueva Contraseña';
            spinner.classList.add('d-none');
            submitBtn.disabled = false;
        }
    }
});