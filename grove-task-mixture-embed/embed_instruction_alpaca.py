import os
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

from pymilvus import (
    connections,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
    utility,
)

# ======== Configuration ========
# OPENAI_API_KEY_INLINE = os.getenv("OPENAI_API_KEY_INLINE", "")
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY_INLINE
OPENAI_API_KEY = "sk-proj-1234567890"
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

MILVUS_HOST = os.getenv("MILVUS_HOST", "localhost")
MILVUS_PORT = int(os.getenv("MILVUS_PORT", "19530"))
COLLECTION_NAME = os.getenv("MILVUS_COLLECTION", "instruction_alpaca")
VECTOR_DIM = int(os.getenv("VECTOR_DIM", "1536"))
INDEX_METRIC = os.getenv("VECTOR_METRIC", "COSINE")

JSON_PATH = os.getenv(
    "INSTRUCTION_ALPACA_JSON",
    os.path.join(os.path.dirname(__file__), "instruction_alpaca.json"),
    # os.path.join(os.path.dirname(__file__), "50개.json"),
)


def _require_openai_client():
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OpenAI API Key is missing. Set OPENAI_API_KEY or OPENAI_API_KEY_INLINE."
        )
    from openai import OpenAI  # type: ignore
    return OpenAI(api_key=OPENAI_API_KEY)


def ensure_collection(name: str) -> Collection:
    if not utility.has_collection(name):
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=VECTOR_DIM),
            FieldSchema(name="input", dtype=DataType.VARCHAR, max_length=8192),
            FieldSchema(name="inputs", dtype=DataType.VARCHAR, max_length=8192),
            FieldSchema(name="constraint", dtype=DataType.VARCHAR, max_length=8192),
            FieldSchema(name="output", dtype=DataType.VARCHAR, max_length=8192),
            FieldSchema(name="instruction", dtype=DataType.VARCHAR, max_length=8192),
        ]
        schema = CollectionSchema(fields=fields, description="instruction_alpaca dataset with embeddings")
        collection = Collection(name=name, schema=schema)
    else:
        collection = Collection(name)

    try:
        indexes = collection.indexes
    except Exception:
        indexes = []
    names = {getattr(ix, "field_name", None) for ix in indexes}

    if "vector" not in names:
        collection.create_index(
            field_name="vector",
            index_params={"index_type": "AUTOINDEX", "metric_type": INDEX_METRIC, "params": {}},
        )
    for text_field in ["input", "inputs", "constraint", "output", "instruction"]:
        if text_field not in names:
            collection.create_index(
                field_name=text_field,
                index_params={"index_type": "AUTOINDEX", "params": {}},
            )

    collection.load()
    return collection


def load_records(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Normalize missing keys to empty string
    for row in data:
        for k in ["input", "inputs", "constraint", "output", "instruction"]:
            if k not in row or row[k] is None:
                row[k] = ""
    return data


def embed_texts(client, texts: List[str]) -> List[List[float]]:
    resp = client.embeddings.create(model=OPENAI_EMBEDDING_MODEL, input=texts)
    out: List[List[float]] = [None] * len(texts)  # type: ignore
    for i, d in enumerate(resp.data):
        out[i] = d.embedding  # type: ignore
    return out


def main():
    start_ts = time.time()
    print(f"Start: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    connections.connect(host=MILVUS_HOST, port=MILVUS_PORT)
    collection = ensure_collection(COLLECTION_NAME)

    rows = load_records(JSON_PATH)
    if not rows:
        print("No records found.")
        return

    client = _require_openai_client()
    batch = int(os.getenv("EMBED_BATCH_SIZE", "512"))

    total = len(rows)
    start = 0
    inserted = 0
    while start < total:
        end = min(start + batch, total)
        seg = rows[start:end]
        subtexts = [r.get("inputs", "") for r in seg]
        subvectors = embed_texts(client, subtexts)

        # Prepare aligned columns (excluding auto id)
        col_vectors = subvectors
        col_input = [r.get("input", "") for r in seg]
        col_inputs = [r.get("inputs", "") for r in seg]
        col_constraint = [r.get("constraint", "") for r in seg]
        col_output = [r.get("output", "") for r in seg]
        col_instruction = [r.get("instruction", "") for r in seg]

        entities = [
            col_vectors,
            col_input,
            col_inputs,
            col_constraint,
            col_output,
            col_instruction,
        ]
        mr = collection.insert(entities)
        collection.flush()
        inserted += len(seg)
        print(f"Inserted {len(seg)} rows (total {inserted}/{total})")
        start = end

    collection.load()
    end_ts = time.time()
    elapsed = timedelta(seconds=int(end_ts - start_ts))
    print(f"End:   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Elapsed: {elapsed}")


if __name__ == "__main__":
    main()


