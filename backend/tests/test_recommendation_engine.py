from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path

from gadgetguru_api.phone_ranking.ranking import rank_devices


FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def _load_fixture():
    return json.loads((FIXTURES_DIR / "phone_ranking_fixture.json").read_text(encoding="utf-8"))


def _run_legacy_frontend_snapshot(options):
    fixture_path = FIXTURES_DIR / "phone_ranking_fixture.json"
    script_path = FIXTURES_DIR / "frontend_phone_ranking_snapshot.mjs"
    completed = subprocess.run(
        ["node", str(script_path), str(fixture_path), json.dumps(options)],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(completed.stdout)


def _project_ranked(ranked):
    projected = []
    for device in ranked:
        projected.append(
            {
                "_id": device.get("_id"),
                "finalScore": round(float(device.get("finalScore", 0)), 10),
                "price_inr": float(device.get("price_inr", 0)),
                "selectedVariant": {
                    "ram_gb": float((device.get("selectedVariant") or {}).get("ram_gb", 0)),
                    "storage_gb": float((device.get("selectedVariant") or {}).get("storage_gb", 0)),
                    "price_inr": float((device.get("selectedVariant") or {}).get("price_inr", 0)),
                },
                "cameraWarning": device.get("cameraWarning", ""),
            }
        )
    return projected


def _diff_results(left, right):
    diffs = []
    max_len = max(len(left), len(right))
    for index in range(max_len):
        left_item = left[index] if index < len(left) else None
        right_item = right[index] if index < len(right) else None
        if left_item != right_item:
            diffs.append({"index": index, "frontend": left_item, "backend": right_item})
    return diffs


class RecommendationEngineTests(unittest.TestCase):
    def test_backend_matches_legacy_frontend_snapshot(self):
        options = {
            "budget": 80000,
            "intent": "gaming",
            "isStrict": True,
            "priorities": [],
        }
        fixture = _load_fixture()
        frontend_ranked = _project_ranked(_run_legacy_frontend_snapshot(options))
        backend_ranked = _project_ranked(
            rank_devices(
                fixture,
                budget=options["budget"],
                intent=options["intent"],
                is_strict=options["isStrict"],
                priorities=options["priorities"],
            )
        )
        diffs = _diff_results(frontend_ranked, backend_ranked)
        self.assertFalse(diffs, f"Frontend/backend ranking drift detected:\n{json.dumps(diffs, indent=2)}")


    def test_rank_devices_is_pure(self):
        fixture = _load_fixture()
        original = json.loads(json.dumps(fixture))
        rank_devices(fixture, budget=80000, intent="camera", is_strict=True, priorities=[])
        self.assertEqual(fixture, original)
