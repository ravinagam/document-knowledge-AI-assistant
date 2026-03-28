from langchain_chroma import Chroma
from app.config import settings
from app.core.embeddings import get_embedding_model

# Singleton — one ChromaDB client shared across all requests.
_vectorstore: Chroma | None = None


def get_vectorstore() -> Chroma:
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = Chroma(
            collection_name=settings.chroma_collection_name,
            embedding_function=get_embedding_model(),
            persist_directory=settings.chroma_persist_directory,
        )
    return _vectorstore


def get_retriever():
    vs = get_vectorstore()
    total_chunks = vs._collection.count()
    # Cap k and fetch_k to the actual number of chunks available
    k = min(settings.retrieval_k, max(total_chunks, 1))
    fetch_k = min(settings.retrieval_k * 4, max(total_chunks, 1))
    # MMR (Maximal Marginal Relevance): fetches fetch_k candidates then selects
    # k chunks that are both relevant AND diverse — prevents returning near-duplicate
    # overlapping chunks that waste context and confuse the LLM.
    return vs.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": k,
            "fetch_k": fetch_k,
            "lambda_mult": 0.7,  # 0 = max diversity, 1 = max relevance
        },
    )
