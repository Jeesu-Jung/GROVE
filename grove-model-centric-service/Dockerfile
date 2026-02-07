# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY main.py .
COPY extract_variability.py .

# Entrypoint: fail fast if model dir is missing/empty
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN python - <<'PY'
from pathlib import Path

p = Path("/app/docker-entrypoint.sh")
# Normalize CRLF -> LF to avoid runtime 'no such file' on shebang
p.write_bytes(p.read_bytes().replace(b"\r\n", b"\n"))
PY
RUN chmod +x /app/docker-entrypoint.sh

# Create model directory (will be mounted as volume)
RUN mkdir -p /app/model

# Expose the service port
EXPOSE 8083

# Run the application
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["uvicorn", "main:get_app", "--host", "0.0.0.0", "--port", "8083"]
