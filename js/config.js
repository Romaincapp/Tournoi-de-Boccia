const ConfigManager = (function() {
    // Vérification de TournamentData
    if (typeof TournamentData === 'undefined') {
        console.error('TournamentData is not loaded');
        return {
            initWizard: function() {
                console.error('Cannot initialize wizard - TournamentData not loaded');
            },
            initEventListeners: function() {
                console.error('Cannot initialize event listeners - TournamentData not loaded');
            },
            resetTournament: function() {
                console.error('Cannot reset tournament - TournamentData not loaded');
            }
        };
    }

    /**
     * Initialise l'assistant de configuration avec des paramètres supplémentaires
     */
    function initWizard() {
        console.log("Initialisation du wizard de configuration");
        
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
        
        // Étape 3: Revenir à l'étape 2 ou passer à l'étape 4 (Nouvelle étape)
        document.getElementById('wizard-prev-3').addEventListener('click', function() {
            prevWizardStep(3);
        });
        
        document.getElementById('wizard-next-3').addEventListener('click', function() {
            nextWizardStep(3);
        });
        
        // Étape 4: Revenir à l'étape 3 ou finaliser
        document.getElementById('wizard-prev-4').addEventListener('click', function() {
            prevWizardStep(4);
        });
        
        document.getElementById('wizard-finish').addEventListener('click', function() {
            console.log("Bouton de finalisation cliqué");
            finishWizard();
        });
        
        // Gestion du format du tournoi
        document.getElementById('tournament-format').addEventListener('change', function() {
            const format = this.value;
            document.getElementById('pools-config').classList.toggle('hidden', format === 'knockout-only');
            document.getElementById('knockout-config').classList.toggle('hidden', format === 'pools-only');
        });
        
        // Gestion des règles de score
        document.getElementById('custom-scoring-toggle').addEventListener('change', function() {
            document.getElementById('custom-scoring-rules').classList.toggle('hidden', !this.checked);
        });
        
        // Gestion des pauses planifiées
        document.getElementById('scheduled-breaks-toggle').addEventListener('change', function() {
            document.getElementById('scheduled-breaks-config').classList.toggle('hidden', !this.checked);
        });
        
        // Ajouter une pause
        document.getElementById('add-break-btn').addEventListener('click', addBreakField);
    }

    /**
     * Ajoute un champ pour configurer une pause planifiée
     */
    function addBreakField() {
        const breaksContainer = document.getElementById('breaks-container');
        const breakCount = breaksContainer.children.length + 1;
        
        const breakDiv = document.createElement('div');
        breakDiv.className = 'scheduled-break-item';
        breakDiv.innerHTML = `
            <h5>Pause ${breakCount}</h5>
            <div class="form-row">
                <div class="form-group half-width">
                    <label for="break-name-${breakCount}">Nom</label>
                    <input type="text" id="break-name-${breakCount}" placeholder="Ex: Pause déjeuner">
                </div>
                <div class="form-group half-width">
                    <label for="break-duration-${breakCount}">Durée (minutes)</label>
                    <input type="number" id="break-duration-${breakCount}" min="5" value="30">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group half-width">
                    <label for="break-time-${breakCount}">Heure prévue</label>
                    <input type="time" id="break-time-${breakCount}">
                </div>
                <div class="form-group half-width text-right">
                    <button class="btn btn-sm btn-danger remove-break-btn" data-break-id="${breakCount}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        breaksContainer.appendChild(breakDiv);
        
        // Ajouter l'écouteur pour supprimer
        breakDiv.querySelector('.remove-break-btn').addEventListener('click', function() {
            breakDiv.remove();
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
        } else if (currentStep === 3) {
            // Récupérer les paramètres de scoring personnalisés
            const useCustomScoring = document.getElementById('custom-scoring-toggle').checked;
            let scoringRules = {
                win: 3,
                loss: 1,
                draw: 2,
                forfeit: 0
            };
            
            if (useCustomScoring) {
                scoringRules.win = parseInt(document.getElementById('points-win').value);
                scoringRules.loss = parseInt(document.getElementById('points-loss').value);
                scoringRules.draw = parseInt(document.getElementById('points-draw').value);
                scoringRules.forfeit = parseInt(document.getElementById('points-forfeit').value);
            }
            
            // Récupérer les règles de départage
            const tiebreakers = [];
            document.querySelectorAll('#tiebreakers-container .tiebreaker-option:checked').forEach(checkbox => {
                tiebreakers.push(checkbox.value);
            });
            
            // Récupérer les durées de match
            const matchDuration = parseInt(document.getElementById('match-duration').value);
            const breakBetweenMatches = parseInt(document.getElementById('break-between-matches').value);
            
            // Sauvegarder les paramètres avancés
            TournamentData.updateConfig({
                scoringRules: scoringRules,
                useCustomScoring: useCustomScoring,
                tiebreakers: tiebreakers,
                matchDuration: matchDuration,
                breakBetweenMatches: breakBetweenMatches
            });
            
            document.getElementById('wizard-step-3').classList.add('hidden');
            document.getElementById('wizard-step-4').classList.remove('hidden');
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
        } else if (currentStep === 4) {
            document.getElementById('wizard-step-4').classList.add('hidden');
            document.getElementById('wizard-step-3').classList.remove('hidden');
        }
    }

    /**
     * Finalise la configuration et passe à l'interface principale
     */
    function finishWizard() {
        console.log("Début de finishWizard()");
        
        try {
            // Récupérer les pauses planifiées
            const useScheduledBreaks = document.getElementById('scheduled-breaks-toggle').checked;
            const scheduledBreaks = [];
            
            if (useScheduledBreaks) {
                document.querySelectorAll('.scheduled-break-item').forEach((breakItem, index) => {
                    const breakId = index + 1;
                    const nameElement = document.getElementById(`break-name-${breakId}`);
                    const durationElement = document.getElementById(`break-duration-${breakId}`);
                    const timeElement = document.getElementById(`break-time-${breakId}`);
                    
                    if (nameElement && durationElement && timeElement) {
                        const name = nameElement.value;
                        const duration = parseInt(durationElement.value);
                        const time = timeElement.value;
                        
                        if (name && duration && time) {
                            scheduledBreaks.push({
                                id: `break_${Date.now()}_${breakId}`,
                                name: name,
                                duration: duration,
                                scheduledTime: time
                            });
                        }
                    }
                });
            }
            
            // Récupérer les paramètres d'urgence
            const enableEmergencyMode = document.getElementById('emergency-mode-toggle').checked;
            const allowLateRegistration = document.getElementById('allow-late-registration').checked;
            const allowPoolModification = document.getElementById('allow-pool-modification').checked;
            const allowFormatChange = document.getElementById('allow-format-change').checked;
            
            // Sauvegarder les paramètres finaux
            TournamentData.updateConfig({
                scheduledBreaks: scheduledBreaks,
                useScheduledBreaks: useScheduledBreaks,
                emergencySettings: {
                    enabled: enableEmergencyMode,
                    allowLateRegistration: allowLateRegistration,
                    allowPoolModification: allowPoolModification,
                    allowFormatChange: allowFormatChange
                }
            });
            
            // Initialiser les structures du tournoi
            const tournamentFormat = TournamentData.getInfo().format || 'pools-knockout';
            
            // Créer les poules si le format le nécessite
            if (typeof PoolsManager !== 'undefined' && (tournamentFormat === 'pools-only' || tournamentFormat === 'pools-knockout')) {
                PoolsManager.createPools();
            }
            
            // Initialiser le tableau des éliminations directes si le format le nécessite
            if (typeof KnockoutManager !== 'undefined' && (tournamentFormat === 'knockout-only' || tournamentFormat === 'pools-knockout')) {
                KnockoutManager.initBracket();
            }
            
            // Sauvegarder la configuration
            TournamentData.saveToLocalStorage();
            
            // Basculer l'affichage de manière cohérente (une seule méthode)
            document.getElementById('configuration-wizard').classList.add('hidden');
            document.getElementById('main-interface').classList.remove('hidden');
            
            // Mettre à jour l'interface
            if (typeof UI !== 'undefined') {
                UI.updateDashboard();
                UI.showAlert('Configuration terminée avec succès! Vous pouvez maintenant gérer votre tournoi.', 'success');
            } else {
                console.warn("Le module UI n'est pas défini, impossible de mettre à jour l'interface");
            }
            
        } catch (error) {
            console.error("Erreur dans finishWizard():", error);
            alert("Erreur dans la finalisation de la configuration. Veuillez vérifier la console pour plus de détails.");
        }
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
        document.getElementById('wizard-step-4').classList.add('hidden'); 
        
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
        resetTournament,
        // Exposer pour le débogage
        finishWizard
    };
})();




