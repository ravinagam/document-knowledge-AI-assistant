import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.core.rag_chain import build_rag_chain
from app.models.request_models import ChatRequest
from app.models.response_models import ChatResponse, SourceCitation

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream the answer as Server-Sent Events (SSE).

    Event format (each line):
        data: {"type": "token",   "data": "<token>"}
        data: {"type": "sources", "data": [{filename, page, excerpt}, ...]}
        data: {"type": "done"}
        data: {"type": "error",   "data": "<message>"}
    """

    async def event_generator():
        source_docs = []
        try:
            chain = build_rag_chain(request.conversation_history or None)

            async for chunk in chain.astream(request.question):
                if "answer" in chunk and chunk["answer"]:
                    yield _sse({"type": "token", "data": chunk["answer"]})
                if "source_docs" in chunk and chunk["source_docs"]:
                    source_docs = chunk["source_docs"]

            # Emit sources after streaming completes
            sources = [
                {
                    "filename": d.metadata.get("filename", "unknown"),
                    "page": d.metadata.get("page"),
                    "excerpt": d.page_content[:400],
                }
                for d in source_docs
            ]
            yield _sse({"type": "sources", "data": sources})
            yield _sse({"type": "done"})

        except Exception as e:
            yield _sse({"type": "error", "data": str(e)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("", response_model=ChatResponse)
async def chat_sync(request: ChatRequest):
    """Non-streaming fallback — returns the full answer at once."""
    try:
        chain = build_rag_chain(request.conversation_history or None)
        result = await chain.ainvoke(request.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    sources = [
        SourceCitation(
            filename=d.metadata.get("filename", "unknown"),
            page=d.metadata.get("page"),
            excerpt=d.page_content[:400],
        )
        for d in result.get("source_docs", [])
    ]
    return ChatResponse(answer=result["answer"], sources=sources)


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
