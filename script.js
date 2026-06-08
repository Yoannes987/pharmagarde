let pharmacies = [];
let gardes = [];
let zonesSet = new Set();
let currentFilterZone = "all";
let currentGardeOnly = false;

const zoneSelect = document.getElementById('zone-select');
const gardeOnlyCheckbox = document.getElementById('garde-only');
const pharmacyListDiv = document.getElementById('pharmacy-list');
const pharmacyCountSpan = document.getElementById('pharmacy-count');
const resetBtn = document.getElementById('reset-filters');

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
}).catch(err => console.error('Erreur chargement:', err));

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

function displayPharmacies(list) {
    if (list.length === 0) {
        pharmacyListDiv.innerHTML = '<div class="pharmacy-card">Aucune pharmacie ne correspond aux critères.</div>';
        return;
    }
    pharmacyListDiv.innerHTML = list.map(p => `
        <div class="pharmacy-card">
            <div class="pharmacy-name">${escapeHtml(p.nom)}</div>
            <div class="pharmacy-zone">${escapeHtml(p.zone || 'Zone non définie')}</div>
            ${p.garde ? '<div class="garde-badge">Garde cette semaine</div>' : ''}
            <div class="pharmacy-actions">
                ${p.whatsapp ? `<a href="https://wa.me/${p.whatsapp}" class="btn-wa" target="_blank">WhatsApp</a>` : ''}
                ${p.telephone ? `<a href="tel:${p.telephone}" class="btn-call">Appeler</a>` : ''}
            </div>
            <div class="stock-feedback">
                <a href="#" data-pharm="${p.nom}" class="stock-link">✔ J’ai trouvé mon médicament ici</a> &nbsp;|&nbsp;
                <a href="#" data-pharm="${p.nom}" class="rupture-link">✖ Rupture signalée</a>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.stock-link, .rupture-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const nom = link.dataset.pharm;
            const type = link.classList.contains('stock-link') ? 'trouve' : 'rupture';
            alert(`Merci pour votre retour sur ${nom}. Cela aide la communauté.`);
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

// Chatbot
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
            btn.onclick = () => handleUserChoice(opt.value);
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
        addBotMessage("Voulez-vous voir toutes les gardes ou dans une zone précise ?", true, [
            {label: "Toutes les gardes", value: "toutes_gardes"},
            {label: "Par zone", value: "zone_garde"}
        ]);
    } else if (choice === 'toutes_gardes') {
        const gardes = pharmacies.filter(p => p.garde);
        if (gardes.length === 0) addBotMessage("Aucune pharmacie de garde cette semaine.");
        else addBotMessage(`Il y a ${gardes.length} pharmacie(s) de garde. Utilisez le filtre sur le site pour les voir.`);
        resetConversation();
    } else if (choice === 'zone_garde') {
        addBotMessage("Quel quartier ou zone ? (ex: Agoè, Lomé Centre)");
        window.attenteZone = true;
    } else if (choice === 'medicament') {
        addBotMessage("Quel médicament cherchez-vous ?");
        window.attenteMedicament = true;
    } else if (choice === 'livraison') {
        addBotMessage("Pour une livraison, contactez directement une pharmacie via WhatsApp. Voulez-vous voir les pharmacies de garde ?", true, [
            {label: "Oui", value: "garde"},
            {label: "Non", value: "retour"}
        ]);
    } else if (choice === 'retour') {
        resetConversation();
    } else {
        if (window.attenteZone) {
            window.attenteZone = false;
            const zone = choice;
            const gardes = pharmacies.filter(p => p.garde && p.zone && p.zone.toLowerCase().includes(zone.toLowerCase()));
            if (gardes.length === 0) addBotMessage(`Aucune garde trouvée pour "${zone}".`);
            else addBotMessage(`${gardes.length} pharmacie(s) de garde trouvée(s) à ${zone}. Utilisez le filtre sur le site.`);
            resetConversation();
        } else if (window.attenteMedicament) {
            window.attenteMedicament = false;
            addBotMessage(`Je ne peux pas vérifier le stock en temps réel. Contactez une pharmacie via WhatsApp pour "${choice}". Voulez-vous voir les gardes ?`, true, [
                {label: "Voir les gardes", value: "garde"},
                {label: "Non", value: "retour"}
            ]);
        } else {
            addBotMessage("Je n'ai pas compris. Reprenons.", true, [
                {label: "Pharmacies de garde", value: "garde"},
                {label: "Médicament", value: "medicament"},
                {label: "Livraison", value: "livraison"}
            ]);
        }
    }
}

function resetConversation() {
    window.attenteZone = false;
    window.attenteMedicament = false;
    addBotMessage("Que souhaitez-vous faire ?", true, [
        {label: "Pharmacies de garde", value: "garde"},
        {label: "Médicament", value: "medicament"},
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

setTimeout(() => {
    addBotMessage("Bienvenue sur PharmaGarde Togo. Je suis votre assistant. Que recherchez-vous ?", true, [
        {label: "Pharmacies de garde", value: "garde"},
        {label: "Médicament", value: "medicament"},
        {label: "Livraison", value: "livraison"}
    ]);
}, 300);
