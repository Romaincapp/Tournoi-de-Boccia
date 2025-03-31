/**
 * Gestion des matchs
 */
const MatchesManager = (function() {
    /**
     * Génère les matchs de poules
     */
    function generateMatches() {
        const tournament = TournamentData.getTournament();
        
        if (tournament.info.format === 'knockout-only') {
            KnockoutManager.generateKnockoutMatches(tournament.teams.map(team => team.name));
            UI.showTab('knockout');
            return;
        }
        
        // Vérifier si toutes les poules ont des équipes
        const poolsWithoutTeams = tournament.pools.some(pool => pool.teams.length === 0);
        
        if (poolsWithoutTeams) {
            UI.showAlert('Certaines poules n\'ont pas d\'équipes assignées', 'warning');
            return;
        }
        
        // Réinitialiser les matchs
        tournament.matches = [];
        
        // Générer les matchs pour chaque poule
        tournament.pools.forEach(pool => {
            const teams = pool.teams;
            const matchesPerTeam = tournament.config.matchesPerTeam;
            
            if (matchesPerTeam >= teams.length - 1) {
                // Si on veut que chaque équipe joue contre toutes les autres
                for (let i = 0; i < teams.length; i++) {
                    for (let j = i + 1; j < teams.length; j++) {
                        tournament.matches.push({
                            id: Date.now() + Math.random().toString(36).substr(2, 9),
                            pool: pool.id,
                            team1: teams[i],
                            team2: teams[j],
                            score1: null,
                            score2: null,
                            played: false,
                            forfeit: null
                        });
                    }
                }
            } else {
                // Si on veut un nombre spécifique de matchs par équipe
                // On utilise un algorithme pour équilibrer les rencontres
                
                // Matrice pour suivre quelles équipes ont déjà joué ensemble
                const matchMatrix = Array(teams.length).fill().map(() => Array(teams.length).fill(0));
                // Tableau pour suivre combien de matchs chaque équipe a joué
                const matchesPlayed = Array(teams.length).fill(0);
                
                // Fonction pour vérifier si toutes les équipes ont atteint leur quota de matchs
                const allTeamsReachedQuota = () => matchesPlayed.every(count => count >= matchesPerTeam);
                
                // Continuer à générer des matchs jusqu'à ce que chaque équipe ait joué son quota
                // ou qu'il ne soit plus possible d'ajouter de matchs
                let attempts = 0;
                const maxAttempts = 1000; // Éviter une boucle infinie
                
                while (!allTeamsReachedQuota() && attempts < maxAttempts) {
                    attempts++;
                    
                    // Trouver l'équipe qui a joué le moins de matchs
                    let teamIndex = matchesPlayed.indexOf(Math.min(...matchesPlayed));
                    
                    // Si cette équipe a déjà atteint son quota, passer à la suivante
                    if (matchesPlayed[teamIndex] >= matchesPerTeam) {
                        continue;
                    }
                    
                    // Trouver un adversaire pour cette équipe
                    // Préférer les équipes qui ont joué moins de matchs et contre qui elle n'a pas encore joué
                    let opponents = [];
                    
                    for (let i = 0; i < teams.length; i++) {
                        if (i !== teamIndex && matchesPlayed[i] < matchesPerTeam && matchMatrix[teamIndex][i] === 0) {
                            opponents.push({
                                index: i,
                                matchesPlayed: matchesPlayed[i]
                            });
                        }
                    }
                    
                    // Trier les adversaires potentiels par nombre de matchs joués
                    opponents.sort((a, b) => a.matchesPlayed - b.matchesPlayed);
                    
                    if (opponents.length > 0) {
                        const opponentIndex = opponents[0].index;
                        
                        // Ajouter le match
                        tournament.matches.push({
                            id: Date.now() + Math.random().toString(36).substr(2, 9),
                            pool: pool.id,
                            team1: teams[teamIndex],
                            team2: teams[opponentIndex],
                            score1: null,
                            score2: null,
                            played: false,
                            forfeit: null
                        });
                        
                        // Mettre à jour la matrice et le compteur
                        matchMatrix[teamIndex][opponentIndex] = 1;
                        matchMatrix[opponentIndex][teamIndex] = 1;
                        matchesPlayed[teamIndex]++;
                        matchesPlayed[opponentIndex]++;
                    } else {
                        // S'il n'y a pas d'adversaire disponible qui n'a pas déjà joué contre cette équipe,
                        // essayer avec des équipes contre lesquelles elle a déjà joué
                        opponents = [];
                        
                        for (let i = 0; i < teams.length; i++) {
                            if (i !== teamIndex && matchesPlayed[i] < matchesPerTeam) {
                                opponents.push({
                                    index: i,
                                    matchesPlayed: matchesPlayed[i]
                                });
                            }
                        }
                        
                        opponents.sort((a, b) => a.matchesPlayed - b.matchesPlayed);
                        
                        if (opponents.length > 0) {
                            const opponentIndex = opponents[0].index;
                            
                            // Ajouter le match
                            tournament.matches.push({
                                id: Date.now() + Math.random().toString(36).substr(2, 9),
                                pool: pool.id,
                                team1: teams[teamIndex],
                                team2: teams[opponentIndex],
                                score1: null,
                                score2: null,
                                played: false,
                                forfeit: null
                            });
                            
                            matchesPlayed[teamIndex]++;
                            matchesPlayed[opponentIndex]++;
                        }
                    }
                }
                
                // Vérifier si on a réussi à générer suffisamment de matchs
                if (attempts >= maxAttempts) {
                    UI.showAlert('Impossible de générer exactement ' + matchesPerTeam + ' matchs par équipe. Certaines équipes joueront plus ou moins de matchs.', 'warning');
                }
            }
        });
        
        TournamentData.saveToLocalStorage();
        renderMatches();
        UI.showTab('matches');
        UI.showAlert('Les matchs ont été générés avec succès');
    }

    /**
     * Affiche les matchs dans l'interface
     */
    function renderMatches() {
        const matchesContainer = document.getElementById('matches-container');
        const tournament = TournamentData.getTournament();
        
        matchesContainer.innerHTML = '';
        
        if (tournament.matches.length === 0) {
            matchesContainer.innerHTML = '<p>Aucun match n\'a été généré.</p>';
            document.getElementById('finalize-pools').classList.add('hidden');
            return;
        }
        
        // Regrouper les matchs par poule
        const matchesByPool = {};
        
        tournament.matches.forEach(match => {
            if (!matchesByPool[match.pool]) {
                matchesByPool[match.pool] = [];
            }
            matchesByPool[match.pool].push(match);
        });
        
        // Afficher les matchs par poule
        Object.keys(matchesByPool).forEach(poolId => {
            const poolName = tournament.pools.find(p => p.id == poolId)?.name || `Poule ${poolId}`;
            
            const poolDiv = document.createElement('div');
            poolDiv.className = 'card';
            poolDiv.innerHTML = `<h3>${poolName}</h3>`;
            
            const matchesList = document.createElement('div');
            matchesList.className = 'matches-list';
            
            matchesByPool[poolId].forEach(match => {
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                
                let statusClass = match.played ? 'match-played' : 'match-pending';
                if (match.forfeit) statusClass = 'match-forfeit';
                
                matchCard.innerHTML = `
                    <div class="match-result ${statusClass}">
                        <div class="match-team">
                            <span>${match.team1}</span>
                        </div>
                        
                        <input type="number" class="match-score" id="score1-${match.id}" 
                            value="${match.score1 !== null ? match.score1 : ''}" 
                            ${match.played ? '' : 'placeholder="..."'}>
                        
                        <div class="match-vs">VS</div>
                        
                        <input type="number" class="match-score" id="score2-${match.id}" 
                            value="${match.score2 !== null ? match.score2 : ''}" 
                            ${match.played ? '' : 'placeholder="..."'}>
                        
                        <div class="match-team">
                            <span>${match.team2}</span>
                        </div>
                    </div>
                    
                    <div class="match-actions">
                        ${!match.played ? 
                            `<button class="btn btn-success save-match-btn" data-match-id="${match.id}">Enregistrer</button>
                            <button class="btn btn-warning forfeit-match-btn" data-match-id="${match.id}">Forfait</button>` :
                            `<button class="btn edit-match-btn" data-match-id="${match.id}">Modifier</button>`
                        }
                    </div>
                `;
                
                matchesList.appendChild(matchCard);
            });
            
            poolDiv.appendChild(matchesList);
            matchesContainer.appendChild(poolDiv);
        });
        
        // Ajouter les écouteurs d'événements
        document.querySelectorAll('.save-match-btn').forEach(button => {
            button.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                saveMatchResult(matchId);
            });
        });
        
        document.querySelectorAll('.forfeit-match-btn').forEach(button => {
            button.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                setMatchForfeit(matchId);
            });
        });
        
        document.querySelectorAll('.edit-match-btn').forEach(button => {
            button.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                editMatchResult(matchId);
            });
        });
        
        // Afficher le bouton de finalisation si tous les matchs sont joués
        const allMatchesPlayed = tournament.matches.every(match => match.played);
        document.getElementById('finalize-pools').classList.toggle('hidden', !allMatchesPlayed || tournament.info.format === 'pools-only');
    }

    /**
     * Enregistre le résultat d'un match
     * @param {string} matchId - ID du match
     */
    function saveMatchResult(matchId) {
        const tournament = TournamentData.getTournament();
        const match = tournament.matches.find(m => m.id === matchId);
        
        if (!match) return;
        
        const score1 = parseInt(document.getElementById(`score1-${matchId}`).value);
        const score2 = parseInt(document.getElementById(`score2-${matchId}`).value);
        
        if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
            UI.showAlert('Veuillez entrer des scores valides', 'warning');
            return;
        }
        
        match.score1 = score1;
        match.score2 = score2;
        match.played = true;
        match.forfeit = null;
        
        TournamentData.saveToLocalStorage();
        renderMatches();
        PoolsManager.renderPools();
        UI.updateDashboard();
        
        UI.showAlert('Le résultat du match a été enregistré avec succès');
    }

    /**
     * Permet de modifier un résultat déjà enregistré
     * @param {string} matchId - ID du match
     */
    function editMatchResult(matchId) {
        const tournament = TournamentData.getTournament();
        const match = tournament.matches.find(m => m.id === matchId);
        
        if (!match) return;
        
        match.played = false;
        
        TournamentData.saveToLocalStorage();
        renderMatches();
        PoolsManager.renderPools();
        UI.updateDashboard();
    }

    /**
     * Enregistre un forfait
     * @param {string} matchId - ID du match
     */
    function setMatchForfeit(matchId) {
        const tournament = TournamentData.getTournament();
        const match = tournament.matches.find(m => m.id === matchId);
        
        if (!match) return;
        
        const team = prompt(`Quelle équipe déclare forfait?\n1: ${match.team1}\n2: ${match.team2}`);
        
        if (team !== '1' && team !== '2') {
            UI.showAlert('Veuillez entrer 1 ou 2', 'warning');
            return;
        }
        
        match.forfeit = team;
        match.played = true;
        
        if (team === '1') {
            match.score1 = 0;
            match.score2 = 20; // Score arbitraire pour le vainqueur par forfait
        } else {
            match.score1 = 20; // Score arbitraire pour le vainqueur par forfait
            match.score2 = 0;
        }
        
        TournamentData.saveToLocalStorage();
        renderMatches();
        PoolsManager.renderPools();
        UI.updateDashboard();
        
        UI.showAlert(`Forfait enregistré pour ${team === '1' ? match.team1 : match.team2}`);
    }

    /**
     * Finalise la phase de poules et crée la phase finale
     */
    function finalizePoolStage() {
        const tournament = TournamentData.getTournament();
        
        if (tournament.info.format !== 'pools-knockout') {
            return;
        }
        
        // Vérifier si tous les matchs des poules sont joués
        const allMatchesPlayed = tournament.matches.every(match => match.played);
        
        if (!allMatchesPlayed) {
            UI.showAlert('Tous les matchs des poules doivent être joués', 'warning');
            return;
        }
        
        // Déterminer les équipes qualifiées
        const qualifiedTeams = [];
        
        tournament.pools.forEach(pool => {
            const standings = PoolsManager.calculatePoolStandings(pool.id);
            const numTeamsToQualify = tournament.config.teamsQualifying;
            
            // Ajouter les équipes qualifiées
            for (let i = 0; i < Math.min(numTeamsToQualify, standings.length); i++) {
                qualifiedTeams.push({
                    name: standings[i].name,
                    pool: pool.id,
                    rank: i + 1
                });
            }
        });
        
        // Vérifier si le nombre d'équipes est une puissance de 2
        if (!TournamentData.isPowerOfTwo(qualifiedTeams.length)) {
            UI.showAlert(`Le nombre d'équipes qualifiées (${qualifiedTeams.length}) n'est pas une puissance de 2. Ajustez la configuration.`, 'warning');
            return;
        }
        
        // Trier les équipes pour les appariements
        const sortedTeams = KnockoutManager.sortTeamsForKnockout(qualifiedTeams);
        
        // Générer les matchs de la phase finale
        KnockoutManager.generateKnockoutMatches(sortedTeams.map(team => team.name));
        
        TournamentData.saveToLocalStorage();
        UI.showTab('knockout');
        UI.showAlert('Phase finale créée avec succès');
    }

    /**
     * Initialise les écouteurs d'événements pour la gestion des matchs
     */
    function initEventListeners() {
        // Finaliser les poules
        document.getElementById('finalize-pools-btn').addEventListener('click', function() {
            finalizePoolStage();
        });
    }

    // API publique
    return {
        generateMatches,
        renderMatches,
        saveMatchResult,
        editMatchResult,
        setMatchForfeit,
        finalizePoolStage,
        initEventListeners
    };
})();
