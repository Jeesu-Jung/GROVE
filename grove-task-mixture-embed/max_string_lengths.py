#!/usr/bin/env python3
import argparse
import json
import os
import sys
from typing import Dict, Iterable, List, Union, Tuple


TargetFields = ("input", "output", "instruction", "constraint", "inputs")


def load_json(path: str) -> Union[List[dict], dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def iter_records(data: Union[List[dict], dict]) -> Iterable[dict]:
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                yield item
    elif isinstance(data, dict):
        # If it's a mapping, try common container keys; otherwise treat as single record
        for key in ("data", "items", "records", "rows"):
            value = data.get(key)
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        yield item
                return
        yield data


def compute_max_lengths(data: Union[List[dict], dict], fields: Iterable[str]) -> Tuple[Dict[str, int], int]:
    max_lengths: Dict[str, int] = {field: 0 for field in fields}
    total_records = 0
    for record in iter_records(data):
        total_records += 1
        for field in fields:
            value = record.get(field)
            if isinstance(value, str):
                length = len(value)
                if length > max_lengths[field]:
                    max_lengths[field] = length
    return max_lengths, total_records


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Compute maximum string lengths for specific fields in a JSON file "
            f"({', '.join(TargetFields)})."
        )
    )
    parser.add_argument(
        "json_path",
        nargs="?",
        default=os.path.join(os.path.dirname(__file__), "instruction_alpaca.json"),
        help="Path to JSON file (defaults to grove-zebra/instruction_alpaca.json)",
    )
    args = parser.parse_args()

    if not os.path.isfile(args.json_path):
        print(f"파일을 찾을 수 없습니다: {args.json_path}", file=sys.stderr)
        return 1

    try:
        data = load_json(args.json_path)
    except json.JSONDecodeError as e:
        print(f"JSON 파싱 오류: {e}", file=sys.stderr)
        return 2

    max_lengths, total_records = compute_max_lengths(data, TargetFields)

    # Output: one line per field
    print(f"total_records: {total_records}")
    for field in TargetFields:
        print(f"{field}: {max_lengths[field]}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())


