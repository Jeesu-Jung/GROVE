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

# Expose the service port
EXPOSE 8083

# Run the application
CMD ["uvicorn", "main:get_app", "--host", "0.0.0.0", "--port", "8083"]
