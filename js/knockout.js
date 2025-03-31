/**
 * Gestion de la phase finale à élimination directe
 */
const KnockoutManager = (function() {
    /**
     * Trie les équipes pour la phase finale
     * @param {Array} teams - Liste des équipes qualifiées
     * @returns {Array} Liste des équipes triées
     */
    function sortTeamsForKnockout(teams) {
        // Cette fonction organise les équipes pour la phase à élimination directe
        // afin que les meilleures équipes ne se rencontrent pas trop tôt
        // Pour un tableau de 8 équipes, l'ordre serait: 1, 8, 4, 5, 2, 7, 3, 6
        
        // Trier d'abord par classement
        teams.sort((a, b) => {
            if (a.rank !== b.rank) return a.rank - b.rank;
            return a.pool - b.pool;
        });
        
        const numTeams = teams.length;
        const sortedTeams = new Array(numTeams);
        
        // Placer les équipes dans le tableau selon l'algorithme de "seeding"
        if (TournamentData.isPowerOfTwo(numTeams)) {
            // Algorithme pour un nombre d'équipes qui est une puissance de 2
            for (let i = 0; i < numTeams; i++) {
                // Calculer la position dans le tableau final selon la méthode standard de "seeding"
                // Cette formule place les équipes de manière à ce que les meilleures ne se rencontrent
                // que le plus tard possible dans le tournoi
                let pos = 0;
                let s = 1;
                let j = i + 1;
                
                while (j > 0) {
                    pos = pos * 2 + (j % 2);
                    j = Math.floor(j / 2);
                    s *= 2;
                }
                
                sortedTeams[pos] = teams[i];
            }
            
            return sortedTeams;
        } else {
            // Si le nombre d'équipes n'est pas une puissance de 2, utiliser un tri simple
            return teams;
        }
    }

    /**
     * Génère les matchs de la phase finale
     * @param {Array} teams - Liste des équipes
     */
    function generateKnockoutMatches(teams) {
        const tournament = TournamentData.getTournament();
        
        // Réinitialiser la phase finale
        tournament.knockout = {
            rounds: [],
            matches: []
        };
        
        // Déterminer le nombre de tours
        const numTeams = teams.length;
        const numRounds = Math.log2(numTeams);
        
        // Créer les tours
        for (let i = 0; i < numRounds; i++) {
            const roundName = i === numRounds - 1 ? 'Finale' : 
                             i === numRounds - 2 ? 'Demi-finales' :
                             i === numRounds - 3 ? 'Quarts de finale' :
                             `Tour ${numRounds - i}`;
            
            tournament.knockout.rounds.push({
                id: i + 1,
                name: roundName,
                numMatches: Math.pow(2, numRounds - i - 1)
            });
        }
        
        // Créer les matchs du premier tour
        const firstRound = tournament.knockout.rounds[0];
        
        for (let i = 0; i < firstRound.numMatches; i++) {
            const matchId = Date.now() + Math.random().toString(36).substr(2, 9) + i;
            
            tournament.knockout.matches.push({
                id: matchId,
                round: firstRound.id,
                match: i + 1,
                team1: i < teams.length / 2 ? teams[i] : null,
                team2: i < teams.length / 2 ? teams[teams.length - 1 - i] : null,
                score1: null,
                score2: null,
                played: false,
                nextMatchId: null
            });
        }
        
        // Créer les matchs des tours suivants (vides)
        for (let r = 1; r < tournament.knockout.rounds.length; r++) {
            const round = tournament.knockout.rounds[r];
            const prevRound = tournament.knockout.rounds[r - 1];
            
            for (let i = 0; i < round.numMatches; i++) {
                const matchId = Date.now() + Math.random().toString(36).substr(2, 9) + r + i;
                
                // Trouver les matchs précédents qui alimentent ce match
                const prevMatch1 = tournament.knockout.matches.find(m => 
                    m.round === prevRound.id && m.match === i * 2 + 1
                );
                
                const prevMatch2 = tournament.knockout.matches.find(m => 
                    m.round === prevRound.id && m.match === i * 2 + 2
                );
                
                // Mettre à jour les ID des matchs suivants
                if (prevMatch1) prevMatch1.nextMatchId = matchId;
                if (prevMatch2) prevMatch2.nextMatchId = matchId;
                
                tournament.knockout.matches.push({
                    id: matchId,
                    round: round.id,
                    match: i + 1,
                    team1: null,
                    team2: null,
                    score1: null,
                    score2: null,
                    played: false,
                    nextMatchId: null
                });
            }
        }
        
        renderKnockoutBracket();
    }

    /**
     * Affiche le tableau de la phase finale
     */
    function renderKnockoutBracket() {
        const bracketContainer = document.getElementById('bracket-container');
        const tournament = TournamentData.getTournament();
        
        bracketContainer.innerHTML = '';
        
        if (tournament.knockout.rounds.length === 0) {
            bracketContainer.innerHTML = '<p>La phase finale n\'a pas encore été générée.</p>';
            return;
        }
        
        // Créer un conteneur pour chaque tour
        tournament.knockout.rounds.forEach(round => {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'bracket-round';
            roundDiv.innerHTML = `<h3>${round.name}</h3>`;
            
            // Trouver les matchs de ce tour
            const roundMatches = tournament.knockout.matches
                .filter(match => match.round === round.id)
                .sort((a, b) => a.match - b.match);
            
            // Créer les matchs
            roundMatches.forEach(match => {
                const matchDiv = document.createElement('div');
                matchDiv.className = 'bracket-match';
                
                let team1 = match.team1 ? match.team1 : 'À déterminer';
                let team2 = match.team2 ? match.team2 : 'À déterminer';
                
                let statusClass = match.played ? 'match-played' : 'match-pending';
                
                matchDiv.innerHTML = `
                    <div class="match-result ${statusClass}">
                        <div class="match-team">
                            <span>${team1}</span>
                        </div>
                        
                        <input type="number" class="match-score" id="ko-score1-${match.id}" 
                            value="${match.score1 !== null ? match.score1 : ''}" 
                            ${match.played ? '' : 'placeholder="..."'}
                            ${(!match.team1 || !match.team2) ? 'disabled' : ''}>
                        
                        <div class="match-vs">VS</div>
                        
                        <input type="number" class="match-score" id="ko-score2-${match.id}" 
                            value="${match.score2 !== null ? match.score2 : ''}" 
                            ${match.played ? '' : 'placeholder="..."'}
                            ${(!match.team1 || !match.team2) ? 'disabled' : ''}>
                        
                        <div class="match-team">
                            <span>${team2}</span>
                        </div>
                    </div>
                    
                    ${(match.team1 && match.team2) ? 
                        `<div class="match-actions">
                            ${!match.played ? 
                                `<button class="btn btn-success ko-save-match-btn" data-match-id="${match.id}">Enregistrer</button>` :
                                `<button class="btn ko-edit-match-btn" data-match-id="${match.id}">Modifier</button>`
                            }
                        </div>` : 
                        ''
                    }
                `;
                
                roundDiv.appendChild(matchDiv);
            });
            
            bracketContainer.appendChild(roundDiv);
        });
        
        // Ajouter les écouteurs d'événements
        document.querySelectorAll('.ko-save-match-btn').forEach(button => {
            button.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                saveKnockoutResult(matchId);
            });
        });
        
        document.querySelectorAll('.ko-edit-match-btn').forEach(button => {
            button.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                editKnockoutResult(matchId);
            });
        });
    }

    /**
     * Enregistre le résultat d'un match de phase finale
     * @param {string} matchId - ID du match
     */
    function saveKnockoutResult(matchId) {
        const tournament = TournamentData.getTournament();
        const match = tournament.knockout.matches.find(m => m.id === matchId);
        
        if (!match || !match.team1 || !match.team2) return;
        
        const score1 = parseInt(document.getElementById(`ko-score1-${matchId}`).value);
        const score2 = parseInt(document.getElementById(`ko-score2-${matchId}`).value);
        
        if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
            UI.showAlert('Veuillez entrer des scores valides', 'warning');
            return;
        }
        
        // En boccia, on n'accepte pas les égalités en phase finale
        if (score1 === score2) {
            UI.showAlert('Le match ne peut pas se terminer par une égalité en phase finale', 'warning');
            return;
        }
        
        match.score1 = score1;
        match.score2 = score2;
        match.played = true;
        
        // Déterminer le vainqueur
        const winner = score1 > score2 ? match.team1 : match.team2;
        
        // Mettre à jour le prochain match si applicable
        if (match.nextMatchId) {
            const nextMatch = tournament.knockout.matches.find(m => m.id === match.nextMatchId);
            
            if (nextMatch) {
                // Trouver l'autre match qui alimente le prochain match
                const otherMatch = tournament.knockout.matches.find(m => 
                    m.nextMatchId === match.nextMatchId && m.id !== match.id
                );
                
                // Déterminer si le gagnant va en team1 ou team2 du prochain match
                if (otherMatch && otherMatch.match % 2 === 0 && match.match % 2 === 1) {
                    nextMatch.team1 = winner;
                } else if (otherMatch && otherMatch.match % 2 === 1 && match.match % 2 === 0) {
                    nextMatch.team2 = winner;
                } else {
                    // Si l'autre match n'existe pas encore ou cas particulier
                    if (!nextMatch.team1) {
                        nextMatch.team1 = winner;
                    } else {
                        nextMatch.team2 = winner;
                    }
                }
            }
        }
        
        TournamentData.saveToLocalStorage();
        renderKnockoutBracket();
        UI.updateDashboard();
        
        UI.showAlert('Le résultat du match a été enregistré avec succès');
    }

    /**
     * Permet de modifier un résultat de match de phase finale
     * @param {string} matchId - ID du match
     */
    function editKnockoutResult(matchId) {
        const tournament = TournamentData.getTournament();
        const match = tournament.knockout.matches.find(m => m.id === matchId);
        
        if (!match) return;
        
        // Vérifier si des matchs ultérieurs ont été joués
        const subsequentMatchesPlayed = hasSubsequentMatchesPlayed(match);
        
        if (subsequentMatchesPlayed) {
            UI.showAlert('Impossible de modifier ce match car des matchs ultérieurs ont déjà été joués', 'warning');
            return;
        }
        
        match.played = false;
        match.score1 = null;
        match.score2 = null;
        
        // Réinitialiser les équipes dans les matchs suivants
        if (match.nextMatchId) {
            const nextMatch = tournament.knockout.matches.find(m => m.id === match.nextMatchId);
            
            if (nextMatch) {
                // Déterminer quelle équipe réinitialiser
                const otherMatch = tournament.knockout.matches.find(m => 
                    m.nextMatchId === match.nextMatchId && m.id !== match.id
                );
                
                if (otherMatch && otherMatch.played) {
                    // Si l'autre match a été joué, déterminer quel côté réinitialiser
                    if (otherMatch.match % 2 === 0 && match.match % 2 === 1) {
                        nextMatch.team1 = null;
                    } else if (otherMatch.match % 2 === 1 && match.match % 2 === 0) {
                        nextMatch.team2 = null;
                    }
                } else {
                    // Si l'autre match n'a pas été joué, réinitialiser les deux côtés
                    nextMatch.team1 = null;
                    nextMatch.team2 = null;
                }
            }
        }
        
        TournamentData.saveToLocalStorage();
        renderKnockoutBracket();
        UI.updateDashboard();
    }

    /**
     * Vérifie si des matchs ultérieurs ont été joués
     * @param {Object} match - Match à vérifier
     * @returns {boolean}
     */
    function hasSubsequentMatchesPlayed(match) {
        if (!match.nextMatchId) return false;
        
        const tournament = TournamentData.getTournament();
        const nextMatch = tournament.knockout.matches.find(m => m.id === match.nextMatchId);
        
        if (!nextMatch) return false;
        
        return nextMatch.played || hasSubsequentMatchesPlayed(nextMatch);
    }

    /**
     * Initialise les écouteurs d'événements pour la phase finale
     */
    function initEventListeners() {
        // Aucun écouteur spécifique à initialiser pour l'instant
        // Les écouteurs sont ajoutés dynamiquement lors du rendu du bracket
    }

    // API publique
    return {
        sortTeamsForKnockout,
        generateKnockoutMatches,
        renderKnockoutBracket,
        saveKnockoutResult,
        editKnockoutResult,
        initEventListeners
    };
})();
