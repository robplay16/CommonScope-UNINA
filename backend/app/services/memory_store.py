import json
import os
from typing import List
from app.models.tool import ToolRecord

# Calcola il percorso assoluto del file tools_db.txt (nella stessa cartella di questo script)
DB_FILE = os.path.join(os.path.dirname(__file__), "tools_db.txt")

def get_all_tools() -> List[ToolRecord]:
    """Legge il file di testo e restituisce la lista di ToolRecord."""
    if not os.path.exists(DB_FILE):
        return []
    
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Converte i dizionari letti dal file in oggetti ToolRecord
            return [ToolRecord(**item) for item in data]
    except (json.JSONDecodeError, ValueError):
        # Se il file è vuoto o malformato, restituiamo una lista vuota
        return []

def save_all_tools(tools: List[ToolRecord]):
    """Salva la lista di ToolRecord nel file di testo sovrascrivendolo."""
    with open(DB_FILE, "w", encoding="utf-8") as f:
        # tool.model_dump() converte l'oggetto Pydantic in un dizionario
        json_data = [tool.model_dump() for tool in tools]
        json.dump(json_data, f, indent=4)