import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.core.rag_chain import aretrieve_docs, build_answer_chain, format_docs
from app.models.request_models import ChatRequest
from app.models.response_models import ChatResponse, SourceCitation

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream the answer as Server-Sent Events (SSE).

    Event format:
        data: {"type": "token",   "data": "<token>"}
        data: {"type": "sources", "data": [{filename, page, excerpt}, ...]}
        data: {"type": "done"}
        data: {"type": "error",   "data": "<message>"}
    """

    async def event_generator():
        try:
            # Step 1: retrieve relevant chunks
            source_docs = await aretrieve_docs(request.question)
            context = format_docs(source_docs)
            logger.info(
                "Context length: %d chars, docs: %d, question: %r\nCONTEXT:\n%s",
                len(context), len(source_docs), request.question[:80], context,
            )

            # Step 2: stream tokens from LLM
            chain = build_answer_chain(request.conversation_history or None)
            async for token in chain.astream(
                {"question": request.question, "context": context}
            ):
                if token:
                    yield _sse({"type": "token", "data": token})

            # Step 3: emit sources then signal completion
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
            logger.exception("chat_stream error for question: %r", request.question[:80])
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
        source_docs = await aretrieve_docs(request.question)
        context = format_docs(source_docs)
        chain = build_answer_chain(request.conversation_history or None)
        answer = await chain.ainvoke({"question": request.question, "context": context})
    except Exception as e:
        logger.exception("chat_sync error")
        raise HTTPException(status_code=500, detail=str(e))

    sources = [
        SourceCitation(
            filename=d.metadata.get("filename", "unknown"),
            page=d.metadata.get("page"),
            excerpt=d.page_content[:400],
        )
        for d in source_docs
    ]
    return ChatResponse(answer=answer, sources=sources)


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
