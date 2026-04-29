from pydantic import BaseModel, Field
from typing import List, Dict, Optional

# ToolRecord = modello astratto della carta di identità di un tool.
# Non è il tool reale, ma la struttura dati che lo descrive.
class ToolRecord(BaseModel):
    id: str
    name: str
    description: str
    version: str = "0.1.0"
    scope_tags: List[str] = Field(default_factory=list)
    capabilities: List[str] = Field(default_factory=list)
    input_schema: Dict = Field(default_factory=dict)
    output_schema: Dict = Field(default_factory=dict)
    endpoint: Optional[str] = None
    status: str = "active"
    owner: Optional[str] = None
