/**
 * Sistema de Configuración de Envíos para HuertoHogar
 * Maneja la configuración de costos de envío y envío gratuito
 */

class ShippingConfig {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * Cargar configuración desde localStorage
     */
    loadConfig() {
        try {
            const saved = localStorage.getItem('shippingConfig');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('ShippingConfig: Error cargando configuración:', error);
        }

        // Configuración por defecto
        return {
            baseCost: 2990,
            freeShippingThreshold: 30000,
            enableFreeShipping: true,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Guardar configuración en localStorage
     */
    saveConfig(newConfig) {
        try {
            this.config = {
                ...this.config,
                ...newConfig,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('shippingConfig', JSON.stringify(this.config));
            console.log('ShippingConfig: Configuración guardada:', this.config);
            return { success: true, message: 'Configuración de envío guardada exitosamente' };
        } catch (error) {
            console.error('ShippingConfig: Error guardando configuración:', error);
            return { success: false, message: 'Error al guardar la configuración' };
        }
    }

    /**
     * Obtener configuración actual
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Calcular costo de envío para un total dado
     */
    calculateShippingCost(orderTotal) {
        // Si el envío gratis está deshabilitado, siempre cobra
        if (!this.config.enableFreeShipping) {
            return this.config.baseCost;
        }

        // Si el total supera el umbral, envío gratis
        if (orderTotal >= this.config.freeShippingThreshold) {
            return 0;
        }

        // Caso contrario, cobra el costo base
        return this.config.baseCost;
    }

    /**
     * Verificar si el pedido califica para envío gratis
     */
    qualifiesForFreeShipping(orderTotal) {
        return this.config.enableFreeShipping && orderTotal >= this.config.freeShippingThreshold;
    }

    /**
     * Obtener mensaje informativo sobre envío
     */
    getShippingMessage(orderTotal) {
        if (!this.config.enableFreeShipping) {
            return `Costo de envío: ${this.formatPrice(this.config.baseCost)}`;
        }

        if (this.qualifiesForFreeShipping(orderTotal)) {
            return 'Envío gratis incluido';
        }

        const remaining = this.config.freeShippingThreshold - orderTotal;
        return `Agrega ${this.formatPrice(remaining)} más para envío gratis`;
    }

    /**
     * Formatear precio en pesos chilenos
     */
    formatPrice(price) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(price);
    }

    /**
     * Resetear configuración a valores por defecto
     */
    resetToDefaults() {
        const defaultConfig = {
            baseCost: 2990,
            freeShippingThreshold: 30000,
            enableFreeShipping: true
        };
        
        return this.saveConfig(defaultConfig);
    }
}

// Crear instancia global
const shippingConfig = new ShippingConfig();

// Funciones globales para debugging
window.verConfigEnvio = function() {
    console.log('📦 Configuración de envío actual:');
    console.table(shippingConfig.getConfig());
    return shippingConfig.getConfig();
};

window.resetearConfigEnvio = function() {
    const result = shippingConfig.resetToDefaults();
    console.log(result.success ? '✅' : '❌', result.message);
    return result;
};