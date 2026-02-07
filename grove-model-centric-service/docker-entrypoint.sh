#!/bin/sh
set -eu

MODEL_DIR="${MODEL_DIR:-/app/model/Llama-3.2-1B-Instruct}"

fail() {
  echo "ERROR: $1" >&2
  exit 66
}

if [ ! -d "$MODEL_DIR" ]; then
  fail "모델 디렉토리를 찾을 수 없습니다: '$MODEL_DIR'
- 해결: 호스트에 모델을 내려받고 docker-compose의 볼륨 마운트(MODEL_PATH)를 확인하세요.
- 기대 경로(기본): grove-model-centric-service/model/Llama-3.2-1B-Instruct/"
fi

if [ -z "$(ls -A "$MODEL_DIR" 2>/dev/null || true)" ]; then
  fail "모델 디렉토리가 비어있습니다: '$MODEL_DIR'
- 해결: Hugging Face의 Llama-3.2-1B-Instruct 파일들을 해당 폴더에 모두 넣어주세요."
fi

# Minimal sanity checks for common HF model layouts
missing=""
for f in config.json tokenizer_config.json tokenizer.json; do
  if [ ! -f "$MODEL_DIR/$f" ]; then
    missing="$missing $f"
  fi
done

has_weights="no"
if ls "$MODEL_DIR"/*.safetensors >/dev/null 2>&1; then
  has_weights="yes"
elif ls "$MODEL_DIR"/pytorch_model*.bin >/dev/null 2>&1; then
  has_weights="yes"
fi

if [ "$has_weights" != "yes" ]; then
  missing="$missing (model weights: *.safetensors 또는 pytorch_model*.bin)"
fi

if [ -n "$missing" ]; then
  fail "모델 파일이 누락되었습니다:$missing
- 해결: 모델 디렉토리에 필요한 파일(config/tokenizer/weights)이 모두 존재하는지 확인하세요."
fi

exec "$@"

