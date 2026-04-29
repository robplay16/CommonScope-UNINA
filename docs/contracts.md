# Common contracts

Questo file descrive i contratti dati minimi comuni del progetto.

## Tool schema
Ogni tool deve descrivere almeno:
- name
- description
- version
- scope_tags
- capabilities
- input_schema
- output_schema
- endpoint
- owner

## Scope request schema
Una richiesta al Router deve contenere:
- text
- desired_capabilities
- domain
- top_k

## Nota importante
In questa fase iniziale:
- i tool non sono ancora servizi ML reali
- le carte di identità dei tool sono istanze del modello `ToolRecord`
- i tool correnti sono caricati in memoria in `memory_store.py`
