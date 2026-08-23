// Backend FastAPI in locale.
const API_BASE = "http://localhost:8000/api";

// --- LETTURA E CANCELLAZIONE ---
async function loadTools() {
  const toolsList = document.getElementById("toolsList");
  toolsList.innerHTML = "<li>Caricamento...</li>";
  
  try {
    const res = await fetch(`${API_BASE}/registry/tools`);
    const data = await res.json();
    toolsList.innerHTML = "";
    
    data.forEach(tool => {
      const li = document.createElement("li");
      li.style.marginBottom = "10px";
      // Aggiungiamo il tasto "Elimina" per ogni tool
      li.innerHTML = `
        <strong>${tool.name}</strong> (${tool.id}) <br> 
        <span style="color: var(--muted); font-size: 0.9em;">${tool.description}</span>
        <br>
        <button onclick="deleteTool('${tool.id}')" style="background: #ef4444; padding: 4px 8px; font-size: 0.8em; margin-top: 4px;">Elimina</button>
      `;
      li.innerHTML = `
        <strong>${tool.name}</strong> (${tool.id}) <br> 
        <span style="color: var(--muted); font-size: 0.9em;">${tool.description}</span>
        <br>
        <button onclick="updateTool('${tool.id}', '${tool.name}', '${tool.description}')" style="background: #f59e0b; color: white; padding: 4px 8px; font-size: 0.8em; margin-top: 4px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">Modifica</button>
        <button onclick="deleteTool('${tool.id}')" style="background: #ef4444; color: white; padding: 4px 8px; font-size: 0.8em; margin-top: 4px; border: none; border-radius: 4px; cursor: pointer;">Elimina</button>
      `;
      toolsList.appendChild(li);
    });
  } catch (err) {
    toolsList.innerHTML = "<li>Errore nel caricamento dei tool</li>";
  }
}
// --- AGGIORNAMENTO (UPDATE) ---
async function updateTool(toolId, currentName, currentDesc) {
  // Chiediamo all'utente i nuovi dati tramite popup del browser
  const newName = prompt(`Modifica il nome per ${toolId}:`, currentName);
  if (newName === null) return; // Se l'utente clicca "Annulla", fermiamo tutto
  
  const newDesc = prompt(`Modifica la descrizione per ${toolId}:`, currentDesc);
  if (newDesc === null) return;

  // Costruiamo l'oggetto aggiornato
  const updatedTool = {
    id: toolId,
    name: newName.trim(),
    description: newDesc.trim(),
    version: "0.1.0",
    status: "active"
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

    loadTools(); // Ricarichiamo la lista per vedere le modifiche
  } catch (err) {
    alert("Errore durante l'aggiornamento");
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

// ---  CREAZIONE ---
async function createTool() {
  const id = document.getElementById("newToolId").value.trim();
  const name = document.getElementById("newToolName").value.trim();
  const description = document.getElementById("newToolDesc").value.trim();

  // Controllo validità
  if (!id || !name) {
    return alert("ID e Nome sono campi obbligatori!");
  }

  // Creiamo l'oggetto con i dati base richiesti dal tuo backend
  const newTool = {
    id: id,
    name: name,
    description: description,
    version: "0.1.0",
    status: "active"
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

    // Pulisci i campi del form e ricarica la lista
    document.getElementById("newToolId").value = "";
    document.getElementById("newToolName").value = "";
    document.getElementById("newToolDesc").value = "";
    loadTools();
    
  } catch (err) {
    alert("Errore di connessione con il server");
  }
}

// --- 3. ROUTER ---
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
    
    // Gestione dell'errore nel caso il router non sia ancora implementato
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
document.getElementById("loadToolsBtn").addEventListener("click", loadTools);
document.getElementById("createToolBtn").addEventListener("click", createTool);
document.getElementById("routeBtn").addEventListener("click", runRouter);