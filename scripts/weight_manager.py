"""
Weight management for CosmicTasha ray tracing readiness scorer.

Handles: loading, saving, snapshotting, rollback, validation of
calibrated production weights. Weights are TRADE SECRETS — never
committed to git, backed up encrypted.

Usage:
    python scripts/weight_manager.py status          # show current weights
    python scripts/weight_manager.py snapshot        # save timestamped snapshot
    python scripts/weight_manager.py rollback <file> # restore from snapshot
    python scripts/weight_manager.py reset           # reset to defaults
    python scripts/weight_manager.py validate        # check weight integrity
"""

import argparse
import copy
import hashlib
import json
import logging
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

log = logging.getLogger(__name__)

DIMENSIONS = [
    "access_control",
    "data_protection",
    "operational_readiness",
    "change_management",
    "documentation",
]

VALID_EDGE_KEYS = [
    "access_control->data_protection",
    "data_protection->access_control",
    "operational_readiness->change_management",
    "change_management->operational_readiness",
    "documentation->access_control",
    "documentation->data_protection",
    "documentation->operational_readiness",
    "documentation->change_management",
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_default_weights() -> dict:
    """Return a fresh copy of the default (uncalibrated) weights."""
    now = _now_iso()
    return {
        "version": "1.0.0",
        "created_at": now,
        "updated_at": now,
        "calibration_count": 0,
        "causal_graph": {
            "access_control->data_protection": 0.7,
            "data_protection->access_control": 0.3,
            "operational_readiness->change_management": 0.5,
            "change_management->operational_readiness": 0.6,
            "documentation->access_control": 0.4,
            "documentation->data_protection": 0.4,
            "documentation->operational_readiness": 0.4,
            "documentation->change_management": 0.4,
        },
        "dimension_weights": {
            "access_control": 0.25,
            "data_protection": 0.20,
            "operational_readiness": 0.20,
            "change_management": 0.15,
            "documentation": 0.20,
        },
        "surface_coefficients": {
            "albedo_scale": 1.0,
            "albedo_bias": 0.0,
            "roughness_scale": 1.0,
            "roughness_bias": 0.1,
            "emission_scale": 0.5,
        },
        "source_distribution": {
            "rays_per_dimension": 100,
            "max_bounces": 5,
            "convergence_threshold": 0.01,
        },
    }


DEFAULT_WEIGHTS = make_default_weights()


def get_weight_path() -> Path:
    """Return the configured weight file path.

    Checks DRIFTWATCH_RAY_WEIGHTS env var first, then defaults to
    ray_weights.json in the current working directory.
    Production systems use /etc/driftwatch/ray_weights.json.
    """
    env_path = os.environ.get("DRIFTWATCH_RAY_WEIGHTS")
    if env_path:
        return Path(env_path)
    return Path("ray_weights.json")


def weight_hash(weights: dict) -> str:
    """Compute SHA-256 of weights dict (deterministic serialization)."""
    raw = json.dumps(weights, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def load_weights() -> dict:
    """Load weights from the configured file, falling back to defaults."""
    path = get_weight_path()
    if not path.exists():
        log.warning("Weight file %s not found, using defaults", path)
        return copy.deepcopy(DEFAULT_WEIGHTS)
    try:
        with open(path, "r", encoding="utf-8") as f:
            weights = json.load(f)
        log.info("Loaded weights from %s", path)
        return weights
    except Exception:
        log.warning("Failed to load weights from %s, using defaults", path, exc_info=True)
        return copy.deepcopy(DEFAULT_WEIGHTS)


def save_weights(weights: dict) -> None:
    """Write weights atomically (write to .tmp then rename)."""
    path = get_weight_path()
    weights["updated_at"] = _now_iso()
    tmp_path = path.with_suffix(".tmp")
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(weights, f, indent=2, sort_keys=False)
            f.write("\n")
        # Atomic rename (on Windows, need to remove destination first)
        if sys.platform == "win32" and path.exists():
            path.unlink()
        shutil.move(str(tmp_path), str(path))
        log.info("Saved weights to %s", path)
    except Exception:
        log.warning("Failed to save weights to %s", path, exc_info=True)
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception:
                log.warning("Failed to clean up temp file %s", tmp_path)
        raise


def validate_weights(weights: dict) -> list:
    """Return a list of validation errors. Empty list means valid."""
    errors = []

    # Check top-level keys
    required_top = ["version", "causal_graph", "dimension_weights",
                    "surface_coefficients", "source_distribution"]
    for key in required_top:
        if key not in weights:
            errors.append(f"Missing top-level key: {key}")

    # Validate causal_graph
    cg = weights.get("causal_graph", {})
    for edge_key in VALID_EDGE_KEYS:
        if edge_key not in cg:
            errors.append(f"Missing causal graph edge: {edge_key}")
    for edge_key, val in cg.items():
        if edge_key not in VALID_EDGE_KEYS:
            errors.append(f"Unknown causal graph edge: {edge_key}")
        if not isinstance(val, (int, float)):
            errors.append(f"Edge weight must be numeric: {edge_key}={val}")
        elif not (0.0 <= val <= 1.0):
            errors.append(f"Edge weight out of range [0,1]: {edge_key}={val}")

    # Validate dimension_weights
    dw = weights.get("dimension_weights", {})
    for dim in DIMENSIONS:
        if dim not in dw:
            errors.append(f"Missing dimension weight: {dim}")
    for dim in dw:
        if dim not in DIMENSIONS:
            errors.append(f"Unknown dimension: {dim}")
    if dw:
        total = sum(dw.values())
        if abs(total - 1.0) > 0.001:
            errors.append(f"Dimension weights sum to {total:.4f}, expected 1.0")

    # Validate surface_coefficients
    sc = weights.get("surface_coefficients", {})
    required_sc = ["albedo_scale", "albedo_bias", "roughness_scale",
                   "roughness_bias", "emission_scale"]
    for key in required_sc:
        if key not in sc:
            errors.append(f"Missing surface coefficient: {key}")

    # Validate source_distribution
    sd = weights.get("source_distribution", {})
    required_sd = ["rays_per_dimension", "max_bounces", "convergence_threshold"]
    for key in required_sd:
        if key not in sd:
            errors.append(f"Missing source distribution param: {key}")
    if "rays_per_dimension" in sd and sd["rays_per_dimension"] < 1:
        errors.append("rays_per_dimension must be >= 1")
    if "max_bounces" in sd and sd["max_bounces"] < 1:
        errors.append("max_bounces must be >= 1")
    if "convergence_threshold" in sd and sd["convergence_threshold"] <= 0:
        errors.append("convergence_threshold must be > 0")

    return errors


def snapshot_weights(weights: dict, snapshot_dir: Path | None = None) -> Path:
    """Save a timestamped copy of weights to the snapshot directory."""
    if snapshot_dir is None:
        snapshot_dir = Path("weight_snapshots")
    snapshot_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    h = weight_hash(weights)[:12]
    filename = f"weights_{timestamp}_{h}.json"
    path = snapshot_dir / filename

    with open(path, "w", encoding="utf-8") as f:
        json.dump(weights, f, indent=2, sort_keys=False)
        f.write("\n")

    log.info("Snapshot saved to %s", path)
    return path


def rollback_weights(snapshot_path: Path) -> dict:
    """Restore weights from a snapshot file."""
    if not snapshot_path.exists():
        raise FileNotFoundError(f"Snapshot not found: {snapshot_path}")
    with open(snapshot_path, "r", encoding="utf-8") as f:
        weights = json.load(f)
    errors = validate_weights(weights)
    if errors:
        raise ValueError(f"Snapshot validation failed: {'; '.join(errors)}")
    save_weights(weights)
    log.info("Rolled back to snapshot %s", snapshot_path)
    return weights


def reset_to_defaults() -> dict:
    """Reset weights to uncalibrated defaults."""
    weights = make_default_weights()
    save_weights(weights)
    log.info("Reset weights to defaults")
    return weights


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _cmd_status(_args: argparse.Namespace) -> None:
    weights = load_weights()
    h = weight_hash(weights)
    print(f"Weight file:        {get_weight_path()}")
    print(f"Version:            {weights.get('version', 'unknown')}")
    print(f"Calibration count:  {weights.get('calibration_count', 0)}")
    print(f"Created:            {weights.get('created_at', 'unknown')}")
    print(f"Updated:            {weights.get('updated_at', 'unknown')}")
    print(f"SHA-256:            {h[:16]}...")
    print()
    print("Dimension weights:")
    for dim, w in weights.get("dimension_weights", {}).items():
        print(f"  {dim:30s} {w:.4f}")
    print()
    print("Causal graph edges:")
    for edge, w in weights.get("causal_graph", {}).items():
        print(f"  {edge:50s} {w:.4f}")


def _cmd_snapshot(_args: argparse.Namespace) -> None:
    weights = load_weights()
    path = snapshot_weights(weights)
    print(f"Snapshot saved: {path}")


def _cmd_rollback(args: argparse.Namespace) -> None:
    snapshot_path = Path(args.file)
    before = load_weights()
    after = rollback_weights(snapshot_path)
    print(f"Rolled back from hash {weight_hash(before)[:16]}...")
    print(f"            to hash   {weight_hash(after)[:16]}...")


def _cmd_reset(_args: argparse.Namespace) -> None:
    before = load_weights()
    # Snapshot current state before resetting
    try:
        snap = snapshot_weights(before)
        print(f"Pre-reset snapshot: {snap}")
    except Exception:
        log.warning("Could not create pre-reset snapshot", exc_info=True)
    after = reset_to_defaults()
    print(f"Reset to defaults. Hash: {weight_hash(after)[:16]}...")


def _cmd_validate(_args: argparse.Namespace) -> None:
    weights = load_weights()
    errors = validate_weights(weights)
    if errors:
        print(f"INVALID — {len(errors)} error(s):")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print(f"VALID — hash {weight_hash(weights)[:16]}...")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    parser = argparse.ArgumentParser(
        description="Weight management for CosmicTasha ray tracing scorer"
    )
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("status", help="Show current weight status")
    sub.add_parser("snapshot", help="Save timestamped snapshot")

    p_rollback = sub.add_parser("rollback", help="Restore from snapshot")
    p_rollback.add_argument("file", help="Path to snapshot file")

    sub.add_parser("reset", help="Reset to default weights")
    sub.add_parser("validate", help="Validate weight integrity")

    args = parser.parse_args()

    dispatch = {
        "status": _cmd_status,
        "snapshot": _cmd_snapshot,
        "rollback": _cmd_rollback,
        "reset": _cmd_reset,
        "validate": _cmd_validate,
    }

    if args.command in dispatch:
        dispatch[args.command](args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
