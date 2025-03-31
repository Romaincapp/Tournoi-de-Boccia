/**
 * Module de gestion des terrains et planification horaire
 */
const CourtsManager = (function() {
    // Structure de données pour les terrains
    let courts = [];
    
    // Structure pour la planification des matchs
    let schedule = {
        matchDuration: 30, // durée par défaut d'un match en minutes
        startTime: '09:00',
        endTime: '18:00',
        breaks: [], // pauses (déjeuner, etc.)
        assignments: [] // assignations des matchs
    };
    
    /**
     * Initialise le module de gestion des terrains
     */
    function init() {
        loadFromLocalStorage();
    }
    
    /**
     * Charge la configuration des terrains depuis le localStorage
     */
    function loadFromLocalStorage() {
        const savedCourts = localStorage.getItem('bocciaCourts');
        const savedSchedule = localStorage.getItem('bocciaSchedule');
        
        if (savedCourts) {
            try {
                courts = JSON.parse(savedCourts);
            } catch (error) {
                console.error('Erreur lors du chargement des terrains:', error);
                courts = [];
            }
        }
        
        if (savedSchedule) {
            try {
                schedule = JSON.parse(savedSchedule);
            } catch (error) {
                console.error('Erreur lors du chargement du planning:', error);
                schedule = {
                    matchDuration: 30,
                    startTime: '09:00',
                    endTime: '18:00',
                    breaks: [],
                    assignments: []
                };
            }
        }
    }
    
    /**
     * Sauvegarde la configuration des terrains dans le localStorage
     */
    function saveToLocalStorage() {
        localStorage.setItem('bocciaCourts', JSON.stringify(courts));
        localStorage.setItem('bocciaSchedule', JSON.stringify(schedule));
    }
    
    /**
     * Ajoute un nouveau terrain
     * @param {Object} court - Données du terrain
     * @returns {boolean} Succès de l'opération
     */
    function addCourt(court) {
        if (!court.name) {
            return false;
        }
        
        // Générer un ID si non fourni
        if (!court.id) {
            court.id = 'court_' + Date.now();
        }
        
        // Valeurs par défaut
        court.available = court.available !== undefined ? court.available : true;
        court.description = court.description || '';
        
        // Ajouter le terrain
        courts.push(court);
        
        // Sauvegarder les changements
        saveToLocalStorage();
        
        return true;
    }
    
    /**
     * Met à jour un terrain existant
     * @param {string} courtId - ID du terrain à mettre à jour
     * @param {Object} updates - Mises à jour à appliquer
     * @returns {boolean} Succès de l'opération
     */
    function updateCourt(courtId, updates) {
        const courtIndex = courts.findIndex(c => c.id === courtId);
        
        if (courtIndex === -1) {
            return false;
        }
        
        // Fusionner les mises à jour
        courts[courtIndex] = { ...courts[courtIndex], ...updates };
        
        // Sauvegarder les changements
        saveToLocalStorage();
        
        return true;
    }
    
    /**
     * Supprime un terrain
     * @param {string} courtId - ID du terrain à supprimer
     * @returns {boolean} Succès de l'opération
     */
    function deleteCourt(courtId) {
        const initialLength = courts.length;
        courts = courts.filter(court => court.id !== courtId);
        
        // Supprimer les assignations de matchs pour ce terrain
        schedule.assignments = schedule.assignments.filter(
            assignment => assignment.courtId !== courtId
        );
        
        // Sauvegarder les changements
        saveToLocalStorage();
        
        return courts.length < initialLength;
    }
    
    /**
     * Récupère tous les terrains
     * @returns {Array} Liste des terrains
     */
    function getCourts() {
        return [...courts];
    }
    
    /**
     * Récupère un terrain par son ID
     * @param {string} courtId - ID du terrain
     * @returns {Object|null} Terrain ou null si non trouvé
     */
    function getCourtById(courtId) {
        return courts.find(court => court.id === courtId) || null;
    }
    
    /**
     * Met à jour les paramètres du planning
     * @param {Object} params - Nouveaux paramètres
     */
    function updateScheduleParams(params) {
        // Fusionner les paramètres
        schedule = { ...schedule, ...params };
        
        // Sauvegarder les changements
        saveToLocalStorage();
    }
    
    /**
     * Ajoute une pause au planning
     * @param {Object} breakTime - Informations sur la pause
     * @returns {boolean} Succès de l'opération
     */
    function addBreak(breakTime) {
        if (!breakTime.start || !breakTime.end || !breakTime.name) {
            return false;
        }
        
        // Générer un ID si non fourni
        if (!breakTime.id) {
            breakTime.id = 'break_' + Date.now();
        }
        
        // Ajouter la pause
        schedule.breaks.push(breakTime);
        
        // Sauvegarder les changements
        saveToLocalStorage();
        
        return true;
    }
    
    /**
     * Supprime une pause du planning
     * @param {string} breakId - ID de la pause à supprimer
     * @returns {boolean} Succès de l'opération
     */
    function deleteBreak(breakId) {
        const initialLength = schedule.breaks.length;
        schedule.breaks = schedule.breaks.filter(breakTime => breakTime.id !== breakId);
        
        // Sauvegarder les changements
        saveToLocalStorage();
        
        return schedule.breaks.length < initialLength;
    }
    
    /**
     * Assigne un match à un terrain et un créneau horaire
     * @param {Object} assignment - Données d'assignation
     * @returns {boolean} Succès de l'opération
     */
    function assignMatch(assignment) {
        if (!assignment.matchId || !assignment.courtId || !assignment.startTime) {
            return false;
        }
        
        // Calculer l'heure de fin en fonction de la durée du match
        const startTime = new Date(`2000-01-01T${assignment.startTime}`);
        const endTime = new Date(startTime.getTime() + schedule.matchDuration * 60000);
        assignment.endTime = endTime.toTimeString().substring(0, 5);
        
        // Vérifier les conflits d'horaire et de terrain
        const conflicts = checkConflicts(assignment);
        if (conflicts.length > 0) {
            return false;
        }
        
        // Générer un ID si non fourni
        if (!assignment.id) {
            assignment.id = 'assignment_' + Date.now();
        }
        
        // Ajouter l'assignation
        schedule.assignments.push(assignment);
        
        // Sauvegarder les changements
        saveToLocalStorage();
        
        return true;
    }
    
    /**
     * Vérifie les conflits pour une assignation de match
     * @param {Object} assignment - Données d'assignation à vérifier
     * @returns {Array} Liste des conflits détectés
     */
    function checkConflicts(assignment) {
        const conflicts = [];
        
        // Convertir les heures en minutes depuis minuit pour faciliter les comparaisons
        const startMinutes = timeToMinutes(assignment.startTime);
        const endMinutes = timeToMinutes(assignment.endTime);
        
        // Vérifier les conflits avec d'autres matchs sur le même terrain
        schedule.assignments.forEach(existing => {
            if (existing.courtId === assignment.courtId) {
                const existingStart = timeToMinutes(existing.startTime);
                const existingEnd = timeToMinutes(existing.endTime);
                
                // Vérifier le chevauchement des horaires
                if (!(endMinutes <= existingStart || startMinutes >= existingEnd)) {
                    conflicts.push({
                        type: 'court_conflict',
                        message: `Conflit de terrain avec le match ${existing.matchId}`,
                        assignment: existing
                    });
                }
            }
        });
        
        // Vérifier les conflits avec les pauses
        schedule.breaks.forEach(breakTime => {
            const breakStart = timeToMinutes(breakTime.start);
            const breakEnd = timeToMinutes(breakTime.end);
            
            // Vérifier le chevauchement des horaires
            if (!(endMinutes <= breakStart || startMinutes >= breakEnd)) {
                conflicts.push({
                    type: 'break_conflict',
                    message: `Conflit avec la pause "${breakTime.name}"`,
                    breakTime: breakTime
                });
            }
        });
        
        // Vérifier les conflits d'équipes (même équipe qui joue simultanément sur différents terrains)
        const tournament = TournamentData.getTournament();
        const match = getMatchById(assignment.matchId, tournament);
        
        if (match) {
            const teams = [match.team1, match.team2];
            
            schedule.assignments.forEach(existing => {
                const existingStart = timeToMinutes(existing.startTime);
                const existingEnd = timeToMinutes(existing.endTime);
                
                // Vérifier le chevauchement des horaires
                if (!(endMinutes <= existingStart || startMinutes >= existingEnd)) {
                    const existingMatch = getMatchById(existing.matchId, tournament);
                    
                    if (existingMatch) {
                        const existingTeams = [existingMatch.team1, existingMatch.team2];
                        
                        // Vérifier si une équipe joue dans les deux matchs
                        const commonTeams = teams.filter(team => existingTeams.includes(team));
                        
                        if (commonTeams.length > 0) {
                            conflicts.push({
                                type: 'team_conflict',
                                message: `Conflit d'équipe: ${commonTeams.join(', ')} joue déjà dans un autre match`,
                                assignment: existing,
                                teams: commonTeams
                            });
                        }
                    }
                }
            });
        }
        
        return conflicts;
    }
    
    /**
     * Récupère un match par son ID
     * @param {string} matchId - ID du match
     * @param {Object} tournament - Données du tournoi
     * @returns {Object|null} Match ou null si non trouvé
     */
    function getMatchById(matchId, tournament) {
        // Chercher dans les matchs de poule
        let match = tournament.matches.find(m => m.id === matchId);
        
        // Si non trouvé, chercher dans les matchs de phase finale
        if (!match) {
            match = tournament.knockout.matches.find(m => m.id === matchId);
        }
        
        return match || null;
    }
    
    /**
     * Convertit une heure au format HH:MM en minutes depuis minuit
     * @param {string} time - Heure au format HH:MM
     * @returns {number} Minutes depuis minuit
     */
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    /**
     * Convertit des minutes depuis minuit en heure au format HH:MM
     * @param {number} minutes - Minutes depuis minuit
     * @returns {string} Heure au format HH:MM
     */
    function minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    
    /**
     * Supprime une assignation de match
     * @param {string} assignmentId - ID de l'assignation à supprimer
     * @returns {boolean} Succès de l'opération
     */
    function deleteAssignment(assignmentId) {
        const initialLength = schedule.assignments.length;
        schedule.assignments = schedule.assignments.filter(assignment => assignment.id !== assignmentId);
        
        // Sauvegarder les changements
        saveToLocalStorage();
        
        return schedule.assignments.length < initialLength;
    }
    
    /**
     * Génère automatiquement un planning pour tous les matchs
     * @returns {Object} Résultat de la planification avec succès et conflits éventuels
     */
    function generateSchedule() {
        const tournament = TournamentData.getTournament();
        const availableCourts = courts.filter(court => court.available);
        
        // Vérifier qu'il y a des terrains disponibles
        if (availableCourts.length === 0) {
            return {
                success: false,
                message: 'Aucun terrain disponible pour la planification'
            };
        }
        
        // Collecter tous les matchs
        const allMatches = [
            ...tournament.matches,
            ...tournament.knockout.matches.filter(m => m.team1 && m.team2)
        ];
        
        // Trier les matchs (d'abord les matchs de phase finale, puis les matchs de poule)
        allMatches.sort((a, b) => {
            const aIsKnockout = !a.pool;
            const bIsKnockout = !b.pool;
            
            if (aIsKnockout && !bIsKnockout) return -1;
            if (!aIsKnockout && bIsKnockout) return 1;
            return 0;
        });
        
        // Convertir les heures de début et de fin en minutes
        const startMinutes = timeToMinutes(schedule.startTime);
        const endMinutes = timeToMinutes(schedule.endTime);
        
        // Créer des créneaux horaires pour chaque terrain
        const courtSlots = {};
        availableCourts.forEach(court => {
            courtSlots[court.id] = startMinutes;
        });
        
        // Convertir les pauses en minutes
        const breakSlots = schedule.breaks.map(breakTime => ({
            start: timeToMinutes(breakTime.start),
            end: timeToMinutes(breakTime.end),
            name: breakTime.name
        }));
        
        // Créer une liste pour suivre les équipes occupées à un moment donné
        const teamOccupied = {};
        
        // Essayer d'assigner chaque match
        const assigned = [];
        const unassigned = [];
        
        allMatches.forEach(match => {
            let assigned = false;
            
            // Parcourir tous les terrains disponibles
            for (const courtId in courtSlots) {
                // Heure de début pour ce terrain
                let startTime = courtSlots[courtId];
                
                // Vérifier si l'heure de début est avant la fin de la journée
                if (startTime + schedule.matchDuration > endMinutes) {
                    continue;
                }
                
                // Vérifier si l'heure chevauche une pause
                let overlapsBreak = false;
                for (const breakSlot of breakSlots) {
                    if (!(startTime + schedule.matchDuration <= breakSlot.start || startTime >= breakSlot.end)) {
                        startTime = breakSlot.end;
                        overlapsBreak = true;
                        break;
                    }
                }
                
                if (overlapsBreak) {
                    // Vérifier à nouveau si l'heure de début mise à jour est avant la fin de la journée
                    if (startTime + schedule.matchDuration > endMinutes) {
                        continue;
                    }
                }
                
                // Vérifier si les équipes sont disponibles à cette heure
                const team1EndTime = teamOccupied[match.team1] || 0;
                const team2EndTime = teamOccupied[match.team2] || 0;
                
                // S'assurer que les équipes ont terminé leurs matchs précédents
                const teamMaxEndTime = Math.max(team1EndTime, team2EndTime);
                if (startTime < teamMaxEndTime) {
                    startTime = teamMaxEndTime;
                }
                
                // Vérifier à nouveau si l'heure de début mise à jour est avant la fin de la journée
                if (startTime + schedule.matchDuration > endMinutes) {
                    continue;
                }
                
                // Assigner le match à ce terrain et cette heure
                const endTime = startTime + schedule.matchDuration;
                
                assigned.push({
                    matchId: match.id,
                    courtId: courtId,
                    startTime: minutesToTime(startTime),
                    endTime: minutesToTime(endTime),
                    id: 'assignment_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
                });
                
                // Mettre à jour les créneaux horaires et les équipes occupées
                courtSlots[courtId] = endTime;
                teamOccupied[match.team1] = endTime;
                teamOccupied[match.team2] = endTime;
                
                assigned = true;
                break;
            }
            
            if (!assigned) {
                unassigned.push(match);
            }
        });
        
        // Remplacer les assignations existantes
        schedule.assignments = assigned;
        saveToLocalStorage();
        
        return {
            success: true,
            assigned: assigned.length,
            unassigned: unassigned.length,
            unassignedMatches: unassigned,
            message: unassigned.length > 0
                ? `${assigned.length} matchs planifiés, ${unassigned.length} non planifiés en raison de contraintes horaires.`
                : `Tous les ${assigned.length} matchs ont été planifiés avec succès.`
        };
    }
    
    /**
     * Récupère le planning des matchs
     * @returns {Object} Planning complet
     */
    function getSchedule() {
        return {
            ...schedule,
            courts: [...courts]
        };
    }
    
    /**
     * Affiche l'interface de gestion des terrains
     */
    function showCourtsInterface() {
        const modalTitle = 'Gestion des Terrains';
        const modalBody = `
            <div class="courts-manager">
                <h4>Terrains disponibles</h4>
                <div id="courts-list">
                    ${renderCourtsList()}
                </div>
                
                <h4>Ajouter un terrain</h4>
                <div class="form-group">
                    <label for="court-name">Nom du terrain</label>
                    <input type="text" id="court-name" placeholder="Ex: Terrain 1">
                </div>
                <div class="form-group">
                    <label for="court-description">Description (optionnel)</label>
                    <textarea id="court-description" placeholder="Caractéristiques du terrain..."></textarea>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="court-available" checked>
                        Terrain disponible pour les matchs
                    </label>
                </div>
                <button class="btn" id="add-court-btn">Ajouter le terrain</button>
            </div>
        `;
        
        // Afficher la modale
        UI.showModal(modalTitle, modalBody, () => true, {
            showCancel: false,
            confirmText: 'Fermer'
        });
        
        // Ajouter les écouteurs d'événements
        document.getElementById('add-court-btn').addEventListener('click', function() {
            const name = document.getElementById('court-name').value.trim();
            const description = document.getElementById('court-description').value.trim();
            const available = document.getElementById('court-available').checked;
            
            if (!name) {
                UI.showAlert('Veuillez entrer un nom pour le terrain', 'warning');
                return;
            }
            
            const success = addCourt({
                name,
                description,
                available
            });
            
            if (success) {
                document.getElementById('court-name').value = '';
                document.getElementById('court-description').value = '';
                document.getElementById('courts-list').innerHTML = renderCourtsList();
                UI.showAlert('Terrain ajouté avec succès', 'success');
            }
        });
        
        // Ajouter les écouteurs pour les boutons d'édition et de suppression
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-court-btn')) {
                const courtId = e.target.getAttribute('data-court-id');
                if (confirm('Êtes-vous sûr de vouloir supprimer ce terrain ?')) {
                    deleteCourt(courtId);
                    document.getElementById('courts-list').innerHTML = renderCourtsList();
                    UI.showAlert('Terrain supprimé avec succès', 'success');
                }
            } else if (e.target.classList.contains('edit-court-btn')) {
                const courtId = e.target.getAttribute('data-court-id');
                const court = getCourtById(courtId);
                if (court) {
                    showEditCourtModal(court);
                }
            }
        });
    }
    
    /**
     * Génère le HTML pour la liste des terrains
     * @returns {string} HTML généré
     */
    function renderCourtsList() {
        if (courts.length === 0) {
            return '<p>Aucun terrain configuré. Ajoutez des terrains pour planifier les matchs.</p>';
        }
        
        return `
            <table class="courts-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Description</th>
                        <th>Disponible</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${courts.map(court => `
                        <tr>
                            <td>${court.name}</td>
                            <td>${court.description || '—'}</td>
                            <td>
                                <span class="status-${court.available ? 'active' : 'inactive'}">
                                    ${court.available ? 'Oui' : 'Non'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm edit-court-btn" data-court-id="${court.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-court-btn" data-court-id="${court.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    /**
     * Affiche la modale d'édition d'un terrain
     * @param {Object} court - Terrain à éditer
     */
    function showEditCourtModal(court) {
        const modalTitle = `Modifier le terrain: ${court.name}`;
        const modalBody = `
            <div class="form-group">
                <label for="edit-court-name">Nom du terrain</label>
                <input type="text" id="edit-court-name" value="${court.name}">
            </div>
            <div class="form-group">
                <label for="edit-court-description">Description</label>
                <textarea id="edit-court-description">${court.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="edit-court-available" ${court.available ? 'checked' : ''}>
                    Terrain disponible pour les matchs
                </label>
            </div>
            <input type="hidden" id="edit-court-id" value="${court.id}">
        `;
        
        UI.showModal(modalTitle, modalBody, saveCourtEdit);
    }
    
    /**
     * Sauvegarde les modifications d'un terrain
     */
    function saveCourtEdit() {
        const courtId = document.getElementById('edit-court-id').value;
        const name = document.getElementById('edit-court-name').value.trim();
        const description = document.getElementById('edit-court-description').value.trim();
        const available = document.getElementById('edit-court-available').checked;
        
        if (!name) {
            UI.showAlert('Le nom du terrain ne peut pas être vide', 'warning');
            return false;
        }
        
        const success = updateCourt(courtId, {
            name,
            description,
            available
        });
        
        if (success) {
            document.getElementById('courts-list').innerHTML = renderCourtsList();
            UI.showAlert('Terrain modifié avec succès', 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * Affiche l'interface de planification des matchs
     */
    function showScheduleInterface() {
        const tournament = TournamentData.getTournament();
        
        // Vérifier qu'il y a des terrains configurés
        if (courts.length === 0) {
            UI.showAlert('Veuillez configurer au moins un terrain avant de planifier les matchs', 'warning');
            showCourtsInterface();
            return;
        }
        
        // Vérifier qu'il y a des matchs à planifier
        const allMatches = [
            ...tournament.matches,
            ...tournament.knockout.matches.filter(m => m.team1 && m.team2)
        ];
        
        if (allMatches.length === 0) {
            UI.showAlert('Aucun match à planifier. Veuillez générer les matchs d\'abord.', 'warning');
            return;
        }
        
        // Préparer le contenu de la modale
        const modalTitle = 'Planification des Matchs';
        const modalBody = `
            <div class="schedule-manager">
                <div class="schedule-settings card">
                    <h4>Paramètres du planning</h4>
                    <div class="form-group">
                        <label for="match-duration">Durée d'un match (minutes)</label>
                        <input type="number" id="match-duration" min="10" step="5" value="${schedule.matchDuration}">
                    </div>
                    <div class="form-group">
                        <label for="schedule-start-time">Heure de début</label>
                        <input type="time" id="schedule-start-time" value="${schedule.startTime}">
                    </div>
                    <div class="form-group">
                        <label for="schedule-end-time">Heure de fin</label>
                        <input type="time" id="schedule-end-time" value="${schedule.endTime}">
                    </div>
                    <button class="btn" id="save-schedule-settings-btn">Enregistrer les paramètres</button>
                    <button class="btn" id="add-break-btn">Ajouter une pause</button>
                </div>
                
                <div class="breaks-list card">
                    <h4>Pauses programmées</h4>
                    <div id="breaks-container">
                        ${renderBreaksList()}
                    </div>
                </div>
                
                <div class="schedule-actions card">
                    <h4>Génération du planning</h4>
                    <button class="btn btn-primary" id="generate-schedule-btn">Générer automatiquement</button>
                    <button class="btn" id="clear-schedule-btn">Effacer le planning</button>
                    <button class="btn" id="manual-assign-btn">Assigner manuellement</button>
                </div>
                
                <div class="schedule-view card">
                    <h4>Planning des matchs</h4>
                    <div id="schedule-container">
                        ${renderSchedule()}
                    </div>
                </div>
            </div>
        `;
        
        // Afficher la modale
        UI.showModal(modalTitle, modalBody, () => true, {
            showCancel: false,
            confirmText: 'Fermer',
            fullscreen: true
        });
        
        // Ajouter les écouteurs d'événements
        document.getElementById('save-schedule-settings-btn').addEventListener('click', function() {
            const matchDuration = parseInt(document.getElementById('match-duration').value);
            const startTime = document.getElementById('schedule-start-time').value;
            const endTime = document.getElementById('schedule-end-time').value;
            
            if (isNaN(matchDuration) || matchDuration < 10) {
                UI.showAlert('La durée du match doit être d\'au moins 10 minutes', 'warning');
                return;
            }
            
            if (!startTime || !endTime) {
                UI.showAlert('Veuillez définir les heures de début et de fin', 'warning');
                return;
            }
            
            if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
                UI.showAlert('L\'heure de début doit être antérieure à l\'heure de fin', 'warning');
                return;
            }
            
            updateScheduleParams({
                matchDuration,
                startTime,
                endTime
            });
            
            UI.showAlert('Paramètres de planning enregistrés', 'success');
        });
        
        document.getElementById('add-break-btn').addEventListener('click', showAddBreakModal);
        
        document.getElementById('generate-schedule-btn').addEventListener('click', function() {
            if (schedule.assignments.length > 0) {
                if (!confirm('Un planning existe déjà. Souhaitez-vous le remplacer ?')) {
                    return;
                }
            }
            
            const result = generateSchedule();
            
            if (result.success) {
                document.getElementById('schedule-container').innerHTML = renderSchedule();
                UI.showAlert(result.message, result.unassigned > 0 ? 'warning' : 'success');
            } else {
                UI.showAlert(result.message, 'danger');
            }
        });
        
        document.getElementById('clear-schedule-btn').addEventListener('click', function() {
            if (schedule.assignments.length === 0) {
                UI.showAlert('Le planning est déjà vide', 'info');
                return;
            }
            
            if (confirm('Êtes-vous sûr de vouloir effacer tout le planning ?')) {
                schedule.assignments = [];
                saveToLocalStorage();
                document.getElementById('schedule-container').innerHTML = renderSchedule();
                UI.showAlert('Planning effacé avec succès', 'success');
            }
        });
        
        document.getElementById('manual-assign-btn').addEventListener('click', showManualAssignModal);
        
        // Écouteurs pour les boutons de suppression de pauses et d'assignations
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-break-btn')) {
                const breakId = e.target.getAttribute('data-break-id');
                if (confirm('Êtes-vous sûr de vouloir supprimer cette pause ?')) {
                    deleteBreak(breakId);
                    document.getElementById('breaks-container').innerHTML = renderBreaksList();
                    document.getElementById('schedule-container').innerHTML = renderSchedule();
                    UI.showAlert('Pause supprimée avec succès', 'success');
                }
            } else if (e.target.classList.contains('delete-assignment-btn')) {
                const assignmentId = e.target.getAttribute('data-assignment-id');
                if (confirm('Êtes-vous sûr de vouloir supprimer cette assignation ?')) {
                    deleteAssignment(assignmentId);
                    document.getElementById('schedule-container').innerHTML = renderSchedule();
                    UI.showAlert('Assignation supprimée avec succès', 'success');
                }
            }
        });
    }
    
    /**
     * Génère le HTML pour la liste des pauses
     * @returns {string} HTML généré
     */
    function renderBreaksList() {
        if (schedule.breaks.length === 0) {
            return '<p>Aucune pause programmée.</p>';
        }
        
        return `
            <table class="breaks-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Début</th>
                        <th>Fin</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${schedule.breaks.map(breakTime => `
                        <tr>
                            <td>${breakTime.name}</td>
                            <td>${breakTime.start}</td>
                            <td>${breakTime.end}</td>
                            <td>
                                <button class="btn btn-sm btn-danger delete-break-btn" data-break-id="${breakTime.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    /**
     * Génère le HTML pour l'affichage du planning
     * @returns {string} HTML généré
     */
    function renderSchedule() {
        if (schedule.assignments.length === 0) {
            return '<p>Aucun match planifié.</p>';
        }
        
        // Trier les assignations par heure de début
        const sortedAssignments = [...schedule.assignments].sort((a, b) => {
            const timeA = timeToMinutes(a.startTime);
            const timeB = timeToMinutes(b.startTime);
            return timeA - timeB;
        });
        
        const tournament = TournamentData.getTournament();
        
        // Grouper par terrain
        const assignmentsByCourtId = {};
        sortedAssignments.forEach(assignment => {
            if (!assignmentsByCourtId[assignment.courtId]) {
                assignmentsByCourtId[assignment.courtId] = [];
            }
            assignmentsByCourtId[assignment.courtId].push(assignment);
        });
        
        // Générer le HTML
        let html = '<div class="schedule-table-container">';
        
        html += '<table class="schedule-table">';
        html += '<thead><tr><th>Heure</th>';
        
        // En-têtes des terrains
        courts.forEach(court => {
            html += `<th>${court.name}</th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        // Créer des plages horaires de 15 minutes
        const startMinutes = timeToMinutes(schedule.startTime);
        const endMinutes = timeToMinutes(schedule.endTime);
        const step = 15; // 15 minutes
        
        for (let minutes = startMinutes; minutes < endMinutes; minutes += step) {
            const timeSlot = minutesToTime(minutes);
            
            html += `<tr><td>${timeSlot}</td>`;
            
            // Cellules pour chaque terrain
            courts.forEach(court => {
                const assignmentsForCourt = assignmentsByCourtId[court.id] || [];
                const assignment = assignmentsForCourt.find(a => {
                    const assignmentStart = timeToMinutes(a.startTime);
                    const assignmentEnd = timeToMinutes(a.endTime);
                    return minutes >= assignmentStart && minutes < assignmentEnd;
                });
                
                if (assignment) {
                    // Trouver les détails du match
                    const match = getMatchById(assignment.matchId, tournament);
                    
                    if (match) {
                        // Déterminer si c'est le début du match
                        const isMatchStart = timeSlot === assignment.startTime;
                        
                        if (isMatchStart) {
                            const rowspan = Math.ceil(schedule.matchDuration / step);
                            html += `<td rowspan="${rowspan}" class="match-cell">
                                <div class="schedule-match">
                                    <div class="schedule-match-teams">
                                        ${match.team1} vs ${match.team2}
                                    </div>
                                    <div class="schedule-match-time">
                                        ${assignment.startTime} - ${assignment.endTime}
                                    </div>
                                    <button class="btn btn-sm btn-danger delete-assignment-btn" data-assignment-id="${assignment.id}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </td>`;
                        }
                        // Ne rien ajouter si ce n'est pas le début du match (la cellule est étendue par rowspan)
                    } else {
                        html += '<td></td>';
                    }
                } else {
                    // Vérifier si c'est une pause
                    const isBreak = schedule.breaks.some(breakTime => {
                        const breakStart = timeToMinutes(breakTime.start);
                        const breakEnd = timeToMinutes(breakTime.end);
                        return minutes >= breakStart && minutes < breakEnd;
                    });
                    
                    if (isBreak) {
                        html += '<td class="break-cell"></td>';
                    } else {
                        html += '<td></td>';
                    }
                }
            });
            
            html += '</tr>';
        }
        
        html += '</tbody></table></div>';
        
        return html;
    }
    
    /**
     * Affiche la modale d'ajout de pause
     */
    function showAddBreakModal() {
        const modalTitle = 'Ajouter une pause';
        const modalBody = `
            <div class="form-group">
                <label for="break-name">Nom de la pause</label>
                <input type="text" id="break-name" placeholder="Ex: Pause déjeuner">
            </div>
            <div class="form-group">
                <label for="break-start">Heure de début</label>
                <input type="time" id="break-start">
            </div>
            <div class="form-group">
                <label for="break-end">Heure de fin</label>
                <input type="time" id="break-end">
            </div>
        `;
        
        UI.showModal(modalTitle, modalBody, saveBreak);
    }
    
    /**
     * Sauvegarde une nouvelle pause
     */
    function saveBreak() {
        const name = document.getElementById('break-name').value.trim();
        const start = document.getElementById('break-start').value;
        const end = document.getElementById('break-end').value;
        
        if (!name || !start || !end) {
            UI.showAlert('Veuillez remplir tous les champs', 'warning');
            return false;
        }
        
        if (timeToMinutes(start) >= timeToMinutes(end)) {
            UI.showAlert('L\'heure de début doit être antérieure à l\'heure de fin', 'warning');
            return false;
        }
        
        const success = addBreak({
            name,
            start,
            end
        });
        
        if (success) {
            document.getElementById('breaks-container').innerHTML = renderBreaksList();
            UI.showAlert('Pause ajoutée avec succès', 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * Affiche la modale d'assignation manuelle d'un match
     */
    function showManualAssignModal() {
        const tournament = TournamentData.getTournament();
        
        // Collecter tous les matchs
        const allMatches = [
            ...tournament.matches,
            ...tournament.knockout.matches.filter(m => m.team1 && m.team2)
        ];
        
        if (allMatches.length === 0) {
            UI.showAlert('Aucun match à planifier', 'warning');
            return;
        }
        
        const modalTitle = 'Assigner un match manuellement';
        const modalBody = `
            <div class="form-group">
                <label for="manual-match">Match</label>
                <select id="manual-match">
                    ${allMatches.map(match => {
                        let matchLabel = `${match.team1} vs ${match.team2}`;
                        
                        // Ajouter une information sur le type de match
                        if (match.pool) {
                            const poolName = tournament.pools.find(p => p.id === match.pool)?.name || `Poule ${match.pool}`;
                            matchLabel += ` (${poolName})`;
                        } else {
                            // Match de phase finale
                            const round = tournament.knockout.rounds.find(r => r.id === match.round);
                            if (round) {
                                matchLabel += ` (${round.name})`;
                            }
                        }
                        
                        // Vérifier si le match est déjà assigné
                        const isAssigned = schedule.assignments.some(a => a.matchId === match.id);
                        if (isAssigned) {
                            matchLabel += ' [Déjà assigné]';
                        }
                        
                        return `<option value="${match.id}" ${isAssigned ? 'disabled' : ''}>${matchLabel}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="manual-court">Terrain</label>
                <select id="manual-court">
                    ${courts.filter(court => court.available).map(court => 
                        `<option value="${court.id}">${court.name}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="manual-start-time">Heure de début</label>
                <input type="time" id="manual-start-time" min="${schedule.startTime}" max="${schedule.endTime}">
            </div>
        `;
        
        UI.showModal(modalTitle, modalBody, saveManualAssignment);
    }
    
    /**
     * Sauvegarde une assignation manuelle
     */
    function saveManualAssignment() {
        const matchId = document.getElementById('manual-match').value;
        const courtId = document.getElementById('manual-court').value;
        const startTime = document.getElementById('manual-start-time').value;
        
        if (!matchId || !courtId || !startTime) {
            UI.showAlert('Veuillez remplir tous les champs', 'warning');
            return false;
        }
        
        // Calculer l'heure de fin
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = startMinutes + schedule.matchDuration;
        
        // Vérifier que l'heure de fin est avant la fin de journée
        if (endMinutes > timeToMinutes(schedule.endTime)) {
            UI.showAlert('Ce match se terminerait après l\'heure de fin de la journée', 'warning');
            return false;
        }
        
        // Créer l'assignation
        const assignment = {
            matchId,
            courtId,
            startTime,
            endTime: minutesToTime(endMinutes)
        };
        
        // Vérifier les conflits
        const conflicts = checkConflicts(assignment);
        
        if (conflicts.length > 0) {
            UI.showAlert(`Impossible d'assigner ce match: ${conflicts[0].message}`, 'warning');
            return false;
        }
        
        // Assigner le match
        const success = assignMatch(assignment);
        
        if (success) {
            document.getElementById('schedule-container').innerHTML = renderSchedule();
            UI.showAlert('Match assigné avec succès', 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * Initialise les écouteurs d'événements
     */
    function initEventListeners() {
        // Ces écouteurs seront initialisés dans main.js
    }
    
    // API publique
    return {
        init,
        getCourts,
        getSchedule,
        showCourtsInterface,
        showScheduleInterface,
        generateSchedule,
        initEventListeners
    };
})();
