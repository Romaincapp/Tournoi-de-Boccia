/**
 * Gestion des poules
 */
const PoolsManager = (function() {
    /**
     * Crée les poules selon la configuration
     */
    function createPools() {
        const tournament = TournamentData.getTournament();
        
        if (tournament.info.format === 'knockout-only') {
            return; // Pas de poules en mode élimination directe uniquement
        }
        
        tournament.pools = [];
        
        for (let i = 1; i <= tournament.config.numPools; i++) {
            tournament.pools.push({
                id: i,
                name: `Poule ${i}`,
                teams: []
            });
        }
        
        TournamentData.saveToLocalStorage();
        renderPools();
    }

    /**
     * Affiche les poules dans l'interface
     */
    function renderPools() {
        const poolsContainer = document.getElementById('pools-container');
        const tournament = TournamentData.getTournament();
        
        poolsContainer.innerHTML = '';
        
        if (tournament.pools.length === 0) {
            poolsContainer.innerHTML = '<p>Aucune poule n\'a été créée.</p>';
            return;
        }
        
        tournament.pools.forEach(pool => {
            const poolCard = document.createElement('div');
            poolCard.className = 'pool-card';
            
            let teamsHtml = '';
            if (pool.teams.length === 0) {
                teamsHtml = '<p><em>Aucune équipe assignée</em></p>';
            } else {
                // Créer le tableau de classement
                const standings = calculatePoolStandings(pool.id);
                
                teamsHtml = `
                    <table>
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Équipe</th>
                                <th>J</th>
                                <th>G</th>
                                <th>P</th>
                                <th>Pts+</th>
                                <th>Pts-</th>
                                <th>Diff</th>
                                <th>Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${standings.map((team, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${team.name}</td>
                                    <td>${team.played}</td>
                                    <td>${team.wins}</td>
                                    <td>${team.losses}</td>
                                    <td>${team.pointsFor}</td>
                                    <td>${team.pointsAgainst}</td>
                                    <td>${team.pointsDiff}</td>
                                    <td><strong>${team.points}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
            
            poolCard.innerHTML = `
                <h3>${pool.name}</h3>
                ${teamsHtml}
            `;
            
            poolsContainer.appendChild(poolCard);
        });
    }

    /**
     * Assigne les équipes aux poules
     */
    function assignTeamsToPools() {
        const tournament = TournamentData.getTournament();
        
        if (tournament.info.format === 'knockout-only') {
            UI.showAlert('Pas de poules en mode élimination directe', 'warning');
            return;
        }
        
        const totalTeamsNeeded = tournament.config.numPools * tournament.config.teamsPerPool;
        
        if (tournament.teams.length < totalTeamsNeeded) {
            UI.showAlert(`Il manque des équipes. ${totalTeamsNeeded} équipes sont nécessaires, mais seulement ${tournament.teams.length} sont inscrites.`, 'warning');
            return;
        }
        
        // Réinitialiser l'assignation des équipes
        tournament.teams.forEach(team => {
            team.pool = null;
        });
        
        tournament.pools.forEach(pool => {
            pool.teams = [];
        });
        
        // Faire une copie des équipes et les mélanger
        const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);
        
        // Assigner les équipes aux poules
        for (let i = 0; i < totalTeamsNeeded; i++) {
            const poolIndex = i % tournament.config.numPools;
            const team = shuffledTeams[i];
            
            tournament.pools[poolIndex].teams.push(team.name);
            team.pool = tournament.pools[poolIndex].name;
        }
        
        TournamentData.saveToLocalStorage();
        TeamsManager.renderTeams();
        renderPools();
        UI.showAlert('Les équipes ont été assignées aux poules avec succès');
    }

    /**
     * Calcule le classement d'une poule
     * @param {number} poolId - ID de la poule
     * @returns {Array} Tableau des équipes triées selon le classement
     */
    function calculatePoolStandings(poolId) {
        const tournament = TournamentData.getTournament();
        const pool = tournament.pools.find(p => p.id === poolId);
        
        if (!pool) return [];
        
        // Initialiser les statistiques de chaque équipe
        const standings = pool.teams.map(teamName => {
            return {
                name: teamName,
                played: 0,
                wins: 0,
                losses: 0,
                pointsFor: 0,
                pointsAgainst: 0,
                pointsDiff: 0,
                points: 0
            };
        });
        
        // Calculer les statistiques à partir des matchs
        tournament.matches
            .filter(match => match.pool === poolId && match.played)
            .forEach(match => {
                // Trouver les équipes dans le classement
                const team1 = standings.find(team => team.name === match.team1);
                const team2 = standings.find(team => team.name === match.team2);
                
                if (!team1 || !team2) return;
                
                // Mettre à jour les statistiques
                team1.played++;
                team2.played++;
                
                team1.pointsFor += match.score1;
                team1.pointsAgainst += match.score2;
                team2.pointsFor += match.score2;
                team2.pointsAgainst += match.score1;
                
                // Déterminer le gagnant
                if (match.forfeit) {
                    // En cas de forfait
                    if (match.forfeit === '1') {
                        team2.wins++;
                        team1.losses++;
                        team2.points += 3; // Victoire
                        team1.points += 0; // Forfait
                    } else {
                        team1.wins++;
                        team2.losses++;
                        team1.points += 3; // Victoire
                        team2.points += 0; // Forfait
                    }
                } else {
                    // Match normal
                    if (match.score1 > match.score2) {
                        team1.wins++;
                        team2.losses++;
                        team1.points += 3; // Victoire
                        team2.points += 1; // Défaite
                    } else if (match.score1 < match.score2) {
                        team2.wins++;
                        team1.losses++;
                        team2.points += 3; // Victoire
                        team1.points += 1; // Défaite
                    } else {
                        // En cas d'égalité (ne devrait pas arriver en boccia)
                        team1.points += 2;
                        team2.points += 2;
                    }
                }
            });
        
        // Calculer la différence de points
        standings.forEach(team => {
            team.pointsDiff = team.pointsFor - team.pointsAgainst;
        });
        
        // Trier selon les critères de classement
        standings.sort((a, b) => {
            // 1. Total des points
            if (b.points !== a.points) return b.points - a.points;
            
            // 2. Nombre de matchs gagnés
            if (b.wins !== a.wins) return b.wins - a.wins;
            
            // 3. Différence de points
            if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
            
            // 4. Total des points marqués
            if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
            
            // 5. Par ordre alphabétique si tout est égal
            return a.name.localeCompare(b.name);
        });
        
        return standings;
    }

    /**
     * Initialise les écouteurs d'événements pour la gestion des poules
     */
    function initEventListeners() {
        // Générer les matchs
        document.getElementById('generate-matches-btn').addEventListener('click', function() {
            MatchesManager.generateMatches();
        });
    }

    // API publique
    return {
        createPools,
        renderPools,
        assignTeamsToPools,
        calculatePoolStandings,
        initEventListeners
    };
})();
