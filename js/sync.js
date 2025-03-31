/**
 * Module de synchronisation avec le cloud
 * Permet de sauvegarder et partager les tournois
 */
const SyncManager = (function() {
    // Configuration par défaut
    let config = {
        enabled: false,
        autoSync: true,
        syncInterval: 5 * 60 * 1000, // 5 minutes
        lastSync: null,
        userId: null,
        apiKey: null,
        serverUrl: 'https://api.boccia-manager.com/v1', // Serveur fictif
        tournaments: [] // IDs des tournois synchronisés
    };
    
    // Intervalle de synchronisation automatique
    let syncInterval = null;
    
    /**
     * Initialise le module de synchronisation
     */
    function init() {
        // Charger la configuration depuis le localStorage
        loadConfig();
        
        // Mettre à jour l'interface utilisateur
        updateUI();
        
        // Initialiser la synchronisation automatique si activée
        if (config.enabled && config.autoSync) {
            startAutoSync();
        }
        
        // Écouter les événements de synchronisation du Service Worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'SYNC_COMPLETE') {
                    updateLastSyncTime(new Date());
                    updateUI();
                }
            });
        }
    }
    
    /**
     * Charge la configuration depuis le localStorage
     */
    function loadConfig() {
        const savedConfig = localStorage.getItem('bocciaSyncConfig');
        if (savedConfig) {
            try {
                const parsedConfig = JSON.parse(savedConfig);
                config = { ...config, ...parsedConfig };
            } catch (error) {
                console.error('Erreur lors du chargement de la configuration de synchronisation:', error);
            }
        }
    }
    
    /**
     * Sauvegarde la configuration dans le localStorage
     */
    function saveConfig() {
        localStorage.setItem('bocciaSyncConfig', JSON.stringify(config));
    }
    
    /**
     * Met à jour l'interface utilisateur
     */
    function updateUI() {
        const statusText = document.getElementById('sync-status-text');
        const configureSyncBtn = document.getElementById('configure-sync-btn');
        
        if (!statusText || !configureSyncBtn) return;
        
        if (config.enabled) {
            statusText.textContent = config.lastSync 
                ? `Synchronisé (Dernière: ${new Date(config.lastSync).toLocaleString()})` 
                : 'Configuré mais jamais synchronisé';
            
            statusText.className = 'status-active';
            configureSyncBtn.textContent = 'Modifier la configuration';
        } else {
            statusText.textContent = 'Non configuré';
            statusText.className = 'status-inactive';
            configureSyncBtn.textContent = 'Configurer la synchronisation';
        }
    }
    
    /**
     * Démarre la synchronisation automatique
     */
    function startAutoSync() {
        // Arrêter tout intervalle existant
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        
        // Créer un nouvel intervalle
        syncInterval = setInterval(function() {
            // Vérifier si la synchronisation est activée et que l'utilisateur est connecté
            if (config.enabled && config.userId && config.apiKey) {
                synchronize();
            }
        }, config.syncInterval);
    }
    
    /**
     * Arrête la synchronisation automatique
     */
    function stopAutoSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
    }
    
    /**
     * Synchronise les données avec le serveur
     * @returns {Promise<boolean>} Promesse résolue avec true si réussi, false sinon
     */
    function synchronize() {
        return new Promise((resolve, reject) => {
            // Vérifier si la synchronisation est activée
            if (!config.enabled || !config.userId || !config.apiKey) {
                resolve(false);
                return;
            }
            
            // Vérifier la connexion internet
            if (!navigator.onLine) {
                // Planifier une synchronisation via le Service Worker quand la connexion sera rétablie
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.sync.register('sync-tournament-data')
                            .then(() => {
                                console.log('Synchronisation background planifiée');
                                resolve(true);
                            })
                            .catch(error => {
                                console.error('Erreur lors de la planification de la synchronisation:', error);
                                resolve(false);
                            });
                    });
                } else {
                    console.log('Pas de connexion internet et Background Sync non supporté');
                    resolve(false);
                }
                return;
            }
            
            // Récupérer les données du tournoi actuel
            const tournament = TournamentData.getTournament();
            const tournamentId = tournament.info.id || generateTournamentId(tournament);
            
            // Mise à jour du timestamp pour déterminer quelle version est la plus récente
            tournament.lastModified = new Date().toISOString();
            
            // Sauvegarder l'ID du tournoi s'il n'est pas déjà enregistré
            if (!tournament.info.id) {
                tournament.info.id = tournamentId;
                TournamentData.saveToLocalStorage();
            }
            
            // Préparer les données à envoyer
            const payload = {
                userId: config.userId,
                tournamentId: tournamentId,
                data: tournament,
                timestamp: new Date().toISOString()
            };
            
            // Simuler une requête au serveur
            console.log('Synchronisation en cours...', payload);
            
            // Ici, nous simulons une réponse réussie
            // Dans une vraie implémentation, ce serait un appel fetch() à l'API du serveur
            setTimeout(() => {
                const success = true; // Simulation de succès
                
                if (success) {
                    // Mettre à jour la dernière synchronisation
                    updateLastSyncTime(new Date());
                    
                    // Ajouter l'ID du tournoi à la liste des tournois synchronisés si nécessaire
                    if (!config.tournaments.includes(tournamentId)) {
                        config.tournaments.push(tournamentId);
                        saveConfig();
                    }
                    
                    updateUI();
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 1000);
        });
    }
    
    /**
     * Génère un ID unique pour un tournoi
     * @param {Object} tournament - Données du tournoi
     * @returns {string} ID unique
     */
    function generateTournamentId(tournament) {
        // Créer une chaîne avec des informations distinctives du tournoi
        const baseString = `${tournament.info.name}-${tournament.info.date}-${Date.now()}-${Math.random()}`;
        
        // Retourner un hash simplifié (non cryptographique)
        let hash = 0;
        for (let i = 0; i < baseString.length; i++) {
            const char = baseString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir en entier 32 bits
        }
        
        return 'tour_' + Math.abs(hash).toString(16);
    }
    
    /**
     * Met à jour la date de dernière synchronisation
     * @param {Date} date - Date de la synchronisation
     */
    function updateLastSyncTime(date) {
        config.lastSync = date.toISOString();
        saveConfig();
    }
    
    /**
     * Configure la synchronisation avec le cloud
     * @param {Object} options - Options de configuration
     */
    function configure(options) {
        // Fusionner les options avec la configuration actuelle
        config = { ...config, ...options };
        
        // Activer/désactiver la synchronisation automatique
        if (config.enabled && config.autoSync) {
            startAutoSync();
        } else {
            stopAutoSync();
        }
        
        // Sauvegarder la configuration
        saveConfig();
        
        // Mettre à jour l'interface
        updateUI();
        
        // Effectuer une synchronisation immédiate si activée
        if (config.enabled) {
            synchronize();
        }
    }
    
    /**
     * Affiche le formulaire de configuration de la synchronisation
     */
    function showConfigureForm() {
        // Préparer le contenu de la modale
        const modalTitle = 'Configuration de la Synchronisation';
        const modalBody = `
            <div class="form-group">
                <label>
                    <input type="checkbox" id="sync-enabled" ${config.enabled ? 'checked' : ''}>
                    Activer la synchronisation avec le cloud
                </label>
                <p class="form-help">Permet de sauvegarder et partager vos tournois entre plusieurs appareils.</p>
            </div>
            
            <div id="sync-options" class="${config.enabled ? '' : 'hidden'}">
                <div class="form-group">
                    <label>Identifiant utilisateur</label>
                    <input type="text" id="sync-user-id" value="${config.userId || ''}" placeholder="Entrez votre identifiant">
                </div>
                
                <div class="form-group">
                    <label>Clé API</label>
                    <input type="password" id="sync-api-key" value="${config.apiKey || ''}" placeholder="Entrez votre clé API">
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="sync-auto" ${config.autoSync ? 'checked' : ''}>
                        Synchronisation automatique
                    </label>
                </div>
                
                <div class="form-group" id="sync-interval-group" ${config.autoSync ? '' : 'hidden'}>
                    <label>Intervalle de synchronisation</label>
                    <select id="sync-interval">
                        <option value="60000" ${config.syncInterval === 60000 ? 'selected' : ''}>1 minute</option>
                        <option value="300000" ${config.syncInterval === 300000 ? 'selected' : ''}>5 minutes</option>
                        <option value="900000" ${config.syncInterval === 900000 ? 'selected' : ''}>15 minutes</option>
                        <option value="1800000" ${config.syncInterval === 1800000 ? 'selected' : ''}>30 minutes</option>
                        <option value="3600000" ${config.syncInterval === 3600000 ? 'selected' : ''}>1 heure</option>
                    </select>
                </div>
            </div>
        `;
        
        // Afficher la modale
        UI.showModal(modalTitle, modalBody, saveConfigureForm);
        
        // Ajouter les écouteurs d'événements pour les changements d'état
        document.getElementById('sync-enabled').addEventListener('change', function() {
            document.getElementById('sync-options').classList.toggle('hidden', !this.checked);
        });
        
        document.getElementById('sync-auto').addEventListener('change', function() {
            document.getElementById('sync-interval-group').classList.toggle('hidden', !this.checked);
        });
    }
    
    /**
     * Sauvegarde la configuration depuis le formulaire
     */
    function saveConfigureForm() {
        const enabled = document.getElementById('sync-enabled').checked;
        const userId = document.getElementById('sync-user-id').value.trim();
        const apiKey = document.getElementById('sync-api-key').value.trim();
        const autoSync = document.getElementById('sync-auto').checked;
        const syncInterval = parseInt(document.getElementById('sync-interval').value);
        
        // Valider les entrées
        if (enabled && (!userId || !apiKey)) {
            UI.showAlert('Veuillez remplir tous les champs pour activer la synchronisation', 'warning');
            return false;
        }
        
        // Appliquer la configuration
        configure({
            enabled,
            userId,
            apiKey,
            autoSync,
            syncInterval
        });
        
        UI.showAlert('Configuration de synchronisation sauvegardée', 'success');
        return true;
    }
    
    /**
     * Initialise les écouteurs d'événements
     */
    function initEventListeners() {
        // Bouton de configuration de la synchronisation
        document.getElementById('configure-sync-btn')?.addEventListener('click', showConfigureForm);
    }
    
    // API publique
    return {
        init,
        synchronize,
        configure,
        showConfigureForm,
        initEventListeners
    };
})();
