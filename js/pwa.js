// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/Tournoi-de-Boccia/service-worker.js')
            .then(function(registration) {
                console.log('Service Worker enregistré avec succès:', registration.scope);
            })
            .catch(function(error) {
                console.log('Erreur lors de l\'enregistrement du Service Worker:', error);
            });
    });
}
            
// Gestion des mises à jour
let refreshing = false;
navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (!refreshing) {
        refreshing = true;
        window.location.reload();
    }
});
            
// Vérifier les mises à jour disponibles
navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        const updateAlert = document.getElementById('update-alert');
        updateAlert.classList.remove('hidden');
    }
});
            
// Appliquer la mise à jour
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('update-app-btn').addEventListener('click', function() {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
        }
    });
    
    // Détecter l'état de la connexion
    updateConnectionStatus();
});

// Détecter l'état de la connexion
function updateConnectionStatus() {
    const connectionStatus = document.getElementById('connection-status');
    if (!navigator.onLine) {
        connectionStatus.classList.remove('hidden');
    } else {
        connectionStatus.classList.add('hidden');
    }
}
        
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
document.addEventListener('DOMContentLoaded', updateConnectionStatus);
        
// Installation de l'application (PWA)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Afficher notre notification d'installation personnalisée
    const pwaPrompt = document.getElementById('pwa-install-prompt');
    pwaPrompt.classList.remove('hidden');
    
    // Gérer le bouton d'installation
    document.getElementById('pwa-install-btn').addEventListener('click', () => {
        pwaPrompt.classList.add('hidden');
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Utilisateur a accepté l\'installation');
            } else {
                console.log('Utilisateur a refusé l\'installation');
            }
            deferredPrompt = null;
        });
    });
    
    // Gérer le bouton "Plus tard"
    document.getElementById('pwa-later-btn').addEventListener('click', () => {
        pwaPrompt.classList.add('hidden');
    });
    
    // Gérer le bouton de fermeture
    document.querySelector('.pwa-prompt-close').addEventListener('click', () => {
        pwaPrompt.classList.add('hidden');
    });
});
