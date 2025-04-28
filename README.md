# Tournoi-de-Boccia

## Qu'est-ce que la Boccia?

La Boccia est un sport de précision apparenté à la pétanque, adapté aux personnes en situation de handicap moteur. Ce sport paralympique se joue en individuel, en doublette ou en triplette avec des balles en cuir.

## À propos du projet

Une application web complète pour organiser et gérer des tournois de Boccia, développée avec une approche "web first" permettant une utilisation sur tout appareil. Notre interface intuitive et nos fonctionnalités avancées simplifient l'organisation de tournois de toutes tailles.

## Caractéristiques principales

### Gestion de tournoi avancée
- **Configuration flexible de tournoi** : poules, élimination directe ou format mixte
- **Gestion des équipes** : ajout, modification, suppression et importation d'équipes
- **Système de poules** : création automatique et équilibrée des poules
- **Génération de matchs** : algorithme intelligent pour optimiser les rencontres
- **Suivi des résultats** : enregistrement des scores et gestion des forfaits
- **Classements automatiques** : calcul des classements selon les critères officiels
- **Phase finale** : création et gestion de tableaux à élimination directe

### Fonctionnalités étendues
- **Application Progressive (PWA)** : installation sur l'appareil, fonctionnement hors ligne
- **Exportation PDF professionnelle** : feuilles de match, classements et tableaux
- **Planification de terrains** : gestion des terrains disponibles pour les matchs
- **Planning horaire** : organisation optimisée des matchs avec gestion des pauses
- **Stockage local** : sauvegarde des données dans le navigateur
- **Export multi-formats** : JSON, PDF, CSV, package ZIP complet
- **Interface adaptative** : responsive design pour tous les appareils

## Installation

### Méthode standard
1. Clonez ce dépôt :
   ```
   git clone https://github.com/votre-utilisateur/boccia-tournament-manager.git
   ```
2. Ouvrez simplement le fichier `index.html` dans votre navigateur ou utilisez un serveur web local.

### Installation en tant qu'application (PWA)
1. Visitez l'application dans Chrome, Edge ou un autre navigateur compatible
2. Cliquez sur l'icône d'installation dans la barre d'adresse ou acceptez l'invitation d'installation
3. L'application s'installera sur votre appareil et sera accessible hors ligne

## Guide d'utilisation

### Configuration initiale
1. **Informations de base** : Nom du tournoi, date, lieu
2. **Structure** : Choisissez le format (poules, élimination directe, ou mixte)
3. **Règles** : Configurez les règles de qualification et de classement

### Gestion des équipes
1. **Ajout d'équipes** : Manuellement ou par importation de fichier texte
2. **Gestion des joueurs** : Ajoutez des joueurs à chaque équipe (optionnel)
3. **Assignation aux poules** : Répartition équilibrée ou manuelle des équipes

### Gestion des terrains et planification
1. **Configuration des terrains** : Définissez les terrains disponibles
2. **Paramètres du planning** : Heures de début/fin, durée des matchs, pauses
3. **Génération du planning** : Automatique ou assignation manuelle des matchs

### Déroulement du tournoi
1. **Phase de poules** : Saisie des résultats, suivi des classements
2. **Phase finale** : Création automatique du tableau à élimination directe
3. **Suivi des résultats** : Mise à jour des scores et progression du tournoi

### Exportation et partage
1. **Documents PDF** : Générez des feuilles de match et classements professionnels
2. **Package complet** : Exportez toutes les données dans un fichier ZIP
3. **Synchronisation** : Partagez les données entre plusieurs appareils

## Technologies utilisées

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **PWA**: Service Workers, Web App Manifest
- **Persistance**: LocalStorage, IndexedDB
- **Exports**: PDF.js, FileSaver.js
- **UI/UX**: Responsive design, Material Design inspiration
- **Build tools**: Webpack, Babel (pour la version de production)

## Structure technique

L'application est construite avec une architecture modulaire:

```
/tournoi-de-boccia
│
├── index.html                 # Page principale
├── offline.html               # Page hors ligne pour PWA
├── manifest.json              # Manifeste PWA
├── service-worker.js          # Service Worker
│
├── assets/                    # Ressources statiques
│   ├── icons/                 # Icônes de l'application
│   │   ├── icon-192x192.png   # Icône PWA
│   │   └── icon-512x512.png   # Icône PWA large
│   ├── images/                # Images générales
│   └── fonts/                 # Polices personnalisées
│
├── css/
│   ├── style.css              # Styles principaux
│   ├── responsive.css         # Adaptations responsives
│   └── themes/                # Thèmes (clair/sombre)
│
├── js/
│   ├── app/                   # Logique principale
│   │   ├── main.js            # Point d'entrée
│   │   ├── router.js          # Gestionnaire de routes
│   │   └── config.js          # Configuration
│   │
│   ├── core/                  # Fonctionnalités de base
│   │   ├── data.js            # Gestion des données
│   │   ├── storage.js         # Stockage local
│   │   └── api.js             # Interactions API (si applicable)
│   │
│   ├── modules/               # Modules fonctionnels
│   │   ├── teams.js           # Gestion des équipes
│   │   ├── pools.js           # Gestion des poules
│   │   ├── matches.js         # Gestion des matchs
│   │   ├── knockout.js        # Phase finale
│   │   ├── rankings.js        # Classements
│   │   ├── courts.js          # Gestion des terrains
│   │   └── scheduler.js       # Planification
│   │
│   ├── ui/                    # Interface utilisateur
│   │   ├── components.js      # Composants UI réutilisables
│   │   ├── forms.js           # Gestion des formulaires
│   │   ├── notifications.js   # Notifications utilisateur
│   │   └── views.js           # Gestionnaire de vues
│   │
│   └── utils/                 # Utilitaires
│       ├── export.js          # Exportation (PDF, CSV)
│       ├── import.js          # Importation de données
│       ├── validation.js      # Validation des données
│       └── helpers.js         # Fonctions auxiliaires
│
├── templates/                 # Modèles HTML pour les vues dynamiques
│
└── README.md                  # Documentation
```

## Fonctionnalités à venir

- **Application mobile native** : Versions iOS/Android avec React Native
- **Mode arbitre** : Interface simplifiée pour la saisie des scores en temps réel
- **Mode spectateur** : Affichage public des matchs et résultats en temps réel sur grands écrans
- **Statistiques avancées** : Analyse des performances individuelles et d'équipes avec visualisations
- **Multilingue** : Support pour français, anglais, espagnol, allemand et italien
- **Mode tournoi multiple** : Gestion de plusieurs tournois simultanés
- **Authentification** : Système de comptes pour organisateurs et arbitres
- **Intégration vidéo** : Support pour les replays et streaming des matchs importants
- **API publique** : Pour intégration avec d'autres systèmes et applications
- **Mode hors-connexion avancé** : Synchronisation automatique lors du retour en ligne

## Support et contact

Pour toute question ou assistance:
- **Email**: support@tournoi-boccia.org
- **Site web**: [www.tournoi-boccia.org](https://www.tournoi-boccia.org)
- **Discord**: [Rejoindre notre communauté](https://discord.gg/boccia-tournament)

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à signaler des bugs ou à proposer des améliorations en créant une issue ou une pull request.

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.
