# Tournoi-de-Boccia
Tournoi de Boccia
# Gestionnaire de Tournois de Boccia

Une application web complète pour organiser et gérer des tournois de Boccia, avec une interface intuitive et des fonctionnalités avancées.

## Caractéristiques principales

### Gestion de tournoi avancée
- **Configuration flexible de tournoi** : poules, élimination directe ou format mixte
- **Gestion des équipes** : ajout, modification, suppression et importation d'équipes
- **Système de poules** : création automatique et équilibrée des poules
- **Génération de matchs** : algorithme intelligent pour optimiser les rencontres
- **Suivi des résultats** : enregistrement des scores et gestion des forfaits
- **Classements automatiques** : calcul des classements selon les critères officiels
- **Phase finale** : création et gestion de tableaux à élimination directe

### Nouvelles fonctionnalités
- **Application Progressive (PWA)** : installation sur l'appareil, fonctionnement hors ligne
- **Exportation PDF professionnelle** : feuilles de match, classements et tableaux
- **Planification de terrains** : gestion des terrains disponibles pour les matchs
- **Planning horaire** : organisation optimisée des matchs avec gestion des pauses
- **Synchronisation cloud** : sauvegarde et partage des tournois entre appareils
- **Export multi-formats** : JSON, PDF, CSV, package ZIP complet
- **Interface adaptative** : thèmes multiples et options d'accessibilité

## Installation

### Méthode standard
1. Clonez ce dépôt :
   ```
   git clone https://github.com/votre-utilisateur/boccia-tournament-manager.git
   ```
2. Ouvrez simplement le fichier `index.html` dans votre navigateur ou utilisez un serveur web.

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

## Structure technique

L'application est construite avec une architecture modulaire en JavaScript vanilla, CSS et HTML:

```
/boccia-tournament-manager
│
├── index.html                 # Structure HTML principale
├── offline.html               # Page hors ligne pour PWA
├── manifest.json              # Manifeste pour l'installation PWA
├── service-worker.js          # Service Worker pour le mode hors ligne
│
├── css/
│   ├── style.css              # Styles principaux
│   └── responsive.css         # Styles responsives
│
├── js/
│   ├── main.js                # Point d'entrée principal
│   ├── config.js              # Configuration et initialisation
│   ├── data.js                # Gestion des données et localStorage
│   ├── ui.js                  # Fonctions d'interface utilisateur
│   ├── teams.js               # Gestion des équipes
│   ├── pools.js               # Gestion des poules
│   ├── matches.js             # Gestion des matchs
│   ├── knockout.js            # Gestion de la phase finale
│   ├── ranking.js             # Gestion du classement général
│   ├── export.js              # Exportation PDF et autres formats
│   ├── courts.js              # Gestion des terrains et planification
│   └── sync.js                # Synchronisation cloud
│
├── icons/
│   ├── icon-192x192.png       # Icônes pour PWA
│   └── icon-512x512.png
│
└── README.md                  # Documentation
```

## Fonctionnalités à venir

- **Application mobile native** : Versions iOS/Android
- **Mode arbitre** : Interface simplifiée pour la saisie des scores
- **Mode spectateur** : Affichage public des matchs et résultats en temps réel
- **Statistiques avancées** : Analyse des performances individuelles et d'équipes
- **Multilingue** : Support de langues additionnelles
- **Mode tournoi multiple** : Gestion de plusieurs tournois simultanés

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à signaler des bugs ou à proposer des améliorations en créant une issue ou une pull request.

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.
