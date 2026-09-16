// Backend FastAPI in locale.
const API_BASE = "http://localhost:8000/api";

// --- VARIABILI DI STATO GLOBALI ---
let editingToolId = null; 
let editingToolVersion = "1.0.0"; 
let isToolsListVisible = false; 
let currentTools = []; 

// --- MAPPA DELLE CAPABILITIES ---
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

// --- MAPPA DI INPUT E OUTPUT ---
const scopeIOMap = {
  "vision": { inputs: ["image", "video", "any"], outputs: ["json", "label", "image", "text", "any"] },
  "classification": { inputs: ["text", "image", "audio", "json", "any"], outputs: ["label", "json", "any"] },
  "document": { inputs: ["image_or_pdf", "image", "any"], outputs: ["text", "json", "any"] },
  "ocr": { inputs: ["image_or_pdf", "image", "any"], outputs: ["text", "json", "any"] },
  "planning": { inputs: ["json", "locations", "any"], outputs: ["json", "any"] },
  "maps": { inputs: ["locations", "json", "any"], outputs: ["json", "route", "any"] },
  "routing": { inputs: ["locations", "json", "any"], outputs: ["route", "json", "any"] },
  "nlp": { inputs: ["text", "any"], outputs: ["text", "label", "json", "any"] },
  "text": { inputs: ["text", "any"], outputs: ["text", "json", "any"] },
  "analysis": { inputs: ["json", "text", "any"], outputs: ["json", "text", "any"] },
  "audio": { inputs: ["audio", "any"], outputs: ["text", "label", "json", "audio", "any"] },
  "data": { inputs: ["json", "text", "any"], outputs: ["json", "any"] }
};

const ioLabels = {
  "any": "any (Qualsiasi)",
  "text": "text (Testo)",
  "image": "image (Immagine)",
  "image_or_pdf": "image_or_pdf (Immagine o PDF)",
  "audio": "audio (Audio)",
  "video": "video (Video)",
  "json": "json (Dati Strutturati)",
  "locations": "locations (Coordinate/Mappe)",
  "label": "label (Etichetta/Categoria)",
  "route": "route (Percorso)"
};