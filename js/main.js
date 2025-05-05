/**
 * Point d'entrée principal de l'application
 * Ce fichier gère l'initialisation de tous les modules du gestionnaire de tournois Boccia
 */

// Attendre que le DOM soit chargé avant d'initialiser l'application
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter un bouton d'urgence pour forcer l'affichage de l'interface principale
    createEmergencyButton();
    
    // Initialiser l'application
    initializeApp();

    // Enregistrer le service worker pour la fonctionnalité PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('Service Worker enregistré avec succès:', registration);
                })
                .catch(error => {
                    console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
                });
        });
    }
    
    // Ajouter un raccourci clavier pour forcer l'affichage (Ctrl+Shift+I)
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'I') {
            event.preventDefault();
            forceShowMainInterface();
        }
    });

    // Initialiser l'interface utilisateur
    UI.initEventListeners();
    
    // Afficher l'onglet par défaut (dashboard) une fois que tout est initialisé
    setTimeout(() => {
        UI.showTab('dashboard');  // ou tout autre onglet par défaut
        UI.debugUI();  // Afficher les infos de débogage
    }, 100);
});

/**
 * Crée un bouton d'urgence visible en permanence pour forcer l'affichage de l'interface
 */
function createEmergencyButton() {
    const emergencyBtn = document.createElement('button');
    emergencyBtn.textContent = 'Forcer l\'affichage de l\'interface';
    emergencyBtn.id = 'emergency-interface-btn';
    emergencyBtn.style.position = 'fixed';
    emergencyBtn.style.top = '10px';
    emergencyBtn.style.left = '10px';
    emergencyBtn.style.zIndex = '9999';
    emergencyBtn.style.backgroundColor = '#ff9800';
    emergencyBtn.style.color = 'white';
    emergencyBtn.style.border = 'none';
    emergencyBtn.style.borderRadius = '5px';
    emergencyBtn.style.padding = '10px';
    emergencyBtn.style.cursor = 'pointer';
    emergencyBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    emergencyBtn.addEventListener('click', function() {
        forceShowMainInterface();
    });
    
    document.body.appendChild(emergencyBtn);
    console.log('Bouton d\'urgence créé et ajouté au DOM');
}

/**
 * Force l'affichage de l'interface principale
 */
function forceShowMainInterface() {
    console.log('Tentative de forçage de l\'affichage de l\'interface principale');
    
    // Masquer le wizard de configuration et afficher l'interface principale
    const configWizard = document.getElementById('configuration-wizard');
    const mainInterface = document.getElementById('main-interface');
    
    if (configWizard) {
        configWizard.classList.add('hidden');
        console.log('Wizard masqué');
    } else {
        console.warn('Élément #configuration-wizard non trouvé');
    }
    
    if (mainInterface) {
        mainInterface.classList.remove('hidden');
        console.log('Interface principale affichée');
        
        // Si l'interface utilisateur est disponible, mettre à jour le tableau de bord
        if (typeof UI !== 'undefined') {
            UI.updateDashboard();
        }
    } else {
        console.warn('Élément #main-interface non trouvé');
        
        // Afficher une alerte pour informer l'utilisateur
        alert('Impossible de trouver l\'élément #main-interface dans le DOM. Vérifiez que votre HTML contient bien cet élément.');
    }
    
    // Afficher l'état actuel des éléments clés du DOM
    console.log('État des éléments DOM :', {
        'configuration-wizard': document.getElementById('configuration-wizard') ? 'trouvé' : 'non trouvé',
        'main-interface': document.getElementById('main-interface') ? 'trouvé' : 'non trouvé',
        'wizard-step-1': document.getElementById('wizard-step-1') ? 'trouvé' : 'non trouvé',
        'dashboard-tab': document.getElementById('dashboard-tab') ? 'trouvé' : 'non trouvé'
    });
}

/**
 * Initialise tous les modules de l'application
 */
function initializeApp() {
    // Initialiser l'interface utilisateur si elle existe
    if (typeof UI !== 'undefined') {
        UI.initEventListeners();
    }
    
    // Initialiser les gestionnaires essentiels s'ils existent
    if (typeof ConfigManager !== 'undefined') {
        ConfigManager.initWizard();
        ConfigManager.initEventListeners();
    }
    
    if (typeof TeamsManager !== 'undefined') {
        TeamsManager.initEventListeners();
    }
    
    if (typeof PoolsManager !== 'undefined') {
        PoolsManager.initEventListeners();
    }
    
    if (typeof MatchesManager !== 'undefined') {
        MatchesManager.initEventListeners();
    }
    
    if (typeof KnockoutManager !== 'undefined') {
        KnockoutManager.initEventListeners();
    }
    
    if (typeof RankingManager !== 'undefined') {
        RankingManager.initEventListeners();
    }
    
    // Initialiser les modules supplémentaires
    if (typeof CourtsManager !== 'undefined') {
        CourtsManager.init();
        CourtsManager.initEventListeners();
    }
    
    if (typeof SyncManager !== 'undefined') {
        SyncManager.init();
        SyncManager.initEventListeners();
    }
    
    // Initialiser la gestion des courts et planification dans les menus
    initializeMenuItems();
    
    // Afficher l'assistant de configuration par défaut, mais s'assurer que l'interface principale est accessible
    const configWizard = document.getElementById('configuration-wizard');
    const mainInterface = document.getElementById('main-interface');
    
    if (configWizard && mainInterface) {
        configWizard.classList.remove('hidden');
        mainInterface.classList.add('hidden');
        
        // S'assurer que la première étape est visible
        const wizardStep1 = document.getElementById('wizard-step-1');
        if (wizardStep1) {
            wizardStep1.classList.remove('hidden');
        } else {
            console.warn('Élément #wizard-step-1 non trouvé');
        }
    } else {
        console.error('Éléments critiques manquants:', {
            'configuration-wizard': !!configWizard,
            'main-interface': !!mainInterface
        });
    }
    
    // Vérifier s'il y a un tournoi sauvegardé et si oui, l'afficher
    if (typeof TournamentData !== 'undefined') {
        try {
            const hasTournament = TournamentData.loadFromLocalStorage();
            const tournament = TournamentData.getTournament();
            
            // Si un tournoi valide est trouvé, afficher l'interface principale
            if (hasTournament && tournament && tournament.info && tournament.info.name) {
                // Afficher l'interface principale
                if (configWizard && mainInterface) {
                    configWizard.classList.add('hidden');
                    mainInterface.classList.remove('hidden');
                    console.log('Interface principale affichée (tournoi trouvé)');
                }
                
                // Mettre à jour l'interface
                if (typeof UI !== 'undefined') UI.updateDashboard();
                if (typeof TeamsManager !== 'undefined') TeamsManager.renderTeams();
                if (typeof PoolsManager !== 'undefined') PoolsManager.renderPools();
                if (typeof MatchesManager !== 'undefined') MatchesManager.renderMatches();
                if (typeof KnockoutManager !== 'undefined') KnockoutManager.renderKnockoutBracket();
                if (typeof RankingManager !== 'undefined') RankingManager.renderOverallRanking();
                
                // Appliquer le thème sauvegardé
                if (typeof UI !== 'undefined') {
                    UI.setTheme(TournamentData.getSettings().theme);
                    const themeSelector = document.getElementById('theme-selector');
                    if (themeSelector) {
                        themeSelector.value = TournamentData.getSettings().theme;
                    }
                }
                
                // Initialiser la recherche d'équipes
                initializeTeamSearch();
                
                if (typeof UI !== 'undefined') {
                    UI.showAlert('Tournoi chargé depuis le stockage local');
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement du tournoi:', error);
        }
    }
    
    // Ajouter des fonctionnalités supplémentaires
    addExtraFeatures();
    
    // Vérifier l'état de l'interface après 2 secondes (permet de détecter les problèmes)
    setTimeout(checkInterfaceState, 2000);
}

/**
 * Ajoute des fonctionnalités supplémentaires à l'application
 */
function addExtraFeatures() {
    // Vérifier que les modules nécessaires sont disponibles
    if (typeof TournamentData === 'undefined' || typeof UI === 'undefined') return;
    
    // Ajout de la détection du mode sombre du système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // L'utilisateur préfère le thème sombre
        if (TournamentData.getSettings().theme === 'default') {
            UI.setTheme('dark');
            const themeSelector = document.getElementById('theme-selector');
            if (themeSelector) {
                themeSelector.value = 'dark';
            }
        }
    }
    
    // Écouter les changements de préférence de thème du système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (TournamentData.getSettings().theme === 'default') {
            UI.setTheme(event.matches ? 'dark' : 'default');
            const themeSelector = document.getElementById('theme-selector');
            if (themeSelector) {
                themeSelector.value = event.matches ? 'dark' : 'default';
            }
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
        if (typeof TournamentData !== 'undefined') {
            TournamentData.saveToLocalStorage();
            console.log('Sauvegarde automatique effectuée');
        }
    }, 60000); // Sauvegarde toutes les minutes
    
    // Gestion des paramètres de taille de texte
    const fontSizeSelector = document.getElementById('font-size-selector');
    if (fontSizeSelector) {
        fontSizeSelector.addEventListener('change', function() {
            const fontSize = this.value;
            document.body.className = document.body.className.replace(/\bfont-size-\S+/g, '');
            document.body.classList.add(`font-size-${fontSize}`);
            
            // Sauvegarder la préférence
            const settings = TournamentData.getSettings();
            settings.fontSize = fontSize;
            TournamentData.updateSettings(settings);
        });
    }
    
    // Appliquer la taille de texte sauvegardée
    const settings = TournamentData.getSettings();
    if (settings.fontSize) {
        document.body.classList.add(`font-size-${settings.fontSize}`);
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
    // Vérifier que les modules nécessaires sont disponibles
    if (typeof CourtsManager === 'undefined') return;
    
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
        const manageCourtBtn = document.getElementById('manage-courts-btn');
        if (manageCourtBtn) {
            manageCourtBtn.addEventListener('click', function() {
                CourtsManager.showCourtsInterface();
            });
        }
        
        const manageScheduleBtn = document.getElementById('manage-schedule-btn');
        if (manageScheduleBtn) {
            manageScheduleBtn.addEventListener('click', function() {
                CourtsManager.showScheduleInterface();
            });
        }
        
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
            const teamNameElement = card.querySelector('h4');
            if (!teamNameElement) return;
            
            const teamName = teamNameElement.textContent.toLowerCase();
            const playerElements = card.querySelectorAll('li');
            const players = Array.from(playerElements).map(li => li.textContent.toLowerCase());
            
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
    // Vérifier que les modules nécessaires sont disponibles
    if (typeof TournamentData === 'undefined' || typeof ExportManager === 'undefined') return;
    
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
    const exportTournamentBtn = document.querySelector('[data-action="export-tournament"]');
    if (exportTournamentBtn) {
        exportTournamentBtn.addEventListener('click', function() {
            TournamentData.exportTournament();
            dropdownMenu.classList.add('hidden');
        });
    }
    
    const exportPackageBtn = document.querySelector('[data-action="export-tournament-package"]');
    if (exportPackageBtn) {
        exportPackageBtn.addEventListener('click', function() {
            ExportManager.exportTournamentPackage();
            dropdownMenu.classList.add('hidden');
        });
    }
    
    const exportRankingBtn = document.querySelector('[data-action="export-ranking-pdf"]');
    if (exportRankingBtn) {
        exportRankingBtn.addEventListener('click', function() {
            ExportManager.exportRankingToPDF();
            dropdownMenu.classList.add('hidden');
        });
    }
    
    const exportMatchsheetsBtn = document.querySelector('[data-action="export-matchsheets-pdf"]');
    if (exportMatchsheetsBtn) {
        exportMatchsheetsBtn.addEventListener('click', function() {
            ExportManager.exportMatchSheetsToPDF();
            dropdownMenu.classList.add('hidden');
        });
    }
    
    const exportBracketBtn = document.querySelector('[data-action="export-bracket-pdf"]');
    if (exportBracketBtn) {
        exportBracketBtn.addEventListener('click', function() {
            ExportManager.exportBracketToPDF();
            dropdownMenu.classList.add('hidden');
        });
    }
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

// Fonction pour réinitialiser complètement l'application (utile pour le débogage)
function resetApplication() {
    localStorage.removeItem('bocciaTournament');
    localStorage.removeItem('bocciaCourts');
    localStorage.removeItem('bocciaSchedule');
    localStorage.removeItem('bocciaSyncConfig');
    window.location.reload();
}

// Ajouter un bouton de réinitialisation accessible directement depuis la page
window.addEventListener('load', function() {
    // Créer un bouton flottant pour réinitialiser l'application
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Réinitialiser App';
    resetButton.style.position = 'fixed';
    resetButton.style.bottom = '10px';
    resetButton.style.right = '10px';
    resetButton.style.zIndex = '9999';
    resetButton.style.backgroundColor = '#e74c3c';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '5px';
    resetButton.style.padding = '5px 10px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.fontSize = '12px';
    
    resetButton.addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser complètement l\'application ? Toutes les données seront perdues.')) {
            resetApplication();
        }
    });
    
    document.body.appendChild(resetButton);
});

// Amélioration de la gestion de la transition entre le wizard et l'interface principale
document.addEventListener('DOMContentLoaded', function() {
    // Référence vers les éléments principaux
    const configWizard = document.getElementById('configuration-wizard');
    const mainInterface = document.getElementById('main-interface');
    const wizardFinishBtn = document.getElementById('wizard-finish');
    const forceShowBtn = document.getElementById('force-show-interface');
    const debugStatus = document.getElementById('debug-status');
    
    // Vérifier si un tournoi existe déjà en mémoire
    const savedTournament = localStorage.getItem('bocciaTournament');
    if (savedTournament) {
        try {
            const tournamentData = JSON.parse(savedTournament);
            if (tournamentData && tournamentData.name) {
                console.log('Tournoi trouvé en mémoire, affichage de l\'interface principale');
                showMainInterface();
            }
        } catch (e) {
            console.error('Erreur lors du chargement du tournoi:', e);
        }
    }
    
    // Événement pour le bouton de finalisation du wizard
    if (wizardFinishBtn) {
        wizardFinishBtn.addEventListener('click', function() {
            logTransition("Bouton Terminer cliqué");
            // Collecter et sauvegarder les données du tournoi
            const tournamentData = collectTournamentData();
            localStorage.setItem('bocciaTournament', JSON.stringify(tournamentData));
            
            // Afficher l'interface principale
            showMainInterface();
        });
    }
    
    // Bouton de secours pour forcer l'affichage
    if (forceShowBtn) {
        forceShowBtn.addEventListener('click', function() {
            logTransition("Bouton de secours cliqué");
            showMainInterface();
        });
    }
    
    // Fonction pour afficher l'interface principale
    function showMainInterface() {
        logTransition("Tentative d'affichage de l'interface principale");
        if (configWizard && mainInterface) {
            configWizard.classList.add('hidden');
            mainInterface.classList.remove('hidden');
            logTransition("Interface principale affichée avec succès");
            
            // Initialiser les onglets et le contenu initial
            initializeMainInterface();
        } else {
            logTransition("ERREUR: Éléments DOM non trouvés");
            console.error('Éléments DOM non trouvés:', { 
                configWizard: !!configWizard, 
                mainInterface: !!mainInterface 
            });
        }
    }
    
    // Fonction pour collecter les données du formulaire de configuration
    function collectTournamentData() {
        const data = {
            name: document.getElementById('tournament-name').value || 'Tournoi sans nom',
            date: document.getElementById('tournament-date').value || new Date().toISOString().split('T')[0],
            location: document.getElementById('tournament-location').value || 'Non spécifié',
            format: document.getElementById('tournament-format').value || 'pools-only',
            pools: {
                count: parseInt(document.getElementById('num-pools').value) || 2,
                teamsPerPool: parseInt(document.getElementById('teams-per-pool').value) || 4,
                matchesPerTeam: parseInt(document.getElementById('matches-per-team').value) || 3,
                teamsQualifying: parseInt(document.getElementById('teams-qualifying').value) || 2,
                qualificationMode: document.getElementById('qualification-mode').value || 'top-n'
            },
            knockout: {
                teams: parseInt(document.getElementById('num-knockout-teams').value) || 8
            },
            scoring: {
                win: parseInt(document.getElementById('points-win').value) || 3,
                loss: parseInt(document.getElementById('points-loss').value) || 1,
                draw: parseInt(document.getElementById('points-draw').value) || 2,
                forfeit: parseInt(document.getElementById('points-forfeit').value) || 0
            },
            teams: [],
            matches: [],
            createdAt: new Date().toISOString()
        };
        
        return data;
    }
    
    // Initialisation de l'interface principale
    function initializeMainInterface() {
        // Gérer les onglets
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                
                // Désactiver tous les onglets
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Activer l'onglet sélectionné
                this.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
        
        // Charger les informations du tournoi dans le dashboard
        updateDashboard();
    }
    
    // Mise à jour du tableau de bord avec les informations du tournoi
    function updateDashboard() {
        try {
            const tournamentData = JSON.parse(localStorage.getItem('bocciaTournament') || '{}');
            
            // Mise à jour des informations de base du tournoi
            document.getElementById('dashboard-tournament-name').textContent = tournamentData.name || 'Non défini';
            document.getElementById('dashboard-tournament-date').textContent = tournamentData.date || 'Non défini';
            document.getElementById('dashboard-tournament-location').textContent = tournamentData.location || 'Non défini';
            
            // Format du tournoi en français
            let format = 'Non défini';
            if (tournamentData.format === 'pools-only') format = 'Poules uniquement';
            else if (tournamentData.format === 'knockout-only') format = 'Élimination directe uniquement';
            else if (tournamentData.format === 'pools-knockout') format = 'Poules suivies d\'élimination directe';
            
            document.getElementById('dashboard-tournament-format').textContent = format;
            
            // Statistiques du tournoi
            document.getElementById('dashboard-teams-count').textContent = tournamentData.teams ? tournamentData.teams.length : 0;
            document.getElementById('dashboard-pools-count').textContent = tournamentData.pools ? tournamentData.pools.count : 0;
            
            // Progression des matchs
            const matchesPlayed = tournamentData.matches ? tournamentData.matches.filter(match => match.status === 'completed').length : 0;
            const totalMatches = tournamentData.matches ? tournamentData.matches.length : 0;
            document.getElementById('dashboard-matches-played').textContent = matchesPlayed;
            document.getElementById('dashboard-total-matches').textContent = totalMatches;
            
            // Barre de progression
            const progressPercentage = totalMatches > 0 ? (matchesPlayed / totalMatches) * 100 : 0;
            document.getElementById('progress-bar-fill').style.width = `${progressPercentage}%`;
            
        } catch (e) {
            console.error('Erreur lors de la mise à jour du dashboard:', e);
        }
    }
    
    // Fonction pour journaliser les transitions pour le débogage
    function logTransition(message) {
        console.log(`[Transition]: ${message}`);
        if (debugStatus) {
            debugStatus.innerHTML = `<strong>État de transition:</strong> ${message} <br>` +
                                   `<small>Horodatage: ${new Date().toLocaleTimeString()}</small>`;
        }
    }
});

/**
 * Vérifie l'état de l'interface et affiche des informations de débogage
 */
function checkInterfaceState() {
    const configWizard = document.getElementById('configuration-wizard');
    const mainInterface = document.getElementById('main-interface');
    
    console.log('État de l\'interface après initialisation:');
    console.log('- configuration-wizard:', configWizard ? 
        (configWizard.classList.contains('hidden') ? 'caché' : 'visible') : 'non trouvé');
    console.log('- main-interface:', mainInterface ? 
        (mainInterface.classList.contains('hidden') ? 'caché' : 'visible') : 'non trouvé');
    
    // Si les deux interfaces sont cachées ou absentes, essayer de forcer l'affichage
    if (!configWizard || !mainInterface || 
        (configWizard.classList.contains('hidden') && mainInterface.classList.contains('hidden'))) {
        console.warn('Aucune interface n\'est visible! Tentative de forçage...');
        forceShowMainInterface();
    }
}

