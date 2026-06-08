// État global
let pharmacies = [];
let zonesSet = new Set();
let currentFilterZone = "all";
let currentGardeOnly = false;

// Éléments DOM
const zoneSelect = document.getElementById('zone-select');
const gardeOnlyCheckbox = document.getElementById('garde-only');
const pharmacyListDiv = document.getElementById('pharmacy-list');
const pharmacyCountSpan = document.getElementById('pharmacy-count');
const resetBtn = document.getElementById('reset-filters');

// Chatbot state
let currentIntent = null; // 'garde', 'medicament', 'livraison'
let conversationStep = 0; // pour la gestion de la conversation

// Charger les données JSON
fetch('pharmacies.json')
    .then(response => response.json())
    .then(data => {
        pharmacies = data;
        buildZones();
        populateZoneSelect();
        applyFilters();
    })
    .catch(err => console.error('Erreur chargement pharmacies:', err));

function buildZones() {
    pharmacies.forEach(p => {
        if (p.zone) zonesSet.add(p.zone);
    });
}

function populateZoneSelect() {
    const sortedZones = Array.from(zonesSet).sort();
    sortedZones.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        zoneSelect.appendChild(option);
    });
}

function applyFilters() {
    let filtered = [...pharmacies];

    if (currentFilterZone !== 'all') {
        filtered = filtered.filter(p => p.zone === currentFilterZone);
    }
    if (currentGardeOnly) {
        filtered = filtered.filter(p => p.garde === true);
    }

    displayPharmacies(filtered);
    pharmacyCountSpan.textContent = `${filtered.length} pharmacie(s) trouvée(s)`;
}

function displayPharmacies(pharmaciesList) {
    if (pharmaciesList.length === 0) {
        pharmacyListDiv.innerHTML = '<div class="pharmacy-card">Aucune pharmacie ne correspond aux critères.</div>';
        return;
    }

    const html = pharmaciesList.map(pharm => `
        <div class="pharmacy-card">
            <div class="pharmacy-name">${escapeHtml(pharm.nom)}</div>
            <div class="pharmacy-zone">${escapeHtml(pharm.zone || 'Zone non définie')}</div>
            ${pharm.garde ? '<div class="garde-badge">Garde cette semaine</div>' : ''}
            <div class="pharmacy-actions">
                ${pharm.whatsapp ? `<a href="https://wa.me/${pharm.whatsapp}" class="btn-wa" target="_blank">WhatsApp</a>` : ''}
                ${pharm.telephone ? `<a href="tel:${pharm.telephone}" class="btn-call">Appeler</a>` : ''}
            </div>
            <div class="stock-feedback">
                <a href="#" data-pharm="${pharm.nom}" class="stock-link">✔️ J’ai trouvé mon médicament ici</a> &nbsp;|&nbsp;
                <a href="#" data-pharm="${pharm.nom}" class="rupture-link">❌ Rupture signalée</a>
            </div>
        </div>
    `).join('');
    pharmacyListDiv.innerHTML = html;

    // Attacher événements feedback stock
    document.querySelectorAll('.stock-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const nom = link.dataset.pharm;
            handleStockFeedback(nom, 'trouve');
        });
    });
    document.querySelectorAll('.rupture-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const nom = link.dataset.pharm;
            handleStockFeedback(nom, 'rupture');
        });
    });
}

function handleStockFeedback(nom, status) {
    // Simuler l'enregistrement (on pourrait stocker dans localStorage ou envoyer à un serveur)
    console.log(`Feedback: ${nom} - ${status}`);
    alert(`Merci pour votre retour sur ${nom}. Cela aide la communauté.`);
    // Optionnel: incrémenter un compteur dans un objet local pour afficher "rupture fréquente"
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

// Écouteurs filtres
zoneSelect.addEventListener('change', (e) => {
    currentFilterZone = e.target.value;
    applyFilters();
});
gardeOnlyCheckbox.addEventListener('change', (e) => {
    currentGardeOnly = e.target.checked;
    applyFilters();
});
resetBtn.addEventListener('click', () => {
    zoneSelect.value = 'all';
    gardeOnlyCheckbox.checked = false;
    currentFilterZone = 'all';
    currentGardeOnly = false;
    applyFilters();
});

// ==================== CHATBOT MAISON ====================
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-chat');
const openChatBtn = document.getElementById('open-chat');
const closeChatBtn = document.getElementById('close-chat');
const chatbotDiv = document.getElementById('chatbot');

openChatBtn.addEventListener('click', () => {
    chatbotDiv.classList.remove('hidden');
    openChatBtn.style.display = 'none';
});
closeChatBtn.addEventListener('click', () => {
    chatbotDiv.classList.add('hidden');
    openChatBtn.style.display = 'flex';
});

function addBotMessage(text, showOptions = false, options = []) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    if (showOptions && options.length) {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'chat-options';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.innerText = opt.label;
            btn.dataset.value = opt.value;
            btn.addEventListener('click', () => {
                handleUserChoice(opt.value);
            });
            optionsDiv.appendChild(btn);
        });
        chatMessages.appendChild(optionsDiv);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user';
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleUserChoice(choice) {
    addUserMessage(choice);
    if (choice === 'garde') {
        currentIntent = 'garde';
        addBotMessage("Souhaitez-vous voir les pharmacies de garde dans une zone précise ? Donnez-moi un quartier (ex: Agoè, Lomé Centre, Baguida) ou tapez 'toutes'.");
        conversationStep = 1;
    } else if (choice === 'medicament') {
        currentIntent = 'medicament';
        addBotMessage("Quel médicament recherchez-vous ? (tapez son nom)");
        conversationStep = 1;
    } else if (choice === 'livraison') {
        currentIntent = 'livraison';
        addBotMessage("Pour une livraison, veuillez contacter directement une pharmacie via WhatsApp. Je peux vous aider à trouver une pharmacie de garde près de chez vous. Quel est votre quartier ?");
        conversationStep = 1;
    } else if (choice === 'retour') {
        resetConversation();
    } else {
        // Gestion des réponses libres
        if (currentIntent === 'garde' && conversationStep === 1) {
            const zone = choice;
            if (zone.toLowerCase() === 'toutes') {
                addBotMessage("Voici toutes les pharmacies de garde actuelles :");
                displayGardePharmacies();
            } else {
                addBotMessage(`Voici les pharmacies de garde dans ${zone} :`);
                displayGardeByZone(zone);
            }
            addBotMessage("Souhaitez-vous autre chose ?", true, [
                {label: "Autre recherche", value: "retour"},
                {label: "Fermer", value: "close"}
            ]);
        } 
        else if (currentIntent === 'medicament' && conversationStep === 1) {
            const medicament = choice;
            addBotMessage(`Je ne peux pas vérifier le stock en temps réel. Mais vous pouvez contacter une pharmacie via WhatsApp pour demander "${medicament}". Voulez-vous voir la liste des pharmacies de garde ?`, true, [
                {label: "Oui, voir les gardes", value: "garde"},
                {label: "Non, merci", value: "close"}
            ]);
        }
        else if (currentIntent === 'livraison' && conversationStep === 1) {
            const quartier = choice;
            addBotMessage(`Je recherche des pharmacies de garde à ${quartier}...`);
            displayGardeByZone(quartier);
            addBotMessage("Contactez-les directement pour la livraison. Besoin d'autre chose ?", true, [
                {label: "Autre", value: "retour"},
                {label: "Fermer", value: "close"}
            ]);
        }
        else {
            addBotMessage("Je n'ai pas compris. Reprenons depuis le début.", true, [
                {label: "Pharmacies de garde", value: "garde"},
                {label: "Médicament", value: "medicament"},
                {label: "Livraison", value: "livraison"}
            ]);
        }
    }
}

function displayGardePharmacies() {
    const gardes = pharmacies.filter(p => p.garde === true);
    if (gardes.length === 0) {
        addBotMessage("Aucune pharmacie de garde trouvée cette semaine.");
        return;
    }
    let message = "Pharmacies de garde :\n";
    gardes.slice(0, 5).forEach(p => {
        message += `- ${p.nom} (${p.zone || 'Zone inconnue'})\n`;
    });
    if (gardes.length > 5) message += `... et ${gardes.length - 5} autres. Utilisez le filtre sur le site pour tout voir.`;
    addBotMessage(message);
}

function displayGardeByZone(zone) {
    const filtered = pharmacies.filter(p => p.garde === true && p.zone && p.zone.toLowerCase().includes(zone.toLowerCase()));
    if (filtered.length === 0) {
        addBotMessage(`Aucune pharmacie de garde trouvée pour "${zone}". Essayez une autre zone.`);
    } else {
        let message = `Pharmacies de garde à ${zone} :\n`;
        filtered.slice(0, 5).forEach(p => {
            message += `- ${p.nom}\n`;
        });
        if (filtered.length > 5) message += `... et ${filtered.length - 5} autres.`;
        addBotMessage(message);
    }
}

function resetConversation() {
    currentIntent = null;
    conversationStep = 0;
    addBotMessage("Que souhaitez-vous faire ?", true, [
        {label: "Pharmacies de garde", value: "garde"},
        {label: "Un médicament", value: "medicament"},
        {label: "Livraison", value: "livraison"}
    ]);
}

sendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    chatInput.value = '';
    handleUserChoice(text);
});

// Initialiser la conversation
setTimeout(() => {
    addBotMessage("Bienvenue sur PharmaGarde Togo. Je suis votre assistant. Que recherchez-vous ?", true, [
        {label: "Pharmacies de garde", value: "garde"},
        {label: "Un médicament", value: "medicament"},
        {label: "Livraison", value: "livraison"}
    ]);
}, 500);
