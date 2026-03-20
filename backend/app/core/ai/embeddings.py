"""
MarketMind AI v2 — Embeddings
Compute text embeddings via OpenAI or local SentenceTransformers.
Supports caching and batch computation.
"""

import asyncio
from typing import List, Optional

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Cache for the local model to avoid repeated loading
_local_model = None


def _get_local_model():
    """Lazily load the SentenceTransformers model."""
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        _local_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("local_embedding_model_loaded", model="all-MiniLM-L6-v2")
    return _local_model


async def compute_embedding(text: str) -> List[float]:
    """
    Compute embedding vector for a single text string.
    Uses the provider configured in settings.EMBEDDING_PROVIDER.
    """
    provider = settings.EMBEDDING_PROVIDER.lower()

    if provider == "openai":
        return await _openai_embedding(text)
    elif provider == "local":
        return await _local_embedding(text)
    else:
        raise ValueError(f"Unknown embedding provider: {provider}")


async def compute_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Compute embeddings for a batch of texts."""
    provider = settings.EMBEDDING_PROVIDER.lower()

    if provider == "openai":
        return await _openai_embeddings_batch(texts)
    elif provider == "local":
        return await _local_embeddings_batch(texts)
    else:
        raise ValueError(f"Unknown embedding provider: {provider}")


async def _openai_embedding(text: str) -> List[float]:
    """Compute embedding via OpenAI API."""
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        response = await client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=text,
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error("openai_embedding_error", error=str(e))
        raise


async def _openai_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Compute embeddings for a batch via OpenAI API."""
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        response = await client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=texts,
        )
        # Sort by index to maintain order
        sorted_data = sorted(response.data, key=lambda x: x.index)
        return [item.embedding for item in sorted_data]
    except Exception as e:
        logger.error("openai_batch_embedding_error", error=str(e))
        raise


async def _local_embedding(text: str) -> List[float]:
    """Compute embedding locally using SentenceTransformers."""
    loop = asyncio.get_event_loop()
    model = _get_local_model()
    embedding = await loop.run_in_executor(None, model.encode, text)
    return embedding.tolist()


async def _local_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Compute batch embeddings locally using SentenceTransformers."""
    loop = asyncio.get_event_loop()
    model = _get_local_model()
    embeddings = await loop.run_in_executor(None, model.encode, texts)
    return [e.tolist() for e in embeddings]


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    import numpy as np
    a = np.array(vec_a)
    b = np.array(vec_b)
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 0.0
    return float(dot / norm)
