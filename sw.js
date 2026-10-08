/* Sicury Turni — guscio offline.
   L'app vive tutta in una pagina e i dati stanno nel telefono: tenendo in
   cache quella pagina, il gestionale si apre anche senza rete. */
var CACHE = 'sicury-turni-v6';
var GUSCIO = ['./', './manifest.webmanifest',
              './icone/icona-192.png', './icone/icona-512.png',
              './icone/icona-maskable.png', './icone/apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(GUSCIO); }).then(function(){
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ch){
    return Promise.all(ch.filter(function(k){ return k !== CACHE; })
                        .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

/* Prima la rete, cosi un aggiornamento arriva subito; se manca il segnale
   si risponde con l'ultima copia salvata. */
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // le varianti con ?qualcosa sono la stessa risorsa: in cache ne tengo una sola
  var chiave = new Request(url.origin + url.pathname, { credentials:'same-origin' });

  e.respondWith(
    fetch(e.request).then(function(r){
      if (r && r.ok && r.type === 'basic') {
        var copia = r.clone();
        caches.open(CACHE).then(function(c){ c.put(chiave, copia); });
      }
      return r;
    }).catch(function(){
      return caches.match(chiave).then(function(r){
        return r || caches.match('./') || caches.match(self.location.origin + '/');
      });
    })
  );
});
