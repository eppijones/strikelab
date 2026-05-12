"""Check that the iOS Caddie's frozen schema contract still matches what
Pydantic generates for the on-course models.

Run locally:
    python -m scripts.check_schema_drift

CI:
    python -m scripts.check_schema_drift --check
        → exit 0 when contract matches, 2 when drift detected.

Regenerate (after intentional schema changes):
    python -m scripts.check_schema_drift --update

The contract lives at `apps/ios/StrikeLabCaddie/Models/contract.json`.
It's the source of truth the iOS team has agreed to — drift means iOS
hand-written models will silently disagree with the server.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Make this script runnable both as `python -m scripts.check_schema_drift`
# from `apps/api` and as `python apps/api/scripts/check_schema_drift.py`
# from the repo root.
HERE = Path(__file__).resolve().parent
API_ROOT = HERE.parent
REPO_ROOT = API_ROOT.parent.parent
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.schemas.caddie import (  # noqa: E402  — sys.path mutation above
    RoundCreate,
    RoundHole,
    RoundResponse,
    RoundShotCreate,
    RoundShotResponse,
    RoundUpdate,
)

CONTRACT_PATH = (
    REPO_ROOT
    / "apps"
    / "ios"
    / "StrikeLabCaddie"
    / "Models"
    / "contract.json"
)

TRACKED = {
    "RoundCreate": RoundCreate,
    "RoundUpdate": RoundUpdate,
    "RoundResponse": RoundResponse,
    "RoundHole": RoundHole,
    "RoundShotCreate": RoundShotCreate,
    "RoundShotResponse": RoundShotResponse,
}


def current_contract() -> dict[str, object]:
    return {name: cls.model_json_schema() for name, cls in TRACKED.items()}


def _normalized(obj: object) -> str:
    return json.dumps(obj, indent=2, sort_keys=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit non-zero if the contract has drifted (for CI).",
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Write the current Pydantic schema to contract.json.",
    )
    args = parser.parse_args()

    generated = current_contract()
    generated_str = _normalized(generated)

    if args.update:
        CONTRACT_PATH.parent.mkdir(parents=True, exist_ok=True)
        CONTRACT_PATH.write_text(generated_str + "\n")
        print(f"Wrote {CONTRACT_PATH.relative_to(REPO_ROOT)}")
        return 0

    if not CONTRACT_PATH.exists():
        print(
            f"contract.json missing at {CONTRACT_PATH}. "
            f"Run with --update to bootstrap it.",
            file=sys.stderr,
        )
        return 2 if args.check else 0

    stored_str = CONTRACT_PATH.read_text().strip()
    if stored_str == generated_str.strip():
        print("Schema contract OK.")
        return 0

    print("SCHEMA DRIFT — Pydantic models differ from contract.json.")
    print(
        "If the drift is intentional, update the contract by running:\n"
        "  python -m scripts.check_schema_drift --update\n"
        "and reconcile the corresponding Swift models in "
        "apps/ios/StrikeLabCaddie/Models/."
    )
    if args.check:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
