/**
 * Point d'entrée principal de l'application
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser l'interface utilisateur
    UI.initEventListeners();
    
    // Initialiser les gestionnaires
    ConfigManager.initWizard();
    ConfigManager.initEventListeners();
    TeamsManager.initEventListeners();
    PoolsManager.initEventListeners();
    MatchesManager.initEventListeners();
    KnockoutManager.initEventListeners();
    
    // Vérifier s'il y a un tournoi sauvegardé
    if (TournamentData.loadFromLocalStorage()) {
        // Afficher l'interface principale
        document.getElementById('configuration-wizard').classList.add('hidden');
        document.getElementById('main-interface').classList.remove('hidden');
        
        // Mettre à jour l'interface
        UI.updateDashboard();
        TeamsManager.renderTeams();
        PoolsManager.renderPools();
        MatchesManager.renderMatches();
        KnockoutManager.renderKnockoutBracket();
        
        // Appliquer le thème sauvegardé
        UI.setTheme(TournamentData.getSettings().theme);
        document.getElementById('theme-selector').value = TournamentData.getSettings().theme;
        
        UI.showAlert('Tournoi chargé depuis le stockage local');
    }
    
    // Ajouter des fonctionnalités supplémentaires
    addExtraFeatures();
});

/**
 * Ajoute des fonctionnalités supplémentaires à l'application
 */
function addExtraFeatures() {
    // Ajout de la détection du mode sombre du système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // L'utilisateur préfère le thème sombre
        if (TournamentData.getSettings().theme === 'default') {
            UI.setTheme('dark');
            document.getElementById('theme-selector').value = 'dark';
        }
    }
    
    // Écouter les changements de préférence de thème du système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (TournamentData.getSettings().theme === 'default') {
            UI.setTheme(event.matches ? 'dark' : 'default');
            document.getElementById('theme-selector').value = event.matches ? 'dark' : 'default';
        }
    });
    
    // Ajouter le raccourci clavier Ctrl+S pour sauvegarder
    document.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            TournamentData.saveToLocalStorage();
            UI.showAlert('Tournoi sauvegardé manuellement');
        }
    });
    
    // Ajouter une confirmation avant de quitter la page si le tournoi contient des données
    window.addEventListener('beforeunload', function(event) {
        const tournament = TournamentData.getTournament();
        if (tournament.teams.length > 0 || tournament.matches.length > 0 || tournament.knockout.matches.length > 0) {
            event.preventDefault();
            //
