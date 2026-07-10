// ============================================================
// 1. CHARGEMENT DES DONNÉES
// ============================================================
let allPharmacies = [];
let currentPage = 1;
const PER_PAGE = 15;

// Éléments DOM
const pharmacyList = document.getElementById('pharmacyList');
const searchInput = document.getElementById('searchInput');
const zoneFilter = document.getElementById('zoneFilter');
const gardeToggle = document.getElementById('gardeToggle');
const stats = document.getElementById('stats');
const pagination = document.getElementById('pagination');

// Charger le fichier JSON
fetch('pharmacies.json')
    .then(res => res.json())
    .then(data => {
        allPharmacies = data.pharmacies;
        populateZoneFilter();
        render();
    })
    .catch(err => {
        pharmacyList.innerHTML = `<p style="color:red;">⚠️ Erreur de chargement des données. Vérifiez que pharmacies.json est présent.</p>`;
        console.error(err);
    });

// ============================================================
// 2. FILTRE PAR ZONE (génération dynamique)
// ============================================================
function populateZoneFilter() {
    const zones = [...new Set(allPharmacies.map(p => p.zone))].sort();
    zones.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z;
        opt.textContent = z;
        zoneFilter.appendChild(opt);
    });
}

// ============================================================
// 3. FILTRAGE + RECHERCHE + TRI
// ============================================================
function getFiltered() {
    const search = searchInput.value.toLowerCase().trim();
    const zone = zoneFilter.value;
    const gardeOnly = gardeToggle.checked;

    return allPharmacies.filter(p => {
        const matchNom = p.nom.toLowerCase().includes(search);
        const matchZone = zone === 'all' || p.zone === zone;
        const matchGarde = gardeOnly ? p.est_de_garde === true : true;
        return matchNom && matchZone && matchGarde;
    });
}

// ============================================================
// 4. AFFICHAGE AVEC PAGINATION MODERNE
// ============================================================
function render() {
    const filtered = getFiltered();
    const total = filtered.length;
    const totalPages = Math.ceil(total / PER_PAGE) || 1;

    // Ajuster la page courante
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    const pageItems = filtered.slice(start, end);

    // Mise à jour des stats
    stats.textContent = `${total} pharmacie${total > 1 ? 's' : ''}`;

    // Génération des cartes
    if (pageItems.length === 0) {
        pharmacyList.innerHTML = `<p style="text-align:center;color:#6a8a6a;padding:40px 0;">Aucune pharmacie trouvée.</p>`;
    } else {
        pharmacyList.innerHTML = pageItems.map(p => {
            const gardeBadge = p.est_de_garde ? `<span class="badge-garde">🛡️ De garde</span>` : '';
            const telLink = p.telephone ? `<a href="tel:${p.telephone}" class="btn btn-appel">📞 Appeler</a>` : '';
            const mapLink = p.localisation ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.nom + ' ' + p.localisation)}" target="_blank" class="btn">🗺️ Itinéraire</a>` : '';
            return `
                <div class="pharmacy-card ${p.est_de_garde ? 'garde' : ''}">
                    <div class="nom">${p.nom}</div>
                    <div class="zone">📍 ${p.zone}</div>
                    ${p.localisation ? `<div class="localisation">${p.localisation}</div>` : ''}
                    ${gardeBadge}
                    <div class="actions">
                        ${telLink}
                        ${mapLink}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Pagination
    renderPagination(totalPages);
}

// ============================================================
// 5. PAGINATION MODERNE (avec boutons numérotés)
// ============================================================
function renderPagination(totalPages) {
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    // Bouton Précédent
    html += `<button ${currentPage === 1 ? 'disabled style="opacity:0.4;cursor:default;"' : ''} onclick="goToPage(${currentPage - 1})">‹</button>`;

    // Pages
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += `<span style="padding:0 4px;color:#8aaa8a;">…</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span style="padding:0 4px;color:#8aaa8a;">…</span>`;
        html += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Bouton Suivant
    html += `<button ${currentPage === totalPages ? 'disabled style="opacity:0.4;cursor:default;"' : ''} onclick="goToPage(${currentPage + 1})">›</button>`;

    pagination.innerHTML = html;
}

// ============================================================
// 6. NAVIGATION PAGES
// ============================================================
function goToPage(page) {
    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    render();
    // Scroll fluide vers le haut de la liste
    document.getElementById('pharmacyList').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// 7. ÉCOUTEURS D'ÉVÉNEMENTS (filtres en temps réel)
// ============================================================
searchInput.addEventListener('input', () => {
    currentPage = 1;
    render();
});
zoneFilter.addEventListener('change', () => {
    currentPage = 1;
    render();
});
gardeToggle.addEventListener('change', () => {
    currentPage = 1;
    render();
});

// ============================================================
// 8. CHATBOT
// ============================================================
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
});
chatClose.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
});

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    // Message utilisateur
    chatMessages.innerHTML += `<div class="message user">${text}</div>`;
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Réponse du bot
    setTimeout(() => {
        const lower = text.toLowerCase();
        let reponse = "Désolé, je n'ai pas trouvé de réponse. Essayez avec une ville (Lomé, Kara, Atakpamé...) ou 'garde'.";

        // Recherche de pharmacies par mot-clé
        const mots = lower.split(' ');
        const keyword = mots.find(m => m.length > 2);
        if (keyword) {
            const results = allPharmacies.filter(p => 
                p.nom.toLowerCase().includes(keyword) || 
                p.zone.toLowerCase().includes(keyword) ||
                p.ville.toLowerCase().includes(keyword)
            );
            if (results.length > 0) {
                const maxShow = 5;
                const list = results.slice(0, maxShow).map(p => 
                    `• ${p.nom} (${p.zone}) ${p.est_de_garde ? '🛡️ Garde' : ''}`
                ).join('\n');
                reponse = `J'ai trouvé ${results.length} pharmacie(s) :\n${list}`;
                if (results.length > maxShow) {
                    reponse += `\n... et ${results.length - maxShow} autre(s). Utilisez la recherche pour plus.`;
                }
            }
        }

        // Commande "garde"
        if (lower.includes('garde')) {
            const gardes = allPharmacies.filter(p => p.est_de_garde);
            if (gardes.length > 0) {
                const list = gardes.map(p => `• ${p.nom} (${p.zone})`).join('\n');
                reponse = `🛡️ Pharmacies de garde aujourd'hui :\n${list}`;
            } else {
                reponse = "Aucune pharmacie de garde enregistrée pour le moment.";
            }
        }

        chatMessages.innerHTML += `<div class="message bot">${reponse.replace(/\n/g, '<br>')}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
   
