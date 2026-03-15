from pydantic import BaseModel, Field
from typing import List


class ConversationTurn(BaseModel):
    role: str  # "human" or "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    conversation_history: List[ConversationTurn] = Field(default_factory=list)
