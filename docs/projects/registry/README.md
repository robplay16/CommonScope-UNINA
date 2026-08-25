# CommonScope Registry

## Objective
Build the persistent registry of tools for CommonScope.

## Scope
- Persistent storage of tool records
- CRUD API
- Validation of tool fields
- Replacement of in-memory store with a real database

## Suggested stack
- FastAPI
- Pydantic
- SQLite or PostgreSQL
- SQLAlchemy
- Docker

## Expected deliverables
- Persistent backend registry
- CRUD API
- Seed data
- Documentation
- Minimal tests

## Notes
This project corresponds to Project 1 in the internship guide.

---

## Registry Implementation Documentation

The Tool Registry serves as the central catalog for the CommonScope ecosystem, providing a formalized and persistent record of all available tools. The module is built using FastAPI and Pydantic, exposing a fully functional RESTful API.

### Data Model: ToolRecord
The system relies on a strict data schema defined via Pydantic to ensure all tools are described uniformly. The `ToolRecord` entity includes the following core attributes:
* **Identifiers & Metadata:** `id`, `name`, `description`, `version` (default: 0.1.0), `status` (default: active), and `owner`.
* **Taxonomy:** `scope_tags` (domain of application) and `capabilities` (specific actions the tool performs).
* **Integration Specs:** `input_schema`, `output_schema`, and a resolvable `endpoint`.

### RESTful API Endpoints
The backend exposes comprehensive CRUD operations under the `/api/registry` prefix, featuring robust error handling for conflicts and missing resources.

| Method | Endpoint | Functionality |
| :--- | :--- | :--- |
| **POST** | `/api/registry/tools` | Registers a new tool. Validates against existing IDs to prevent duplicates, raising a 400 error if a conflict occurs. |
| **GET** | `/api/registry/tools` | Retrieves the complete list of registered `ToolRecord` objects. |
| **GET** | `/api/registry/tools/{tool_id}` | Fetches a specific tool by its unique identifier, raising a 404 error if not found. |
| **PUT** | `/api/registry/tools/{tool_id}` | Updates an existing tool. Enforces consistency by requiring the ID in the URL to match the ID in the request body. |
| **DELETE**| `/api/registry/tools/{tool_id}` | Removes a tool from the registry, confirming deletion or raising a 404 error if the target does not exist. |
| **GET** | `/api/health` | System health check endpoint returning `{"status": "ok"}`. |

### Persistence Layer
To achieve data persistence without the immediate overhead of a relational database, the system utilizes a local JSON file (`tools_db.json`) as a lightweight storage mechanism.
* **Read Operations:** The storage service parses the JSON file and reconstructs validated `ToolRecord` objects, safely returning an empty list if the file is missing or corrupted.
* **Write Operations:** Tool lists are serialized using Pydantic's `model_dump()` method and saved with standardized JSON indentation.

### Application Configuration
The FastAPI application is configured with wide-open CORS middleware (`allow_origins=["*"]`) to facilitate seamless local testing and integration with the frontend. Upon starting the server, automatic interactive API documentation (Swagger UI) is natively generated and accessible at the `/docs` route.