/**
 * Gestion du classement général du tournoi
 */
const RankingManager = (function() {
    /**
     * Calcule le classement général du tournoi
     * @returns {Array} Tableau des équipes triées selon le classement général
     */
    function calculateOverallRanking() {
        const tournament = TournamentData.getTournament();
        
        // Si aucune équipe, retourner un tableau vide
        if (tournament.teams.length === 0) {
            return [];
        }
        
        // Si la phase finale est terminée, le classement est déterminé par celle-ci
        if (tournament.info.format !== 'pools-only' && 
            tournament.knockout.rounds.length > 0 && 
            isKnockoutComplete()) {
            return calculateKnockoutRanking();
        }
        
        // Sinon, on utilise les classements des poules
        return calculatePoolsRanking();
    }
    
    /**
     * Vérifie si la phase finale est complète
     * @returns {boolean}
     */
    function isKnockoutComplete() {
        const tournament = TournamentData.getTournament();
        // Vérifier si tous les matchs de phase finale ont été joués
        return tournament.knockout.matches.every(match => match.played || (!match.team1 || !match.team2));
    }
    
    /**
     * Calcule le classement à partir des résultats de phase finale
     * @returns {Array} Classement des équipes
     */
    function calculateKnockoutRanking() {
        const tournament = TournamentData.getTournament();
        const ranking = [];
        
        // Trouver la finale (dernier round)
        const lastRound = tournament.knockout.rounds[tournament.knockout.rounds.length - 1];
        if (!lastRound) return calculatePoolsRanking();
        
        // Trouver le match de finale
        const finalMatch = tournament.knockout.matches.find(m => m.round === lastRound.id);
        if (!finalMatch || !finalMatch.played) return calculatePoolsRanking();
        
        // Déterminer le vainqueur et le finaliste
        const winner = finalMatch.score1 > finalMatch.score2 ? finalMatch.team1 : finalMatch.team2;
        const finalist = finalMatch.score1 > finalMatch.score2 ? finalMatch.team2 : finalMatch.team1;
        
        // Ajouter le vainqueur et le finaliste au classement
        ranking.push({
            name: winner,
            rank: 1,
            status: 'Champion'
        });
        
        ranking.push({
            name: finalist,
            rank: 2,
            status: 'Finaliste'
        });
        
        // Si on a des demi-finales, ajouter les demi-finalistes
        if (tournament.knockout.rounds.length > 1) {
            const semiFinalRound = tournament.knockout.rounds[tournament.knockout.rounds.length - 2];
            const semiFinalMatches = tournament.knockout.matches.filter(m => m.round === semiFinalRound.id);
            
            // Trouver les équipes éliminées en demi-finale
            const semiFinalLosers = [];
            semiFinalMatches.forEach(match => {
                if (match.played) {
                    const loser = match.score1 > match.score2 ? match.team2 : match.team1;
                    semiFinalLosers.push(loser);
                }
            });
            
            // Ajouter les demi-finalistes (partage la 3ème place)
            semiFinalLosers.forEach(team => {
                ranking.push({
                    name: team,
                    rank: 3,
                    status: 'Demi-finaliste'
                });
            });
        }
        
        // Compléter le classement avec les autres équipes selon leur progression dans le tournoi
        let currentRank = ranking.length + 1;
        
        // Parcourir les rounds de la fin vers le début
        for (let r = tournament.knockout.rounds.length - 3; r >= 0; r--) {
            const round = tournament.knockout.rounds[r];
            const roundMatches = tournament.knockout.matches.filter(m => m.round === round.id);
            
            const losers = [];
            roundMatches.forEach(match => {
                if (match.played) {
                    const loser = match.score1 > match.score2 ? match.team2 : match.team1;
                    if (!ranking.some(item => item.name === loser)) {
                        losers.push(loser);
                    }
                }
            });
            
            // Ajouter les perdants de ce tour au classement
            losers.forEach(team => {
                ranking.push({
                    name: team,
                    rank: currentRank,
                    status: `Éliminé au ${round.name}`
                });
            });
            
            if (losers.length > 0) {
                currentRank += losers.length;
            }
        }
        
        // S'il reste des équipes qui n'ont pas participé à la phase finale,
        // les ajouter selon leur classement en poule
        const poolRanking = calculatePoolsRanking();
        
        poolRanking.forEach(team => {
            if (!ranking.some(item => item.name === team.name)) {
                ranking.push({
                    name: team.name,
                    rank: currentRank,
                    status: 'Non qualifié',
                    points: team.points,
                    pointsDiff: team.pointsDiff
                });
            }
        });
        
        return ranking;
    }
    
    /**
     * Calcule le classement à partir des résultats des poules
     * @returns {Array} Classement des équipes
     */
    function calculatePoolsRanking() {
        const tournament = TournamentData.getTournament();
        let allTeams = [];
        
        // Si on n'a pas de poules, classer simplement par ordre alphabétique
        if (tournament.pools.length === 0) {
            return tournament.teams.map((team, index) => ({
                name: team.name,
                rank: index + 1,
                status: 'Non classé',
                points: 0,
                pointsDiff: 0
            }));
        }
        
        // Récupérer les classements de toutes les poules
        tournament.pools.forEach(pool => {
            const standings = PoolsManager.calculatePoolStandings(pool.id);
            
            // Ajouter l'information de la poule
            standings.forEach(team => {
                team.pool = pool.id;
                team.poolName = pool.name;
            });
            
            allTeams = allTeams.concat(standings);
        });
        
        // Trier selon les critères de classement global
        allTeams.sort((a, b) => {
            // 1. Total des points
            if (b.points !== a.points) return b.points - a.points;
            
            // 2. Différence de points
            if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
            
            // 3. Total des points marqués
            if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
            
            // 4. Par ordre alphabétique si tout est égal
            return a.name.localeCompare(b.name);
        });
        
        // Assigner les rangs
        allTeams.forEach((team, index) => {
            team.rank = index + 1;
            team.status = `${team.poolName} - Position ${team.poolRank || 'N/A'}`;
        });
        
        return allTeams;
    }
    
    /**
     * Affiche le classement général dans l'interface
     */
    function renderOverallRanking() {
        const rankingContainer = document.getElementById('ranking-container');
        if (!rankingContainer) return;
        
        const ranking = calculateOverallRanking();
        
        rankingContainer.innerHTML = '';
        
        if (ranking.length === 0) {
            rankingContainer.innerHTML = '<p>Aucune équipe inscrite.</p>';
            return;
        }
        
        // Créer le tableau de classement
        const rankingTable = document.createElement('table');
        rankingTable.innerHTML = `
            <thead>
                <tr>
                    <th>Rang</th>
                    <th>Équipe</th>
                    <th>Statut</th>
                    <th>Points</th>
                    <th>Diff.</th>
                </tr>
            </thead>
            <tbody>
                ${ranking.map(team => `
                    <tr>
                        <td>${team.rank}</td>
                        <td>${team.name}</td>
                        <td>${team.status || 'N/A'}</td>
                        <td>${team.points !== undefined ? team.points : 'N/A'}</td>
                        <td>${team.pointsDiff !== undefined ? team.pointsDiff : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        rankingContainer.appendChild(rankingTable);
    }
    
    /**
     * Initialise les écouteurs d'événements pour le classement
     */
    function initEventListeners() {
        // Écouteur pour les mises à jour de données
        document.addEventListener('tournamentDataUpdated', function() {
            renderOverallRanking();
        });
    }
    
    // API publique
    return {
        calculateOverallRanking,
        renderOverallRanking,
        initEventListeners
    };
})();
