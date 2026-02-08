from fastapi import FastAPI, Body, HTTPException, Path
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import gc
import json
import torch
from torch import nn
from transformers import AutoTokenizer, AutoModel
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
import redis.asyncio as aioredis
import hashlib
from contextlib import asynccontextmanager
import asyncio
import os


# ──────────────────────────────────────────────
# 모델 레지스트리: 새 모델을 추가하려면 여기에 항목만 추가하면 됩니다.
# key   = API URL에 사용될 모델 이름
# value = HuggingFace 모델 ID
# ──────────────────────────────────────────────
MODEL_REGISTRY: dict[str, str] = {
    "llama-3.2-1b-instruct": "meta-llama/Llama-3.2-1B-Instruct",  # hf auth login 으로 사전 인증 필요
    "qwen2.5-0.5b-instruct": "Qwen/Qwen2.5-0.5B-Instruct",
    "qwen3-0.6b": "Qwen/Qwen3-0.6B",
    # "qwen2.5-3b-instruct": "Qwen/Qwen2.5-3B-Instruct",
    "qwen2.5-1.5b-instruct": "Qwen/Qwen2.5-1.5B-Instruct",
    # "qwen2.5-7b-instruct": "Qwen/Qwen2.5-7B-Instruct",
    "exaone-4.0-1.2b": "LGAI-EXAONE/EXAONE-4.0-1.2B",
    "gemma-2b-it": "google/gemma-2b-it",
}


class VariabilityRequest(BaseModel):
    inputs: str


class BatchVariabilityRequest(BaseModel):
    inputs: list[str]


def kl_divergence(p: torch.Tensor, q: torch.Tensor, epsilon: float = 1e-8) -> torch.Tensor:
    p = p + epsilon
    q = q + epsilon
    return torch.sum(p * (torch.log(p) - torch.log(q)))


def jensen_shannon_divergence(logit1: torch.Tensor, logit2: torch.Tensor) -> float:
    softmax = nn.Softmax(dim=1)
    prob1 = softmax(logit1)
    prob2 = softmax(logit2)

    mid_prob = (prob1 + prob2) * 0.5

    kl_div1 = kl_divergence(prob1, mid_prob)
    kl_div2 = kl_divergence(prob2, mid_prob)
    js_div = (kl_div1 + kl_div2) * 0.5
    return js_div.item()


def svc_key_builder(func, namespace: str, request=None, response=None, *args, **kwargs) -> str:
    model_name = kwargs['kwargs']['model_name']
    raw = kwargs['kwargs']['inputs']
    if not raw or raw.isspace():
        raise ValueError("Input cannot be empty or contain only whitespace")
    digest = hashlib.md5(raw.encode("utf-8")).hexdigest()
    return f"{namespace}:{model_name}:extract:{digest}"


def _build_cache_key(model_name: str, inputs: str) -> str:
    """캐시 키를 생성합니다. svc_key_builder 와 동일한 규칙."""
    digest = hashlib.md5(inputs.encode("utf-8")).hexdigest()
    return f"grove:model-centric:variability:{model_name}:extract:{digest}"


def _load_model(model_id: str):
    """모델과 토크나이저를 로드합니다."""
    print(f"[MODEL] Loading {model_id} ...")
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    model = AutoModel.from_pretrained(model_id, output_hidden_states=True)
    model.eval()
    print(f"[MODEL] {model_id} loaded ✓")
    return tokenizer, model


def _unload_model(model, tokenizer):
    """모델과 토크나이저를 메모리에서 해제합니다."""
    del model
    del tokenizer
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        torch.mps.empty_cache()
    print("[MODEL] Unloaded ✓")


def _compute_single(tokenizer, model, inputs: str) -> float:
    """로드된 모델로 단일 input의 variability를 계산합니다."""
    input_ids = tokenizer(inputs, return_tensors="pt", padding=True)["input_ids"]
    with torch.no_grad():
        outputs = model(input_ids)
    first_layer_logits = outputs.hidden_states[0]
    last_layer_logits = outputs.hidden_states[-1]
    return jensen_shannon_divergence(first_layer_logits, last_layer_logits)


@cache(expire=None, key_builder=svc_key_builder)
async def _cached_extract(model_name: str, inputs: str) -> float:
    """단건 요청용: 캐시 히트 시 모델 로드 없이 바로 반환됩니다."""
    model_id = MODEL_REGISTRY[model_name]
    tokenizer, model = _load_model(model_id)
    try:
        return _compute_single(tokenizer, model, inputs)
    finally:
        _unload_model(model, tokenizer)


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
    FastAPICache.init(RedisBackend(redis), prefix="grove:model-centric:variability")
    try:
        yield
    finally:
        await redis.close()


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "UP"}


@app.get("/v1/model-centric/models")
async def list_models():
    """등록된 모델 목록을 반환합니다."""
    return {
        "code": "OK",
        "message": "Success",
        "data": [
            {"key": key, "label": hf_id}
            for key, hf_id in MODEL_REGISTRY.items()
        ],
    }


@app.post("/v1/model-centric/{model_name}/variability/extract")
async def extract_variability(
    model_name: str = Path(..., description="모델 이름 (예: llama-3.2-1b-instruct, qwen3-0.6b)"),
    req: VariabilityRequest = Body(...),
):
    if model_name not in MODEL_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Model '{model_name}' not found. Available: {list(MODEL_REGISTRY.keys())}",
        )
    try:
        dec_score = await _cached_extract(model_name=model_name, inputs=req.inputs)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "code": "OK",
        "message": "Success",
        "data": {"dec_score": dec_score},
    }


@app.post("/v1/model-centric/{model_name}/variability/batch-extract")
async def batch_extract_variability(
    model_name: str = Path(..., description="모델 이름 (예: llama-3.2-1b-instruct, qwen3-0.6b)"),
    req: BatchVariabilityRequest = Body(...),
):
    """
    SSE 스트리밍으로 배치 처리 진행상황을 실시간 전송합니다.

    이벤트 종류:
      - progress : {"index": i, "dec_score": float, "completed": n, "total": N}
      - done     : {"dec_scores": [...]}
      - error    : {"detail": "..."}
    """
    if model_name not in MODEL_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Model '{model_name}' not found. Available: {list(MODEL_REGISTRY.keys())}",
        )

    total = len(req.inputs)

    async def event_stream():
        backend = FastAPICache.get_backend()
        results: list[float | None] = [None] * total
        uncached_indices: list[int] = []
        completed = 0

        # 1) 캐시 조회: 히트된 항목은 바로 progress 이벤트 전송
        for i, inp in enumerate(req.inputs):
            if not inp or inp.isspace():
                results[i] = 0.0
                completed += 1
                yield f"event: progress\ndata: {json.dumps({'index': i, 'dec_score': 0.0, 'completed': completed, 'total': total})}\n\n"
                continue
            key = _build_cache_key(model_name, inp)
            cached = await backend.get(key)
            if cached is not None:
                # RedisBackend 버전에 따라 반환 형식이 다를 수 있음
                if isinstance(cached, (tuple, list)):
                    value = cached[-1]
                else:
                    value = cached
                score = float(value)
                results[i] = score
                completed += 1
                yield f"event: progress\ndata: {json.dumps({'index': i, 'dec_score': score, 'completed': completed, 'total': total})}\n\n"
            else:
                uncached_indices.append(i)

        # 2) 캐시 미스가 있을 때만 모델을 1회 로드하여 순차 처리
        if uncached_indices:
            model_id = MODEL_REGISTRY[model_name]

            # 모델 로딩을 별도 스레드에서 실행하면서 heartbeat 전송
            loop = asyncio.get_event_loop()
            load_task = loop.run_in_executor(None, _load_model, model_id)
            while True:
                done, _ = await asyncio.wait({asyncio.ensure_future(load_task)}, timeout=10)
                if done:
                    break
                yield f"event: heartbeat\ndata: {json.dumps({'status': 'loading_model', 'model': model_id})}\n\n"
            tokenizer, model = load_task.result()

            try:
                for i in uncached_indices:
                    score = _compute_single(tokenizer, model, req.inputs[i])
                    results[i] = score
                    # 캐시 저장
                    key = _build_cache_key(model_name, req.inputs[i])
                    await backend.set(key, str(score))
                    completed += 1
                    yield f"event: progress\ndata: {json.dumps({'index': i, 'dec_score': score, 'completed': completed, 'total': total})}\n\n"
            finally:
                _unload_model(model, tokenizer)

        # 3) 완료 이벤트 — 전체 결과를 순서대로 전송
        yield f"event: done\ndata: {json.dumps({'dec_scores': results})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def get_app() -> FastAPI:
    return app
