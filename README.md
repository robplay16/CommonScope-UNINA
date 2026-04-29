# CommonScope Starter Repository (commented)

Base repository per progetti di tirocinio triennale su CommonScope.

## Struttura
- `backend/` API FastAPI
- `frontend/` interfaccia minima
- `docs/` documentazione condivisa

## Avvio backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Avvio frontend
```bash
cd frontend
python -m http.server 8080
```

## URL utili
- Backend root: `http://127.0.0.1:8000/`
- Health: `http://127.0.0.1:8000/api/health`
- Docs API: `http://127.0.0.1:8000/docs`
- Frontend: `http://127.0.0.1:8080`
