"""
MarketMind AI v2 — LLM Client
Async wrapper for OpenAI / Anthropic / local LLM chat completions.
Supports rate limiting, retries, and configurable provider.
"""

import asyncio
import json
from typing import Dict, Any, Optional, List

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Rate-limiting semaphore: max concurrent LLM calls
_llm_semaphore = asyncio.Semaphore(5)


async def chat_completion(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 1024,
    response_format: Optional[Dict[str, str]] = None,
) -> str:
    """
    Send a chat completion request to the configured LLM provider.
    Returns the assistant's response text.
    """
    provider = settings.LLM_PROVIDER.lower()

    async with _llm_semaphore:
        if provider == "openai":
            return await _openai_completion(messages, model, temperature, max_tokens, response_format)
        elif provider == "anthropic":
            return await _anthropic_completion(messages, model, temperature, max_tokens)
        elif provider == "local":
            return await _local_completion(messages, model, temperature, max_tokens)
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")


async def _openai_completion(
    messages: List[Dict[str, str]],
    model: Optional[str],
    temperature: float,
    max_tokens: int,
    response_format: Optional[Dict[str, str]] = None,
) -> str:
    """Call OpenAI Chat Completions API."""
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        model = model or "gpt-4o-mini"

        kwargs: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            kwargs["response_format"] = response_format

        logger.info("openai_request", model=model, msg_count=len(messages))

        response = await client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content or ""

        logger.info("openai_response", tokens=response.usage.total_tokens if response.usage else 0)
        return content

    except Exception as e:
        logger.error("openai_error", error=str(e))
        raise


async def _anthropic_completion(
    messages: List[Dict[str, str]],
    model: Optional[str],
    temperature: float,
    max_tokens: int,
) -> str:
    """Call Anthropic Messages API."""
    try:
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        model = model or "claude-3-5-sonnet-20241022"

        # Anthropic uses system message separately
        system_msg = ""
        api_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"]
            else:
                api_messages.append(msg)

        logger.info("anthropic_request", model=model, msg_count=len(api_messages))

        response = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_msg,
            messages=api_messages,
        )
        content = response.content[0].text if response.content else ""

        logger.info("anthropic_response", input_tokens=response.usage.input_tokens)
        return content

    except Exception as e:
        logger.error("anthropic_error", error=str(e))
        raise


async def _local_completion(
    messages: List[Dict[str, str]],
    model: Optional[str],
    temperature: float,
    max_tokens: int,
) -> str:
    """Call a local LLM (Ollama / llama.cpp) via OpenAI-compatible API."""
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key="not-needed",
            base_url=settings.LOCAL_LLM_URL,
        )
        model = model or "llama3"

        logger.info("local_llm_request", model=model, url=settings.LOCAL_LLM_URL)

        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content or ""
        return content

    except Exception as e:
        logger.error("local_llm_error", error=str(e))
        raise


async def structured_extraction(
    text: str,
    system_prompt: str,
    response_schema: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Use LLM to extract structured data from text.
    Returns parsed JSON matching the requested schema.
    """
    messages = [
        {
            "role": "system",
            "content": f"{system_prompt}\n\nRespond ONLY with valid JSON matching this schema:\n{json.dumps(response_schema, indent=2)}",
        },
        {"role": "user", "content": text},
    ]

    response = await chat_completion(
        messages=messages,
        temperature=0.1,
        response_format={"type": "json_object"} if settings.LLM_PROVIDER == "openai" else None,
    )

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        logger.error("structured_extraction_parse_error", response=response[:200])
        return {}
