// Service Worker pour l'application de gestion de tournois de Boccia
const CACHE_NAME = 'boccia-tournament-manager-v1';

// Liste des fichiers à mettre en cache
const urlsToCache = [
  '/Tournoi-de-Boccia/',
  '/Tournoi-de-Boccia/index.html',
  '/Tournoi-de-Boccia/offline.html',
  '/Tournoi-de-Boccia/css/style.css',
  '/Tournoi-de-Boccia/css/responsive.css',
  '/Tournoi-de-Boccia/js/main.js',
  '/Tournoi-de-Boccia/js/config.js',
  '/Tournoi-de-Boccia/js/data.js',
  '/Tournoi-de-Boccia/js/ui.js',
  '/Tournoi-de-Boccia/js/teams.js',
  '/Tournoi-de-Boccia/js/pools.js',
  '/Tournoi-de-Boccia/js/matches.js',
  '/Tournoi-de-Boccia/js/knockout.js',
  '/Tournoi-de-Boccia/js/ranking.js',
  '/Tournoi-de-Boccia/js/export.js',
  '/Tournoi-de-Boccia/manifest.json',

  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  // Mettre le Service Worker en attente jusqu'à ce que la promesse soit résolue
  event.waitUntil(
    // Ouvrir le cache
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        // Ajouter toutes les URLs au cache avec gestion d'erreurs
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.error('Erreur lors de la mise en cache des ressources:', error);
            // Vous pouvez également lister individuellement les ressources qui posent problème
          });
      })
      .then(() => self.skipWaiting()) // Activer immédiatement
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    // Nettoyer les anciennes versions du cache
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prendre le contrôle de tous les clients
  );
});

// Intercepter les requêtes
self.addEventListener('fetch', event => {
  event.respondWith(
    // Essayer de récupérer depuis le cache d'abord
    caches.match(event.request)
      .then(response => {
        // Si trouvé dans le cache, renvoyer la réponse mise en cache
        if (response) {
          return response;
        }

        // Sinon, faire la requête réseau
        return fetch(event.request)
          .then(response => {
            // Si la requête a échoué, retourner la réponse
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cloner la réponse (stream ne peut être lu qu'une fois)
            const responseToCache = response.clone();

            // Ouvrir le cache et ajouter la nouvelle réponse
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            // Gérer l'échec réseau
            console.log('Erreur de récupération:', error);

            // Pour les requêtes de navigation, retourner la page hors ligne
            if (event.request.mode === 'navigate') {
              return caches.match('/Tournoi-de-Boccia/offline.html');
            }

            // Pour les images, retourner une image de remplacement
            if (event.request.destination === 'image') {
              return caches.match('/Tournoi-de-Boccia/images/offline.png');
            }

            // Pour les autres ressources, retourner simplement l'erreur
            return new Response('Ressource non disponible hors ligne', {
              status: 503,
              statusText: 'Service indisponible'
            });
          });
      })
  );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tournament-data') {
    event.waitUntil(syncTournamentData());
  }
});

// Fonction pour synchroniser les données du tournoi
function syncTournamentData() {
  return new Promise((resolve, reject) => {
    // Cette fonction sera implémentée lorsque nous ajouterons la synchronisation avec un serveur
    console.log('Synchronisation des données en arrière-plan');
    resolve();
  });
}

// Notification de mise à jour disponible
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

