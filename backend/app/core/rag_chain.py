import logging
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from app.config import settings
from app.core.vectorstore import get_retriever
from typing import List

logger = logging.getLogger(__name__)

# Simpler, more direct prompt — small 1B models perform better with fewer rules.
# Key principle: put the context BEFORE the question so the model reads it first.
SYSTEM_PROMPT = """You are a precise assistant that answers questions using only the document excerpts below.

Rules:
- Quote amounts and values EXACTLY as they appear — do not calculate, estimate, or invent numbers.
- Answer ONLY what is specifically asked.
- For financial statements: a label (e.g. "TOTAL AMOUNT DUE") is immediately followed by its value on the same or next line. Match each label to its own value — do not confuse "TOTAL AMOUNT DUE" with "MINIMUM DUE" or "AVAILABLE CREDIT LIMIT".
- "TOTAL AMOUNT DUE" and "MINIMUM DUE" are different fields — always return the correct one for what was asked.
- If you cannot find the exact value in the excerpts, say: "The uploaded documents don't contain enough information to answer this question."

---
{context}
---"""


def format_docs(docs: List[Document]) -> str:
    if not docs:
        return "No relevant content found in the uploaded documents."
    parts = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("filename", "unknown")
        page = doc.metadata.get("page", "")
        page_label = f" (page {page + 1})" if page != "" else ""
        parts.append(f"[Excerpt {i} — {source}{page_label}]\n{doc.page_content.strip()}")
    return "\n\n".join(parts)


def build_llm() -> ChatOllama:
    return ChatOllama(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
        temperature=settings.llm_temperature,
        num_predict=settings.llm_max_tokens,
        num_ctx=settings.llm_context_window,
        request_timeout=settings.llm_request_timeout,
    )


async def aretrieve_docs(question: str) -> List[Document]:
    """Retrieve relevant document chunks via MMR."""
    retriever = get_retriever()
    docs = await retriever.ainvoke(question)
    logger.info(
        "Retrieved %d chunks for: %r", len(docs), question[:80]
    )
    for i, d in enumerate(docs, 1):
        logger.debug(
            "  chunk %d — %s p%s — %r",
            i,
            d.metadata.get("filename", "?"),
            d.metadata.get("page", "?"),
            d.page_content[:80],
        )
    return docs


def build_answer_chain(conversation_history: list | None = None):
    """Returns prompt | llm | StrOutputParser. Input: {question, context}."""
    llm = build_llm()

    messages = [("system", SYSTEM_PROMPT)]
    if conversation_history:
        for turn in conversation_history[-4:]:   # last 2 exchanges only
            role = "human" if turn.role == "human" else "assistant"
            messages.append((role, turn.content))
    messages.append(("human", "{question}"))

    prompt = ChatPromptTemplate.from_messages(messages)
    return prompt | llm | StrOutputParser()
