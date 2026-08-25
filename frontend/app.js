// Backend FastAPI in locale.
const API_BASE = "http://localhost:8000/api";

// --- 1. LETTURA E CANCELLAZIONE ---
let isToolsListVisible = false; // NUOVA: Memorizza se la lista è aperta o chiusa
let currentTools = []; // Salviamo i tool qui in memoria per non perdere dati durante l'update

async function loadTools() {
  const toolsList = document.getElementById("toolsList");
  const btn = document.getElementById("loadToolsBtn"); // Recuperiamo il bottone
  toolsList.innerHTML = "<li>Caricamento...</li>";
  
  try {
    const res = await fetch(`${API_BASE}/registry/tools`);
    currentTools = await res.json(); 
    toolsList.innerHTML = "";
    
    currentTools.forEach(tool => {
      const li = document.createElement("li");
      li.style.marginBottom = "15px";
      li.style.paddingBottom = "10px";
      li.style.borderBottom = "1px dashed var(--border)";
      
      const tags = tool.scope_tags ? tool.scope_tags.join(", ") : "";
      const caps = tool.capabilities ? tool.capabilities.join(", ") : "";

      li.innerHTML = `
        <strong>${tool.name}</strong> <span style="color: var(--muted); font-size: 0.9em;">(${tool.id})</span> 
        <span style="background: #e2e8f0; font-size: 0.75em; padding: 2px 6px; border-radius: 10px; float: right;">Owner: ${tool.owner || 'N/A'}</span>
        <br> 
        <span style="color: var(--text); font-size: 0.9em;">${tool.description}</span>
        <br>
        <span style="color: #3b82f6; font-size: 0.8em;"><strong>Tags:</strong> [${tags}]</span> | 
        <span style="color: #8b5cf6; font-size: 0.8em;"><strong>Caps:</strong> [${caps}]</span>
        <br>
        <button onclick="updateTool('${tool.id}')" style="background: #f59e0b; color: white; padding: 4px 10px; font-size: 0.8em; margin-top: 8px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">Modifica</button>
        <button onclick="deleteTool('${tool.id}')" style="background: #ef4444; color: white; padding: 4px 10px; font-size: 0.8em; margin-top: 8px; border: none; border-radius: 4px; cursor: pointer;">Elimina</button>
      `;
      toolsList.appendChild(li);
    });

    // Quando la lista viene caricata, cambiamo lo stato e il testo del bottone
    isToolsListVisible = true;
    btn.innerText = "Non mostrare più";

  } catch (err) {
    toolsList.innerHTML = "<li>Errore nel caricamento dei tool</li>";
  }
}

async function deleteTool(toolId) {
  // Finestra di conferma prima di eliminare
  if (!confirm(`Vuoi davvero eliminare il tool ${toolId}?`)) return;
  
  try {
    await fetch(`${API_BASE}/registry/tools/${toolId}`, { method: "DELETE" });
    loadTools(); // Ricarica la lista aggiornata dopo l'eliminazione
  } catch (err) {
    alert("Errore durante l'eliminazione");
  }
}

// --- 2. CREAZIONE ---
// --- 2. CREAZIONE ---
async function createTool() {
  const idInput = document.getElementById("newToolId");
  const nameInput = document.getElementById("newToolName");
  const scopeBtn = document.getElementById("scopeDropdownBtn");
  const capsBtn = document.getElementById("capsDropdownBtn");
  const endpointInput = document.getElementById("newToolEndpoint");

  const id = idInput.value.trim();
  const name = nameInput.value.trim();
  const endpointStr = endpointInput.value.trim();

  // Legge quali checkbox sono state selezionate nel menu a tendina
  const selectedScopes = Array.from(document.querySelectorAll('#scopeDropdownMenu input:checked')).map(cb => cb.value);
  const selectedCaps = Array.from(document.querySelectorAll('#capsDropdownMenu input:checked')).map(cb => cb.value);

  // --- 1. RESET VISIVO INIZIALE (Riporta tutto alla normalità) ---
  const resetStyle = (element) => {
    element.style.borderColor = "var(--border)";
    element.style.backgroundColor = "white";
  };
  
  resetStyle(idInput);
  resetStyle(nameInput);
  resetStyle(scopeBtn);
  resetStyle(capsBtn);
  resetStyle(endpointInput);

  // --- 2. CONTROLLO ERRORI VISIVO ---
  let hasError = false;

  const showError = (element) => {
    element.style.borderColor = "#ef4444"; // Diventa rosso
    element.style.backgroundColor = "#fef2f2";
    hasError = true;
  };

  // Ora colorerà di rosso SOLO quelli effettivamente vuoti in questo momento
  if (!id) showError(idInput);
  if (!name) showError(nameInput);
  if (selectedScopes.length === 0) showError(scopeBtn);
  if (selectedCaps.length === 0) showError(capsBtn);
  
  let validEndpoint = null;
  if (!endpointStr) {
    showError(endpointInput);
  } else {
    try {
      new URL(endpointStr);
      validEndpoint = endpointStr;
    } catch (err) {
      showError(endpointInput);
      return alert("Attenzione: L'Endpoint URL inserito non è valido. Assicurati di includere http:// o https://");
    }
  }

  if (hasError) {
    return alert("Compila tutti i campi obbligatori contrassegnati con l'asterisco (*)");
  }

  // Creiamo l'oggetto completo
  const newTool = {
    id: id,
    name: name,
    description: document.getElementById("newToolDesc").value.trim(),
    version: "0.1.0",
    scope_tags: selectedScopes,
    capabilities: selectedCaps,    
    input_schema: { type: document.getElementById("newToolInput").value || "any" },
    output_schema: { type: document.getElementById("newToolOutput").value || "any" },
    endpoint: validEndpoint, // Usiamo l'URL validato
    status: "active",
    owner: document.getElementById("newToolOwner").value.trim() || "lab"
  };

  try {
    const res = await fetch(`${API_BASE}/registry/tools`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(newTool)
    });

    if (!res.ok) {
      const err = await res.json();
      return alert("Errore dal server: " + err.detail);
    }

    // Pulizia di tutti i campi dopo il successo
    document.querySelectorAll("input[type='text'], input[type='url'], textarea").forEach(el => el.value = "");
    document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
    document.querySelectorAll("select").forEach(el => el.selectedIndex = 0); // Resetta Input/Output
    
    document.getElementById("scopeDropdownBtn").innerText = "Seleziona Scope * (Settore) ▼";
    capsMenu.innerHTML = "";
    capsBtn.innerText = "Seleziona prima uno Scope...";
    capsBtn.style.background = "#f8fafc";
    capsBtn.style.color = "var(--muted)";
    capsBtn.style.cursor = "not-allowed";
    
    loadTools(); // Ricarica la lista
  } catch (err) {
    alert("Errore di connessione con il server");
  }
}

// --- 3. AGGIORNAMENTO SICURO ---
async function updateTool(toolId) {
  // Trova il tool originale per non cancellare gli array e gli schemi non modificabili
  const originalTool = currentTools.find(t => t.id === toolId);
  if (!originalTool) return;

  const newName = prompt(`Modifica il nome per ${toolId}:`, originalTool.name);
  if (newName === null) return; 
  
  const newDesc = prompt(`Modifica la descrizione per ${toolId}:`, originalTool.description);
  if (newDesc === null) return;

  // Crea una copia del tool aggiornando solo nome e descrizione
  const updatedTool = { 
    ...originalTool, 
    name: newName.trim(), 
    description: newDesc.trim() 
  };

  try {
    const res = await fetch(`${API_BASE}/registry/tools/${toolId}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(updatedTool)
    });

    if (!res.ok) {
      const err = await res.json();
      return alert("Errore dal server: " + err.detail);
    }

    loadTools(); 
  } catch (err) {
    alert("Errore durante l'aggiornamento");
  }
}

// --- 4. ROUTER (Placeholder) ---
async function runRouter() {
  const text = document.getElementById("queryText").value;
  const domain = document.getElementById("domainText").value.trim();
  const out = document.getElementById("routeResults");
  out.innerHTML = "Elaborazione...";
  
  try {
    const res = await fetch(`${API_BASE}/router/match`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        text,
        domain: domain || null,
        desired_capabilities: [],
        top_k: 3
      })
    });
    
    if (!res.ok) {
        out.innerHTML = "Modulo Router non ancora implementato nel backend!";
        return;
    }
    
    const data = await res.json();
    out.innerHTML = "";
    data.results.forEach(item => {
      const div = document.createElement("div");
      div.className = "result";
      div.innerHTML = `<strong>${item.tool_name}</strong>
        <div class="score">Score: ${item.score}</div>
        <div>${item.reason}</div>`;
      out.appendChild(div);
    });
  } catch (err) {
    out.innerHTML = "Errore durante il routing (il server è spento o la rotta non esiste).";
  }
}

// --- ASSEGNAZIONE EVENTI AI PULSANTI ---
// Gestione interruttore (toggle) per mostrare/nascondere la lista
document.getElementById("loadToolsBtn").addEventListener("click", async () => {
  const btn = document.getElementById("loadToolsBtn");
  const toolsList = document.getElementById("toolsList");

  if (isToolsListVisible) {
    // Se la lista è visibile, la svuotiamo e resettiamo il bottone
    toolsList.innerHTML = "";
    btn.innerText = "Mostra Tools Registrati";
    isToolsListVisible = false;
  } else {
    // Se è nascosta, chiamiamo la funzione che la popola e cambia il testo
    await loadTools();
  }
});document.getElementById("createToolBtn").addEventListener("click", createTool);
document.getElementById("routeBtn").addEventListener("click", runRouter);

// --- GESTIONE MENU A TENDINA SCOPE ---
const scopeBtn = document.getElementById("scopeDropdownBtn");
const scopeMenu = document.getElementById("scopeDropdownMenu");
const scopeCheckboxes = document.querySelectorAll('#scopeDropdownMenu input[type="checkbox"]');

// Apri/Chiudi il menu al click sul bottone
scopeBtn.addEventListener("click", (e) => {
  e.preventDefault(); 
  scopeMenu.style.display = scopeMenu.style.display === "none" ? "block" : "none";
});

// Chiudi il menu se clicchi fuori
document.addEventListener("click", (e) => {
  if (!scopeBtn.contains(e.target) && !scopeMenu.contains(e.target)) {
    scopeMenu.style.display = "none";
  }
});

// Cambia il testo del bottone quando selezioni una casella
scopeCheckboxes.forEach(cb => {
  cb.addEventListener('change', () => {
    const checkedCount = document.querySelectorAll('#scopeDropdownMenu input:checked').length;
    if (checkedCount === 0) {
      scopeBtn.innerText = "Seleziona Scope ▼";
    } else {
      scopeBtn.innerText = `${checkedCount} scope selezionati ▼`;
    }
  });
});

// --- MAPPA DELLE CAPABILITIES E MENU DINAMICO ---
const scopeToCaps = {
  vision: ["classify_image", "extract_text", "detect_objects"],
  classification: ["return_top_label", "categorize_data"],
  document: ["parse_document", "extract_text", "summarize"],
  ocr: ["extract_text", "recognize_characters"],
  planning: ["plan_route", "optimize_schedule"],
  maps: ["estimate_distance", "find_location"],
  routing: ["plan_route", "estimate_distance"],
  nlp: ["summarize", "translate", "sentiment_analysis"],
  text: ["extract_keywords", "summarize"],
  analysis: ["generate_report", "analyze_trends"],
  audio: ["transcribe_audio", "audio_classification"],
  data: ["clean_data", "aggregate_data"]
};

const capsBtn = document.getElementById("capsDropdownBtn");
const capsMenu = document.getElementById("capsDropdownMenu");

capsBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (capsMenu.innerHTML.trim() !== "") { // Si apre solo se ci sono opzioni
    capsMenu.style.display = capsMenu.style.display === "none" ? "block" : "none";
  }
});

// Chiusura automatica cliccando fuori
document.addEventListener("click", (e) => {
  if (!capsBtn.contains(e.target) && !capsMenu.contains(e.target)) {
    capsMenu.style.display = "none";
  }
});

function updateCapabilitiesMenu() {
  const selectedScopes = Array.from(document.querySelectorAll('#scopeDropdownMenu input:checked')).map(cb => cb.value);
  
  // Usiamo un Set per evitare capabilities duplicate (es. ocr e document hanno entrambi extract_text)
  let availableCaps = new Set();
  selectedScopes.forEach(scope => {
    if (scopeToCaps[scope]) scopeToCaps[scope].forEach(cap => availableCaps.add(cap));
  });

  capsMenu.innerHTML = ""; // Svuotiamo il menu

 if (availableCaps.size === 0) {
    capsBtn.innerText = "Seleziona prima uno Scope...";
    capsBtn.style.background = "#f8fafc";
    capsBtn.style.color = "var(--muted)"; // <-- AGGIUNGI QUESTA: Torna grigio se lo disabiliti
    capsBtn.style.cursor = "not-allowed";
    capsMenu.style.display = "none";
  } else {
    capsBtn.innerText = "Seleziona Capabilities * ▼";
    capsBtn.style.background = "white";
    capsBtn.style.color = "var(--text)"; // <-- AGGIUNGI QUESTA: Diventa nero quando si attiva!
    capsBtn.style.cursor = "pointer";
    
    availableCaps.forEach(cap => {
      const label = document.createElement("label");
      label.style.cssText = "display: flex; align-items: center; gap: 8px; padding: 4px; cursor: pointer; margin: 0;";
      label.innerHTML = `<input type="checkbox" value="${cap}" style="width: auto; margin: 0; padding: 0;"> ${cap}`;
      capsMenu.appendChild(label);
    });

    // Aggiorniamo il testo del bottone quando si selezionano le capabilities
    capsMenu.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checkedCount = capsMenu.querySelectorAll('input:checked').length;
        capsBtn.innerText = checkedCount === 0 ? "Seleziona Capabilities ▼" : `${checkedCount} capabilities selezionate ▼`;
      });
    });
  }
}

// Quando clicco uno scope, ricalcola le capabilities
scopeCheckboxes.forEach(cb => cb.addEventListener('change', updateCapabilitiesMenu));

// --- RIMOZIONE ERRORI VISIVI QUANDO SI SCRIVE ---
const clearError = (element) => {
  element.style.borderColor = "var(--border)";
  element.style.backgroundColor = "white";
};

document.getElementById("newToolId").addEventListener("input", function() { clearError(this); });
document.getElementById("newToolName").addEventListener("input", function() { clearError(this); });
document.getElementById("newToolEndpoint").addEventListener("input", function() { clearError(this); });

document.getElementById("scopeDropdownBtn").addEventListener("click", function() {
  if (this.style.borderColor === "rgb(239, 68, 68)" || this.style.borderColor === "#ef4444") clearError(this);
});
document.getElementById("capsDropdownBtn").addEventListener("click", function() {
  if (this.style.borderColor === "rgb(239, 68, 68)" || this.style.borderColor === "#ef4444") clearError(this);
});