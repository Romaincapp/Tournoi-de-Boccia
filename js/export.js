/**
 * Module d'exportation au format PDF et autres formats
 * Utilise jsPDF pour la génération de documents professionnels
 */
const ExportManager = (function() {
    /**
     * Génère un PDF du classement général
     */
    function exportRankingToPDF() {
        // Charger jsPDF dynamiquement si nécessaire
        if (typeof jspdf === 'undefined') {
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', function() {
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js', function() {
                    generateRankingPDF();
                });
            });
        } else {
            generateRankingPDF();
        }
    }

    /**
     * Charge un script externe
     */
    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    }

    /**
     * Génère le PDF du classement
     */
    function generateRankingPDF() {
        const tournament = TournamentData.getTournament();
        const ranking = RankingManager.calculateOverallRanking();
        
        if (ranking.length === 0) {
            UI.showAlert('Aucune donnée à exporter', 'warning');
            return;
        }
        
        // Création du document PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Titre et informations du tournoi
        doc.setFontSize(20);
        doc.text('Classement Général', 14, 20);
        
        doc.setFontSize(12);
        doc.text(tournament.info.name, 14, 30);
        doc.text(`Date: ${new Date(tournament.info.date).toLocaleDateString()}`, 14, 37);
        doc.text(`Lieu: ${tournament.info.location}`, 14, 44);
        
        // Préparation des données pour le tableau
        const tableData = ranking.map(team => [
            team.rank,
            team.name,
            team.status || 'N/A',
            team.points !== undefined ? team.points : 'N/A',
            team.pointsDiff !== undefined ? team.pointsDiff : 'N/A'
        ]);
        
        // Génération du tableau
        doc.autoTable({
            startY: 50,
            head: [['Rang', 'Équipe', 'Statut', 'Points', 'Différence']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [52, 152, 219],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            margin: { top: 50 }
        });
        
        // Pied de page
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${i} / ${totalPages}`, 14, doc.internal.pageSize.height - 10);
            doc.text(`Généré le ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        }
        
        // Téléchargement du PDF
        const filename = tournament.info.name 
            ? `classement_${tournament.info.name.replace(/\s+/g, '_')}.pdf`
            : 'classement_tournoi_boccia.pdf';
            
        doc.save(filename);
        
        UI.showAlert('PDF du classement généré avec succès', 'success');
    }
    
    /**
     * Génère un PDF des feuilles de match
     */
    function exportMatchSheetsToPDF() {
        // Charger jsPDF dynamiquement si nécessaire
        if (typeof jspdf === 'undefined') {
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', function() {
                generateMatchSheetsPDF();
            });
        } else {
            generateMatchSheetsPDF();
        }
    }
    
    /**
     * Génère le PDF des feuilles de match
     */
    function generateMatchSheetsPDF() {
        const tournament = TournamentData.getTournament();
        
        // Vérifier s'il y a des matchs
        if (tournament.matches.length === 0 && tournament.knockout.matches.length === 0) {
            UI.showAlert('Aucun match à exporter', 'warning');
            return;
        }
        
        // Création du document PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let y = 20;
        let pageCount = 1;
        
        // Fonction pour ajouter un en-tête de page
        function addHeader() {
            doc.setFontSize(14);
            doc.text('Feuilles de Match - ' + tournament.info.name, 14, 15);
            y = 25;
        }
        
        // Fonction pour ajouter une feuille de match
        function addMatchSheet(match, type, poolName) {
            // Vérifier s'il faut passer à une nouvelle page
            if (y > 230) {
                doc.addPage();
                pageCount++;
                addHeader();
            }
            
            // Cadre de la feuille de match
            doc.rect(10, y, 190, 60);
            
            // Titre du match
            doc.setFontSize(12);
            doc.text(`Match ${type} - ${poolName || ''}`, 14, y + 8);
            
            // Date
            doc.setFontSize(10);
            doc.text(`Date: ${new Date(tournament.info.date).toLocaleDateString()}`, 14, y + 16);
            
            // Équipes et scores
            doc.setFontSize(11);
            
            // Équipe 1
            doc.text(match.team1, 50, y + 30, { align: 'center' });
            doc.rect(30, y + 35, 40, 15);
            
            // Versus
            doc.setFontSize(12);
            doc.text('VS', 105, y + 30, { align: 'center' });
            
            // Équipe 2
            doc.setFontSize(11);
            doc.text(match.team2, 160, y + 30, { align: 'center' });
            doc.rect(140, y + 35, 40, 15);
            
            // Signatures
            doc.setFontSize(8);
            doc.text('Arbitre', 30, y + 58);
            doc.line(20, y + 55, 70, y + 55);
            
            doc.text('Signature Équipe 1', 105, y + 58, { align: 'center' });
            doc.line(75, y + 55, 135, y + 55);
            
            doc.text('Signature Équipe 2', 170, y + 58, { align: 'center' });
            doc.line(140, y + 55, 195, y + 55);
            
            y += 70;
        }
        
        // Ajouter l'en-tête de la première page
        addHeader();
        
        // Ajouter les matchs de poule
        tournament.matches.forEach((match, index) => {
            const poolName = tournament.pools.find(p => p.id === match.pool)?.name || `Poule ${match.pool}`;
            addMatchSheet(match, `#${index + 1}`, poolName);
        });
        
        // Ajouter les matchs de phase finale
        tournament.knockout.matches.forEach((match, index) => {
            if (match.team1 && match.team2) {
                const roundName = tournament.knockout.rounds.find(r => r.id === match.round)?.name || `Round ${match.round}`;
                addMatchSheet(match, `#${index + 1}`, roundName);
            }
        });
        
        // Pied de page
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} / ${totalPages}`, 14, doc.internal.pageSize.height - 10);
            doc.text(`Généré le ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        }
        
        // Téléchargement du PDF
        const filename = tournament.info.name 
            ? `feuilles_match_${tournament.info.name.replace(/\s+/g, '_')}.pdf`
            : 'feuilles_match_tournoi_boccia.pdf';
            
        doc.save(filename);
        
        UI.showAlert('PDF des feuilles de match généré avec succès', 'success');
    }
    
    /**
     * Génère un PDF du tableau de la phase finale
     */
    function exportBracketToPDF() {
        UI.showAlert('Génération du tableau de phase finale en cours...', 'info');
        
        // On utilise html2canvas pour capturer le tableau visuel
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', function() {
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', function() {
                generateBracketPDF();
            });
        });
    }
    
    /**
     * Génère le PDF du tableau de phase finale
     */
    function generateBracketPDF() {
        const tournament = TournamentData.getTournament();
        
        if (tournament.knockout.rounds.length === 0) {
            UI.showAlert('Aucun tableau de phase finale à exporter', 'warning');
            return;
        }
        
        // Capture du tableau de phase finale
        const bracketElement = document.getElementById('bracket-container');
        
        html2canvas(bracketElement).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            
            // Création du document PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // Ajout du titre
            doc.setFontSize(16);
            doc.text('Tableau Phase Finale - ' + tournament.info.name, 14, 15);
            
            // Ajout du canvas comme image
            const imgWidth = doc.internal.pageSize.getWidth() - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            doc.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
            
            // Pied de page
            doc.setFontSize(10);
            doc.text(`Généré le ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
            
            // Téléchargement du PDF
            const filename = tournament.info.name 
                ? `tableau_phase_finale_${tournament.info.name.replace(/\s+/g, '_')}.pdf`
                : 'tableau_phase_finale_tournoi_boccia.pdf';
                
            doc.save(filename);
            
            UI.showAlert('PDF du tableau de phase finale généré avec succès', 'success');
        });
    }
    
    /**
     * Exporte toutes les données du tournoi dans un dossier ZIP
     */
    function exportTournamentPackage() {
        UI.showAlert('Préparation de l\'export complet du tournoi...', 'info');
        
        // Charger JSZip dynamiquement
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', function() {
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js', function() {
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', function() {
                    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js', function() {
                        loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', function() {
                            generateTournamentPackage();
                        });
                    });
                });
            });
        });
    }
    
    /**
     * Génère le package complet du tournoi
     */
    function generateTournamentPackage() {
        const tournament = TournamentData.getTournament();
        const zip = new JSZip();
        
        // Ajouter les données JSON brutes
        const jsonData = JSON.stringify(tournament, null, 2);
        zip.file("donnees_tournoi.json", jsonData);
        
        // Créer un dossier pour les PDF
        const pdfFolder = zip.folder("pdf");
        
        // Ajouter les promesses pour la génération des PDF
        const promises = [];
        
        // Générer le PDF du classement
        promises.push(new Promise((resolve) => {
            const { jsPDF } = window.jspdf;
            const ranking = RankingManager.calculateOverallRanking();
            
            if (ranking.length > 0) {
                const doc = new jsPDF();
                
                // Titre et informations du tournoi
                doc.setFontSize(20);
                doc.text('Classement Général', 14, 20);
                
                doc.setFontSize(12);
                doc.text(tournament.info.name, 14, 30);
                doc.text(`Date: ${new Date(tournament.info.date).toLocaleDateString()}`, 14, 37);
                doc.text(`Lieu: ${tournament.info.location}`, 14, 44);
                
                // Préparation des données pour le tableau
                const tableData = ranking.map(team => [
                    team.rank,
                    team.name,
                    team.status || 'N/A',
                    team.points !== undefined ? team.points : 'N/A',
                    team.pointsDiff !== undefined ? team.pointsDiff : 'N/A'
                ]);
                
                // Génération du tableau
                doc.autoTable({
                    startY: 50,
                    head: [['Rang', 'Équipe', 'Statut', 'Points', 'Différence']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [52, 152, 219],
                        textColor: 255,
                        fontStyle: 'bold'
                    }
                });
                
                // Ajouter au ZIP
                pdfFolder.file("classement.pdf", doc.output('blob'));
            }
            resolve();
        }));
        
        // Générer le PDF des feuilles de match
        promises.push(new Promise((resolve) => {
            if (tournament.matches.length > 0 || tournament.knockout.matches.length > 0) {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                let y = 20;
                
                // Fonction pour ajouter un en-tête de page
                function addHeader() {
                    doc.setFontSize(14);
                    doc.text('Feuilles de Match - ' + tournament.info.name, 14, 15);
                    y = 25;
                }
                
                // Fonction pour ajouter une feuille de match
                function addMatchSheet(match, type, poolName) {
                    // Vérifier s'il faut passer à une nouvelle page
                    if (y > 230) {
                        doc.addPage();
                        addHeader();
                    }
                    
                    // Cadre de la feuille de match
                    doc.rect(10, y, 190, 60);
                    
                    // Titre du match
                    doc.setFontSize(12);
                    doc.text(`Match ${type} - ${poolName || ''}`, 14, y + 8);
                    
                    // Date
                    doc.setFontSize(10);
                    doc.text(`Date: ${new Date(tournament.info.date).toLocaleDateString()}`, 14, y + 16);
                    
                    // Équipes et scores
                    doc.setFontSize(11);
                    
                    // Équipe 1
                    doc.text(match.team1, 50, y + 30, { align: 'center' });
                    doc.rect(30, y + 35, 40, 15);
                    
                    // Versus
                    doc.setFontSize(12);
                    doc.text('VS', 105, y + 30, { align: 'center' });
                    
                    // Équipe 2
                    doc.setFontSize(11);
                    doc.text(match.team2, 160, y + 30, { align: 'center' });
                    doc.rect(140, y + 35, 40, 15);
                    
                    // Signatures
                    doc.setFontSize(8);
                    doc.text('Arbitre', 30, y + 58);
                    doc.line(20, y + 55, 70, y + 55);
                    
                    doc.text('Signature Équipe 1', 105, y + 58, { align: 'center' });
                    doc.line(75, y + 55, 135, y + 55);
                    
                    doc.text('Signature Équipe 2', 170, y + 58, { align: 'center' });
                    doc.line(140, y + 55, 195, y + 55);
                    
                    y += 70;
                }
                
                // Ajouter l'en-tête de la première page
                addHeader();
                
                // Ajouter les matchs de poule
                tournament.matches.forEach((match, index) => {
                    const poolName = tournament.pools.find(p => p.id === match.pool)?.name || `Poule ${match.pool}`;
                    addMatchSheet(match, `#${index + 1}`, poolName);
                });
                
                // Ajouter les matchs de phase finale
                tournament.knockout.matches.forEach((match, index) => {
                    if (match.team1 && match.team2) {
                        const roundName = tournament.knockout.rounds.find(r => r.id === match.round)?.name || `Round ${match.round}`;
                        addMatchSheet(match, `#${index + 1}`, roundName);
                    }
                });
                
                // Ajouter au ZIP
                pdfFolder.file("feuilles_match.pdf", doc.output('blob'));
            }
            resolve();
        }));
        
        // Générer le CSV du classement
        promises.push(new Promise((resolve) => {
            const ranking = RankingManager.calculateOverallRanking();
            
            if (ranking.length > 0) {
                let csvContent = 'Rang,Équipe,Statut,Points,Différence\n';
                
                ranking.forEach(team => {
                    csvContent += `${team.rank},"${team.name}","${team.status || 'N/A'}",${team.points || 'N/A'},${team.pointsDiff || 'N/A'}\n`;
                });
                
                zip.file("csv/classement.csv", csvContent);
            }
            resolve();
        }));
        
        // Générer le CSV des matchs
        promises.push(new Promise((resolve) => {
            if (tournament.matches.length > 0) {
                let csvContent = 'Poule,Équipe 1,Équipe 2,Score 1,Score 2,Joué,Forfait\n';
                
                tournament.matches.forEach(match => {
                    csvContent += `${match.pool},"${match.team1}","${match.team2}",${match.score1 || ''},${match.score2 || ''},${match.played},${match.forfeit || ''}\n`;
                });
                
                zip.file("csv/matchs.csv", csvContent);
            }
            resolve();
        }));
        
        // Attendre que toutes les promesses soient résolues
        Promise.all(promises).then(() => {
            // Générer le fichier ZIP
            zip.generateAsync({ type: 'blob' }).then(function(content) {
                // Télécharger le fichier ZIP
                const filename = tournament.info.name 
                    ? `tournoi_boccia_${tournament.info.name.replace(/\s+/g, '_')}.zip`
                    : 'tournoi_boccia_export.zip';
                    
                saveAs(content, filename);
                
                UI.showAlert('Export complet du tournoi généré avec succès', 'success');
            });
        });
    }

    // API publique
    return {
        exportRankingToPDF,
        exportMatchSheetsToPDF,
        exportBracketToPDF,
        exportTournamentPackage
    };
})();
