/**
 * Sistema de Verificación de Código
 * Maneja la validación del código de 6 dígitos y cuenta regresiva
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('verifyCodeForm');
    const codeInput = document.getElementById('verificationCode');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner-border');
    const emailDisplay = document.getElementById('emailDisplay');
    const countdownElement = document.getElementById('countdown');
    const resendCodeBtn = document.getElementById('resendCode');
    
    let countdownInterval;
    let email = '';
    
    // Inicializar página
    initializePage();
    
    // Event listeners
    codeInput.addEventListener('input', handleCodeInput);
    codeInput.addEventListener('paste', handlePaste);
    form.addEventListener('submit', handleSubmit);
    resendCodeBtn.addEventListener('click', handleResendCode);
    
    /**
     * Inicializa la página obteniendo el email y verificando el código guardado
     */
    function initializePage() {
        // Obtener email de la URL
        const urlParams = new URLSearchParams(window.location.search);
        email = urlParams.get('email');
        
        if (!email) {
            mostrarNotificacion('Error: No se especificó el email', 'error');
            setTimeout(() => {
                window.location.href = 'olvidoContrasena.html';
            }, 2000);
            return;
        }
        
        // Mostrar email
        emailDisplay.textContent = email;
        
        // Verificar si hay código válido
        const codigoData = obtenerCodigoGuardado();
        if (!codigoData || codigoData.email !== email) {
            mostrarNotificacion('Código expirado o inválido', 'error');
            setTimeout(() => {
                window.location.href = 'olvidoContrasena.html';
            }, 2000);
            return;
        }
        
        // Iniciar cuenta regresiva
        iniciarCuentaRegresiva(codigoData);
    }
    
    /**
     * Maneja la entrada del código con validaciones
     */
    function handleCodeInput(e) {
        // Solo permitir números
        let value = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = value;
        
        // Limpiar errores
        clearError();
        
        // Auto-submit cuando se completen 6 dígitos
        if (value.length === 6) {
            setTimeout(() => {
                if (validateCode()) {
                    handleSubmit(e);
                }
            }, 300);
        }
    }
    
    /**
     * Maneja el pegado de código
     */
    function handlePaste(e) {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const numbers = paste.replace(/[^0-9]/g, '').substring(0, 6);
        codeInput.value = numbers;
        
        if (numbers.length === 6) {
            clearError();
            setTimeout(() => {
                if (validateCode()) {
                    handleSubmit(e);
                }
            }, 300);
        }
    }
    
    /**
     * Maneja el envío del formulario
     */
    function handleSubmit(e) {
        e.preventDefault();
        
        if (!validateCode()) {
            return;
        }
        
        const codigo = codeInput.value.trim();
        const codigoData = obtenerCodigoGuardado();
        
        if (!codigoData) {
            showError('Código expirado. Solicita uno nuevo.');
            return;
        }
        
        // Mostrar loading
        setLoadingState(true);
        
        // Simular verificación (en producción sería una llamada a API)
        setTimeout(() => {
            if (codigo === codigoData.codigo) {
                // Código correcto
                mostrarNotificacion('Código verificado correctamente', 'success');
                
                // Marcar como verificado y redirigir
                marcarComoVerificado(email);
                setTimeout(() => {
                    window.location.href = `nuevaContrasena.html?email=${encodeURIComponent(email)}`;
                }, 1500);
                
            } else {
                // Código incorrecto - mostrar ayuda para testing
                showError('Código incorrecto. Verifica e intenta nuevamente.');
                console.log('❌ Código incorrecto ingresado:', codigo);
                console.log('✅ Código esperado:', codigoData.codigo);
                console.log('📋 Códigos de prueba disponibles:');
                console.log('   - admin@huerthogar.com → 123456');
                console.log('   - mauricio@huerthogar.com → 111111');
                console.log('   - juan@correo.com → 222222');
                console.log('   - maria@correo.com → 333333');
                console.log('   - cliente@test.com → 444444');
                
                codeInput.value = '';
                codeInput.focus();
            }
            
            setLoadingState(false);
        }, 1500);
    }
    
    /**
     * Maneja el reenvío de código
     */
    function handleResendCode(e) {
        e.preventDefault();
        
        resendCodeBtn.style.pointerEvents = 'none';
        resendCodeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
        
        setTimeout(() => {
            // Generar nuevo código
            const nuevocodigo = generarCodigoVerificacion();
            guardarCodigoVerificacion(email, nuevocodigo);
            
            mostrarNotificacion('Nuevo código enviado a tu correo', 'success');
            console.log('Nuevo código:', nuevocodigo);
            
            // Reiniciar cuenta regresiva
            const nuevaData = obtenerCodigoGuardado();
            iniciarCuentaRegresiva(nuevaData);
            
            // Resetear botón
            resendCodeBtn.innerHTML = '<i class="fas fa-redo me-2"></i>Reenviar código';
            resendCodeBtn.style.pointerEvents = 'auto';
            
            // Limpiar campo y enfocar
            codeInput.value = '';
            codeInput.focus();
            
        }, 2000);
    }
    
    /**
     * Valida el código ingresado
     */
    function validateCode() {
        const code = codeInput.value.trim();
        
        if (!code) {
            showError('Ingresa el código de verificación');
            return false;
        }
        
        if (code.length !== 6) {
            showError('El código debe tener 6 dígitos');
            return false;
        }
        
        if (!/^\d{6}$/.test(code)) {
            showError('El código solo debe contener números');
            return false;
        }
        
        return true;
    }
    
    /**
     * Inicia la cuenta regresiva del código
     */
    function iniciarCuentaRegresiva(codigoData) {
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        const startTime = codigoData.timestamp;
        const duration = codigoData.expiresIn;
        
        countdownInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            
            if (remaining <= 0) {
                clearInterval(countdownInterval);
                countdownElement.textContent = '00:00';
                countdownElement.className = 'text-danger fw-bold';
                mostrarNotificacion('El código ha expirado', 'error');
                
                // Deshabilitar formulario
                codeInput.disabled = true;
                submitBtn.disabled = true;
                return;
            }
            
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            countdownElement.textContent = timeString;
            
            // Cambiar color según el tiempo restante
            if (remaining < 60000) { // Menos de 1 minuto
                countdownElement.className = 'text-danger fw-bold';
            } else if (remaining < 300000) { // Menos de 5 minutos
                countdownElement.className = 'text-warning fw-bold';
            } else {
                countdownElement.className = 'text-warning fw-bold';
            }
        }, 1000);
    }
    
    /**
     * Obtiene el código guardado en localStorage
     */
    function obtenerCodigoGuardado() {
        try {
            const codigoData = localStorage.getItem('codigoRecuperacion');
            if (!codigoData) return null;
            
            const data = JSON.parse(codigoData);
            const now = Date.now();
            
            // Verificar si ha expirado
            if (now - data.timestamp > data.expiresIn) {
                localStorage.removeItem('codigoRecuperacion');
                return null;
            }
            
            return data;
        } catch (error) {
            localStorage.removeItem('codigoRecuperacion');
            return null;
        }
    }
    
    /**
     * Genera un nuevo código de verificación
     */
    function generarCodigoVerificacion() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    /**
     * Guarda un nuevo código de verificación con códigos de prueba
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
        
        console.log('🔄 Nuevo código guardado:', codigoFinal, 'para', email);
    }
    
    /**
     * Marca el código como verificado para permitir cambio de contraseña
     */
    function marcarComoVerificado(email) {
        const verificationData = {
            email: email,
            verified: true,
            timestamp: Date.now(),
            expiresIn: 10 * 60 * 1000 // 10 minutos para cambiar contraseña
        };
        localStorage.setItem('verificacionCompleta', JSON.stringify(verificationData));
    }
    
    /**
     * Muestra mensaje de error
     */
    function showError(message) {
        const errorElement = document.getElementById('codeError');
        codeInput.classList.add('is-invalid');
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }
    
    /**
     * Limpia errores
     */
    function clearError() {
        const errorElement = document.getElementById('codeError');
        codeInput.classList.remove('is-invalid');
        errorElement.classList.add('d-none');
    }
    
    /**
     * Controla el estado de carga
     */
    function setLoadingState(loading) {
        if (loading) {
            form.classList.add('loading');
            btnText.textContent = 'Verificando...';
            spinner.classList.remove('d-none');
            submitBtn.disabled = true;
            codeInput.disabled = true;
        } else {
            form.classList.remove('loading');
            btnText.textContent = 'Verificar Código';
            spinner.classList.add('d-none');
            submitBtn.disabled = false;
            codeInput.disabled = false;
        }
    }
});