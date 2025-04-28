/**
 * Fonctions pour gérer l'interface principale et la transition depuis l'assistant
 */

// Fonction pour forcer l'affichage de l'interface principale
function forceShowMainInterface() {
    document.getElementById('configuration-wizard').classList.add('hidden');
    document.getElementById('main-interface').classList.remove('hidden');
    console.log("Interface principale forcée à s'afficher");
}

// Initialiser les gestionnaires d'événements lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Gestion du bouton de forçage d'affichage de l'interface
    const forceShowBtn = document.getElementById('force-show-interface');
    if (forceShowBtn) {
        forceShowBtn.addEventListener('click', forceShowMainInterface);
    }
    
    // Gestion du bouton de fin de configuration de l'assistant
    const wizardFinishBtn = document.getElementById('wizard-finish');
    if (wizardFinishBtn) {
        wizardFinishBtn.addEventListener('click', function() {
            document.getElementById('debug-status').textContent = 'État de transition: Terminaison de la configuration...';
            setTimeout(function() {
                document.getElementById('configuration-wizard').classList.add('hidden');
                document.getElementById('main-interface').classList.remove('hidden');
                document.getElementById('debug-status').textContent = 'État de transition: Interface principale affichée';
            }, 500);
        });
    }
});
