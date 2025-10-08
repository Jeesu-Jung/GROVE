import os
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple

from pymilvus import (
    connections,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
    utility,
)

# ======== Configuration ========
# OpenAI API Key should be set via environment variable or inline variable below.
# Prefer environment variable OPENAI_API_KEY; fallback to OPENAI_API_KEY_INLINE if provided.
# OPENAI_API_KEY_INLINE = os.getenv("OPENAI_API_KEY_INLINE", "")
# OPENAI_API_KEY = "os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY_INLINE"
OPENAI_API_KEY = "sk-proj-1234567890"

# OpenAI embedding model and endpoint
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

# Milvus connection
MILVUS_HOST = os.getenv("MILVUS_HOST", "localhost")
MILVUS_PORT = int(os.getenv("MILVUS_PORT", "19530"))

# Collection config (align with screenshot)
COLLECTION_NAME = os.getenv("MILVUS_COLLECTION", "seed_sentence")
VECTOR_DIM = int(os.getenv("VECTOR_DIM", "1536"))
INDEX_METRIC = os.getenv("VECTOR_METRIC", "COSINE")

# Input JSON path
JSON_PATH = os.getenv(
    "SEED_SENTENCES_JSON",
    os.path.join(os.path.dirname(__file__), "seed_sentences.json"),
)


def _require_openai_client():
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OpenAI API Key is missing. Set environment variable OPENAI_API_KEY or OPENAI_API_KEY_INLINE."
        )
    try:
        from openai import OpenAI  # type: ignore
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("openai package is required. Install via 'pip install openai'.") from exc
    return OpenAI(api_key=OPENAI_API_KEY)


def load_seed_sentences(path: str) -> List[Tuple[str, str]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    rows: List[Tuple[str, str]] = []
    for group in data:
        group_type = group.get("type", "")
        sentences = group.get("sentences", [])
        for s in sentences:
            if not isinstance(s, str):
                continue
            rows.append((group_type, s))
    return rows


def ensure_collection(name: str) -> Collection:
    """Create collection and index if absent; otherwise return existing collection."""
    exists = utility.has_collection(name)
    if not exists:
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=VECTOR_DIM),
            FieldSchema(name="sentence", dtype=DataType.VARCHAR, max_length=2048),
            FieldSchema(name="type", dtype=DataType.VARCHAR, max_length=512),
        ]
        schema = CollectionSchema(fields=fields, description="Seed sentences with embeddings")
        collection = Collection(name=name, schema=schema)
    else:
        collection = Collection(name)

    # Create indexes if not exists
    try:
        indexes = collection.indexes
    except Exception:
        indexes = []

    has_vector_index = any(getattr(ix, "field_name", None) == "vector" for ix in indexes)
    has_sentence_index = any(getattr(ix, "field_name", None) == "sentence" for ix in indexes)
    has_type_index = any(getattr(ix, "field_name", None) == "type" for ix in indexes)

    if not has_vector_index:
        collection.create_index(
            field_name="vector",
            index_params={
                "index_type": "AUTOINDEX",
                "metric_type": INDEX_METRIC,
                "params": {},
            },
        )
    if not has_sentence_index:
        collection.create_index(
            field_name="sentence",
            index_params={
                "index_type": "AUTOINDEX",
                "params": {},
            },
        )
    if not has_type_index:
        collection.create_index(
            field_name="type",
            index_params={
                "index_type": "AUTOINDEX",
                "params": {},
            },
        )

    # Load for search/insert performance
    collection.load()
    return collection


def embed_texts(client, texts: List[str]) -> List[List[float]]:
    # OpenAI responses may include 'data' with embeddings per input
    response = client.embeddings.create(model=OPENAI_EMBEDDING_MODEL, input=texts)
    # Maintain order
    vectors: List[List[float]] = [None] * len(texts)  # type: ignore
    for i, item in enumerate(response.data):
        vectors[i] = item.embedding  # type: ignore
    return vectors


def insert_rows(collection: Collection, types: List[str], sentences: List[str], vectors: List[List[float]]):
    assert len(types) == len(sentences) == len(vectors)
    entities = [
        vectors,
        sentences,
        types,
    ]
    # Order must match field order except primary auto_id field.
    # Collection schema: id (auto), vector, sentence, type
    mr = collection.insert(entities)
    collection.flush()
    return mr


def main():
    start_ts = time.time()
    print(f"Start: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    # Connect Milvus
    connections.connect(alias="default", host=MILVUS_HOST, port=MILVUS_PORT)

    # Ensure collection and index
    collection = ensure_collection(COLLECTION_NAME)

    # Load data
    pairs = load_seed_sentences(JSON_PATH)
    if not pairs:
        print("No sentences found in JSON. Nothing to do.")
        return

    # Prepare client and embed in batches
    client = _require_openai_client()

    BATCH = int(os.getenv("EMBED_BATCH_SIZE", "64"))
    start = 0
    total = len(pairs)
    inserted = 0
    while start < total:
        end = min(start + BATCH, total)
        batch_pairs = pairs[start:end]
        batch_types = [t for t, _ in batch_pairs]
        batch_texts = [s for _, s in batch_pairs]

        vectors = embed_texts(client, batch_texts)
        mr = insert_rows(collection, batch_types, batch_texts, vectors)
        inserted += len(batch_texts)
        print(f"Inserted {len(batch_texts)} rows (total {inserted}/{total}), pk ranges: {mr.primary_keys if hasattr(mr, 'primary_keys') else 'auto'}")
        start = end

    # Keep collection loaded for immediate querying
    collection.load()
    end_ts = time.time()
    elapsed = timedelta(seconds=int(end_ts - start_ts))
    print(f"End:   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Elapsed: {elapsed}")


if __name__ == "__main__":
    main()


