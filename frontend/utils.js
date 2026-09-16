// --- HELPER: Aumenta la minor version (es. da 1.0.0 a 1.1.0) ---
function getNextMinorVersion(versionStr) {
  if (!versionStr) return "1.1.0";
  const parts = versionStr.split(".");
  if (parts.length === 3) {
    let minor = parseInt(parts[1], 10);
    return `${parts[0]}.${minor + 1}.${parts[2]}`;
  }
  return "1.1.0"; 
}

// --- HELPER: Aumenta la major version (es. da 1.1.0 a 2.1.0) ---
function getNextMajorVersion(versionStr) {
  if (!versionStr) return "2.0.0";
  const parts = versionStr.split(".");
  if (parts.length === 3) {
    let major = parseInt(parts[0], 10);
    return `${major + 1}.0.0`; 
  }
  return "2.0.0"; 
}

// --- HELPER: Compara due versioni (Ritorna -1 se v1 è maggiore, 1 se v2 è maggiore) ---
function compareVersions(v1, v2) {
  const p1 = (v1 || "1.0.0").split('.').map(Number);
  const p2 = (v2 || "1.0.0").split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (p1[i] > p2[i]) return -1;
    if (p1[i] < p2[i]) return 1;
  }
  return 0;
}

// --- HELPER: Mostra/Nasconde lo storico delle versioni ---
function toggleHistory(baseId) {
  const container = document.getElementById(`history_${baseId}`);
  const btn = document.getElementById(`toggleBtn_${baseId}`);
  if (container.style.display === "none") {
    container.style.display = "block";
    btn.innerHTML = "▲📆 Nascondi versioni precedenti";
  } else {
    container.style.display = "none";
    btn.innerHTML = `▼📆 Mostra versioni precedenti (${container.children.length})`;
  }
}

// --- SISTEMA DI NOTIFICHE TOAST ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// --- HELPER: Genera il codice HTML della singola Card del Tool ---
function getToolCardHTML(tool) {
  const tags = tool.scope_tags && tool.scope_tags.length > 0 ? tool.scope_tags.join(', ') : '';
  const caps = tool.capabilities && tool.capabilities.length > 0 ? tool.capabilities.join(', ') : '';

  return `
    <div style="float: right; text-align: right; margin-left: 10px;">
      <span style="background: #e2e8f0; font-size: 0.75em; padding: 2px 6px; border-radius: 10px; display: inline-block; margin-bottom: 6px;">
        Owner: ${tool.owner || 'N/A'}
      </span><br>
      <span style="background: #e2e8f0; font-size: 0.75em; padding: 2px 6px; border-radius: 10px; display: inline-block;">
        Version: ${tool.version || '1.0.0'}
      </span>
    </div>

    <strong>${tool.name}</strong> <span style="color: var(--muted); font-size: 0.9em;">(${tool.id})</span> 
    <br> 
    <span style="color: var(--text); font-size: 0.9em;">${tool.description || ''}</span>
    <br>
    <span style="color: #3b82f6; font-size: 0.8em;"><strong>Scopes:</strong> [${tags}]</span> | 
    <span style="color: #8b5cf6; font-size: 0.8em;"><strong>Capabilities:</strong> [${caps}]</span>
    
    <div style="display: flex; gap: 15px; width: 100%; margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; align-items: stretch;">
        <button onclick="updateTool('${tool.id}')" style="background: #f59e0b; color: white; padding: 8px 14px; font-size: 0.85em; border: none; border-radius: 4px; cursor: pointer; width: 100%;">🔧 Modifica</button>
        <button onclick="deleteTool('${tool.id}')" style="background: #ef4444; color: white; padding: 8px 14px; font-size: 0.85em; border: none; border-radius: 4px; cursor: pointer; width: 100%;">❌ Elimina</button>
      </div>
      <div class="right-actions" style="flex: 1; display: flex; flex-direction: column; gap: 8px; align-items: stretch;">
        <button onclick="addNewVersion('${tool.id}')" style="background: #8b5cf6; color: white; padding: 8px 14px; font-size: 0.85em; border: none; border-radius: 4px; cursor: pointer; width: 100%;">➕ Aggiungi Nuova Versione</button>
      </div>
    </div>
  `;
}