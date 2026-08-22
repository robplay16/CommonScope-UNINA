from fastapi.testclient import TestClient
from app.main import app 

client = TestClient(app)

def test_tool_not_found():
    """Verifica che venga restituito errore 404 per un tool inesistente."""
    response = client.get("/api/registry/tools/id-che-non-esiste")
    assert response.status_code == 404

def test_read_single_tool():
    """Verifica esclusivamente la lettura di un singolo tool (GET /{tool_id})."""
    mock_tool = {
        "id": "test-tool-read",
        "name": "Tool da Leggere",
        "description": "Test per la lettura",
        "version": "1.0.0",
        "status": "active"
    }
    
    # 1. Creazione iniziale
    client.post("/api/registry/tools", json=mock_tool)
    
    # 2. Lettura e verifica
    get_response = client.get("/api/registry/tools/test-tool-read")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Tool da Leggere"
    
    # 3. Pulizia
    client.delete("/api/registry/tools/test-tool-read")

def test_update_tool():
    """Verifica esclusivamente l'aggiornamento di un tool (PUT /{tool_id})."""
    mock_tool = {
        "id": "test-tool-update",
        "name": "Tool Originale",
        "description": "Test per la modifica",
        "version": "1.0.0",
        "status": "active"
    }
    
    # 1. Creazione iniziale
    client.post("/api/registry/tools", json=mock_tool)
    
    # 2. Modifica
    mock_tool["name"] = "Tool Aggiornato"
    put_response = client.put("/api/registry/tools/test-tool-update", json=mock_tool)
    assert put_response.status_code == 200
    assert put_response.json()["name"] == "Tool Aggiornato"
    
    # 3. Pulizia
    client.delete("/api/registry/tools/test-tool-update")
def test_read_all_tools():
    # Nota il prefisso corretto!
    response = client.get("/api/registry/tools")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_and_delete_tool():
    mock_tool = {
        "id": "test-tool-99",
        "name": "Tool di Prova",
        "description": "Un tool generato automaticamente dai test",
        "version": "1.0.0",
        "status": "active"
    }
    
    # Nota il prefisso corretto!
    post_response = client.post("/api/registry/tools", json=mock_tool)
    assert post_response.status_code == 200
    assert post_response.json()["id"] == "test-tool-99"
    
    # Nota il prefisso corretto!
    delete_response = client.delete("/api/registry/tools/test-tool-99")
    assert delete_response.status_code == 200
    assert delete_response.json()["id"] == "test-tool-99"


    