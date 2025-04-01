
/**
 * Gestion de l'interface utilisateur
 */
const UI = (function() {
    /**
     * Affiche une alerte
     * @param {string} message - Message à afficher
     * @param {string} type - Type d'alerte (success, warning, danger, info)
     */
    function showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Supprimer automatiquement l'alerte après 3 secondes
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    /**
     * Bascule entre les onglets
     * @param {string} tabId - ID de l'onglet à afficher
     */
    function showTab(tabId) {
        // Désactiver tous les onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Activer l'onglet sélectionné
        document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }

    /**
     * Met à jour le tableau de bord avec les informations actuelles
     */
    function updateDashboard() {
        const tournament = TournamentData.getTournament();
        
        document.getElementById('dashboard-tournament-name').textContent = tournament.info.name;
        document.getElementById('dashboard-tournament-date').textContent = new Date(tournament.info.date).toLocaleDateString();
        document.getElementById('dashboard-tournament-location').textContent = tournament.info.location;
        
        let formatText = '';
        switch (tournament.info.format) {
            case 'pools-only':
                formatText = 'Poules uniquement';
                break;
            case 'knockout-only':
                formatText = 'Élimination directe uniquement';
                break;
            case 'pools-knockout':
                formatText = 'Poules suivies d\'élimination directe';
                break;
            default:
                formatText = 'Non spécifié';
        }
        
        document.getElementById('dashboard-tournament-format').textContent = formatText;
        document.getElementById('dashboard-teams-count').textContent = tournament.teams.length;
        document.getElementById('dashboard-pools-count').textContent = tournament.pools.length;
        
        const matchesPlayed = tournament.matches.filter(match => match.played).length + 
                               tournament.knockout.matches.filter(match => match.played).length;
        const totalMatches = tournament.matches.length + tournament.knockout.matches.length;
        
        document.getElementById('dashboard-matches-played').textContent = matchesPlayed;
        document.getElementById('dashboard-total-matches').textContent = totalMatches;
        
        // Masquer l'onglet de phase finale si non applicable
        if (tournament.info.format === 'pools-only') {
            document.getElementById('knockout-tab').style.display = 'none';
        } else {
            document.getElementById('knockout-tab').style.display = 'inline-block';
        }
    }

    /**
     * Change le thème de l'application
     * @param {string} theme - Nom du thème à appliquer
     */
    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        TournamentData.updateSettings({ theme });
    }

    /**
     * Initialise l'écouteur d'événements pour l'interface utilisateur
     */
    function initEventListeners() {
        // Gestion des onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                showTab(tabId);
            });
        });

        // Gestion des actions rapides
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                
                switch (action) {
                    case 'manage-teams':
                        showTab('teams');
                        break;
                    case 'view-matches':
                        showTab('matches');
                        break;
                    case 'export-tournament':
                        TournamentData.exportTournament();
                        break;
                    case 'print-tournament':
                        printTournament();
                        break;
                }
            });
        });

        // Changement de thème
        document.getElementById('theme-selector').addEventListener('change', function() {
            setTheme(this.value);
        });

        // Écouteur pour les mises à jour de données
        document.addEventListener('tournamentDataUpdated', function() {
            updateDashboard();
        });
    }

    /**
     * Imprime les feuilles de match et les classements
     */
    function printTournament() {
        // Créer une nouvelle fenêtre pour l'impression
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            showAlert('Veuillez autoriser les fenêtres popup pour cette fonctionnalité', 'warning');
            return;
        }
        
        const tournament = TournamentData.getTournament();
        
        // Générer le contenu HTML à imprimer
        let printContent = `
            <html>
            <head>
                <title>Tournoi de Boccia: ${tournament.info.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1, h2, h3 { margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .match-sheet { page-break-after: always; padding: 20px; border: 1px solid #ddd; margin-bottom: 20px; }
                    .match-teams { display: flex; justify-content: space-between; margin: 20px 0; }
                    .match-team { flex: 1; text-align: center; font-size: 20px; font-weight: bold; }
                    .match-score { display: flex; justify-content: space-around; margin-bottom: 20px; }
                    .score-box { border: 1px solid #000; width: 100px; height: 60px; display: inline-block; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
                    .signature { flex: 1; border-top: 1px solid #000; margin: 0 20px; text-align: center; padding-top: 5px; }
                    .pool-standings { margin-bottom: 30px; }
                    @media print {
                        .match-sheet { page-break-after: always; }
                    }
                </style>
            </head>
            <body>
                <h1>${tournament.info.name}</h1>
                <p><strong>Date:</strong> ${new Date(tournament.info.date).toLocaleDateString()}</p>
                <p><strong>Lieu:</strong> ${tournament.info.location}</p>
                <hr>
        `;
        
        // Ajouter les feuilles de match
        if (tournament.matches.length > 0) {
            printContent += '<h2>Feuilles de Match - Phase de Poules</h2>';
            
            tournament.matches.forEach((match, index) => {
                printContent += `
                    <div class="match-sheet">
                        <h3>Match #${index + 1} - Poule ${match.pool}</h3>
                        <p><strong>Date:</strong> ${new Date(tournament.info.date).toLocaleDateString()}</p>
                        <div class="match-teams">
                            <div class="match-team">${match.team1}</div>
                            <div style="font-size: 24px; font-weight: bold;">VS</div>
                            <div class="match-team">${match.team2}</div>
                        </div>
                        <div class="match-score">
                            <div class="score-box"></div>
                            <div class="score-box"></div>
                        </div>
                        <div class="signatures">
                            <div class="signature">Arbitre</div>
                            <div class="signature">Capitaine Équipe 1</div>
                            <div class="signature">Capitaine Équipe 2</div>
                        </div>
                    </div>
                `;
            });
        }
        
        // Ajouter les matchs de phase finale
        if (tournament.knockout.matches.length > 0) {
            printContent += '<h2>Feuilles de Match - Phase Finale</h2>';
            
            tournament.knockout.matches.forEach((match, index) => {
                if (match.team1 && match.team2) {
                    const roundName = tournament.knockout.rounds.find(r => r.id === match.round)?.name || `Round ${match.round}`;
                    
                    printContent += `
                        <div class="match-sheet">
                            <h3>Match #${index + 1} - ${roundName}</h3>
                            <p><strong>Date:</strong> ${new Date(tournament.info.date).toLocaleDateString()}</p>
                            <div class="match-teams">
                                <div class="match-team">${match.team1}</div>
                                <div style="font-size: 24px; font-weight: bold;">VS</div>
                                <div class="match-team">${match.team2}</div>
                            </div>
                            <div class="match-score">
                                <div class="score-box"></div>
                                <div class="score-box"></div>
                            </div>
                            <div class="signatures">
                                <div class="signature">Arbitre</div>
                                <div class="signature">Capitaine Équipe 1</div>
                                <div class="signature">Capitaine Équipe 2</div>
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        // Ajouter les classements des poules
        if (tournament.pools.length > 0) {
            printContent += '<h2>Classements des Poules</h2>';
            
            tournament.pools.forEach(pool => {
                const poolStandings = PoolsManager.calculatePoolStandings(pool.id);
                
                printContent += `
                    <div class="pool-standings">
                        <h3>${pool.name}</h3>
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
                                ${poolStandings.map((team, index) => `
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
                    </div>
                `;
            });
        }
        
        printContent += '</body></html>';
        
        // Écrire le contenu dans la nouvelle fenêtre et imprimer
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé avant d'imprimer
        printWindow.addEventListener('load', function() {
            printWindow.print();
        });
    }

    // API publique
    return {
        showAlert,
        showTab,
        updateDashboard,
        setTheme,
        initEventListeners,
        printTournament
    };
})();

/**
 * Exporte le classement général au format CSV
 */
function exportRanking() {
    const tournament = TournamentData.getTournament();
    const ranking = RankingManager.calculateOverallRanking();
    
    if (ranking.length === 0) {
        UI.showAlert('Aucune donnée à exporter', 'warning');
        return;
    }
    
    // Créer le contenu CSV
    let csvContent = 'Rang,Équipe,Statut,Points,Différence\n';
    
    ranking.forEach(team => {
        csvContent += `${team.rank},"${team.name}","${team.status || 'N/A'}",${team.points || 'N/A'},${team.pointsDiff || 'N/A'}\n`;
    });
    
    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const exportFileName = tournament.info.name ?
        `classement_${tournament.info.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv` :
        `classement_tournoi_boccia_${new Date().toISOString().split('T')[0]}.csv`;
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', exportFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    UI.showAlert('Classement exporté avec succès');
}

/**
 * Imprime le classement général
 */
function printRanking() {
    const tournament = TournamentData.getTournament();
    const ranking = RankingManager.calculateOverallRanking();
    
    if (ranking.length === 0) {
        UI.showAlert('Aucune donnée à imprimer', 'warning');
        return;
    }
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        UI.showAlert('Veuillez autoriser les fenêtres popup pour cette fonctionnalité', 'warning');
        return;
    }
    
    // Générer le contenu HTML à imprimer
    let printContent = `
        <html>
        <head>
            <title>Classement - ${tournament.info.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1, h2, h3 { margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { display: flex; justify-content: space-between; align-items: center; }
                .tournament-info { margin-bottom: 20px; }
                @media print {
                    body { margin: 0; }
                    @page { margin: 1cm; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Classement Général</h1>
                <div class="tournament-info">
                    <h2>${tournament.info.name}</h2>
                    <p><strong>Date:</strong> ${new Date(tournament.info.date).toLocaleDateString()}</p>
                    <p><strong>Lieu:</strong> ${tournament.info.location}</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Équipe</th>
                        <th>Statut</th>
                        <th>Points</th>
                        <th>Différence</th>
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
            </table>
            
            <p><small>Classement généré le ${new Date().toLocaleString()}</small></p>
        </body>
        </html>
    `;
    
    // Écrire le contenu dans la nouvelle fenêtre et imprimer
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.addEventListener('load', function() {
        printWindow.print();
    });
}

// Ajoutez ces fonctions au return de UI
/*
// API publique
return {
    showAlert,
    showTab,
    updateDashboard,
    setTheme,
    initEventListeners,
    printTournament,
    exportRanking,  // Ajouter ici
    printRanking    // Ajouter ici
};
*/

// Modification du fichier js/matches.js pour améliorer l'affichage des matchs

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
