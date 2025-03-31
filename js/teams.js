/**
 * Gestion des équipes
 */
const TeamsManager = (function() {
    /**
     * Ajoute une nouvelle équipe
     * @param {string} teamName - Nom de l'équipe
     * @param {Array} players - Liste des joueurs
     * @returns {boolean} True si l'ajout a réussi, false sinon
     */
    function addTeam(teamName, players = []) {
        if (!teamName) {
            UI.showAlert('Veuillez entrer un nom d\'équipe', 'warning');
            return false;
        }
        
        const tournament = TournamentData.getTournament();
        
        // Vérifier si l'équipe existe déjà
        if (tournament.teams.some(team => team.name === teamName)) {
            UI.showAlert('Une équipe avec ce nom existe déjà', 'warning');
            return false;
        }
        
        const processedPlayers = Array.isArray(players) ? players : players.split('\n').filter(p => p.trim());
        
        const team = {
            id: Date.now().toString(),
            name: teamName,
            players: processedPlayers,
            pool: null
        };
        
        tournament.teams.push(team);
        TournamentData.saveToLocalStorage();
        
        renderTeams();
        UI.updateDashboard();
        
        UI.showAlert(`L'équipe ${teamName} a été ajoutée avec succès`);
        return true;
    }

    /**
     * Affiche les équipes dans l'interface
     */
    function renderTeams() {
        const teamsContainer = document.getElementById('teams-list');
        const tournament = TournamentData.getTournament();
        
        teamsContainer.innerHTML = '';
        
        if (tournament.teams.length === 0) {
            teamsContainer.innerHTML = '<p>Aucune équipe inscrite. Ajoutez des équipes pour commencer.</p>';
            return;
        }
        
        tournament.teams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            teamCard.innerHTML = `
                <h4>${team.name}</h4>
                ${team.pool ? `<p><strong>Poule:</strong> ${team.pool}</p>` : ''}
                ${team.players.length > 0 ? `
                    <p><strong>Joueurs:</strong></p>
                    <ul>
                        ${team.players.map(player => `<li>${player}</li>`).join('')}
                    </ul>
                ` : '<p><em>Aucun joueur enregistré</em></p>'}
                <div class="btn-group">
                    <button class="btn btn-warning edit-team-btn" data-team-id="${team.id}">Modifier</button>
                    <button class="btn btn-danger delete-team-btn" data-team-id="${team.id}">Supprimer</button>
                </div>
            `;
            
            teamsContainer.appendChild(teamCard);
        });
        
        // Ajouter les écouteurs d'événements pour les boutons d'édition et de suppression
        document.querySelectorAll('.edit-team-btn').forEach(button => {
            button.addEventListener('click', function() {
                const teamId = this.getAttribute('data-team-id');
                editTeam(teamId);
            });
        });
        
        document.querySelectorAll('.delete-team-btn').forEach(button => {
            button.addEventListener('click', function() {
                const teamId = this.getAttribute('data-team-id');
                deleteTeam(teamId);
            });
        });
    }

    /**
     * Affiche le formulaire d'édition d'une équipe
     * @param {string} teamId - ID de l'équipe à éditer
     */
    function editTeam(teamId) {
        const tournament = TournamentData.getTournament();
        const team = tournament.teams.find(t => t.id === teamId);
        
        if (!team) return;
        
        // Créer un formulaire de modification
        const editForm = document.createElement('div');
        editForm.className = 'card edit-form';
        editForm.innerHTML = `
            <h3>Modifier Équipe</h3>
            <div class="form-group">
                <label for="edit-team-name">Nom de l'Équipe</label>
                <input type="text" id="edit-team-name" value="${team.name}">
            </div>
            <div class="form-group">
                <label for="edit-team-players">Joueurs (un par ligne)</label>
                <textarea id="edit-team-players">${team.players.join('\n')}</textarea>
            </div>
            <button class="btn save-team-edit-btn" data-team-id="${teamId}">Enregistrer</button>
            <button class="btn btn-danger cancel-team-edit-btn">Annuler</button>
        `;
        
        // Ajouter le formulaire à la page
        const teamTab = document.getElementById('teams-tab');
        const existingForm = teamTab.querySelector('.edit-form');
        
        if (existingForm) {
            existingForm.remove();
        }
        
        teamTab.appendChild(editForm);
        
        // Ajouter les écouteurs d'événements
        document.querySelector('.save-team-edit-btn').addEventListener('click', function() {
            const teamId = this.getAttribute('data-team-id');
            saveTeamEdit(teamId);
        });
        
        document.querySelector('.cancel-team-edit-btn').addEventListener('click', cancelTeamEdit);
        
        // Faire défiler jusqu'au formulaire
        editForm.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Enregistre les modifications d'une équipe
     * @param {string} teamId - ID de l'équipe
     */
    function saveTeamEdit(teamId) {
        const tournament = TournamentData.getTournament();
        const team = tournament.teams.find(t => t.id === teamId);
        
        if (!team) return;
        
        const newName = document.getElementById('edit-team-name').value;
        const newPlayers = document.getElementById('edit-team-players').value;
        
        if (!newName) {
            UI.showAlert('Le nom de l\'équipe ne peut pas être vide', 'warning');
            return;
        }
        
        // Vérifier si le nouveau nom existe déjà (sauf si c'est le même)
        if (newName !== team.name && tournament.teams.some(t => t.name === newName)) {
            UI.showAlert('Une équipe avec ce nom existe déjà', 'warning');
            return;
        }
        
        // Mettre à jour les noms d'équipe dans les matchs si le nom a changé
        if (newName !== team.name) {
            // Mettre à jour les matchs de poule
            tournament.matches.forEach(match => {
                if (match.team1 === team.name) match.team1 = newName;
                if (match.team2 === team.name) match.team2 = newName;
            });
            
            // Mettre à jour les matchs de phase finale
            tournament.knockout.matches.forEach(match => {
                if (match.team1 === team.name) match.team1 = newName;
                if (match.team2 === team.name) match.team2 = newName;
            });
            
            // Mettre à jour les références dans les poules
            tournament.pools.forEach(pool => {
                const index = pool.teams.indexOf(team.name);
                if (index !== -1) {
                    pool.teams[index] = newName;
                }
            });
        }
        
        team.name = newName;
        team.players = newPlayers ? newPlayers.split('\n').filter(p => p.trim()) : [];
        
        TournamentData.saveToLocalStorage();
        renderTeams();
        document.querySelector('.edit-form').remove();
        
        UI.showAlert('Équipe modifiée avec succès');
    }

    /**
     * Annule l'édition d'une équipe
     */
    function cancelTeamEdit() {
        document.querySelector('.edit-form').remove();
    }

    /**
     * Supprime une équipe
     * @param {string} teamId - ID de l'équipe à supprimer
     */
    function deleteTeam(teamId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) return;
        
        const tournament = TournamentData.getTournament();
        const teamIndex = tournament.teams.findIndex(t => t.id === teamId);
        
        if (teamIndex === -1) return;
        
        const teamName = tournament.teams[teamIndex].name;
        
        // Supprimer l'équipe des matchs
        tournament.matches = tournament.matches.filter(match => 
            match.team1 !== teamName && match.team2 !== teamName
        );
        
        // Supprimer l'équipe des poules
        tournament.pools.forEach(pool => {
            const index = pool.teams.indexOf(teamName);
            if (index !== -1) {
                pool.teams.splice(index, 1);
            }
        });
        
        // Supprimer l'équipe de la phase finale
        tournament.knockout.matches.forEach(match => {
            if (match.team1 === teamName) match.team1 = null;
            if (match.team2 === teamName) match.team2 = null;
        });
        
        // Supprimer l'équipe
        tournament.teams.splice(teamIndex, 1);
        
        TournamentData.saveToLocalStorage();
        renderTeams();
        UI.updateDashboard();
        
        UI.showAlert(`L'équipe a été supprimée avec succès`);
    }

    /**
     * Importe des équipes depuis un fichier texte
     * @param {File} file - Fichier à importer
     */
    function importTeams(file) {
        if (!file) {
            UI.showAlert('Veuillez sélectionner un fichier', 'warning');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const content = e.target.result;
            const lines = content.split(/\r?\n/);
            
            let importCount = 0;
            let skippedCount = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const teamName = lines[i].trim();
                
                if (!teamName) continue; // Ignorer les lignes vides
                
                const result = addTeam(teamName, []);
                if (result) {
                    importCount++;
                } else {
                    skippedCount++;
                }
            }
            
            if (importCount > 0) {
                UI.showAlert(`${importCount} équipe(s) importée(s) avec succès${skippedCount > 0 ? `, ${skippedCount} équipe(s) ignorée(s) (déjà présentes)` : ''}`);
            } else {
                UI.showAlert('Aucune équipe n\'a été importée', 'warning');
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Initialise les écouteurs d'événements pour la gestion des équipes
     */
    function initEventListeners() {
        // Ajouter une équipe
        document.getElementById('add-team-btn').addEventListener('click', function() {
            const teamName = document.getElementById('team-name').value;
            const teamPlayers = document.getElementById('team-players').value;
            
            if (addTeam(teamName, teamPlayers)) {
                // Réinitialiser le formulaire
                document.getElementById('team-name').value = '';
                document.getElementById('team-players').value = '';
            }
        });
        
        // Import d'équipes
        document.getElementById('import-teams-btn').addEventListener('click', function() {
            const fileInput = document.getElementById('teams-import-file');
            importTeams(fileInput.files[0]);
            fileInput.value = ''; // Réinitialiser le champ de fichier
        });
        
        // Assignation des équipes aux poules
        document.getElementById('assign-teams-btn').addEventListener('click', function() {
            PoolsManager.assignTeamsToPools();
        });
    }

    // API publique
    return {
        addTeam,
        renderTeams,
        editTeam,
        deleteTeam,
        importTeams,
        initEventListeners
    };
})();
