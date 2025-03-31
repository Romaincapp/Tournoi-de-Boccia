/**
 * Gestion de la configuration du tournoi
 */
const ConfigManager = (function() {
    /**
     * Initialise l'assistant de configuration
     */
    function initWizard() {
        // Étape 1: Passer à l'étape 2
        document.getElementById('wizard-next-1').addEventListener('click', function() {
            nextWizardStep(1);
        });
        
        // Étape 2: Revenir à l'étape 1 ou passer à l'étape 3
        document.getElementById('wizard-prev-2').addEventListener('click', function() {
            prevWizardStep(2);
        });
        
        document.getElementById('wizard-next-2').addEventListener('click', function() {
            nextWizardStep(2);
        });
        
        // Étape 3: Revenir à l'étape 2 ou finaliser
        document.getElementById('wizard-prev-3').addEventListener('click', function() {
            prevWizardStep(3);
        });
        
        document.getElementById('wizard-finish').addEventListener('click', function() {
            finishWizard();
        });
        
        // Gestion du format du tournoi
        document.getElementById('tournament-format').addEventListener('change', function() {
            const format = this.value;
            document.getElementById('pools-config').classList.toggle('hidden', format === 'knockout-only');
            document.getElementById('knockout-config').classList.toggle('hidden', format === 'pools-only');
        });
    }

    /**
     * Passe à l'étape suivante de l'assistant
     * @param {number} currentStep - Étape actuelle
     */
    function nextWizardStep(currentStep) {
        if (currentStep === 1) {
            const name = document.getElementById('tournament-name').value;
            const date = document.getElementById('tournament-date').value;
            const location = document.getElementById('tournament-location').value;
            
            if (!name || !date || !location) {
                UI.showAlert('Veuillez remplir tous les champs', 'warning');
                return;
            }
            
            TournamentData.updateInfo({
                name: name,
                date: date,
                location: location
            });
            
            document.getElementById('wizard-step-1').classList.add('hidden');
            document.getElementById('wizard-step-2').classList.remove('hidden');
        } else if (currentStep === 2) {
            const format = document.getElementById('tournament-format').value;
            const numPools = parseInt(document.getElementById('num-pools').value);
            const teamsPerPool = parseInt(document.getElementById('teams-per-pool').value);
            const matchesPerTeam = parseInt(document.getElementById('matches-per-team').value);
            const qualificationMode = document.getElementById('qualification-mode').value;
            const teamsQualifying = parseInt(document.getElementById('teams-qualifying').value);
            const numKnockoutTeams = parseInt(document.getElementById('num-knockout-teams').value);
            
            if (format.includes('pools') && (numPools < 1 || teamsPerPool < 2 || teamsQualifying < 1)) {
                UI.showAlert('Veuillez entrer des valeurs valides pour les poules', 'warning');
                return;
            }
            
            if (format.includes('pools') && (matchesPerTeam < 1 || matchesPerTeam > teamsPerPool - 1)) {
                UI.showAlert(`Le nombre de matchs par équipe doit être entre 1 et ${teamsPerPool - 1}`, 'warning');
                return;
            }
            
            if (format.includes('knockout') && !TournamentData.isPowerOfTwo(numKnockoutTeams)) {
                UI.showAlert('Le nombre d\'équipes en phase finale doit être une puissance de 2', 'warning');
                return;
            }
            
            TournamentData.updateInfo({ format: format });
            TournamentData.updateConfig({
                numPools: numPools,
                teamsPerPool: teamsPerPool,
                matchesPerTeam: matchesPerTeam,
                qualificationMode: qualificationMode,
                teamsQualifying: teamsQualifying,
                numKnockoutTeams: numKnockoutTeams
            });
            
            document.getElementById('wizard-step-2').classList.add('hidden');
            document.getElementById('wizard-step-3').classList.remove('hidden');
        }
    }

    /**
     * Revient à l'étape précédente de l'assistant
     * @param {number} currentStep - Étape actuelle
     */
    function prevWizardStep(currentStep) {
        if (currentStep === 2) {
            document.getElementById('wizard-step-2').classList.add('hidden');
            document.getElementById('wizard-step-1').classList.remove('hidden');
        } else if (currentStep === 3) {
            document.getElementById('wizard-step-3').classList.add('hidden');
            document.getElementById('wizard-step-2').classList.remove('hidden');
        }
    }

    /**
     * Finalise la configuration et passe à l'interface principale
     */
    function finishWizard() {
        document.getElementById('configuration-wizard').classList.add('hidden');
        document.getElementById('main-interface').classList.remove('hidden');
        
        // Mettre à jour le tableau de bord
        UI.updateDashboard();
        
        // Créer les poules
        PoolsManager.createPools();
        
        // Sauvegarder la configuration
        TournamentData.saveToLocalStorage();
    }

    /**
     * Réinitialise le tournoi
     */
    function resetTournament() {
        if (!confirm('Êtes-vous sûr de vouloir réinitialiser le tournoi ? Toutes les données seront perdues.')) return;
        
        TournamentData.resetTournament();
        
        // Afficher l'assistant de configuration
        document.getElementById('configuration-wizard').classList.remove('hidden');
        document.getElementById('main-interface').classList.add('hidden');
        
        // Réinitialiser les étapes du wizard
        document.getElementById('wizard-step-1').classList.remove('hidden');
        document.getElementById('wizard-step-2').classList.add('hidden');
        document.getElementById('wizard-step-3').classList.add('hidden');
        
        // Réinitialiser les champs du formulaire
        document.getElementById('tournament-name').value = '';
        document.getElementById('tournament-date').value = '';
        document.getElementById('tournament-location').value = '';
        
        UI.showAlert('Tournoi réinitialisé avec succès');
    }

    /**
     * Initialise les écouteurs d'événements pour la configuration
     */
    function initEventListeners() {
        // Import/Export de tournoi
        document.getElementById('import-btn').addEventListener('click', function() {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file').addEventListener('change', function(event) {
            const file = event.target.files[0];
            
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const success = TournamentData.importTournament(e.target.result);
                    
                    if (success) {
                        // Afficher l'interface principale
                        document.getElementById('configuration-wizard').classList.add('hidden');
                        document.getElementById('main-interface').classList.remove('hidden');
                        
                        // Mettre à jour l'interface
                        UI.updateDashboard();
                        TeamsManager.renderTeams();
                        PoolsManager.renderPools();
                        MatchesManager.renderMatches();
                        KnockoutManager.renderKnockoutBracket();
                        
                        // Appliquer le thème
                        UI.setTheme(TournamentData.getSettings().theme);
                        document.getElementById('theme-selector').value = TournamentData.getSettings().theme;
                        
                        UI.showAlert('Tournoi importé avec succès');
                    } else {
                        UI.showAlert('Format de fichier invalide', 'danger');
                    }
                } catch (error) {
                    UI.showAlert(`Erreur lors de l'importation: ${error.message}`, 'danger');
                }
            };
            
            reader.readAsText(file);
        });
        
        document.getElementById('export-btn').addEventListener('click', function() {
            TournamentData.exportTournament();
        });
        
        // Réinitialisation
        document.getElementById('reset-btn').addEventListener('click', function() {
            resetTournament();
        });
    }

    // API publique
    return {
        initWizard,
        initEventListeners,
        resetTournament
    };
})();
