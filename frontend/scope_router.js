// --- SCOPE ROUTER E HUMAN-IN-THE-LOOP ---
async function runRouter() {
  const text = document.getElementById("queryText").value.trim();
  const out = document.getElementById("routeResults");

  if (!text) {
    return alert("Inserisci una richiesta da analizzare.");
  }

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
    const predictions = data.predictions; 
    let currentIndex = 0; 

    const matchedTool = {
        id: "nlp-sentiment-local-1",
        name: "Analizzatore di Sentimenti Base",
        description: "modello NLP leggero per estrarre la polarità da testi brevi.",
        capabilities: ["sentiment_analysis"],
        endpoint: "http://127.0.0.1:8001/analyze-sentiment"
    };

    function renderResult() {
      const currentPred = predictions[currentIndex];
      const detectedScope = currentPred.scope;
      const isNlp = detectedScope === "nlp";
      const hasMore = currentIndex < predictions.length - 1;

      const btnStyle = isNlp 
        ? "background: #10b981; color: white; cursor: pointer;" 
        : "background: #e2e8f0; color: #94a3b8; cursor: not-allowed;";
      const btnText = isNlp ? "Conferma e vai allo Strumento" : "Nessun Tool attivo";
      const nextBtnBg = hasMore ? '#f59e0b' : '#e2e8f0';
      const nextBtnColor = hasMore ? 'white' : '#94a3b8';
      const nextBtnCursor = hasMore ? 'pointer' : 'not-allowed';

      const toolMatchHtml = isNlp ? `
        <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: left; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
          <div style="font-size: 0.75em; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            ✓ Strumento Compatibile Trovato
          </div>
          <h5 style="margin: 0 0 4px 0; color: #0f172a; font-size: 1.05em;">
            ${matchedTool.name} <span style="font-size: 0.8em; color: #64748b; font-weight: 400;">(${matchedTool.id})</span>
          </h5>
          <p style="margin: 0 0 10px 0; font-size: 0.85em; color: #475569;">
            ${matchedTool.description}
          </p>
          <div style="font-size: 0.8em; color: #334155; line-height: 1.6;">
            <strong>Capability:</strong> <span style="background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 12px; font-weight: 600;">${matchedTool.capabilities[0]}</span><br>
            <strong>Endpoint:</strong> <code style="color: #d946ef; background: #fdf4ff; padding: 2px 6px; border-radius: 4px;">${matchedTool.endpoint}</code>
          </div>
        </div>
      ` : '';

      out.innerHTML = `
        <div style="border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin-top: 20px; background: #f0f9ff;">
          <h4 style="margin: 0 0 8px 0; color: #0284c7; font-size: 1.1em;">🔍 Routing Semantico Completato</h4>
          <p style="margin: 0 0 16px 0; font-size: 0.95em; color: #334155;">Il modello neurale ha classificato la tua richiesta:</p>
          
          <div style="background: white; border: 1px solid #e0f2fe; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
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

          ${toolMatchHtml}

          <div style="display: flex; gap: 12px;">
            <button id="nextScopeBtn" ${!hasMore ? "disabled" : ""} style="flex: 1; background: ${nextBtnBg}; color: ${nextBtnColor}; cursor: ${nextBtnCursor}; padding: 12px 16px; border-radius: 8px; border: none; font-weight: 600; font-size: 0.95em; transition: filter 0.2s;">
              Non è questo?
            </button>
            <button id="confirmScopeBtn" ${isNlp ? "" : "disabled"} style="flex: 2; ${btnStyle} padding: 12px 16px; border-radius: 8px; border: none; font-weight: 600; font-size: 0.95em; transition: filter 0.2s;">
              ${btnText}
            </button>
          </div>

          <p style="margin: 16px 0 0 0; font-size: 0.85em; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
            <em>${isNlp ? "Procedendo verrai reindirizzato all'Area di Test e la richiesta verrà inoltrata al tool indicato." : "L'unico strumento esperto connesso appartiene al dominio 'nlp'."}</em>
          </p>

          <div id="dynamicTestArea" style="display: none; margin-top: 24px; padding-top: 24px; border-top: 2px dashed #bae6fd; text-align: left;">
            <h4 style="margin: 0 0 12px 0; color: #6b21a8; font-size: 1.1em;">🧪 Area di Test: Analisi Sentiment</h4>
            <p style="margin: 0 0 16px 0; font-size: 0.9em; color: #475569;">Invia una richiesta reale al Tool Server (Porta 8001).</p>
            
            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9em; color: #1e293b;">Testo da analizzare:</label>
            <textarea id="testTextInput" rows="3" placeholder="Scrivi una frase in inglese (es. This project is very beautiful oppure This project is terrible)" style="width: 100%; resize: none; margin-bottom: 12px; font-family: inherit; font-size: 0.95rem; padding: 12px 16px; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box;"></textarea>
            
            <button id="runDynamicTestBtn" style="width: 100%; background: #8b5cf6; color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.95em; transition: filter 0.2s;">
              Analizza con Tool Esterno
            </button>

            <div id="testResult" style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; display: none;">
              <h4 style="margin: 0 0 12px 0; color: #1e293b;">Risultato dell'Analisi:</h4>
              <p style="margin: 6px 0; font-size: 0.95em;"><strong>Testo:</strong> <span id="resText"></span></p>
              <p style="margin: 6px 0; font-size: 0.95em;"><strong>Sentiment:</strong> <span id="resLabel" style="font-weight: bold; padding: 2px 8px; border-radius: 4px;"></span></p>
              <p style="margin: 6px 0; font-size: 0.95em;"><strong>Polarity Score:</strong> <span id="resScore"></span></p>
            </div>
          </div>
        </div>
      `;
      
      if (hasMore) {
        document.getElementById("nextScopeBtn").addEventListener("click", () => {
          currentIndex++;
          renderResult(); 
        });
      }

      if (isNlp) {
        document.getElementById("confirmScopeBtn").addEventListener("click", () => {
          const testArea = document.getElementById("dynamicTestArea");
          testArea.style.display = "block";
          testArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
          
          const confirmBtn = document.getElementById("confirmScopeBtn");
          confirmBtn.style.background = "#94a3b8";
          confirmBtn.innerText = "Strumento Attivo ↓";
          confirmBtn.disabled = true;

          testArea.style.transition = "background-color 0.5s ease";
          testArea.style.backgroundColor = "#fef3c7"; 
          setTimeout(() => { testArea.style.backgroundColor = "transparent"; }, 1200);

          document.getElementById("runDynamicTestBtn").addEventListener("click", testSentimentTool);
        });
      }
    }

    renderResult();

  } catch (err) {
    out.innerHTML = `<span style="color: #ef4444; font-weight: bold;">Errore: Impossibile connettersi al Router. Assicurati che il server sulla porta 8002 sia in esecuzione.</span>`;
  }
}

// --- FUNZIONE PER TESTARE IL TOOL SERVER (Porta 8001) ---
async function testSentimentTool() {
  const textInput = document.getElementById("testTextInput").value.trim();
  const resBox = document.getElementById("testResult");

  if (!textInput) {
    showToast("Inserisci un testo da analizzare.", "warning");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8001/analyze-sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textInput })
    });

    if (!res.ok) throw new Error("Errore Tool Server");

    const data = await res.json();
    resBox.style.display = "block";
    
    document.getElementById("resText").innerText = data.text_analyzed;
    document.getElementById("resScore").innerText = data.polarity_score.toFixed(2);
    
    const labelSpan = document.getElementById("resLabel");
    labelSpan.innerText = data.sentiment_label; 
    
    const sentimentLower = data.sentiment_label.toLowerCase();
    
    if (sentimentLower === "positive") {
      labelSpan.style.backgroundColor = "#dcfce7";
      labelSpan.style.color = "#16a34a";
    } else if (sentimentLower === "negative") {
      labelSpan.style.backgroundColor = "#fee2e2";
      labelSpan.style.color = "#dc2626";
    } else {
      labelSpan.style.backgroundColor = "#f1f5f9";
      labelSpan.style.color = "#475569";
    }

    showToast("Analisi completata con successo!", "success");

  } catch (err) {
    showToast("Impossibile connettersi al Tool Server. Assicurati che sia avviato sulla porta 8001.", "error");
  }
}

document.getElementById("routeBtn").addEventListener("click", runRouter);