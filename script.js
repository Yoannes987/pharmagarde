// Données chargées depuis le fichier JSON
let pharmaciesData = {};

// Chargement du fichier JSON au démarrage
fetch('pharmacies.json')
    .then(response => {
        if (!response.ok) throw new Error('Fichier JSON introuvable');
        return response.json();
    })
    .then(data => {
        pharmaciesData = data;
        afficherQuartiers();
    })
    .catch(error => {
        console.error(error);
        document.getElementById('quartier-buttons').innerHTML = '<p style="color:red;">❌ Erreur chargement données. Vérifie que pharmacies.json existe.</p>';
    });

function afficherQuartiers() {
    const container = document.getElementById('quartier-buttons');
    const quartiers = Object.keys(pharmaciesData);
    
    if (quartiers.length === 0) {
        container.innerHTML = '<p>Aucun quartier disponible.</p>';
        return;
    }
    
    container.innerHTML = quartiers.map(quartier => 
        `<button data-quartier="${quartier}">🏘️ ${quartier}</button>`
    ).join('');
    
    // Ajouter les écouteurs d'événements
    document.querySelectorAll('[data-quartier]').forEach(btn => {
        btn.addEventListener('click', () => {
            const quartier = btn.dataset.quartier;
            afficherPharmacies(quartier);
        });
    });
}

function afficherPharmacies(quartier) {
    const pharmacies = pharmaciesData[quartier];
    
    if (!pharmacies || pharmacies.length === 0) {
        document.getElementById('liste-pharmacies').innerHTML = '<p>Aucune pharmacie de garde pour ce quartier cette semaine.</p>';
    } else {
        const html = pharmacies.map(pharm => `
            <div class="pharmacie">
                <div class="nom">🏪 ${pharm.nom}</div>
                ${pharm.rupture ? '<div class="rupture">⚠️ Risque de rupture signalé</div>' : ''}
                <div class="actions">
                    ${pharm.whatsapp ? `<a href="https://wa.me/${pharm.whatsapp}" class="whatsapp" target="_blank">💬 Vérifier stock</a>` : ''}
                    ${pharm.telephone ? `<a href="tel:${pharm.telephone}" class="appel">📞 Appeler</a>` : ''}
                    ${pharm.maps ? `<a href="${pharm.maps}" class="maps" target="_blank">🗺️ Itinéraire</a>` : ''}
                </div>
                <small>📦 Livraison possible via <strong>GoGett</strong> ou <strong>AfriMove</strong> (demandez en pharmacie)</small>
            </div>
        `).join('');
        document.getElementById('liste-pharmacies').innerHTML = html;
    }
    
    // Afficher la vue résultats, cacher les quartiers
    document.querySelector('.quartiers').classList.add('hidden');
    document.getElementById('resultats').classList.remove('hidden');
    
    // Mémoriser le quartier pour le bouton retour (optionnel)
    document.getElementById('retour').onclick = () => {
        document.getElementById('resultats').classList.add('hidden');
        document.querySelector('.quartiers').classList.remove('hidden');
    };
}

// Gestion du signalement de rupture
document.getElementById('signaler').addEventListener('click', (e) => {
    e.preventDefault();
    alert('📢 Merci ! Envoyez-nous un message sur WhatsApp au +228 XXXXXXXX pour signaler une rupture. Nous mettrons à jour dans les 24h.');
});