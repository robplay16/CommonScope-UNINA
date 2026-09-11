from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from textblob import TextBlob

# Inizializziamo un'istanza FastAPI indipendente
app = FastAPI(
    title="Esperto NLP - Sentiment Analysis",
    description="Microservizio isolato per l'analisi del testo",
    version="1.0.0"
)

# --- CONFIGURAZIONE CORS ---
# Permette all'interfaccia web (porta 8080) di comunicare con questo server (porta 8001)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In produzione andrebbe limitato agli IP consentiti
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. SCHEMI DATI (I/O) ---
class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    text_analyzed: str
    sentiment_label: str
    polarity_score: float

# --- 2. ENDPOINT DEL TOOL ---
@app.post("/analyze-sentiment", response_model=SentimentResponse)
async def analyze_sentiment(payload: SentimentRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Il testo non può essere vuoto")
    
    # Esecuzione del modello NLP
    blob = TextBlob(payload.text)
    score = blob.sentiment.polarity  # type: ignore # Valore da -1.0 (negativo) a 1.0 (positivo)
    
    # Classificazione basata sullo score
    if score > 0.1:
        label = "POSITIVE"
    elif score < -0.1:
        label = "NEGATIVE"
    else:
        label = "NEUTRAL"
        
    return SentimentResponse(
        text_analyzed=payload.text,
        sentiment_label=label,
        polarity_score=round(score, 2)
    )

# --- 3. ENDPOINT DI HEALTH (Utile per il Registry) ---
@app.get("/health")
async def health_check():
    return {"status": "online", "model": "textblob-sentiment-v1"}