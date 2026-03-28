import httpx
import logging
from fastapi import APIRouter, Query
from app.config import settings
from app.core.vectorstore import get_vectorstore

router = APIRouter(prefix="/api/system", tags=["system"])
logger = logging.getLogger(__name__)

# ── Model performance tiers ───────────────────────────────────────────────────
# Shown to users in the UI so they understand what to expect.

_MODEL_NOTES = {
    # 1B class — fastest on CPU, lowest quality
    "llama3.2:1b":   {"params": "1B", "vram_gb": 1.3, "quality": "Basic"},
    "qwen2.5:1.5b":  {"params": "1.5B", "vram_gb": 1.0, "quality": "Good"},
    "tinyllama":     {"params": "1.1B", "vram_gb": 0.6, "quality": "Basic"},
    # 3B class — good CPU performance on 8+ GB RAM
    "llama3.2:3b":   {"params": "3B", "vram_gb": 2.0, "quality": "Good"},
    "phi3.5:mini":   {"params": "3.8B", "vram_gb": 2.2, "quality": "Very Good"},
    "gemma2:2b":     {"params": "2B", "vram_gb": 1.6, "quality": "Good"},
    # 7–8B class — needs GPU or 16+ GB RAM
    "llama3.1:8b":   {"params": "8B", "vram_gb": 4.7, "quality": "Excellent"},
    "mistral:7b":    {"params": "7B", "vram_gb": 4.1, "quality": "Excellent"},
    "llama3.2":      {"params": "3B", "vram_gb": 2.0, "quality": "Good"},
}

_CPU_UPGRADE_ADVICE = (
    "You are running on CPU only. Responses will take 30–90 seconds. "
    "For faster responses, consider: "
    "(1) Use a machine with an NVIDIA GPU (4 GB+ VRAM) — Ollama uses it automatically. "
    "(2) Switch to a smaller model like qwen2.5:1.5b for slightly faster answers. "
    "(3) Upgrade to llama3.2:3b or phi3.5:mini on a 16 GB+ RAM machine for better answers at similar speed."
)

_GPU_ADVICE = "GPU detected — excellent performance. Responses should arrive in 5–15 seconds."


@router.get("/info")
async def system_info():
    """
    Returns current model, hardware mode (CPU vs GPU), performance expectations,
    and upgrade recommendations.
    """
    on_gpu = False
    gpu_layers = 0
    ollama_reachable = False
    loaded_models: list[str] = []

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # /api/ps: currently loaded models — includes num_gpu_layers if on GPU
            r = await client.get(f"{settings.ollama_base_url}/api/ps")
            if r.status_code == 200:
                ollama_reachable = True
                for m in r.json().get("models", []):
                    loaded_models.append(m.get("name", ""))
                    model_name = m.get("name", "")
                    if settings.ollama_model in model_name or model_name in settings.ollama_model:
                        details = m.get("details", {})
                        gpu_layers = details.get("num_gpu_layers", 0)
                        on_gpu = gpu_layers > 0
    except Exception as exc:
        logger.warning("Could not reach Ollama for system info: %s", exc)

    model_meta = _MODEL_NOTES.get(settings.ollama_model, {})

    if on_gpu:
        expected_time = "5–15 seconds"
        advice = _GPU_ADVICE
    else:
        expected_time = "30–90 seconds"
        advice = _CPU_UPGRADE_ADVICE

    return {
        "model": settings.ollama_model,
        "model_params": model_meta.get("params", "unknown"),
        "model_quality": model_meta.get("quality", "unknown"),
        "embedding_model": settings.embedding_model,
        "ollama_reachable": ollama_reachable,
        "hardware": {
            "on_gpu": on_gpu,
            "gpu_layers": gpu_layers,
            "mode": "GPU" if on_gpu else "CPU",
        },
        "performance": {
            "expected_response_time": expected_time,
            "advice": advice,
        },
        "recommended_upgrades": _get_recommendations(on_gpu, settings.ollama_model),
    }


@router.get("/debug-chunks")
async def debug_chunks(filename: str = Query(None, description="Filter by filename")):
    """Return raw stored chunks from ChromaDB for inspection."""
    vs = get_vectorstore()
    collection = vs._collection
    results = collection.get(include=["metadatas", "documents"])
    chunks = []
    for doc, meta in zip(results["documents"], results["metadatas"]):
        if filename and filename.lower() not in (meta.get("filename") or "").lower():
            continue
        chunks.append({"filename": meta.get("filename"), "chunk": doc})
    return {"total": len(chunks), "chunks": chunks}


def _get_recommendations(on_gpu: bool, current_model: str) -> list[dict]:
    """Return upgrade path suggestions based on current setup."""
    recs = []

    if not on_gpu:
        if current_model != "qwen2.5:1.5b":
            recs.append({
                "model": "qwen2.5:1.5b",
                "reason": "Similar speed to llama3.2:1b but better answer quality on CPU",
                "effort": "Low — change OLLAMA_MODEL in docker-compose.yml",
            })
        recs.append({
            "model": "phi3.5:mini (3.8B)",
            "reason": "Microsoft research model — excellent Q&A quality, runs on 16 GB RAM",
            "effort": "Medium — needs 16 GB RAM, change OLLAMA_MODEL=phi3.5:mini",
        })
        recs.append({
            "model": "llama3.1:8b (GPU)",
            "reason": "Best quality; requires NVIDIA GPU with 8 GB+ VRAM",
            "effort": "High — needs GPU hardware + OLLAMA_MODEL=llama3.1:8b",
        })
    else:
        if "1b" in current_model or "3b" in current_model:
            recs.append({
                "model": "llama3.1:8b",
                "reason": "8B model gives much better answers with GPU acceleration",
                "effort": "Low — change OLLAMA_MODEL=llama3.1:8b in docker-compose.yml",
            })

    return recs
