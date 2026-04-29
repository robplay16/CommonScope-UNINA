# Brief operativo per gli studenti

## Che cos'è questa repository
Questa repository è una base software comune per costruire i primi moduli di CommonScope.

Non state lavorando su modelli neurali da addestrare.
State lavorando su:
- servizi software
- API
- modelli dati
- routing
- coordinamento tra tool
- interfacce grafiche

## Come leggere la struttura
- `backend/app/models/` contiene i contratti dati
- `backend/app/services/` contiene dati o logiche di supporto
- `backend/app/api/` espone le API del sistema
- `frontend/` contiene la prima GUI
- `docs/` contiene convenzioni e documentazione condivisa

## ToolRecord vs TOOLS
### ToolRecord
Si trova in `backend/app/models/tool.py`.
È il modello astratto della carta di identità di un tool.

### TOOLS
Si trova in `backend/app/services/memory_store.py`.
È la lista concreta dei tool caricati nel prototipo attuale.

In breve:
- `ToolRecord` = schema
- `TOOLS` = dati reali caricati

## Dove sono i tool reali?
Attualmente non ci sono ancora tool reali in esecuzione.
Ci sono solo record descrittivi.

## Dove nascerà la lavagna ontologica?
Non è ancora implementata.
In futuro potrà vivere nel backend con file tipo:
- `backend/app/models/blackboard.py`
- `backend/app/services/blackboard_store.py`
- `backend/app/api/blackboard.py`

## Cosa fare nella prima settimana
1. Avviare backend e frontend
2. Capire il flusso GUI -> API -> dati
3. Leggere i modelli `ToolRecord` e `ScopeRequest`
4. Capire come il Router usa i dati del Registry
5. Discutere con il docente il modulo assegnato
