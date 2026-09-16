// --- CARICAMENTO E RAGGRUPPAMENTO TOOL ---
async function loadTools() {
  const toolsList = document.getElementById("toolsList");
  const btn = document.getElementById("loadToolsBtn"); 
  toolsList.innerHTML = "<li>Caricamento...</li>";
  
  try {
    const res = await fetch(`${API_BASE}/registry/tools`);
    if (!res.ok) throw new Error("Errore API");
    
    currentTools = await res.json(); 
    toolsList.innerHTML = "";
    
    const groupedTools = {};
    currentTools.forEach(tool => {
      const baseId = tool.id.replace(/_\d+\.\d+\.\d+$/, "");
      if (!groupedTools[baseId]) groupedTools[baseId] = [];
      groupedTools[baseId].push(tool);
    });

    Object.keys(groupedTools).forEach(baseId => {
      const group = groupedTools[baseId].sort((a, b) => compareVersions(a.version, b.version));
      const latestTool = group[0];
      const olderTools = group.slice(1);

      const li = document.createElement("li");
      li.style.marginBottom = "15px";
      li.style.paddingBottom = "10px";
      li.style.borderBottom = "1px dashed var(--border)";
      li.innerHTML = getToolCardHTML(latestTool);

      if (olderTools.length > 0) {
        const rightCol = li.querySelector('.right-actions');

        const toggleBtn = document.createElement("button");
        toggleBtn.id = `toggleBtn_${baseId}`;
        toggleBtn.innerHTML = `▼ 📆Mostra versioni precedenti (${olderTools.length})`;
        toggleBtn.style.cssText = "background: #f8fafc; color: #475569; border: 1px dashed #cbd5e1; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8em; text-align: center; width: 100%; transition: all 0.2s; margin-top: 4px;";
        
        toggleBtn.onmouseover = () => toggleBtn.style.background = "#e2e8f0";
        toggleBtn.onmouseout = () => toggleBtn.style.background = "#f8fafc";
        toggleBtn.onclick = () => toggleHistory(baseId);
        
        if (rightCol) {
          rightCol.appendChild(toggleBtn);
        } else {
          li.appendChild(toggleBtn);
        }

        const historyDiv = document.createElement("div");
        historyDiv.id = `history_${baseId}`;
        historyDiv.style.cssText = "display: none; margin-top: 15px; margin-left: 15px; border-left: 3px solid #cbd5e1; padding-left: 15px;";
        
        olderTools.forEach(oldTool => {
          const oldDiv = document.createElement("div");
          oldDiv.style.cssText = "background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 10px;";
          oldDiv.innerHTML = getToolCardHTML(oldTool);
          historyDiv.appendChild(oldDiv);
        });
        li.appendChild(historyDiv);
      }
      toolsList.appendChild(li);
    });

    isToolsListVisible = true;
    btn.innerText = "🔼Non mostrare più ";

  } catch (err) {
    toolsList.innerHTML = "<li>Errore nel caricamento dei tool</li>";
    showToast("Impossibile caricare i tool. Verifica che il Registry (porta 8000) sia attivo.", "error");
  }
}

// --- CREAZIONE E AGGIORNAMENTO TOOL ---
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

  const resetStyle = (element) => {
    element.style.borderColor = "var(--border)";
    element.style.backgroundColor = element.readOnly ? "#f1f5f9" : "white";
  };
  
  [idInput, nameInput, scopeBtn, capsBtn, endpointInput].forEach(resetStyle);

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

  try {
    const checkRes = await fetch(`${API_BASE}/registry/tools`);
    if (checkRes.ok) {
      const existingTools = await checkRes.json();
      if (existingTools.some(t => t.id === id && t.id !== editingToolId)) {
        showError(idInput);
        showError(nameInput);
        showToast(`L'ID '${id}' esiste già. Modifica il Nome per renderlo univoco.`, "warning");
        return;
      }
    }
  } catch (err) {
    console.warn("Impossibile verificare i duplicati lato client.");
  }

  if (editingToolId) {
    const originalTool = currentTools.find(t => t.id === editingToolId);
    if (originalTool) {
      const currentDesc = document.getElementById("newToolDesc").value.trim();
      const currentOwner = document.getElementById("newToolOwner").value.trim();
      const currentInput = document.getElementById("newToolInput").value || "any";
      const currentOutput = document.getElementById("newToolOutput").value || "any";

      const isIdSame = (originalTool.id || "") === id;
      const isNameSame = (originalTool.name || "") === name;
      const isDescSame = (originalTool.description || "") === currentDesc;
      const isEndpointSame = (originalTool.endpoint || "") === validEndpoint;
      
      const origOwner = originalTool.owner && originalTool.owner !== "<sconosciuto>" && originalTool.owner !== "N/A" ? originalTool.owner : "";
      const currOwner = currentOwner && currentOwner !== "<sconosciuto>" && currentOwner !== "N/A" ? currentOwner : "";
      const isOwnerSame = origOwner === currOwner;

      const isInputSame = (originalTool.input_schema?.type || "any") === currentInput;
      const isOutputSame = (originalTool.output_schema?.type || "any") === currentOutput;

      const origScopes = originalTool.scope_tags || [];
      const origCaps = originalTool.capabilities || [];
      const areScopesSame = JSON.stringify([...origScopes].sort()) === JSON.stringify([...selectedScopes].sort());
      const areCapsSame = JSON.stringify([...origCaps].sort()) === JSON.stringify([...selectedCaps].sort());

      if (isIdSame && isNameSame && isDescSame && isEndpointSame && isOwnerSame && isInputSame && isOutputSame && areScopesSame && areCapsSame) {
        showToast("Nessuna modifica rilevata. Cambia almeno un campo per salvare.", "warning");
        const submitBtn = document.getElementById("createToolBtn");
        submitBtn.style.transform = "translateX(5px)";
        setTimeout(() => submitBtn.style.transform = "translateX(-5px)", 100);
        setTimeout(() => submitBtn.style.transform = "translateX(0)", 200);
        return; 
      }
    }
  }

  const finalVersion = editingToolId ? getNextMinorVersion(editingToolVersion) : "1.0.0";
  
  let finalId = id;
  const oldBaseId = editingToolId ? editingToolId.replace(/_\d+\.\d+\.\d+$/, "") : null;
  const newBaseId = id.replace(/_\d+\.\d+\.\d+$/, "");
  let historyTools = [];

  if (editingToolId && oldBaseId !== newBaseId) {
    historyTools = currentTools.filter(t => t.id.replace(/_\d+\.\d+\.\d+$/, "") === oldBaseId);
    if (historyTools.length > 1 || editingToolId.includes("_")) {
      finalId = `${newBaseId}_${finalVersion}`;
    } else {
      finalId = newBaseId;
    }
  }

  const payloadTool = {
    id: finalId,
    name: name,
    description: document.getElementById("newToolDesc").value.trim(),
    version: finalVersion,
    scope_tags: selectedScopes,
    capabilities: selectedCaps,    
    input_schema: { type: document.getElementById("newToolInput").value || "any" },
    output_schema: { type: document.getElementById("newToolOutput").value || "any" },
    endpoint: validEndpoint,
    status: "active",
    owner: document.getElementById("newToolOwner").value.trim() || "<sconosciuto>"
  };

  try {
    let res;
    
    if (editingToolId) {
      if (oldBaseId !== newBaseId) {
        res = await fetch(`${API_BASE}/registry/tools`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(payloadTool)
        });

        if (res.ok) {
          await fetch(`${API_BASE}/registry/tools/${editingToolId}`, { method: "DELETE" });

          for (const oldT of historyTools) {
            if (oldT.id === editingToolId) continue; 
            const migratedTool = { ...oldT, id: `${newBaseId}_${oldT.version}`, name: name };
            await fetch(`${API_BASE}/registry/tools`, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify(migratedTool)
            });
            await fetch(`${API_BASE}/registry/tools/${oldT.id}`, { method: "DELETE" });
          }
        }
      } else if (editingToolId !== finalId) {
        res = await fetch(`${API_BASE}/registry/tools`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(payloadTool)
        });
        if (res.ok) await fetch(`${API_BASE}/registry/tools/${editingToolId}`, { method: "DELETE" });
      } else {
        res = await fetch(`${API_BASE}/registry/tools/${editingToolId}`, {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(payloadTool)
        });
      }
    } else {
      res = await fetch(`${API_BASE}/registry/tools`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payloadTool)
      });
    }

    if (!res.ok) {
      const err = await res.json();
      showToast("Errore dal server: " + (err.detail || "Operazione fallita"), "error");
      return;
    }

    showToast(editingToolId ? `Tool aggiornato con successo alla v${finalVersion}!` : "Nuovo Tool registrato con successo!", "success");
    resetFormAfterSave();
    loadTools(); 
  } catch (err) {
    showToast("Errore di connessione con il server", "error");
  }
}

// --- POPOLAMENTO MODULO IN MODALITÀ MODIFICA ---
async function updateTool(toolId) {
  const tool = currentTools.find(t => t.id === toolId);
  if (!tool) return;

  editingToolId = tool.id;
  editingToolVersion = tool.version || "1.0.0";

  document.getElementById("newToolName").value = tool.name;
  document.getElementById("newToolId").value = tool.id;
  document.getElementById("newToolDesc").value = tool.description || "";
  document.getElementById("newToolEndpoint").value = tool.endpoint;
  document.getElementById("newToolOwner").value = tool.owner || "";

  let scopeCount = 0;
  document.querySelectorAll('#scopeDropdownMenu input[type="checkbox"]').forEach(cb => {
    cb.checked = tool.scope_tags.includes(cb.value);
    if (cb.checked) {
      scopeCount++;
      cb.dispatchEvent(new Event('change')); 
    }
  });
  document.getElementById("scopeDropdownBtn").innerText = `Selezionati (${scopeCount}) ▼`;

  setTimeout(() => {
    let capsCount = 0;
    document.querySelectorAll('#capsDropdownMenu input[type="checkbox"]').forEach(cb => {
      cb.checked = tool.capabilities.includes(cb.value);
      if (cb.checked) capsCount++;
    });
    
    document.getElementById("capsDropdownBtn").innerText = capsCount > 0 
      ? `Selezionate (${capsCount}) ▼` 
      : "Seleziona prima uno Scope...";
    
    if (tool.input_schema && tool.input_schema.type) {
        document.getElementById("newToolInput").value = tool.input_schema.type;
    }
    if (tool.output_schema && tool.output_schema.type) {
        document.getElementById("newToolOutput").value = tool.output_schema.type;
    }
  }, 100);

  const submitBtn = document.getElementById("createToolBtn");
  submitBtn.innerText = `💾 Salva Modifiche (v${getNextMinorVersion(editingToolVersion)})`;
  submitBtn.style.background = "#f59e0b"; 

  submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
  showToast("Modalità modifica attivata. I dati sono stati caricati nel modulo.", "info");
  document.getElementById("cancelEditBtn").style.display = "block";
}

// --- AGGIUNTA NUOVA VERSIONE ---
async function addNewVersion(toolId) {
  const tool = currentTools.find(t => t.id === toolId);
  if (!tool) return;

  const newEndpoint = prompt(`Inserisci il nuovo endpoint per la versione successiva di ${tool.name}:`, tool.endpoint);
  if (!newEndpoint || newEndpoint.trim() === "") return;
  
  let validEndpoint = newEndpoint.trim().toLowerCase();
  if (!validEndpoint.startsWith("http://") && !validEndpoint.startsWith("https://")) {
    validEndpoint = "http://" + validEndpoint;
  }

  try {
    new URL(validEndpoint);
  } catch (err) {
    showToast("L'Endpoint inserito non è un URL valido.", "error");
    return;
  }

  try {
    const currentVersion = tool.version || "1.0.0";
    const newVersion = getNextMajorVersion(currentVersion);
    const baseId = tool.id.replace(/_\d+\.\d+\.\d+$/, "");
    
    const oldVersionId = `${baseId}_${currentVersion}`;
    const newVersionId = `${baseId}_${newVersion}`;

    if (tool.id !== oldVersionId) {
      const updatedOldTool = { ...tool, id: oldVersionId };
      await fetch(`${API_BASE}/registry/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOldTool)
      });
      await fetch(`${API_BASE}/registry/tools/${tool.id}`, { method: "DELETE" });
    }

    const newTool = { ...tool, id: newVersionId, version: newVersion, endpoint: validEndpoint };
    const res = await fetch(`${API_BASE}/registry/tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTool)
    });

    if (!res.ok) {
      const err = await res.json();
      showToast("Errore dal server: " + (err.detail || "Impossibile creare la versione"), "error");
      return;
    }

    showToast(`Nuova versione ${newVersion} aggiunta con successo al Registry!`, "success");
    loadTools(); 
    
  } catch (error) {
    showToast("Errore di connessione al server.", "error");
  }
}

// --- CANCELLAZIONE TOOL ---
async function deleteTool(toolId) {
  if (!confirm(`Vuoi davvero eliminare il tool ${toolId}?`)) return;
  
  try {
    const res = await fetch(`${API_BASE}/registry/tools/${toolId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Errore API");
    showToast(`Tool ${toolId} eliminato correttamente!`, "warning");
    loadTools(); 
  } catch (err) {
    showToast(`Errore durante l'eliminazione del tool ${toolId}.`, "error");
  }
}

// --- COLLEGAMENTO TASTI PRINCIPALI ---
document.getElementById("loadToolsBtn").addEventListener("click", async () => {
  const btn = document.getElementById("loadToolsBtn");
  const toolsList = document.getElementById("toolsList");

  if (isToolsListVisible) {
    toolsList.innerHTML = "";
    btn.innerText = "🔽Mostra Tools Registrati ";
    isToolsListVisible = false;
  } else {
    await loadTools();
  }
});

document.getElementById("createToolBtn").addEventListener("click", createTool);