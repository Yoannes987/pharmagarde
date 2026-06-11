let pharmacies = [];
let zones = {};
let gardes = [];
let currentPage = 1;
const itemsPerPage = 12;
let filteredPharmacies = [];

// DOM elements
const zoneSelect = document.getElementById('zoneSelect');
const gardeToggle = document.getElementById('gardeToggle');
const searchInput = document.getElementById('searchInput');
const resetBtn = document.getElementById('resetFilters');
const pharmacyGrid = document.getElementById('pharmacyGrid');
const resultCountSpan = document.getElementById('resultCount');
const paginationControls = document.getElementById('paginationControls');
const paginationBottom = document.getElementById('paginationBottom');

// Load data
Promise.all([
    fetch('pharmacies.json').then(r => r.json()),
    fetch('zones.json').then(r => r.json()),
    fetch('gardes.json').then(r => r.json()).catch(() => ({ gardes_noms: [] }))
]).then(([pharmaData, zonesData, gardeData]) => {
    pharmacies = pharmaData;
    zones = zonesData;
    gardes = gardeData.gardes_noms || [];
    
    // Mark gardes
    pharmacies.forEach(p => {
        p.garde = gardes.includes(p.nom);
        // Determine zone for each pharmacy from zones object
        p.zone = findZoneForPharmacy(p.nom);
    });
    
    populateZoneSelect();
    applyFilters();
}).catch(err => console.error('Erreur chargement:', err));

function findZoneForPharmacy(nom) {
    for (const [zoneName, pharmList] of Object.entries(zones)) {
        if (pharmList.includes(nom)) return zoneName;
    }
    return null; // non classée
}

function populateZoneSelect() {
    const zoneNames = Object.keys(zones).sort();
    zoneNames.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        zoneSelect.appendChild(option);
    });
    // Add option for "Non classées"
    const opt = document.createElement('option');
    opt.value = "__non_classees";
    opt.textContent = "Pharmacies non classées";
    zoneSelect.appendChild(opt);
}

function applyFilters() {
    let filtered = [...pharmacies];
    const zone = zoneSelect.value;
    const gardeOnly = gardeToggle.checked;
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (zone === "__non_classees") {
        filtered = filtered.filter(p => !p.zone);
    } else if (zone !== 'all') {
        filtered = filtered.filter(p => p.zone === zone);
    }
    if (gardeOnly) {
        filtered = filtered.filter(p => p.garde);
    }
    if (searchTerm) {
        filtered = filtered.filter(p => p.nom.includes(searchTerm) || (p.zone && p.zone.toLowerCase().includes(searchTerm)));
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
    
    if (pageItems.length === 0) {
        pharmacyGrid.innerHTML = '<div class="pharmacy-card">Aucune pharmacie ne correspond.</div>';
    } else {
        pharmacyGrid.innerHTML = pageItems.map(p => `
            <div class="pharmacy-card">
                <div class="pharmacy-name">${escapeHtml(p.nom)}</div>
                <div class="pharmacy-zone">${p.zone ? escapeHtml(p.zone) : 'Non classée'}</div>
                ${p.garde ? '<div class="garde-indicator">Garde cette semaine</div>' : ''}
                <div class="actions">
                    ${p.whatsapp ? `<a href="https://wa.me/${p.whatsapp}" class="btn-wa" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : ''}
                    ${p.telephone ? `<a href="tel:${p.telephone}" class="btn-call"><i class="fas fa-phone-alt"></i> Appeler</a>` : ''}
                </div>
            </div>
        `).join('');
    }
    
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
        btn.addEventListener('click', () => {
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

// Event listeners
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
    const div = document.createElement('div');
    div.className = 'message bot';
    div.innerText = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message user';
    div.innerText = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function processUserMessage(msg) {
    const lower = msg.toLowerCase();
    if (lower.includes('garde') || lower.includes('pharmacie de garde')) {
        const gardeList = pharmacies.filter(p => p.garde).slice(0, 5);
        if (gardeList.length === 0) addBotMessage("Aucune pharmacie de garde cette semaine.");
        else addBotMessage("Quelques pharmacies de garde : " + gardeList.map(p => p.nom).join(', '));
    } else if (lower.includes('zone') || lower.includes('quartier')) {
        addBotMessage("Quel quartier vous intéresse ? (ex: Agoè, Lomé Centre)");
        window.awaitingZone = true;
    } else if (window.awaitingZone) {
        window.awaitingZone = false;
        const zoneKey = Object.keys(zones).find(z => z.toLowerCase().includes(lower));
        if (zoneKey) {
            const pharms = zones[zoneKey];
            addBotMessage(`La zone ${zoneKey} contient ${pharms.length} pharmacies. Utilisez le filtre sur le site.`);
        } else {
            addBotMessage("Zone non reconnue. Essayez 'Agoè', 'Lomé Centre', etc.");
        }
    } else if (lower.includes('médicament') || lower.includes('stock')) {
        addBotMessage("Je ne peux pas vérifier le stock en temps réel. Vous pouvez contacter une pharmacie via WhatsApp. Voulez-vous voir les gardes ? (oui/non)");
        window.awaitingMed = true;
    } else if (window.awaitingMed) {
        window.awaitingMed = false;
        if (lower.includes('oui')) {
            const gardeList = pharmacies.filter(p => p.garde).slice(0, 5);
            addBotMessage("Pharmacies de garde : " + gardeList.map(p => p.nom).join(', '));
        } else {
            addBotMessage("D'accord. Puis-je vous aider autrement ?");
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

// Initial bot message
addBotMessage("Bienvenue sur PharmaGarde. Je suis votre assistant. Posez-moi une question sur les pharmacies de garde, les zones, ou les médicaments.");
