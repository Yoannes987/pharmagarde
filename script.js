// Données
let pharmacies = [];
let zonesSet = new Set();
let currentPage = 1;
const itemsPerPage = 12;
let filteredPharmacies = [];

// Éléments DOM
const zoneSelect = document.getElementById('zoneSelect');
const gardeToggle = document.getElementById('gardeToggle');
const searchInput = document.getElementById('searchInput');
const resetBtn = document.getElementById('resetFilters');
const pharmacyGrid = document.getElementById('pharmacyGrid');
const resultCountSpan = document.getElementById('resultCount');
const paginationControls = document.getElementById('paginationControls');
const paginationBottom = document.getElementById('paginationBottom');

// Chargement des données
Promise.all([
    fetch('pharmacies.json').then(r => r.json()),
    fetch('gardes.json').then(r => r.json()).catch(() => ({ gardes_noms: [] }))
]).then(([pharmaData, gardeData]) => {
    pharmacies = pharmaData;
    const gardesNoms = gardeData.gardes_noms || [];
    pharmacies.forEach(p => {
        p.garde = gardesNoms.includes(p.nom.toLowerCase());
        if (p.zone) zonesSet.add(p.zone);
    });
    populateZoneSelect();
    applyFilters();
}).catch(err => console.error('Erreur', err));

function populateZoneSelect() {
    const sorted = Array.from(zonesSet).sort();
    sorted.forEach(zone => {
        const opt = document.createElement('option');
        opt.value = zone;
        opt.textContent = zone;
        zoneSelect.appendChild(opt);
    });
}

function applyFilters() {
    let filtered = [...pharmacies];
    const zone = zoneSelect.value;
    const gardeOnly = gardeToggle.checked;
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (zone !== 'all') {
        filtered = filtered.filter(p => p.zone === zone);
    }
    if (gardeOnly) {
        filtered = filtered.filter(p => p.garde);
    }
    if (searchTerm) {
        filtered = filtered.filter(p => p.nom.toLowerCase().includes(searchTerm) || (p.zone && p.zone.toLowerCase().includes(searchTerm)));
    }
    filteredPharmacies = filtered;
    currentPage = 1;
    render();
}

function render() {
    const total = filteredPharmacies.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredPharmacies.slice(start, start + itemsPerPage);

    resultCountSpan.textContent = `${total} pharmacie(s) trouvée(s)`;

    // Afficher les cartes
    if (pageItems.length === 0) {
        pharmacyGrid.innerHTML = '<div class="pharmacy-card">Aucune pharmacie ne correspond.</div>';
    } else {
        pharmacyGrid.innerHTML = pageItems.map(p => `
            <div class="pharmacy-card">
                <div class="pharmacy-name">${escapeHtml(p.nom)}</div>
                <div class="pharmacy-zone">${escapeHtml(p.zone || 'Zone inconnue')}</div>
                ${p.garde ? '<div class="garde-indicator">Garde cette semaine</div>' : ''}
                <div class="actions">
                    ${p.whatsapp ? `<a href="https://wa.me/${p.whatsapp}" class="btn-wa" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : ''}
                    ${p.telephone ? `<a href="tel:${p.telephone}" class="btn-call"><i class="fas fa-phone-alt"></i> Appeler</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Pagination
    const paginationHtml = generatePagination(totalPages);
    paginationControls.innerHTML = paginationHtml;
    paginationBottom.innerHTML = paginationHtml;
    attachPaginationEvents();
}

function generatePagination(totalPages) {
    if (totalPages <= 1) return '';
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    return html;
}

function attachPaginationEvents() {
    document.querySelectorAll('.pagination button[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentPage = parseInt(btn.dataset.page);
            render();
        });
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Écouteurs
zoneSelect.addEventListener('change', () => applyFilters());
gardeToggle.addEventListener('change', () => applyFilters());
searchInput.addEventListener('input', () => applyFilters());
resetBtn.addEventListener('click', () => {
    zoneSelect.value = 'all';
    gardeToggle.checked = false;
    searchInput.value = '';
    applyFilters();
});

// Chatbot
const chatButton = document.getElementById('chatButton');
const chatPanel = document.getElementById('chatPanel');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');

chatButton.addEventListener('click', () => {
    chatPanel.classList.toggle('hidden');
});
closeChat.addEventListener('click', () => {
    chatPanel.classList.add('hidden');
});

function addBotMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user';
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function processUserMessage(message) {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('garde') || lowerMsg.includes('pharmacie de garde')) {
        const gardes = pharmacies.filter(p => p.garde).slice(0, 5);
        if (gardes.length === 0) addBotMessage("Aucune pharmacie de garde cette semaine.");
        else {
            let reply = "Voici quelques pharmacies de garde :\n";
            gardes.forEach(p => reply += `- ${p.nom} (${p.zone})\n`);
            addBotMessage(reply);
        }
    } else if (lowerMsg.includes('zone') || lowerMsg.includes('quartier')) {
        addBotMessage("Quel quartier vous intéresse ? (ex: Agoè, Lomé Centre)");
        // On attend la réponse suivante
        window.awaitingZone = true;
    } else if (window.awaitingZone) {
        window.awaitingZone = false;
        const zone = message;
        const found = pharmacies.filter(p => p.zone && p.zone.toLowerCase().includes(zone.toLowerCase()));
        if (found.length === 0) addBotMessage(`Aucune pharmacie trouvée pour "${zone}".`);
        else addBotMessage(`${found.length} pharmacie(s) trouvée(s) dans ${zone}. Utilisez la recherche sur le site.`);
    } else if (lowerMsg.includes('médicament') || lowerMsg.includes('stock')) {
        addBotMessage("Je ne peux pas vérifier le stock en temps réel, mais vous pouvez contacter une pharmacie directement via WhatsApp. Voulez-vous voir les pharmacies de garde ? (oui/non)");
        window.awaitingMed = true;
    } else if (window.awaitingMed) {
        window.awaitingMed = false;
        if (message.toLowerCase().includes('oui')) {
            const gardes = pharmacies.filter(p => p.garde).slice(0, 5);
            addBotMessage("Pharmacies de garde : " + gardes.map(p => p.nom).join(', '));
        } else {
            addBotMessage("D'accord. Puis-je vous aider avec autre chose ?");
        }
    } else {
        addBotMessage("Je peux vous renseigner sur les pharmacies de garde, les zones, ou vous aider à contacter une pharmacie. Dites-moi ce dont vous avez besoin.");
    }
}

sendChat.addEventListener('click', () => {
    const msg = chatInput.value.trim();
    if (!msg) return;
    addUserMessage(msg);
    chatInput.value = '';
    processUserMessage(msg);
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChat.click();
});

// Initial chat
addBotMessage("Bienvenue sur PharmaGarde. Je suis votre assistant. Vous pouvez me poser des questions sur les pharmacies de garde, les zones, ou les médicaments.");
