## 모델 다운로드
https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct/tree/main 의 파일들을 모두 다운로드 후 model/Llama-3.2-1B-Instruct 에 넣어주세요.

## API 서버 실행

8083 포트로 FastAPI 서버를 실행합니다.

```bash
uvicorn main:get_app --host 0.0.0.0 --port 8083
```

요청 예시:

```bash
curl -X POST \
  http://localhost:8083/v1/model-centric/variability/extract \
  -H 'Content-Type: application/json' \
  -d '{"inputs":"tell me about the seasons in the temperate forest biome."}'
```

응답 예시:

```json
{
  "code": "OK",
  "message": "Success",
  "data": {"dec_score": 234.7866210938}
}
```


