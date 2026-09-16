// --- GENERAZIONE AUTOMATICA DELL'ID DAL NOME ---
document.getElementById("newToolName").addEventListener("input", function(e) {
  const nameVal = e.target.value;
  const generatedId = nameVal
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') 
    .replace(/[^a-z0-9-]/g, ''); 
    
  document.getElementById("newToolId").value = generatedId;
});

// --- RIMOZIONE ERRORI VISIVI QUANDO SI SCRIVE ---
const clearError = (element) => {
  element.style.borderColor = "var(--border)";
  element.style.backgroundColor = element.readOnly ? "#f1f5f9" : "white";
};

document.getElementById("newToolName").addEventListener("input", function() { 
  clearError(this); 
  clearError(document.getElementById("newToolId")); 
});
document.getElementById("newToolEndpoint").addEventListener("input", function() { clearError(this); });

document.getElementById("scopeDropdownBtn").addEventListener("click", function() {
  if (this.style.borderColor === "rgb(239, 68, 68)" || this.style.borderColor === "#ef4444") clearError(this);
});
document.getElementById("capsDropdownBtn").addEventListener("click", function() {
  if (this.style.borderColor === "rgb(239, 68, 68)" || this.style.borderColor === "#ef4444") clearError(this);
});

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
    updateCapabilitiesMenu();
    updateIOMenus();
  });
});

// --- GESTIONE MENU CAPABILITIES ---
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

// --- GESTIONE MENU INPUT/OUTPUT ---
function updateIOMenus() {
  const selectedScopes = Array.from(document.querySelectorAll('#scopeDropdownMenu input:checked')).map(cb => cb.value);
  const inputSelect = document.getElementById("newToolInput");
  const outputSelect = document.getElementById("newToolOutput");

  if (selectedScopes.length === 0) {
    inputSelect.innerHTML = '<option value="" disabled selected>Seleziona prima uno Scope...</option>';
    inputSelect.disabled = true;
    inputSelect.style.background = "#f8fafc";
    inputSelect.style.color = "#94a3b8";
    inputSelect.style.cursor = "not-allowed";

    outputSelect.innerHTML = '<option value="" disabled selected>Seleziona prima uno Scope...</option>';
    outputSelect.disabled = true;
    outputSelect.style.background = "#f8fafc";
    outputSelect.style.color = "#94a3b8";
    outputSelect.style.cursor = "not-allowed";
    return;
  }

  let validInputs = new Set();
  let validOutputs = new Set();

  selectedScopes.forEach(scope => {
    if (scopeIOMap[scope]) {
      scopeIOMap[scope].inputs.forEach(i => validInputs.add(i));
      scopeIOMap[scope].outputs.forEach(o => validOutputs.add(o));
    }
  });

  inputSelect.disabled = false;
  inputSelect.style.background = "white";
  inputSelect.style.color = "var(--text, #333)";
  inputSelect.style.cursor = "pointer";
  inputSelect.innerHTML = '<option value="" disabled selected>Tipo Input ▼</option>' + 
    Array.from(validInputs).map(val => `<option value="${val}">${ioLabels[val] || val}</option>`).join('');

  outputSelect.disabled = false;
  outputSelect.style.background = "white";
  outputSelect.style.color = "var(--text, #333)";
  outputSelect.style.cursor = "pointer";
  outputSelect.innerHTML = '<option value="" disabled selected>Tipo Output ▼</option>' + 
    Array.from(validOutputs).map(val => `<option value="${val}">${ioLabels[val] || val}</option>`).join('');
}

// --- FUNZIONE DI RESET DEL FORM ---
function resetFormAfterSave() {
  document.querySelectorAll("input[type='text']:not([readonly]), input[type='url'], textarea").forEach(el => el.value = "");
  document.getElementById("newToolId").value = ""; 
  
  document.querySelectorAll("input[type='checkbox']").forEach(cb => {
      cb.checked = false;
      cb.dispatchEvent(new Event('change')); 
  });
  
  document.querySelectorAll("select").forEach(el => el.selectedIndex = 0);
  document.getElementById("scopeDropdownBtn").innerText = "Seleziona Scope (Settore) * ▼";
  
  const capsBtn = document.getElementById("capsDropdownBtn");
  capsBtn.innerText = "Seleziona prima uno Scope...";
  capsBtn.style.background = "#f8fafc";
  capsBtn.style.color = "var(--muted)";
  capsBtn.style.cursor = "not-allowed";
  
  editingToolId = null;
  editingToolVersion = "1.0.0";
  
  const submitBtn = document.getElementById("createToolBtn");
  submitBtn.innerText = "+ Aggiungi Tool";
  submitBtn.style.background = "#10b981"; 
  document.getElementById("cancelEditBtn").style.display = "none";
}

document.getElementById("cancelEditBtn").addEventListener("click", () => {
  resetFormAfterSave();
  showToast("Modifica annullata. Puoi inserire un nuovo tool.", "info");
});