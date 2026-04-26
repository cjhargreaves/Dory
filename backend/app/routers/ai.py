import asyncio
import json
from datetime import datetime, timezone
from typing import Optional
from urllib import error, request

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from app.config import settings

router = APIRouter()
DEFAULT_MODEL_FALLBACKS = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
]


def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.backend_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


class AgentSummary(BaseModel):
    agent: str
    total_cost_usd: float
    total_input_tokens: int
    total_output_tokens: int
    call_count: int
    last_seen: str


class ModelSummary(BaseModel):
    model: str
    total_cost_usd: float
    total_input_tokens: int
    total_output_tokens: int
    call_count: int
    agent_count: int


class FunctionSummary(BaseModel):
    function_name: str
    total_cost_usd: float
    total_input_tokens: int
    total_output_tokens: int
    call_count: int
    model_count: int


class SpendSummaryPayload(BaseModel):
    total_cost_usd: float
    agents: list[AgentSummary]
    models: list[ModelSummary]
    functions: list[FunctionSummary]


class DetailedBreakdownPayload(BaseModel):
    agent: str
    model: str
    function_name: str = "unspecified"
    total_cost_usd: float
    total_input_tokens: int
    total_output_tokens: int
    call_count: int
    last_seen: str


class SpendEventPayload(BaseModel):
    agent: str
    model: str
    function_name: Optional[str] = None
    input_tokens: int
    output_tokens: int
    cost_usd: float
    timestamp: str


class DashboardSuggestionRequest(BaseModel):
    summary: SpendSummaryPayload
    details: list[DetailedBreakdownPayload]
    events: list[SpendEventPayload]


def _avg(numerator: float, denominator: int) -> float:
    return round(numerator / denominator, 6) if denominator else 0.0


def _build_prompt(payload: DashboardSuggestionRequest) -> str:
    summary = payload.summary
    agent_metrics = [
        {
            "agent": agent.agent,
            "total_cost_usd": round(agent.total_cost_usd, 6),
            "call_count": agent.call_count,
            "avg_cost_per_call_usd": _avg(agent.total_cost_usd, agent.call_count),
            "avg_total_tokens_per_call": round(
                (agent.total_input_tokens + agent.total_output_tokens) / agent.call_count, 2
            )
            if agent.call_count
            else 0,
            "total_input_tokens": agent.total_input_tokens,
            "total_output_tokens": agent.total_output_tokens,
            "last_seen": agent.last_seen,
        }
        for agent in sorted(summary.agents, key=lambda item: item.total_cost_usd, reverse=True)
    ]

    detail_metrics = [
        {
            "agent": detail.agent,
            "model": detail.model,
            "function_name": detail.function_name,
            "total_cost_usd": round(detail.total_cost_usd, 6),
            "call_count": detail.call_count,
            "avg_cost_per_call_usd": _avg(detail.total_cost_usd, detail.call_count),
            "avg_total_tokens_per_call": round(
                (detail.total_input_tokens + detail.total_output_tokens) / detail.call_count, 2
            )
            if detail.call_count
            else 0,
            "total_input_tokens": detail.total_input_tokens,
            "total_output_tokens": detail.total_output_tokens,
            "last_seen": detail.last_seen,
        }
        for detail in sorted(payload.details, key=lambda item: item.total_cost_usd, reverse=True)
    ]

    model_metrics = [
        {
            "model": model.model,
            "total_cost_usd": round(model.total_cost_usd, 6),
            "call_count": model.call_count,
            "agent_count": model.agent_count,
            "avg_cost_per_call_usd": _avg(model.total_cost_usd, model.call_count),
            "avg_total_tokens_per_call": round(
                (model.total_input_tokens + model.total_output_tokens) / model.call_count, 2
            )
            if model.call_count
            else 0,
        }
        for model in summary.models
    ]

    recent_events = [
        {
            "agent": event.agent,
            "model": event.model,
            "function_name": event.function_name or "unspecified",
            "cost_usd": round(event.cost_usd, 6),
            "input_tokens": event.input_tokens,
            "output_tokens": event.output_tokens,
            "timestamp": event.timestamp,
        }
        for event in payload.events[:25]
    ]

    dashboard_snapshot = {
        "window": "Last 30 days for aggregated tables; recent events sample included below.",
        "totals": {
            "total_cost_usd": round(summary.total_cost_usd, 6),
            "agent_count": len(summary.agents),
            "model_count": len(summary.models),
            "function_count": len(summary.functions),
            "total_calls": sum(agent.call_count for agent in summary.agents),
        },
        "agents": agent_metrics[:25],
        "models": model_metrics[:15],
        "functions": [
            {
                "function_name": fn.function_name,
                "total_cost_usd": round(fn.total_cost_usd, 6),
                "call_count": fn.call_count,
                "model_count": fn.model_count,
            }
            for fn in summary.functions[:15]
        ],
        "top_agent_model_pairs": detail_metrics[:30],
        "recent_events": recent_events,
    }

    return "\n".join(
        [
            "You are an AI cost optimization analyst for a dashboard that tracks agent usage.",
            "Review the JSON snapshot and give concrete, specific optimization suggestions.",
            "Focus on:",
            "1. Agents using expensive models when a cheaper model would probably work.",
            "2. Estimated cost savings in USD, with assumptions stated when needed.",
            "3. Agents making too many calls, especially if average tokens or cost per call are small.",
            "4. Opportunities to batch, cache, debounce, or consolidate calls.",
            "Use only the provided data and clearly mark any assumption.",
            "Prefer actionable recommendations like 'move agent X from model A to model B' or",
            "'reduce agent Y call frequency by batching N small requests together.'",
            "Return Markdown with exactly these sections:",
            "## Snapshot",
            "## Top Recommendations",
            "## High-Call Agents",
            "## Quick Wins",
            "Each recommendation should include the agent name, current model, proposed change,",
            "why it is a fit, and estimated savings.",
            "If there are no strong recommendations, say so plainly.",
            "",
            json.dumps(dashboard_snapshot, indent=2),
        ]
    )


def _extract_text(response_body: dict) -> str:
    candidates = response_body.get("candidates") or []
    for candidate in candidates:
        content = candidate.get("content") or {}
        parts = content.get("parts") or []
        texts = [part.get("text", "") for part in parts if part.get("text")]
        if texts:
            return "\n".join(texts).strip()
    return ""


def _build_gemini_url(model_name: str) -> str:
    return (
        "https://generativelanguage.googleapis.com/"
        f"{settings.gemini_api_version}/models/{model_name}:generateContent"
    )


def _model_list_url() -> str:
    return (
        "https://generativelanguage.googleapis.com/"
        f"{settings.gemini_api_version}/models?pageSize=200"
    )


def _request_json(url: str, api_key: str) -> dict:
    req = request.Request(
        url,
        headers={"x-goog-api-key": api_key},
        method="GET",
    )

    with request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def _list_supported_generate_models(api_key: str) -> set[str]:
    body = _request_json(_model_list_url(), api_key)
    supported_models: set[str] = set()

    for model in body.get("models", []):
        methods = model.get("supportedGenerationMethods", [])
        name = model.get("name", "")
        if "generateContent" in methods and name.startswith("models/"):
            supported_models.add(name.split("/", 1)[1])

    return supported_models


def _resolve_model_name(api_key: str, preferred_model: str) -> str:
    supported_models = _list_supported_generate_models(api_key)

    if preferred_model in supported_models:
        return preferred_model

    for fallback in DEFAULT_MODEL_FALLBACKS:
        if fallback in supported_models:
            return fallback

    if supported_models:
        return sorted(supported_models)[0]

    raise RuntimeError("Gemini API returned no generateContent-capable models")


def _post_generate_content(prompt: str, api_key: str, gemini_model: str) -> dict:
    gemini_url = (
        _build_gemini_url(gemini_model)
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "topP": 0.9,
            "maxOutputTokens": 1200,
        },
    }

    req = request.Request(
        gemini_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini API error ({exc.code}): {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Gemini API request failed: {exc.reason}") from exc


def _request_gemini(prompt: str, api_key: str) -> tuple[str, str]:
    preferred_model = settings.gemini_model

    try:
        body = _post_generate_content(prompt, api_key, preferred_model)
        used_model = preferred_model
    except RuntimeError as exc:
        if "Gemini API error (404)" not in str(exc):
            raise

        fallback_model = _resolve_model_name(api_key, preferred_model)
        body = _post_generate_content(prompt, api_key, fallback_model)
        used_model = fallback_model

    text = _extract_text(body)
    if not text:
        raise RuntimeError("Gemini API returned no text content")

    return text, used_model


@router.post("/api/ai/dashboard-suggestions", dependencies=[Depends(verify_api_key)])
async def dashboard_suggestions(payload: DashboardSuggestionRequest):
    try:
        gemini_api_key = settings.gemini_backend_api_key
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    prompt = _build_prompt(payload)

    try:
        suggestions, used_model = await asyncio.to_thread(_request_gemini, prompt, gemini_api_key)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "model": used_model,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "suggestions": suggestions,
    }
