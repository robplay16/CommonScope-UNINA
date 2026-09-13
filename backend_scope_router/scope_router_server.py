from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from typing import List

app = FastAPI(title="CommonScope Mock Router")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")

# --- NUOVI MODELLI DATI ---
class RouterRequest(BaseModel):
    text: str

class ScopePrediction(BaseModel):
    scope: str
    confidence: float

class RouterResponse(BaseModel):
    predictions: List[ScopePrediction] # Ora restituiamo una LISTA di risultati

@app.post("/analyze-scope", response_model=RouterResponse)
async def analyze_scope(payload: RouterRequest):
    candidate_scopes = ["document", "nlp", "vision", "routing", "audio", "data"]
    
    # Il modello restituisce le etichette già in ordine decrescente di probabilità
    result = classifier(payload.text, candidate_scopes)
    
    # Creiamo un array di tutte le predizioni
    predictions = []
    for label, score in zip(result["labels"], result["scores"]):
        predictions.append(ScopePrediction(scope=label, confidence=round(score * 100, 2)))
        
    return RouterResponse(predictions=predictions)