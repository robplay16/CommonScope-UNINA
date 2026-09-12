from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline

app = FastAPI(title="CommonScope Mock Router")

# Abilitazione CORS per permettere le chiamate dal Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caricamento del modello neurale (distilbert è leggero e veloce)
# Il download avverrà in automatico solo alla prima esecuzione del file
classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")

# Definizione dei Contratti Dati (Pydantic)
class RouterRequest(BaseModel):
    text: str

class RouterResponse(BaseModel):
    detected_scope: str
    confidence: float

@app.post("/analyze-scope", response_model=RouterResponse)
async def analyze_scope(payload: RouterRequest):
    # Gli scope validi nel tuo ecosistema
    candidate_scopes = ["document", "nlp", "vision", "routing", "audio", "data"]
    
    # Esecuzione dell'inferenza semantica
    result = classifier(payload.text, candidate_scopes)
    
    # Estrazione dell'etichetta con la probabilità più alta
    best_scope = result["labels"][0]
    score = result["scores"][0]
    
    return RouterResponse(
        detected_scope=best_scope,
        confidence=round(score * 100, 2)
    )

# Per avviarlo: uvicorn router_server:app --port 8002