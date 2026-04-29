from pydantic import BaseModel, Field
from typing import List, Optional

# ScopeRequest = struttura formale di una richiesta al Router.
class ScopeRequest(BaseModel):
    text: str
    desired_capabilities: List[str] = Field(default_factory=list)
    domain: Optional[str] = None
    top_k: int = 3
