from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.documents import Document
from app.config import settings
from app.core.vectorstore import get_retriever
from typing import List

SYSTEM_PROMPT = """You are a knowledgeable assistant that answers questions strictly based on the provided document context.

Guidelines:
1. Answer ONLY from the context below. Do not use prior knowledge.
2. If the context does not contain enough information, say: "I don't have enough information in the uploaded documents to answer this."
3. Be concise, accurate, and cite the source document when possible.
4. Never hallucinate or make up facts.

Context:
{context}
"""


def format_docs(docs: List[Document]) -> str:
    if not docs:
        return "No relevant documents found."
    parts = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("filename", "unknown")
        page = doc.metadata.get("page", "")
        page_str = f", page {page + 1}" if page != "" else ""
        parts.append(f"[Source {i}: {source}{page_str}]\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)


def build_llm() -> ChatOllama:
    return ChatOllama(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
        temperature=settings.llm_temperature,
        num_predict=settings.llm_max_tokens,
    )


def build_rag_chain(conversation_history: list | None = None):
    """
    Build the LangChain RAG chain.
    Returns a chain that accepts a question string and yields
    {"answer": str, "source_docs": list[Document]}.
    """
    llm = build_llm()
    retriever = get_retriever()

    # Build prompt messages including optional conversation history
    messages = [("system", SYSTEM_PROMPT)]
    if conversation_history:
        for turn in conversation_history[-8:]:  # last 4 exchanges max
            role = "human" if turn.role == "human" else "assistant"
            messages.append((role, turn.content))
    messages.append(("human", "{question}"))

    prompt = ChatPromptTemplate.from_messages(messages)

    # Fetch context and pass question through in parallel
    setup = RunnableParallel(
        context=retriever | format_docs,
        question=RunnablePassthrough(),
        source_docs=retriever,
    )

    chain = setup | {
        "answer": (
            RunnablePassthrough.assign(context=lambda x: x["context"])
            | prompt
            | llm
            | StrOutputParser()
        ),
        "source_docs": lambda x: x["source_docs"],
    }

    return chain
