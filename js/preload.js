// Sistema de PRELOAD GLOBAL para todo HuertoHogar
console.log('🚀 Iniciando sistema de preload global...');

// Configuración global
const PRELOAD_CONFIG = {
  // Páginas importantes para precargar
  CRITICAL_PAGES: [
    '/index.html',
    '/pages/client/tienda/catalogo.html',
    '/pages/client/tienda/perfil.html',
    '/pages/login.html',
    '/pages/registro.html'
  ],
  
  // Recursos que siempre precargar
  CRITICAL_RESOURCES: [
    '/css/style.css',
    '/css/bootstrap.min.css',
    '/js/bootstrap.bundle.min.js',
    '/js/auth.js'
  ],
  
  // Tiempo de espera antes de precargar (ms)
  HOVER_DELAY: 200,
  
  // Máximo de recursos en cache dinámico
  MAX_DYNAMIC_CACHE: 50
};

// 1. REGISTRAR SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/js/service-worker.js');
      console.log('✅ Service Worker registrado:', registration.scope);
      
      // Escuchar actualizaciones del service worker
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Nueva versión del Service Worker disponible');
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });
      
    } catch (error) {
      console.error('❌ Error al registrar Service Worker:', error);
    }
  });
}

// 2. PRELOAD INTELIGENTE AL HOVER
function setupHoverPreload() {
  const preloadedUrls = new Set();
  let hoverTimer;
  
  document.addEventListener('mouseover', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    
    const url = link.getAttribute('href');
    
    // Solo precargar URLs internas y no repetidas
    if (isInternalUrl(url) && !preloadedUrls.has(url)) {
      clearTimeout(hoverTimer);
      
      hoverTimer = setTimeout(() => {
        preloadResource(url, 'prefetch');
        preloadedUrls.add(url);
        console.log('🔗 Precargando por hover:', url);
      }, PRELOAD_CONFIG.HOVER_DELAY);
    }
  });
  
  document.addEventListener('mouseout', () => {
    clearTimeout(hoverTimer);
  });
}

// 3. PRELOAD DE RECURSOS CRÍTICOS
function preloadCriticalResources() {
  // Precargar páginas críticas
  PRELOAD_CONFIG.CRITICAL_PAGES.forEach(url => {
    preloadResource(url, 'prefetch');
  });
  
  // Precargar recursos críticos
  PRELOAD_CONFIG.CRITICAL_RESOURCES.forEach(url => {
    preloadResource(url, 'preload');
  });
  
  console.log('📦 Recursos críticos precargados');
}

// 4. LAZY LOADING AVANZADO
function setupLazyLoading() {
  // Lazy loading para imágenes
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          imageObserver.unobserve(img);
          console.log('🖼️ Imagen cargada:', img.src);
        }
      }
    });
  }, { 
    rootMargin: '50px' // Cargar 50px antes de que sea visible
  });
  
  // Observar todas las imágenes con data-src
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
  
  // Lazy loading para iframes
  const iframeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.dataset.src) {
        entry.target.src = entry.target.dataset.src;
        entry.target.removeAttribute('data-src');
        iframeObserver.unobserve(entry.target);
      }
    });
  });
  
  document.querySelectorAll('iframe[data-src]').forEach(iframe => {
    iframeObserver.observe(iframe);
  });
}

// 5. PREDICCIÓN INTELIGENTE DE NAVEGACIÓN
function setupIntelligentPrediction() {
  let userBehavior = JSON.parse(localStorage.getItem('huertito_behavior') || '{}');
  
  // Rastrear patrones de navegación
  window.addEventListener('beforeunload', () => {
    const currentPage = window.location.pathname;
    const timeSpent = Date.now() - (window.pageLoadTime || Date.now());
    
    if (!userBehavior[currentPage]) {
      userBehavior[currentPage] = { visits: 0, timeSpent: 0, nextPages: {} };
    }
    
    userBehavior[currentPage].visits++;
    userBehavior[currentPage].timeSpent += timeSpent;
    
    localStorage.setItem('huertito_behavior', JSON.stringify(userBehavior));
  });
  
  // Precargar páginas basado en comportamiento
  const currentPage = window.location.pathname;
  if (userBehavior[currentPage]) {
    const mostVisited = Object.entries(userBehavior[currentPage].nextPages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([page]) => page);
    
    mostVisited.forEach(page => {
      setTimeout(() => preloadResource(page, 'prefetch'), 2000);
    });
  }
}

// 6. MONITOREO DE RENDIMIENTO
function setupPerformanceMonitoring() {
  // Medir métricas de rendimiento
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const metrics = {
        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        cacheHits: 0 // Se actualizará desde el service worker
      };
      
      console.log('📊 Métricas de rendimiento:', metrics);
      
      // Enviar métricas al service worker para optimización
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_SIZE') {
            console.log('💾 Recursos en cache:', event.data.size);
          }
        };
        
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_CACHE_SIZE'
        }, [messageChannel.port2]);
      }
    }, 1000);
  });
}

// 7. FUNCIONES UTILITARIAS
function preloadResource(url, rel = 'prefetch') {
  if (!url || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return;
  }
  
  const existingLink = document.querySelector(`link[href="${url}"]`);
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.rel = rel;
  link.href = url;
  
  // Determinar el tipo de recurso
  if (url.endsWith('.css')) {
    link.as = 'style';
  } else if (url.endsWith('.js')) {
    link.as = 'script';
  } else if (url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) {
    link.as = 'image';
  } else if (url.match(/\.(woff|woff2|ttf|eot)$/)) {
    link.as = 'font';
    link.crossOrigin = 'anonymous';
  } else {
    link.as = 'document';
  }
  
  document.head.appendChild(link);
}

function isInternalUrl(url) {
  if (!url) return false;
  return !url.startsWith('http') && !url.startsWith('//') && 
         !url.startsWith('#') && !url.startsWith('mailto:') && 
         !url.startsWith('tel:');
}

function showUpdateNotification() {
  // Crear notificación de actualización
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="alert alert-info alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 9999;">
      <strong>🔄 Nueva versión disponible</strong><br>
      <small>Recarga la página para obtener la última versión</small>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  document.body.appendChild(notification);
  
  // Auto-remover después de 10 segundos
  setTimeout(() => {
    notification.remove();
  }, 10000);
}

// 8. INICIALIZACIÓN GLOBAL
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 Inicializando sistema de optimización global...');
  
  // Marcar tiempo de carga de página
  window.pageLoadTime = Date.now();
  
  // Configurar todos los sistemas
  setupHoverPreload();
  setupLazyLoading();
  setupIntelligentPrediction();
  setupPerformanceMonitoring();
  
  // Precargar recursos críticos después de un delay
  setTimeout(preloadCriticalResources, 1000);
  
  console.log('✅ Sistema de optimización global activo');
});

// 9. OPTIMIZACIÓN DE IMÁGENES EN TIEMPO REAL
function optimizeImages() {
  document.querySelectorAll('img').forEach(img => {
    if (!img.loading) {
      img.loading = 'lazy';
    }
    
    if (!img.decoding) {
      img.decoding = 'async';
    }
  });
}

// Ejecutar optimización de imágenes
document.addEventListener('DOMContentLoaded', optimizeImages);

// Re-ejecutar cuando se añadan nuevas imágenes dinámicamente
const observer = new MutationObserver(() => {
  optimizeImages();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});