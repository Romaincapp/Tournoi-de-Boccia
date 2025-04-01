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
 * Affiche les matchs dans l'interface avec un regroupement amélioré
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

    // Ajouter un système de navigation par journées et poules
    const tabNav = document.createElement('div');
    tabNav.className = 'matches-navigation';
    tabNav.innerHTML = `
        <div class="matches-filter-bar">
            <div class="filter-group">
                <label for="match-filter-day">Journée:</label>
                <select id="match-filter-day" class="match-filter-select">
                    <option value="all">Toutes les journées</option>
                    ${generateDayOptions(tournament)}
                </select>
            </div>
            <div class="filter-group">
                <label for="match-filter-pool">Poule:</label>
                <select id="match-filter-pool" class="match-filter-select">
                    <option value="all">Toutes les poules</option>
                    ${tournament.pools.map(pool => 
                        `<option value="${pool.id}">${pool.name}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label for="match-filter-status">Statut:</label>
                <select id="match-filter-status" class="match-filter-select">
                    <option value="all">Tous les matchs</option>
                    <option value="pending">Matchs à jouer</option>
                    <option value="played">Matchs joués</option>
                    <option value="forfeit">Forfaits</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="match-filter-team">Équipe:</label>
                <select id="match-filter-team" class="match-filter-select">
                    <option value="all">Toutes les équipes</option>
                    ${tournament.teams.map(team => 
                        `<option value="${team.name}">${team.name}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <button id="clear-match-filters" class="btn btn-sm">Réinitialiser les filtres</button>
    `;
    
    matchesContainer.appendChild(tabNav);

    // Conteneur pour les matchs filtrés
    const matchesContent = document.createElement('div');
    matchesContent.id = 'matches-display-container';
    matchesContent.className = 'matches-display-container';
    matchesContainer.appendChild(matchesContent);
    
    // Afficher tous les matchs par défaut
    renderFilteredMatches('all', 'all', 'all', 'all');
    
    // Ajouter les écouteurs d'événements pour les filtres
    document.getElementById('match-filter-day').addEventListener('change', updateMatchFilters);
    document.getElementById('match-filter-pool').addEventListener('change', updateMatchFilters);
    document.getElementById('match-filter-status').addEventListener('change', updateMatchFilters);
    document.getElementById('match-filter-team').addEventListener('change', updateMatchFilters);
    document.getElementById('clear-match-filters').addEventListener('click', clearMatchFilters);
    
    // Afficher ou masquer le bouton de finalisation
    const allMatchesPlayed = tournament.matches.every(match => match.played);
    document.getElementById('finalize-pools').classList.toggle('hidden', !allMatchesPlayed || tournament.info.format === 'pools-only');
}

/**
 * Génère les options pour les journées de match
 * @param {Object} tournament - Données du tournoi
 * @returns {string} HTML des options
 */
function generateDayOptions(tournament) {
    // Déterminer le nombre de journées selon les matchs
    const matchesPerDay = 10; // Valeur arbitraire, configurable
    const totalDays = Math.ceil(tournament.matches.length / matchesPerDay);
    
    let options = '';
    for (let i = 1; i <= totalDays; i++) {
        options += `<option value="day${i}">Journée ${i}</option>`;
    }
    
    return options;
}

/**
 * Met à jour l'affichage des matchs selon les filtres sélectionnés
 */
function updateMatchFilters() {
    const dayFilter = document.getElementById('match-filter-day').value;
    const poolFilter = document.getElementById('match-filter-pool').value;
    const statusFilter = document.getElementById('match-filter-status').value;
    const teamFilter = document.getElementById('match-filter-team').value;
    
    renderFilteredMatches(dayFilter, poolFilter, statusFilter, teamFilter);
}

/**
 * Réinitialise tous les filtres
 */
function clearMatchFilters() {
    document.getElementById('match-filter-day').value = 'all';
    document.getElementById('match-filter-pool').value = 'all';
    document.getElementById('match-filter-status').value = 'all';
    document.getElementById('match-filter-team').value = 'all';
    
    renderFilteredMatches('all', 'all', 'all', 'all');
}

/**
 * Affiche les matchs filtrés selon les critères sélectionnés
 * @param {string} dayFilter - Filtre par journée
 * @param {string} poolFilter - Filtre par poule
 * @param {string} statusFilter - Filtre par statut
 * @param {string} teamFilter - Filtre par équipe
 */
function renderFilteredMatches(dayFilter, poolFilter, statusFilter, teamFilter) {
    const matchesContent = document.getElementById('matches-display-container');
    const tournament = TournamentData.getTournament();
    
    matchesContent.innerHTML = '';
    
    // Filtrer les matchs selon les critères
    let filteredMatches = [...tournament.matches];
    
    // Filtre par journée
    if (dayFilter !== 'all') {
        const dayNumber = parseInt(dayFilter.replace('day', ''));
        const matchesPerDay = 10; // Doit correspondre à la valeur utilisée dans generateDayOptions
        const startIndex = (dayNumber - 1) * matchesPerDay;
        const endIndex = startIndex + matchesPerDay;
        filteredMatches = filteredMatches.slice(startIndex, endIndex);
    }
    
    // Filtre par poule
    if (poolFilter !== 'all') {
        filteredMatches = filteredMatches.filter(match => match.pool == poolFilter);
    }
    
    // Filtre par statut
    if (statusFilter !== 'all') {
        switch (statusFilter) {
            case 'pending':
                filteredMatches = filteredMatches.filter(match => !match.played);
                break;
            case 'played':
                filteredMatches = filteredMatches.filter(match => match.played && !match.forfeit);
                break;
            case 'forfeit':
                filteredMatches = filteredMatches.filter(match => match.forfeit);
                break;
        }
    }
    
    // Filtre par équipe
    if (teamFilter !== 'all') {
        filteredMatches = filteredMatches.filter(match => 
            match.team1 === teamFilter || match.team2 === teamFilter
        );
    }
    
    // Si aucun match ne correspond aux filtres
    if (filteredMatches.length === 0) {
        matchesContent.innerHTML = '<p class="no-matches-message">Aucun match ne correspond aux critères sélectionnés.</p>';
        return;
    }
    
    // Regrouper les matchs par poule
    const matchesByPool = {};
    
    filteredMatches.forEach(match => {
        if (!matchesByPool[match.pool]) {
            matchesByPool[match.pool] = [];
        }
        matchesByPool[match.pool].push(match);
    });
    
    // Afficher les matchs par poule
    Object.keys(matchesByPool).forEach(poolId => {
        const poolName = tournament.pools.find(p => p.id == poolId)?.name || `Poule ${poolId}`;
        
        const poolDiv = document.createElement('div');
        poolDiv.className = 'card matches-pool-card';
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
                    <div class="match-team ${match.team1 === teamFilter ? 'highlighted-team' : ''}">
                        <span>${match.team1}</span>
                    </div>
                    
                    <input type="number" class="match-score" id="score1-${match.id}" 
                        value="${match.score1 !== null ? match.score1 : ''}" 
                        ${match.played ? '' : 'placeholder="..."'}>
                    
                    <div class="match-vs">VS</div>
                    
                    <input type="number" class="match-score" id="score2-${match.id}" 
                        value="${match.score2 !== null ? match.score2 : ''}" 
                        ${match.played ? '' : 'placeholder="..."'}>
                    
                    <div class="match-team ${match.team2 === teamFilter ? 'highlighted-team' : ''}">
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
        matchesContent.appendChild(poolDiv);
    });
    
    // Réattacher les écouteurs d'événements
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
