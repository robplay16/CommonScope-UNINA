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
    if (!res.ok) throw new Error("Errore API");
    
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
    btn.innerText = "Non mostrare più 🔼";

  } catch (err) {
    toolsList.innerHTML = "<li>Errore nel caricamento dei tool</li>";
    // TOAST DI ERRORE
    showToast("Impossibile caricare i tool. Verifica che il Registry (porta 8000) sia attivo.", "error");
  }
}


async function deleteTool(toolId) {
  if (!confirm(`Vuoi davvero eliminare il tool ${toolId}?`)) return;
  
  try {
    const res = await fetch(`${API_BASE}/registry/tools/${toolId}`, { method: "DELETE" });
    
    // Se il server risponde con un errore (es. 404 o 500), scatta il catch
    if (!res.ok) throw new Error("Errore API");
    
    // TOAST DI SUCCESSO (Giallo/Arancione perché è un'eliminazione)
    showToast(`Tool ${toolId} eliminato correttamente!`, "warning");
    
    loadTools(); 
  } catch (err) {
    // TOAST DI ERRORE
    showToast(`Errore durante l'eliminazione del tool ${toolId}.`, "error");
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
  if (!id) showError(idInput);
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
      showToast("Attenzione: L'Endpoint URL inserito non è nel formato corretto.", "error");
      return; 
    }
  }

  if (hasError) {
    showToast("Compila tutti i campi obbligatori contrassegnati con l'asterisco (*)", "error");
    return;
  }

  // --- 3. CONTROLLO DUPLICATI (ID UNIVOCO) ---
  try {
    const checkRes = await fetch(`${API_BASE}/registry/tools`);
    if (checkRes.ok) {
      const existingTools = await checkRes.json();
      if (existingTools.some(t => t.id === id)) {
        showError(idInput);
        showError(nameInput);
        showToast(`L'ID '${id}' esiste già. Modifica il Nome per renderlo univoco.`, "warning");
        return;
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
      showToast("Errore dal server: " + (err.detail || "Registrazione fallita"), "error");
      return;
    }

    // TOAST DI SUCCESSO (VERDE) INSERITO QUI
    showToast("Nuovo Tool registrato con successo!", "success");

    // Pulizia dei campi
    document.querySelectorAll("input[type='text']:not([readonly]), input[type='url'], textarea").forEach(el => el.value = "");
    document.getElementById("newToolId").value = ""; 
    document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
    document.querySelectorAll("select").forEach(el => el.selectedIndex = 0);
    
    document.getElementById("scopeDropdownBtn").innerText = "Seleziona Scope (Settore) * ▼";
    
    const capsMenu = document.getElementById("capsDropdownMenu");
    if (capsMenu) capsMenu.innerHTML = "";
    
    capsBtn.innerText = "Seleziona prima uno Scope...";
    capsBtn.style.background = "#f8fafc";
    capsBtn.style.color = "var(--muted)";
    capsBtn.style.cursor = "not-allowed";
    
    loadTools(); 
  } catch (err) {
    showToast("Errore di connessione con il server", "error");
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
// --- 4. ROUTER (Chiamata al Microservizio AI con Human-in-the-Loop) ---
async function runRouter() {
  const text = document.getElementById("queryText").value.trim();
  const out = document.getElementById("routeResults");

  if (!text) {
    return alert("Inserisci una richiesta da analizzare.");
  }

  // Feedback visivo di attesa
  out.innerHTML = `
    <div style="padding: 15px; border-radius: 8px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a;">
      ⏳ Invio della richiesta al Router Neurale (Porta 8002) in corso...
    </div>`;

  try {
    const res = await fetch("http://127.0.0.1:8002/analyze-scope", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text })
    });

    if (!res.ok) throw new Error("Errore dal server Router");

    const data = await res.json();
    const predictions = data.predictions; // Ora è un array di risultati ordinati
    let currentIndex = 0; // Partiamo dal vincitore (indice 0)

    // Funzione interna per generare (o aggiornare) l'interfaccia
    function renderResult() {
      const currentPred = predictions[currentIndex];
      const detectedScope = currentPred.scope;
      const isNlp = detectedScope === "nlp";
      
      // Controllo se ci sono altre opzioni nella lista per disabilitare il tasto "Prossimo" alla fine
      const hasMore = currentIndex < predictions.length - 1;

    // Stili dinamici (Aggiornati per la nuova UI)
      const btnStyle = isNlp 
        ? "background: #10b981; color: white; cursor: pointer;" 
        : "background: #e2e8f0; color: #94a3b8; cursor: not-allowed;";
      
      const btnText = isNlp 
        ? "Conferma e vai allo Strumento" 
        : "Nessun Tool attivo"; // Testo accorciato per un layout più pulito
        
      const nextBtnBg = hasMore ? '#f59e0b' : '#e2e8f0';
      const nextBtnColor = hasMore ? 'white' : '#94a3b8';
      const nextBtnCursor = hasMore ? 'pointer' : 'not-allowed';

      // Disegniamo la Card (Design State of the Art)
      out.innerHTML = `
        <div style="border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin-top: 20px; background: #f0f9ff;">
          
          <h4 style="margin: 0 0 8px 0; color: #0284c7; font-size: 1.1em;">🔍 Routing Semantico Completato</h4>
          <p style="margin: 0 0 16px 0; font-size: 0.95em; color: #334155;">Il modello neurale ha classificato la tua richiesta:</p>
          
          <!-- Box Risultato Centrale -->
          <div style="background: white; border: 1px solid #e0f2fe; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <span style="font-size: 0.82em; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
              Scope Proposto (${currentIndex + 1} di ${predictions.length})
            </span>
            <div style="margin: 12px 0;">
              <span style="background: #e0f2fe; color: #0284c7; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 1.25em; border: 1px solid #bae6fd;">
                ${detectedScope}
              </span>
            </div>
            <div style="font-size: 0.9em; font-weight: 600; color: ${currentIndex === 0 ? '#10b981' : '#f59e0b'};">
              Affidabilità: ${currentPred.confidence}%
            </div>
          </div>

          <!-- Pulsantiera Flex -->
          <div style="display: flex; gap: 12px;">
            <button id="nextScopeBtn" ${!hasMore ? "disabled" : ""} style="flex: 1; background: ${nextBtnBg}; color: ${nextBtnColor}; cursor: ${nextBtnCursor}; padding: 12px 16px; border-radius: 8px; border: none; font-weight: 600; font-size: 0.95em; transition: filter 0.2s;">
              Non è questo?
            </button>
            <button id="confirmScopeBtn" ${isNlp ? "" : "disabled"} style="flex: 2; ${btnStyle} padding: 12px 16px; border-radius: 8px; border: none; font-weight: 600; font-size: 0.95em; transition: filter 0.2s;">
              ${btnText}
            </button>
          </div>

          <p style="margin: 16px 0 0 0; font-size: 0.85em; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
            <em>${isNlp ? "Procedendo verrai reindirizzato all'Area di Test." : "L'unico strumento esperto connesso appartiene al dominio 'nlp'."}</em>
          </p>
          
        </div>
      `;

      // LOGICA DEI PULSANTI
      
      // 1. Tasto "Prova il prossimo" (Cambia lo scope visualizzato)
      if (hasMore) {
        document.getElementById("nextScopeBtn").addEventListener("click", () => {
          currentIndex++;
          renderResult(); // Ricarica la card con l'indice successivo
        });
      }

      // 2. Tasto "Conferma" (Mostra l'area, scroll e copia il testo)
      if (isNlp) {
        document.getElementById("confirmScopeBtn").addEventListener("click", () => {
          const testSection = document.getElementById("testTextInput").closest('section');
          
          // 1. Rendi visibile l'area di test prima di fare lo scroll
          testSection.style.display = "block";
          
          // 2. Esegui lo scroll fluido
          testSection.scrollIntoView({ behavior: "smooth", block: "start" });
          
          // 3. Effetto di evidenziazione visiva
          testSection.style.transition = "background-color 0.5s ease";
          testSection.style.backgroundColor = "#fef3c7"; 
          
  
          
          // 4. Ripristino del colore di sfondo
          setTimeout(() => { testSection.style.backgroundColor = "white"; }, 1200);
        });
      }
    }

    // Lanciamo la renderizzazione per la prima volta (Indice 0, il più probabile)
    renderResult();

  } catch (err) {
    out.innerHTML = `<span style="color: #ef4444; font-weight: bold;">Errore: Impossibile connettersi al Router. Assicurati che il server sulla porta 8002 sia in esecuzione.</span>`;
  }
}
// --- ASSEGNAZIONE EVENTI AI PULSANTI ---
document.getElementById("loadToolsBtn").addEventListener("click", async () => {
  const btn = document.getElementById("loadToolsBtn");
  const toolsList = document.getElementById("toolsList");

  if (isToolsListVisible) {
    toolsList.innerHTML = "";
    btn.innerText = "Mostra Tools Registrati 🔽";
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

// --- SISTEMA DI NOTIFICHE TOAST ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Crea l'elemento notifica
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icona in base al tipo
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  toast.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
  
  // Aggiunge la notifica allo schermo
  container.appendChild(toast);
  
  // Fa partire l'animazione di entrata dopo un istante
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Rimuove la notifica dopo 3.5 secondi
  setTimeout(() => {
    toast.classList.remove('show');
    // Aspetta che finisca l'animazione di uscita prima di eliminare il nodo dal DOM
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}