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
  "data": {"dec_score": 360.9709167480469}
}
```


