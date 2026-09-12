// Backend FastAPI in locale.
const API_BASE = "http://localhost:8000/api";

// --- 1. LETTURA E CANCELLAZIONE ---
let isToolsListVisible = false; 
let currentTools = []; 

async function loadTools() {
  const toolsList = document.getElementById("toolsList");
  const btn = document.getElementById("loadToolsBtn"); 
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

    isToolsListVisible = true;
    btn.innerText = "Non mostrare più";

  } catch (err) {
    toolsList.innerHTML = "<li>Errore nel caricamento dei tool</li>";
  }
}

async function deleteTool(toolId) {
  if (!confirm(`Vuoi davvero eliminare il tool ${toolId}?`)) return;
  
  try {
    await fetch(`${API_BASE}/registry/tools/${toolId}`, { method: "DELETE" });
    loadTools(); 
  } catch (err) {
    alert("Errore durante l'eliminazione");
  }
}

// --- GENERAZIONE AUTOMATICA DELL'ID DAL NOME ---
document.getElementById("newToolName").addEventListener("input", function(e) {
  const nameVal = e.target.value;
  // Converte in minuscolo, sostituisce spazi e underscore con trattini, rimuove caratteri speciali
  const generatedId = nameVal
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') 
    .replace(/[^a-z0-9-]/g, ''); 
    
  document.getElementById("newToolId").value = generatedId;
});

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

  const selectedScopes = Array.from(document.querySelectorAll('#scopeDropdownMenu input:checked')).map(cb => cb.value);
  const selectedCaps = Array.from(document.querySelectorAll('#capsDropdownMenu input:checked')).map(cb => cb.value);

  // --- 1. RESET VISIVO INIZIALE ---
  const resetStyle = (element) => {
    element.style.borderColor = "var(--border)";
    element.style.backgroundColor = element.readOnly ? "#f1f5f9" : "white";
  };
  
  resetStyle(idInput);
  resetStyle(nameInput);
  resetStyle(scopeBtn);
  resetStyle(capsBtn);
  resetStyle(endpointInput);

  // --- 2. CONTROLLO ERRORI VISIVO ---
  let hasError = false;

  const showError = (element) => {
    element.style.borderColor = "#ef4444"; 
    element.style.backgroundColor = "#fef2f2";
    hasError = true;
  };

  if (!name) showError(nameInput);
  if (!id) showError(idInput); // Questo scatterà solo se il nome è vuoto o fatto di soli simboli
  if (selectedScopes.length === 0) showError(scopeBtn);
  if (selectedCaps.length === 0) showError(capsBtn);
  
  let validEndpoint = null;
  if (!endpointStr) {
    showError(endpointInput);
  } else {
    let sanitizedEndpoint = endpointStr.toLowerCase();
    if (!sanitizedEndpoint.startsWith("http://") && !sanitizedEndpoint.startsWith("https://")) {
      sanitizedEndpoint = "http://" + endpointStr; 
    }

    try {
      new URL(sanitizedEndpoint);
      validEndpoint = sanitizedEndpoint; 
      endpointInput.value = validEndpoint; 
    } catch (err) {
      showError(endpointInput);
      return alert("Attenzione: L'Endpoint URL inserito non è nel formato corretto.");
    }
  }

  if (hasError) {
    return alert("Compila tutti i campi obbligatori contrassegnati con l'asterisco (*)");
  }

  // --- 3. CONTROLLO DUPLICATI (ID UNIVOCO) ---
  try {
    const checkRes = await fetch(`${API_BASE}/registry/tools`);
    if (checkRes.ok) {
      const existingTools = await checkRes.json();
      if (existingTools.some(t => t.id === id)) {
        showError(idInput);
        showError(nameInput);
        return alert(`Attenzione: L'ID generato '${id}' esiste già nel Registry. Modifica leggermente il Nome del tool per renderlo univoco.`);
      }
    }
  } catch (err) {
    console.warn("Impossibile verificare i duplicati lato client, il server se ne occuperà.");
  }

  // --- 4. CREAZIONE OGGETTO E INVIO ---
  const newTool = {
    id: id,
    name: name,
    description: document.getElementById("newToolDesc").value.trim(),
    version: "0.1.0",
    scope_tags: selectedScopes,
    capabilities: selectedCaps,    
    input_schema: { type: document.getElementById("newToolInput").value || "any" },
    output_schema: { type: document.getElementById("newToolOutput").value || "any" },
    endpoint: validEndpoint,
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

    // Pulizia dei campi
    document.querySelectorAll("input[type='text']:not([readonly]), input[type='url'], textarea").forEach(el => el.value = "");
    document.getElementById("newToolId").value = ""; // Svuotiamo anche l'ID readonly
    document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
    document.querySelectorAll("select").forEach(el => el.selectedIndex = 0);
    
    document.getElementById("scopeDropdownBtn").innerText = "Seleziona Scope (Settore) * ▼";
    capsMenu.innerHTML = "";
    capsBtn.innerText = "Seleziona prima uno Scope...";
    capsBtn.style.background = "#f8fafc";
    capsBtn.style.color = "var(--muted)";
    capsBtn.style.cursor = "not-allowed";
    
    loadTools(); 
  } catch (err) {
    alert("Errore di connessione con il server");
  }
}

// --- 3. AGGIORNAMENTO SICURO ---
async function updateTool(toolId) {
  const originalTool = currentTools.find(t => t.id === toolId);
  if (!originalTool) return;

  const newName = prompt(`Modifica il nome per ${toolId}:`, originalTool.name);
  if (newName === null) return; 
  
  const newDesc = prompt(`Modifica la descrizione per ${toolId}:`, originalTool.description);
  if (newDesc === null) return;

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

// --- 4. SCOPE  ROUTER ---
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
document.getElementById("loadToolsBtn").addEventListener("click", async () => {
  const btn = document.getElementById("loadToolsBtn");
  const toolsList = document.getElementById("toolsList");

  if (isToolsListVisible) {
    toolsList.innerHTML = "";
    btn.innerText = "Mostra Tools Registrati";
    isToolsListVisible = false;
  } else {
    await loadTools();
  }
});

document.getElementById("createToolBtn").addEventListener("click", createTool);
document.getElementById("routeBtn").addEventListener("click", runRouter);

// --- GESTIONE MENU A TENDINA SCOPE ---
const scopeBtn = document.getElementById("scopeDropdownBtn");
const scopeMenu = document.getElementById("scopeDropdownMenu");
const scopeCheckboxes = document.querySelectorAll('#scopeDropdownMenu input[type="checkbox"]');

scopeBtn.addEventListener("click", (e) => {
  e.preventDefault(); 
  scopeMenu.style.display = scopeMenu.style.display === "none" ? "block" : "none";
});

document.addEventListener("click", (e) => {
  if (!scopeBtn.contains(e.target) && !scopeMenu.contains(e.target)) {
    scopeMenu.style.display = "none";
  }
});

scopeCheckboxes.forEach(cb => {
  cb.addEventListener('change', () => {
    const checkedCount = document.querySelectorAll('#scopeDropdownMenu input:checked').length;
    if (checkedCount === 0) {
      scopeBtn.innerText = "Seleziona Scope (Settore) * ▼";
    } else {
      scopeBtn.innerText = `${checkedCount} scope selezionato/i ▼`;
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

const capsDescriptions = {
  "classify_image": "Assegna una categoria o etichetta a un'immagine.",
  "extract_text": "Estrae testo da documenti o immagini.",
  "detect_objects": "Individua e delimita oggetti specifici.",
  "return_top_label": "Restituisce la classe con la probabilità più alta.",
  "categorize_data": "Suddivide un dataset in categorie logiche.",
  "parse_document": "Analizza layout e struttura del documento.",
  "summarize": "Genera un riassunto del documento o testo.",
  "recognize_characters": "Converte i pixel in caratteri digitali.",
  "plan_route": "Calcola un percorso o una sequenza logica di passi.",
  "optimize_schedule": "Ottimizza le tempistiche di una serie di azioni.",
  "estimate_distance": "Calcola la distanza fisica o logica.",
  "find_location": "Individua le coordinate geografiche di un luogo.",
  "translate": "Traduce il testo da una lingua all'altra.",
  "sentiment_analysis": "Valuta il tono emotivo del testo.",
  "extract_keywords": "Individua le parole chiave principali.",
  "generate_report": "Crea un documento riassuntivo dei dati.",
  "analyze_trends": "Individua pattern e tendenze nel tempo.",
  "transcribe_audio": "Converte l'audio parlato in testo testuale.",
  "audio_classification": "Categorizza il tipo di suono (es. voce, rumore).",
  "clean_data": "Rimuove rumore o formattazioni errate dai dati.",
  "aggregate_data": "Raggruppa e sintetizza dataset complessi."
};

const capsBtn = document.getElementById("capsDropdownBtn");
const capsMenu = document.getElementById("capsDropdownMenu");

capsBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (capsMenu.innerHTML.trim() !== "") {
    capsMenu.style.display = capsMenu.style.display === "none" ? "block" : "none";
  }
});

document.addEventListener("click", (e) => {
  if (!capsBtn.contains(e.target) && !capsMenu.contains(e.target)) {
    capsMenu.style.display = "none";
  }
});

function updateCapabilitiesMenu() {
  const selectedScopes = Array.from(document.querySelectorAll('#scopeDropdownMenu input:checked')).map(cb => cb.value);
  
  let availableCaps = new Set();
  selectedScopes.forEach(scope => {
    if (scopeToCaps[scope]) scopeToCaps[scope].forEach(cap => availableCaps.add(cap));
  });

  capsMenu.innerHTML = ""; 

 if (availableCaps.size === 0) {
    capsBtn.innerText = "Seleziona prima uno Scope...";
    capsBtn.style.background = "#f8fafc";
    capsBtn.style.color = "var(--muted)";
    capsBtn.style.cursor = "not-allowed";
    capsMenu.style.display = "none";
  } else {
    capsBtn.innerText = "Seleziona Capabilities * ▼";
    capsBtn.style.background = "white";
    capsBtn.style.color = "var(--text)";
    capsBtn.style.cursor = "pointer";
    
    availableCaps.forEach(cap => {
      const desc = capsDescriptions[cap] || "Capacità operativa."; 
      const label = document.createElement("label");
      label.style.cssText = "display: flex; align-items: flex-start; gap: 8px; padding: 6px 4px; cursor: pointer; margin: 0; border-bottom: 1px solid #f1f5f9;";
      label.innerHTML = `
        <input type="checkbox" value="${cap}" style="width: auto; margin-top: 4px; padding: 0;"> 
        <span style="font-size: 0.9em;"><strong>${cap}</strong><br><span style="color: var(--muted); font-size: 0.85em;">${desc}</span></span>
      `;
      capsMenu.appendChild(label);
    });

    capsMenu.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checkedCount = capsMenu.querySelectorAll('input:checked').length;
        capsBtn.innerText = checkedCount === 0 ? "Seleziona Capabilities ▼" : `${checkedCount} capabilities selezionata/e ▼`;
      });
    });
  }
}

scopeCheckboxes.forEach(cb => cb.addEventListener('change', updateCapabilitiesMenu));

// --- RIMOZIONE ERRORI VISIVI QUANDO SI SCRIVE ---
const clearError = (element) => {
  element.style.borderColor = "var(--border)";
  element.style.backgroundColor = element.readOnly ? "#f1f5f9" : "white";
};

document.getElementById("newToolName").addEventListener("input", function() { 
  clearError(this); 
  clearError(document.getElementById("newToolId")); // Pulisce l'errore anche sull'ID collegato
});
document.getElementById("newToolEndpoint").addEventListener("input", function() { clearError(this); });

document.getElementById("scopeDropdownBtn").addEventListener("click", function() {
  if (this.style.borderColor === "rgb(239, 68, 68)" || this.style.borderColor === "#ef4444") clearError(this);
});
document.getElementById("capsDropdownBtn").addEventListener("click", function() {
  if (this.style.borderColor === "rgb(239, 68, 68)" || this.style.borderColor === "#ef4444") clearError(this);
});

// --- FUNZIONE DI TEST PER IL TOOL NLP ESTERNO (Porta 8001) ---
async function testSentimentTool() {
  const textInput = document.getElementById("testTextInput").value.trim();
  const resultDiv = document.getElementById("testResult");
  
  if (!textInput) {
    return alert("Inserisci una frase da analizzare!");
  }

  resultDiv.style.display = "block";
  document.getElementById("resText").innerText = "Elaborazione in corso...";
  document.getElementById("resLabel").innerText = "...";
  document.getElementById("resLabel").style.background = "transparent";
  document.getElementById("resLabel").style.color = "black";
  document.getElementById("resScore").innerText = "...";

  try {
    const res = await fetch("http://127.0.0.1:8001/analyze-sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textInput })
    });

    if (!res.ok) {
      throw new Error("Errore dal server del tool");
    }

    const data = await res.json();

    document.getElementById("resText").innerText = data.text_analyzed;
    document.getElementById("resScore").innerText = data.polarity_score;
    
    const labelSpan = document.getElementById("resLabel");
    labelSpan.innerText = data.sentiment_label;
    
    if (data.sentiment_label === "POSITIVE") {
      labelSpan.style.background = "#dcfce7";
      labelSpan.style.color = "#166534";
    } else if (data.sentiment_label === "NEGATIVE") {
      labelSpan.style.background = "#fee2e2";
      labelSpan.style.color = "#991b1b";
    } else {
      labelSpan.style.background = "#f1f5f9";
      labelSpan.style.color = "#475569";
    }

  } catch (err) {
    alert("Impossibile connettersi al Tool. Assicurati che sia in esecuzione sulla porta 8001.");
    resultDiv.style.display = "none";
  }
}