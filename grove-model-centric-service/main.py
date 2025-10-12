from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel
import torch
from torch import nn
from transformers import AutoTokenizer, AutoModel
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
import redis.asyncio as aioredis
import hashlib
from contextlib import asynccontextmanager


class VariabilityRequest(BaseModel):
    inputs: str


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
    raw = kwargs['kwargs']['inputs']
    if not raw or raw.isspace():
        raise ValueError("Input cannot be empty or contain only whitespace")
    digest = hashlib.md5(raw.encode("utf-8")).hexdigest()
    return f"{namespace}:extract:{digest}"


class VariabilityService:
    def __init__(self, model_path: str = "./model/Llama-3.2-1B-Instruct") -> None:
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        self.model = AutoModel.from_pretrained(model_path, output_hidden_states=True)
        self.model.eval()

    @cache(expire=None, key_builder=svc_key_builder)
    async def extract(self, inputs: str) -> float:
        input_ids = self.tokenizer(inputs, return_tensors="pt", padding=True)["input_ids"]
        with torch.no_grad():
            outputs = self.model(input_ids)
        first_layer_logits = outputs.hidden_states[0]
        last_layer_logits = outputs.hidden_states[-1]
        return jensen_shannon_divergence(first_layer_logits, last_layer_logits)


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = aioredis.from_url("redis://localhost:6379")
    FastAPICache.init(RedisBackend(redis), prefix="grove:model-centric:variability")
    try:
        yield
    finally:
        await redis.close()


app = FastAPI(lifespan=lifespan)
service = VariabilityService()


@app.post("/v1/model-centric/llama-3.2-1b-instruct/variability/extract")
async def extract_variability(req: VariabilityRequest = Body(...)):
    try:
        dec_score = await service.extract(inputs=req.inputs)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "code": "OK",
        "message": "Success",
        "data": {"dec_score": dec_score},
    }


def get_app() -> FastAPI:
    return app


