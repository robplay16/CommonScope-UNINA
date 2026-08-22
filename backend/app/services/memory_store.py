import json
import os
from typing import List
from app.models.tool import ToolRecord

DB_FILE = os.path.join(os.path.dirname(__file__), "tools_db.json")

def get_all_tools() -> List[ToolRecord]:
    """Legge il file JSON e restituisce la lista di ToolRecord."""
    if not os.path.exists(DB_FILE):
        return []
    
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Converte i dizionari letti dal file in oggetti ToolRecord
            return [ToolRecord(**item) for item in data]
    except (json.JSONDecodeError, ValueError) as e:
        # Stampiamo l'errore nel terminale per comodità di debug
        print(f"Attenzione: Impossibile leggere il database. File corrotto o vuoto. Dettaglio: {e}")
        return []

def save_all_tools(tools: List[ToolRecord]):
    """Salva la lista di ToolRecord nel file JSON sovrascrivendolo."""
    with open(DB_FILE, "w", encoding="utf-8") as f:
        # tool.model_dump() converte l'oggetto Pydantic in un dizionario
        json_data = [tool.model_dump() for tool in tools]
        json.dump(json_data, f, indent=4)