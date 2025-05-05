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
        // Vérifier que les éléments existent avant de continuer
        const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        const tabPane = document.getElementById(`${tabId}-tab`);
        
        if (!tabButton || !tabPane) {
            console.error(`Onglet "${tabId}" non trouvé. Button: ${!!tabButton}, Pane: ${!!tabPane}`);
            return;
        }
        
        // Désactiver tous les onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Activer l'onglet sélectionné
        tabButton.classList.add('active');
        tabPane.classList.add('active');
    }

    
    function updateDashboard() {
        // Vérifier que l'interface principale est visible avant de mettre à jour
        if (document.getElementById('main-interface').classList.contains('hidden')) {
            console.log("Impossible de mettre à jour le tableau de bord: interface principale cachée");
            return;
        }
        
        const tournament = TournamentData.getTournament();
        const info = TournamentData.getInfo();
        
        // Vérifications de sécurité
        if (!info) {
            console.error("Impossible d'accéder aux informations du tournoi");
            return;
        }
        
        // Mettre à jour l'interface uniquement si les éléments existent
        const elements = {
            'dashboard-tournament-name': info.name || 'Non défini',
            'dashboard-tournament-date': info.date ? new Date(info.date).toLocaleDateString() : 'Non défini',
            'dashboard-tournament-location': info.location || 'Non défini',
            'dashboard-tournament-format': getFormatText(info.format),
            'dashboard-teams-count': tournament.teams ? tournament.teams.length : 0,
            'dashboard-pools-count': tournament.pools ? tournament.pools.length : 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Élément ${id} non trouvé`);
            }
        });
        
        // Statistiques des matchs
        const matchesPlayed = (tournament.matches || []).filter(match => match.played).length + 
                             ((tournament.knockout?.matches || []).filter(match => match.played).length);
        const totalMatches = (tournament.matches || []).length + 
                            ((tournament.knockout?.matches || []).length);
        
        updateElementSafely('dashboard-matches-played', matchesPlayed);
        updateElementSafely('dashboard-total-matches', totalMatches);
        
        // Gestion de l'onglet phase finale
        const knockoutTab = document.getElementById('knockout-tab');
        if (knockoutTab && info.format) {
            knockoutTab.style.display = info.format === 'pools-only' ? 'none' : 'inline-block';
        }
    }

    // Fonction utilitaire pour mettre à jour les éléments en toute sécurité
    function updateElementSafely(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Fonction pour obtenir le texte du format
    function getFormatText(format) {
        const formats = {
            'pools-only': 'Poules uniquement',
            'knockout-only': 'Élimination directe uniquement',
            'pools-knockout': 'Poules suivies d\'élimination directe'
        };
        return formats[format] || 'Non spécifié';
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
        printTournament,
        exportRanking,  // Ajouter ces deux fonctions
        printRanking,   // dans l'API publique
        debugUI         // Ajouter la fonction de débogage
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

// À exécuter après le chargement de la page ou lors de l'initialisation du tournoi
function showMainInterface() {
    const mainInterface = document.getElementById('main-interface');
    if (mainInterface) {
        mainInterface.classList.remove('hidden');
        updateDashboard(); // Mettre à jour le tableau de bord une fois l'interface visible
    }
}

