// Service Worker para PWA completo - E-CORP SERVIÇOS
const CACHE_NAME = 'ecorp-pwa-v3';
const RUNTIME_CACHE = 'ecorp-runtime-v3';
const IMAGE_CACHE = 'ecorp-images-v3';

// Recursos essenciais para funcionamento offline
const ESSENTIAL_RESOURCES = [
  '/',
  '/ponto',
  '/colaborador',
  '/admin',
  '/mapa',
  '/manifest.json',
  '/logo-ecorp.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando recursos essenciais');
        // Adicionar recursos essenciais ao cache
        return cache.addAll(ESSENTIAL_RESOURCES.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('[SW] Erro ao cachear recursos:', error);
      })
  );
  
  // Forçar ativação imediata
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remover caches antigos
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Assumir controle imediatamente
  self.clients.claim();
});

// Interceptar requisições - Estratégia Network First com Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições de chrome-extension e outras origens
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('manus.computer') && !url.origin.includes('manus.space')) {
    return;
  }

  // Cache especial para imagens
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Estratégia especial para API tRPC - sempre tentar rede primeiro
  if (url.pathname.includes('/api/trpc')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se sucesso, clonar e cachear a resposta
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tentar cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Usando cache para API:', url.pathname);
              return cachedResponse;
            }
            // Se não tiver cache, retornar erro
            return new Response(
              JSON.stringify({ error: 'Sem conexão e sem cache disponível' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'application/json' })
              }
            );
          });
        })
    );
    return;
  }

  // Estratégia Network First para recursos estáticos
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se sucesso, clonar e cachear
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Se falhar, buscar no cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Usando cache para:', url.pathname);
            return cachedResponse;
          }
          
          // Se for navegação e não tiver cache, retornar página principal
          if (request.mode === 'navigate') {
            return caches.match('/').then((indexResponse) => {
              if (indexResponse) {
                console.log('[SW] Retornando página principal do cache');
                return indexResponse;
              }
              
              // Última tentativa: retornar página offline simples
              return new Response(
                `<!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>E-CORP - Offline</title>
                  <style>
                    body {
                      font-family: system-ui, -apple-system, sans-serif;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 100vh;
                      margin: 0;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      text-align: center;
                      padding: 20px;
                    }
                    .container {
                      max-width: 400px;
                    }
                    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
                    p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; }
                    button {
                      background: white;
                      color: #667eea;
                      border: none;
                      padding: 12px 32px;
                      font-size: 1rem;
                      border-radius: 8px;
                      cursor: pointer;
                      font-weight: 600;
                    }
                    button:hover { transform: scale(1.05); }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>📡 Sem Conexão</h1>
                    <p>Você está offline. Conecte-se à internet para acessar o sistema E-CORP.</p>
                    <button onclick="window.location.reload()">Tentar Novamente</button>
                  </div>
                </body>
                </html>`,
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            });
          }
          
          // Para outros recursos, retornar erro 404
          return new Response('Recurso não encontrado no cache', {
            status: 404,
            statusText: 'Not Found'
          });
        });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registros-ponto') {
    console.log('[SW] Evento de sincronização recebido');
    event.waitUntil(syncRegistrosPonto());
  }
});

async function syncRegistrosPonto() {
  console.log('[SW] Sincronizando registros de ponto...');
  
  // Notificar todos os clientes para executar a sincronização
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_REGISTROS',
      timestamp: Date.now()
    });
  });
}

// Receber mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    // Cachear URLs adicionais enviadas pelo cliente
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(urls).catch((error) => {
        console.error('[SW] Erro ao cachear URLs adicionais:', error);
      });
    });
  }
});

// Log de erros
self.addEventListener('error', (event) => {
  console.error('[SW] Erro no Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Promise rejeitada não tratada:', event.reason);
});

console.log('[SW] Service Worker carregado');
