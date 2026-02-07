import os
import time

import httpx


def main() -> None:
    url = os.getenv("MILVUS_HEALTH_URL", "http://milvus:9091/healthz")
    timeout_s = int(os.getenv("MILVUS_WAIT_SECONDS", "240"))
    interval_s = float(os.getenv("MILVUS_WAIT_INTERVAL_SECONDS", "2"))

    deadline = time.time() + timeout_s
    last_err: str | None = None

    while time.time() < deadline:
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(url)
            if resp.status_code == 200:
                print(f"Milvus is healthy: {url}")
                return
            last_err = f"status={resp.status_code}, body={resp.text[:200]!r}"
        except Exception as exc:
            last_err = str(exc)

        print(f"Waiting for Milvus... ({last_err})")
        time.sleep(interval_s)

    raise SystemExit(f"Timed out waiting for Milvus health at {url}: {last_err}")


if __name__ == "__main__":
    main()

