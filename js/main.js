function initializeApp() {
    // Vérifiez l'existence des modules
    if (typeof UI === 'undefined') console.error('UI module not loaded');
    if (typeof TournamentData === 'undefined') console.error('TournamentData module not loaded');
    if (typeof ConfigManager === 'undefined') console.error('ConfigManager module not loaded');
    if (typeof PoolsManager === 'undefined') console.error('PoolsManager module not loaded');
    if (typeof TeamsManager === 'undefined') console.error('TeamsManager module not loaded');
    // ... autres vérifications

    // Initialiser les modules uniquement s'ils existent
    if (UI) UI.initEventListeners();
    
    if (ConfigManager) {
        ConfigManager.initWizard();
        ConfigManager.initEventListeners();
    }

    // Autres initialisations conditionnelles
    if (TournamentData) {
        TournamentData.loadFromLocalStorage();
    }

/**
 * Point d'entrée principal de l'application
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les modules
    initializeApp();
});

/**
 * Initialise tous les modules de l'application
 */
function initializeApp() {
    // Initialiser l'interface utilisateur
    UI.initEventListeners();
    
    // Initialiser les gestionnaires
    ConfigManager.initWizard();
    ConfigManager.initEventListeners();
    TeamsManager.initEventListeners();
    PoolsManager.initEventListeners();
    MatchesManager.initEventListeners();
    KnockoutManager.initEventListeners();
    RankingManager.initEventListeners();
    
    // Initialiser les nouveaux modules
    CourtsManager.init();
    SyncManager.init();
    SyncManager.initEventListeners();
    
    // Initialiser la gestion des courts et planification dans les menus
    initializeMenuItems();
    
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
        RankingManager.renderOverallRanking();
        
        // Appliquer le thème sauvegardé
        UI.setTheme(TournamentData.getSettings().theme);
        document.getElementById('theme-selector').value = TournamentData.getSettings().theme;
        
        // Initialiser la recherche d'équipes
        initializeTeamSearch();
        
        UI.showAlert('Tournoi chargé depuis le stockage local');
    }
    
    // Ajouter des fonctionnalités supplémentaires
    addExtraFeatures();
}

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
            // Message standard de confirmation de navigation
            event.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
            return event.returnValue;
        }
    });
    
    // Ajout d'une fonctionnalité de sauvegarde automatique
    setInterval(function() {
        TournamentData.saveToLocalStorage();
        console.log('Sauvegarde automatique effectuée');
    }, 60000); // Sauvegarde toutes les minutes
    
    // Gestion des paramètres de taille de texte
    document.getElementById('font-size-selector')?.addEventListener('change', function() {
        const fontSize = this.value;
        document.body.className = document.body.className.replace(/\bfont-size-\S+/g, '');
        document.body.classList.add(`font-size-${fontSize}`);
        
        // Sauvegarder la préférence
        const settings = TournamentData.getSettings();
        settings.fontSize = fontSize;
        TournamentData.updateSettings(settings);
    });
    
    // Appliquer la taille de texte sauvegardée
    const settings = TournamentData.getSettings();
    if (settings.fontSize) {
        document.body.classList.add(`font-size-${settings.fontSize}`);
        const fontSizeSelector = document.getElementById('font-size-selector');
        if (fontSizeSelector) {
            fontSizeSelector.value = settings.fontSize;
        }
    }
    
    // Initialiser le menu déroulant d'exportation
    initializeExportDropdown();
    
    // Initialiser les filtres de matchs
    initializeMatchFilters();
}

/**
 * Initialise les éléments de menu pour courts et planification
 */
function initializeMenuItems() {
    // Ajouter les boutons au tableau de bord
    const quickActionsCard = document.getElementById('quick-actions');
    if (quickActionsCard) {
        const courtsBtn = document.createElement('button');
        courtsBtn.className = 'btn';
        courtsBtn.textContent = 'Gestion des Terrains';
        courtsBtn.id = 'courts-btn';
        
        const scheduleBtn = document.createElement('button');
        scheduleBtn.className = 'btn';
        scheduleBtn.textContent = 'Planification';
        scheduleBtn.id = 'schedule-btn';
        
        quickActionsCard.appendChild(courtsBtn);
        quickActionsCard.appendChild(scheduleBtn);
        
        // Ajouter les écouteurs d'événements
        courtsBtn.addEventListener('click', function() {
            CourtsManager.showCourtsInterface();
        });
        
        scheduleBtn.addEventListener('click', function() {
            CourtsManager.showScheduleInterface();
        });
    }
    
    // Ajouter un onglet pour la planification
    const tabButtons = document.querySelector('.tab-buttons');
    const tabContent = document.querySelector('.tab-content');
    
    if (tabButtons && tabContent) {
        // Créer le bouton d'onglet
        const scheduleTabBtn = document.createElement('button');
        scheduleTabBtn.className = 'tab-button';
        scheduleTabBtn.setAttribute('data-tab', 'schedule');
        scheduleTabBtn.textContent = 'Planning';
        
        // Insérer avant les paramètres
        const settingsTabBtn = document.querySelector('.tab-button[data-tab="settings"]');
        if (settingsTabBtn) {
            tabButtons.insertBefore(scheduleTabBtn, settingsTabBtn);
        } else {
            tabButtons.appendChild(scheduleTabBtn);
        }
        
        // Créer le contenu de l'onglet
        const scheduleTabPane = document.createElement('div');
        scheduleTabPane.id = 'schedule-tab';
        scheduleTabPane.className = 'tab-pane';
        
        scheduleTabPane.innerHTML = `
            <h2>Planning du Tournoi</h2>
            <div class="card">
                <h3>Gestion des Terrains et Planning</h3>
                <p>Configurez les terrains disponibles et planifiez les matchs du tournoi.</p>
                <button class="btn" id="manage-courts-btn">Gérer les Terrains</button>
                <button class="btn" id="manage-schedule-btn">Planifier les Matchs</button>
            </div>
            <div class="card">
                <h3>Vue du Planning</h3>
                <div id="schedule-view-container">
                    <!-- Le planning sera généré ici dynamiquement -->
                </div>
            </div>
        `;
        
        // Ajouter au contenu des onglets
        tabContent.appendChild(scheduleTabPane);
        
        // Ajouter les écouteurs d'événements
        document.getElementById('manage-courts-btn')?.addEventListener('click', function() {
            CourtsManager.showCourtsInterface();
        });
        
        document.getElementById('manage-schedule-btn')?.addEventListener('click', function() {
            CourtsManager.showScheduleInterface();
        });
        
        // Mettre à jour le planning quand on affiche l'onglet
        scheduleTabBtn.addEventListener('click', function() {
            const scheduleContainer = document.getElementById('schedule-view-container');
            if (scheduleContainer) {
                const schedule = CourtsManager.getSchedule();
                if (schedule.assignments.length > 0) {
                    // Ici, on pourrait ajouter une fonction pour afficher le planning
                    scheduleContainer.innerHTML = '<p>Planning disponible. Cliquez sur "Planifier les Matchs" pour le visualiser en détail.</p>';
                } else {
                    scheduleContainer.innerHTML = '<p>Aucun match planifié. Utilisez le bouton "Planifier les Matchs" pour créer un planning.</p>';
                }
            }
        });
    }
}

/**
 * Initialise la recherche d'équipes
 */
function initializeTeamSearch() {
    const searchInput = document.getElementById('team-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const teamCards = document.querySelectorAll('.team-card');
        
        teamCards.forEach(card => {
            const teamName = card.querySelector('h4').textContent.toLowerCase();
            const players = Array.from(card.querySelectorAll('li')).map(li => li.textContent.toLowerCase());
            
            // Rechercher dans le nom de l'équipe et les noms des joueurs
            const matchesTeamName = teamName.includes(searchTerm);
            const matchesPlayers = players.some(player => player.includes(searchTerm));
            
            if (matchesTeamName || matchesPlayers) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

/**
 * Initialise le menu déroulant d'exportation
 */
function initializeExportDropdown() {
    const dropdownBtn = document.getElementById('export-dropdown-btn');
    const dropdownMenu = document.getElementById('export-dropdown');
    
    if (!dropdownBtn || !dropdownMenu) return;
    
    // Afficher/masquer le menu déroulant
    dropdownBtn.addEventListener('click', function() {
        dropdownMenu.classList.toggle('hidden');
    });
    
    // Masquer le menu quand on clique ailleurs
    document.addEventListener('click', function(event) {
        if (!dropdownBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });
    
    // Ajouter les écouteurs d'événements pour les options d'exportation
    document.querySelector('[data-action="export-tournament"]')?.addEventListener('click', function() {
        TournamentData.exportTournament();
        dropdownMenu.classList.add('hidden');
    });
    
    document.querySelector('[data-action="export-tournament-package"]')?.addEventListener('click', function() {
        ExportManager.exportTournamentPackage();
        dropdownMenu.classList.add('hidden');
    });
    
    document.querySelector('[data-action="export-ranking-pdf"]')?.addEventListener('click', function() {
        ExportManager.exportRankingToPDF();
        dropdownMenu.classList.add('hidden');
    });
    
    document.querySelector('[data-action="export-matchsheets-pdf"]')?.addEventListener('click', function() {
        ExportManager.exportMatchSheetsToPDF();
        dropdownMenu.classList.add('hidden');
    });
    
    document.querySelector('[data-action="export-bracket-pdf"]')?.addEventListener('click', function() {
        ExportManager.exportBracketToPDF();
        dropdownMenu.classList.add('hidden');
    });
}

/**
 * Initialise les filtres de matchs
 */
function initializeMatchFilters() {
    const matchFilter = document.getElementById('match-filter');
    if (!matchFilter) return;
    
    matchFilter.addEventListener('change', function() {
        const filterValue = this.value;
        const matchCards = document.querySelectorAll('.match-card');
        
        matchCards.forEach(card => {
            const isPending = !card.querySelector('.match-played');
            const isPlayed = card.querySelector('.match-played') && !card.querySelector('.match-forfeit');
            const isForfeit = card.querySelector('.match-forfeit');
            
            switch (filterValue) {
                case 'all':
                    card.style.display = '';
                    break;
                case 'pending':
                    card.style.display = isPending ? '' : 'none';
                    break;
                case 'played':
                    card.style.display = isPlayed ? '' : 'none';
                  break;
                case 'forfeit':
                    card.style.display = isForfeit ? '' : 'none';
                    break;
            }
        });
    });
}

// Initialiser l'application au chargement de la page
