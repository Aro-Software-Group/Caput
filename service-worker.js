const CACHE_NAME = 'caput-static-v1.0.3'; // Updated versioning
const DYNAMIC_CACHE_NAME = 'caput-dynamic-v1.0.3';
const OFFLINE_REQUEST_QUEUE_NAME = 'caput-offline-queue-v1.0.3'; // For potential future use with IndexedDB

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html', // Added offline page
  '/styles/main.css',
  '/js/main.js',
  '/js/ui.js',
  '/js/ui-managers.js',
  '/js/agent.js',
  '/js/config.js',
  '/js/tools.js',
  '/js/modular-tools.js',
  '/js/storage.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Helper function to add response to dynamic cache
const addToDynamicCache = (request, response) => {
  return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
    return cache.put(request, response);
  });
};

// Helper function to identify API requests (customize as needed)
const isApiRequest = (request) => {
  return request.url.includes('/api/') || request.url.includes('generativelanguage.googleapis.com');
};

// Helper function to identify navigation requests
const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

self.addEventListener('fetch', event => {
  const { request } = event;

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Network first for navigation
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || caches.match('/offline.html'); // Fallback to offline page
          });
        })
    );
  } else if (isApiRequest(request)) {
    if (request.method === 'GET') {
      // Cacheable API GET requests
      event.respondWith(
        fetch(request)
          .then(response => {
            // Network first
            if (response.ok) {
              const responseToCache = response.clone();
              addToDynamicCache(request, responseToCache);
            }
            return response;
          })
          .catch(() => {
            // Network failed, try dynamic cache
            return caches.match(request, { cacheName: DYNAMIC_CACHE_NAME });
          })
      );
    } else {
      // Non-cacheable API requests (e.g., POST)
      event.respondWith(
        fetch(request).catch(() => {
          // Offline, return a specific response or let it fail
          return new Response(JSON.stringify({ error: 'Offline, request not sent' }), {
            status: 503, // Service Unavailable
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
    }
  } else {
    // Static assets: Cache-first strategy
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          // Optionally cache new static assets if not already in ASSETS_TO_CACHE
          // For now, we assume ASSETS_TO_CACHE is comprehensive for static assets
          return fetchResponse;
        });
      })
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) // Also preserve DYNAMIC_CACHE_NAME
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // Ensure new service worker takes control immediately
});
