from langchain_chroma import Chroma
from app.config import settings
from app.core.embeddings import get_embedding_model


def get_vectorstore() -> Chroma:
    return Chroma(
        collection_name=settings.chroma_collection_name,
        embedding_function=get_embedding_model(),
        persist_directory=settings.chroma_persist_directory,
    )


def get_retriever():
    vs = get_vectorstore()
    return vs.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={
            "k": settings.retrieval_k,
            "score_threshold": settings.retrieval_score_threshold,
        },
    )
