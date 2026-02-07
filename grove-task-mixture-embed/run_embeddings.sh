#!/bin/sh
set -eu

echo "== GROVE Milvus embedding indexer =="

if [ -z "${OPENAI_API_KEY:-}" ] && [ -z "${OPENAI_API_KEY_INLINE:-}" ]; then
  echo "ERROR: OPENAI_API_KEY 가 설정되지 않았습니다. (.env 또는 환경변수로 설정)" >&2
  exit 66
fi

python /app/wait_for_milvus.py

echo "== Embedding seed sentences =="
MILVUS_COLLECTION="${SEED_SENTENCE_COLLECTION:-seed_sentence}" python /app/embed_seed_sentences.py

echo "== Embedding instruction alpaca =="
MILVUS_COLLECTION="${INSTRUCTION_ALPACA_COLLECTION:-instruction_alpaca}" python /app/embed_instruction_alpaca.py

echo "== Done =="

