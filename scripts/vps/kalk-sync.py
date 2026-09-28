#!/usr/bin/env python3
"""Run the BeKaPaKa KALK sync without putting its secret in cron or argv."""

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


ENV_PATH = Path("/opt/bekapaka-stats/.env")
SYNC_URL = "http://127.0.0.1:4001/api/internal/kalk/sync"


def read_secret(path: Path) -> str:
    for line in path.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() == "KALK_CRON_SECRET":
            secret = value.strip().strip('"\'')
            if secret:
                return secret
    raise ValueError("KALK_CRON_SECRET is missing from the production .env")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("probe", "full"), default="full")
    args = parser.parse_args()

    try:
        secret = read_secret(ENV_PATH)
        request = urllib.request.Request(
            f"{SYNC_URL}?mode={args.mode}",
            headers={"X-Cron-Secret": secret},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=1200) as response:
            result = json.load(response)
            if response.status != 200 or not result.get("success"):
                raise RuntimeError("KALK sync returned an unsuccessful response")
        print(f"KALK sync completed: mode={args.mode}")
        return 0
    except (OSError, ValueError, RuntimeError, urllib.error.URLError) as error:
        # Never log the URL request object or headers; they contain the secret.
        print(f"KALK sync failed: {type(error).__name__}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
