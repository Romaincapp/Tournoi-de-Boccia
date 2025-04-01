let tournament = {
    info: {
        name: '',
        date: '',
        location: '',
        format: ''
    },
    config: {
        numPools: 2,
        teamsPerPool: 4,
        matchesPerTeam: 3,
        qualificationMode: 'top-n',
        teamsQualifying: 2,
        numKnockoutTeams: 8,
        
        // Paramètres avancés pour le scoring
        scoringRules: {
            win: 3,
            loss: 1,
            draw: 2,
            forfeit: 0
        },
        useCustomScoring: false,
        
        // Critères de départage (ordre de priorité)
        tiebreakers: ['points', 'wins', 'pointsDiff', 'pointsFor'],
        
        // Durées de match
        matchDuration: 30,
        breakBetweenMatches: 5,
        
        // Pauses planifiées
        scheduledBreaks: [],
        useScheduledBreaks: false,
        
        // Paramètres d'urgence
        emergencySettings: {
            enabled: true,
            allowLateRegistration: true,
            allowPoolModification: true,
            allowFormatChange: false
        }
    },
    teams: [],
    pools: [],
    matches: [],
    knockout: {
        rounds: [],
        matches: []
    },
    settings: {
        theme: 'default'
    }
};

    /**
     * Enregistre les données du tournoi dans le localStorage
     */
    function saveToLocalStorage() {
        localStorage.setItem('bocciaTournament', JSON.stringify(tournament));
        // Déclencher un événement pour notifier que les données ont été sauvegardées
        document.dispatchEvent(new CustomEvent('tournamentDataUpdated'));
    }

    /**
     * Charge les données du tournoi depuis le localStorage
     * @returns {boolean} True si des données ont été chargées, false sinon
     */
    function loadFromLocalStorage() {
        const savedTournament = localStorage.getItem('bocciaTournament');
        if (savedTournament) {
            tournament = JSON.parse(savedTournament);
            
            // Assurer la compatibilité avec les anciennes versions
            if (!tournament.settings) {
                tournament.settings = { theme: 'default' };
            }
            
            return true;
        }
        return false;
    }

    /**
     * Exporte les données du tournoi sous forme de fichier JSON
     */
    function exportTournament() {
        const dataStr = JSON.stringify(tournament, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileName = tournament.info.name ?
            `${tournament.info.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json` :
            `tournoi_boccia_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
    }

    /**
     * Importe des données de tournoi depuis un fichier JSON
     * @param {string} jsonData - Données JSON du tournoi
     * @returns {boolean} True si l'importation a réussi, false sinon
     */
    function importTournament(jsonData) {
        try {
            const importedTournament = JSON.parse(jsonData);
            
            // Validation basique
            if (!importedTournament.info || !importedTournament.config) {
                return false;
            }
            
            tournament = importedTournament;
            
            // Assurer la compatibilité avec les anciennes versions
            if (!tournament.settings) {
                tournament.settings = { theme: 'default' };
            }
            
            saveToLocalStorage();
            return true;
        } catch (error) {
            console.error("Erreur lors de l'importation:", error);
            return false;
        }
    }

    /**
     * Réinitialise complètement le tournoi
     */
    function resetTournament() {
        tournament = {
            info: {
                name: '',
                date: '',
                location: '',
                format: ''
            },
            config: {
                numPools: 2,
                teamsPerPool: 4,
                matchesPerTeam: 3,
                qualificationMode: 'top-n',
                teamsQualifying: 2,
                numKnockoutTeams: 8
            },
            teams: [],
            pools: [],
            matches: [],
            knockout: {
                rounds: [],
                matches: []
            },
            settings: {
                theme: tournament.settings?.theme || 'default'
            }
        };
        
        saveToLocalStorage();
    }

    /**
     * Vérifie si un nombre est une puissance de 2
     * @param {number} n - Nombre à vérifier
     * @returns {boolean}
     */
    function isPowerOfTwo(n) {
        return n && (n & (n - 1)) === 0;
    }

    /**
     * Met à jour la configuration du tournoi
     * @param {Object} config - Nouvelles valeurs de configuration
     */
    function updateConfig(config) {
        for (const key in config) {
            if (tournament.config.hasOwnProperty(key)) {
                tournament.config[key] = config[key];
            }
        }
        saveToLocalStorage();
    }
    
    /**
     * Met à jour les informations du tournoi
     * @param {Object} info - Nouvelles informations
     */
    function updateInfo(info) {
        for (const key in info) {
            if (tournament.info.hasOwnProperty(key)) {
                tournament.info[key] = info[key];
            }
        }
        saveToLocalStorage();
    }
    
    /**
     * Met à jour les paramètres
     * @param {Object} settings - Nouveaux paramètres
     */
    function updateSettings(settings) {
        for (const key in settings) {
            if (tournament.settings.hasOwnProperty(key)) {
                tournament.settings[key] = settings[key];
            }
        }
        saveToLocalStorage();
    }

    // API publique
    return {
        // Getters
        getTournament: () => tournament,
        getInfo: () => tournament.info,
        getConfig: () => tournament.config,
        getTeams: () => tournament.teams,
        getPools: () => tournament.pools,
        getMatches: () => tournament.matches,
        getKnockout: () => tournament.knockout,
        getSettings: () => tournament.settings,
        
        // Setters (les fonctions qui modifient les données)
        updateInfo,
        updateConfig,
        updateSettings,
        
        // Gestion du stockage
        saveToLocalStorage,
        loadFromLocalStorage,
        exportTournament,
        importTournament,
        resetTournament,
        
        // Utilitaires
        isPowerOfTwo
    };
})();
