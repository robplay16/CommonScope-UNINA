from fastapi import APIRouter
from app.models.request import ScopeRequest
from app.services.memory_store import get_all_tools, save_all_tools #modificato da TOOLS a get_all_tools() per non importare la variabile globale (lista di ToolRecord) direttamente, ma per ottenere la lista di tool dal file dove sono contenuti.

TOOLS = get_all_tools() #di conseguenza, TOOLS è ora una lista di ToolRecord ottenuta dal file tools_db.json, invece di essere importata direttamente come variabile globale.
router = APIRouter()

# Router iniziale:
# legge la richiesta, confronta i tool e assegna un punteggio.

def score_tool(tool, req: ScopeRequest) -> float:
    score = 0.0
    text = req.text.lower()

    # Match su tag di scope
    for tag in tool.scope_tags:
        if tag.lower() in text:
            score += 1.0

    # Match su capability richieste
    for cap in req.desired_capabilities:
        if cap in tool.capabilities:
            score += 2.0

    # Boost sul dominio
    if req.domain and req.domain.lower() in " ".join(tool.scope_tags).lower():
        score += 1.5

    return score

@router.post("/match")
def match_scope(req: ScopeRequest):
    ranked = []
    for tool in TOOLS:
        s = score_tool(tool, req)
        ranked.append({
            "tool_id": tool.id,
            "tool_name": tool.name,
            "score": s,
            "reason": f"Matched on tags/capabilities for request: {req.text}"
        })
    ranked.sort(key=lambda x: x["score"], reverse=True)
    return {"query": req.dict(), "results": ranked[:req.top_k]}
