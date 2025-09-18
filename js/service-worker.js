// Service Worker GLOBAL para cachear TODO el sitio HuertoHogar
const CACHE_NAME = 'huertito-global-v1';
const CACHE_STATIC_NAME = 'huertito-static-v1';
const CACHE_DYNAMIC_NAME = 'huertito-dynamic-v1';

// Recursos CRÍTICOS que siempre deben estar cacheados
const CRITICAL_RESOURCES = [
  // Páginas principales
  '/',
  '/index.html',
  '/pages/client/tienda/perfil.html',
  '/pages/client/tienda/catalogo.html',
  '/pages/login.html',
  '/pages/registro.html',
  
  // CSS crítico
  '/css/style.css',
  '/css/perfil.css',
  '/css/bootstrap.min.css',
  
  // JavaScript crítico
  '/js/bootstrap.bundle.min.js',
  '/js/auth.js',
  '/js/perfil.js',
  '/js/preload.js',
  
  // Componentes compartidos
  '/pages/shared/components.js',
  '/pages/shared/navbar.html',
  '/pages/shared/footer.html',
  
  // Imágenes importantes
  '/img/usuario-avatar.webp',
  '/icons/picnic.svg',
  '/icons/wheat.svg',
  '/icons/pot.svg',
  
  // Fuentes locales
  '/fonts/Montserrat/Montserrat-VariableFont_wght.ttf',
  '/fonts/Playfair_Display/PlayfairDisplay-VariableFont_wght.ttf'
];

// Recursos que se cachean dinámicamente
const CACHE_DYNAMIC_PATTERNS = [
  /.*\.html$/,
  /.*\.css$/,
  /.*\.js$/,
  /.*\.jpg$/,
  /.*\.png$/,
  /.*\.webp$/,
  /.*\.svg$/,
  /.*\.ttf$/,
  /.*\.woff$/,
  /.*\.woff2$/
];

// URLs externas que también queremos cachear
const EXTERNAL_RESOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap'
];

// Instalar el service worker
self.addEventListener('install', (event) => {
  console.log('🚀 Instalando Service Worker Global de HuertoHogar...');
  event.waitUntil(
    Promise.all([
      // Cachear recursos críticos
      caches.open(CACHE_STATIC_NAME).then((cache) => {
        console.log('📦 Cacheando recursos críticos...');
        return cache.addAll(CRITICAL_RESOURCES.concat(EXTERNAL_RESOURCES));
      })
    ])
  );
  // Forzar la activación inmediata
  self.skipWaiting();
});

// Activar el service worker
self.addEventListener('activate', (event) => {
  console.log('✅ Activando Service Worker Global...');
  event.waitUntil(
    // Limpiar caches viejos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_STATIC_NAME && cacheName !== CACHE_DYNAMIC_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control inmediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar TODAS las peticiones
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Solo cachear recursos del mismo origen o recursos externos específicos
  if (url.origin === location.origin || EXTERNAL_RESOURCES.some(ext => event.request.url.includes(ext))) {
    event.respondWith(
      // Cache First Strategy para recursos estáticos
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('⚡ Sirviendo desde cache:', event.request.url);
          return cachedResponse;
        }
        
        // Si no está en cache, hacer fetch y cachear dinámicamente
        return fetch(event.request).then((response) => {
          // Solo cachear respuestas exitosas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Verificar si el recurso debe ser cacheado dinámicamente
          const shouldCache = CACHE_DYNAMIC_PATTERNS.some(pattern => 
            pattern.test(event.request.url)
          );
          
          if (shouldCache) {
            console.log('💾 Cacheando dinámicamente:', event.request.url);
            const responseToCache = response.clone();
            
            caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        }).catch(() => {
          // Fallback: Si no hay conexión y no hay cache
          return new Response('Recurso no disponible offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
  }
});

// Mensaje del service worker al cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({
        type: 'CACHE_SIZE',
        size: size
      });
    });
  }
});

// Función para obtener el tamaño del cache
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    totalSize += requests.length;
  }
  
  return totalSize;
}