from fastapi import APIRouter, HTTPException
from typing import List
from app.models.tool import ToolRecord
from app.services.memory_store import get_all_tools, save_all_tools

router = APIRouter()

# --- CREATE (Creazione) ---
@router.post("/tools", response_model=ToolRecord)
def create_tool(tool: ToolRecord):
    tools = get_all_tools()
    
    # Controlla se esiste già un tool con questo ID
    if any(t.id == tool.id for t in tools):
        raise HTTPException(status_code=400, detail="Tool with this ID already exists")
    
    tools.append(tool)
    save_all_tools(tools)
    return tool

# --- READ (Lettura di tutti) ---
@router.get("/tools", response_model=List[ToolRecord])
def list_tools():
    return get_all_tools()

# --- READ (Lettura di uno specifico) --- (da valutare utilità)
@router.get("/tools/{tool_id}", response_model=ToolRecord)
def get_tool(tool_id: str):
    tools = get_all_tools()
    for tool in tools:
        if tool.id == tool_id:
            return tool
    raise HTTPException(status_code=404, detail="Tool not found")

# --- UPDATE (Aggiornamento) --- 
@router.put("/tools/{tool_id}", response_model=ToolRecord)
def update_tool(tool_id: str, updated_tool: ToolRecord):
    tools = get_all_tools()
    for index, tool in enumerate(tools):
        if tool.id == tool_id:
            # Assicuriamoci che l'ID del body corrisponda a quello dell'URL
            if updated_tool.id != tool_id:
                raise HTTPException(status_code=400, detail="ID in URL and body must match")
            
            tools[index] = updated_tool
            save_all_tools(tools)
            return updated_tool
            
    raise HTTPException(status_code=404, detail="Tool not found")

# --- DELETE (Cancellazione) ---
@router.delete("/tools/{tool_id}")
def delete_tool(tool_id: str):
    tools = get_all_tools()
    
    for i, tool in enumerate(tools):
        if tool.id == tool_id:
            tools.pop(i)
            save_all_tools(tools)
            return {"status": "deleted", "id": tool_id}
            
    # Se il ciclo finisce senza aver fatto "return", significa che non c'è
    raise HTTPException(status_code=404, detail="Tool not found")