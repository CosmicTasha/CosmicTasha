"""
Calibration pipeline for CosmicTasha ray tracing weights.

Takes anonymized audit outcome data (dimension scores + pass/fail/conditional)
and adjusts the causal graph weights to minimize prediction error.

This runs on the ops node (i7-4770K), NOT on the production node.
Customer data is anonymized — only dimension scores and outcomes, no names.

Usage:
    python scripts/calibrate.py run              # run calibration with latest data
    python scripts/calibrate.py simulate         # dry run, show proposed changes
    python scripts/calibrate.py add-outcome      # add a new audit outcome interactively
    python scripts/calibrate.py history          # show calibration history
"""

import argparse
import copy
import json
import logging
import os
import sys
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from calibration_audit import log_event
from weight_manager import (
    DIMENSIONS,
    VALID_EDGE_KEYS,
    load_weights,
    save_weights,
    snapshot_weights,
    validate_weights,
    weight_hash,
)

log = logging.getLogger(__name__)

CALIBRATION_DIR = Path("calibration_data")
OUTCOMES_PATH = CALIBRATION_DIR / "outcomes.json"
HISTORY_PATH = CALIBRATION_DIR / "history.json"

LEARNING_RATE = 0.05
EDGE_MIN = 0.05
EDGE_MAX = 0.95

VALID_OUTCOMES = ("pass", "fail", "conditional")
VALID_FINDINGS = ("no_findings", "minor", "major")
VALID_COMPANY_SIZES = ("1-5", "6-15", "16-50", "51-100", "101-200", "200+")
VALID_INDUSTRIES = ("saas", "fintech", "healthcare", "other")


@dataclass
class AuditOutcome:
    """Anonymized audit result — NO company names, NO intake answers."""
    outcome_id: str
    timestamp: str
    outcome: str                       # pass | fail | conditional
    dimension_scores: dict             # predicted scores at time of audit
    actual_findings: dict              # per-dimension: no_findings | minor | major
    company_size: str                  # anonymized size bracket
    industry_category: str             # anonymized industry


def _load_outcomes() -> list:
    """Load outcomes from disk."""
    if not OUTCOMES_PATH.exists():
        return []
    try:
        with open(OUTCOMES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        log.warning("Failed to load outcomes, returning empty", exc_info=True)
        return []


def _save_outcomes(outcomes: list) -> None:
    """Save outcomes to disk atomically."""
    CALIBRATION_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = OUTCOMES_PATH.with_suffix(".tmp")
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(outcomes, f, indent=2)
            f.write("\n")
        if sys.platform == "win32" and OUTCOMES_PATH.exists():
            OUTCOMES_PATH.unlink()
        os.rename(str(tmp_path), str(OUTCOMES_PATH))
    except Exception:
        log.warning("Failed to save outcomes", exc_info=True)
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception:
                log.warning("Failed to clean up temp outcomes file")
        raise


def _load_history() -> list:
    """Load calibration history from disk."""
    if not HISTORY_PATH.exists():
        return []
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        log.warning("Failed to load calibration history", exc_info=True)
        return []


def _save_history(history: list) -> None:
    """Save calibration history to disk atomically."""
    CALIBRATION_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = HISTORY_PATH.with_suffix(".tmp")
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)
            f.write("\n")
        if sys.platform == "win32" and HISTORY_PATH.exists():
            HISTORY_PATH.unlink()
        os.rename(str(tmp_path), str(HISTORY_PATH))
    except Exception:
        log.warning("Failed to save calibration history", exc_info=True)
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception:
                log.warning("Failed to clean up temp history file")
        raise


def _finding_to_error(predicted_score: float, finding: str) -> float:
    """Convert a dimension's predicted score + actual finding into an error signal.

    Returns a signed error:
      positive = predicted too high (overconfident)
      negative = predicted too low (underconfident)
    """
    # Map findings to an "actual quality" proxy (0=bad, 1=good)
    finding_map = {
        "no_findings": 1.0,
        "minor": 0.6,
        "major": 0.2,
    }
    actual = finding_map.get(finding, 0.5)
    # Scores are 0-100, normalize to 0-1
    predicted = max(0.0, min(1.0, predicted_score / 100.0))
    return predicted - actual


def calibrate(outcomes: list, current_weights: dict) -> dict:
    """
    Adjust weights based on prediction error.

    For each outcome:
    1. Compare predicted dimension scores with actual findings
    2. If a dimension predicted high but had major findings, its causal
       outgoing edges are too strong (reduce)
    3. If a dimension predicted low but had no findings, its causal
       incoming edges are too strong (reduce) or outgoing too weak
    4. Adjust edge weights by a small learning rate (0.05 per outcome)

    This is intentionally simple and explainable — no neural network,
    no black box. A compliance product needs auditable calibration.
    """
    if not outcomes:
        log.warning("No outcomes to calibrate against")
        return copy.deepcopy(current_weights)

    new_weights = copy.deepcopy(current_weights)
    cg = new_weights["causal_graph"]
    dw = new_weights["dimension_weights"]

    for outcome_data in outcomes:
        scores = outcome_data.get("dimension_scores", {})
        findings = outcome_data.get("actual_findings", {})

        for dim in DIMENSIONS:
            if dim not in scores or dim not in findings:
                continue

            error = _finding_to_error(scores[dim], findings[dim])

            # Adjust outgoing edges from this dimension
            for edge_key in VALID_EDGE_KEYS:
                src, _tgt = edge_key.split("->")
                if src == dim:
                    # If overconfident (error > 0), reduce outgoing influence
                    # If underconfident (error < 0), increase outgoing influence
                    adjustment = -error * LEARNING_RATE
                    cg[edge_key] = max(EDGE_MIN, min(EDGE_MAX,
                                                     cg[edge_key] + adjustment))

            # Adjust dimension weight: if consistently over/under-predicted,
            # nudge the base weight
            dw_adjustment = -error * LEARNING_RATE * 0.5  # half rate for base weights
            dw[dim] = max(0.01, dw[dim] + dw_adjustment)

    # Re-normalize dimension weights to sum to 1.0
    total = sum(dw.values())
    if total > 0:
        for dim in dw:
            dw[dim] = dw[dim] / total

    new_weights["calibration_count"] = current_weights.get("calibration_count", 0) + 1
    new_weights["updated_at"] = datetime.now(timezone.utc).isoformat()

    return new_weights


def _print_diff(before: dict, after: dict) -> None:
    """Print a human-readable diff of weight changes (no raw values)."""
    print("\n--- Weight Changes ---")

    # Causal graph changes
    cg_before = before.get("causal_graph", {})
    cg_after = after.get("causal_graph", {})
    print("\nCausal graph edge adjustments:")
    any_cg_change = False
    for edge in VALID_EDGE_KEYS:
        b = cg_before.get(edge, 0)
        a = cg_after.get(edge, 0)
        delta = a - b
        if abs(delta) > 0.0001:
            direction = "+" if delta > 0 else ""
            print(f"  {edge:50s} {direction}{delta:.4f}")
            any_cg_change = True
    if not any_cg_change:
        print("  (no changes)")

    # Dimension weight changes
    dw_before = before.get("dimension_weights", {})
    dw_after = after.get("dimension_weights", {})
    print("\nDimension weight adjustments:")
    any_dw_change = False
    for dim in DIMENSIONS:
        b = dw_before.get(dim, 0)
        a = dw_after.get(dim, 0)
        delta = a - b
        if abs(delta) > 0.0001:
            direction = "+" if delta > 0 else ""
            print(f"  {dim:30s} {direction}{delta:.4f}")
            any_dw_change = True
    if not any_dw_change:
        print("  (no changes)")

    print(f"\nHash before: {weight_hash(before)[:16]}...")
    print(f"Hash after:  {weight_hash(after)[:16]}...")


def _prompt_float(prompt: str, default: float | None = None) -> float:
    """Prompt the user for a float value."""
    while True:
        suffix = f" [{default}]" if default is not None else ""
        raw = input(f"{prompt}{suffix}: ").strip()
        if not raw and default is not None:
            return default
        try:
            return float(raw)
        except ValueError:
            print("  Please enter a number.")


def _prompt_choice(prompt: str, choices: tuple) -> str:
    """Prompt the user to choose from a set of options."""
    choices_str = " / ".join(choices)
    while True:
        raw = input(f"{prompt} ({choices_str}): ").strip().lower()
        if raw in choices:
            return raw
        print(f"  Please choose one of: {choices_str}")


# ---------------------------------------------------------------------------
# CLI commands
# ---------------------------------------------------------------------------

def _cmd_run(args: argparse.Namespace) -> None:
    outcomes = _load_outcomes()
    if not outcomes:
        print("No outcomes found. Use 'add-outcome' first.")
        return

    current = load_weights()
    proposed = calibrate(outcomes, current)

    errors = validate_weights(proposed)
    if errors:
        print("Proposed weights are INVALID:")
        for e in errors:
            print(f"  - {e}")
        return

    _print_diff(current, proposed)

    print(f"\nCalibrated against {len(outcomes)} outcome(s).")
    confirm = input("Apply these changes? [y/N]: ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    # Snapshot before applying
    snap_path = snapshot_weights(current)
    print(f"Pre-calibration snapshot: {snap_path}")

    h_before = weight_hash(current)
    save_weights(proposed)
    h_after = weight_hash(proposed)

    log_event(
        event_type="calibration",
        details={
            "outcomes_count": len(outcomes),
            "snapshot_path": str(snap_path),
        },
        weight_hash_before=h_before,
        weight_hash_after=h_after,
    )

    # Log to calibration history
    history = _load_history()
    history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "outcomes_count": len(outcomes),
        "hash_before": h_before,
        "hash_after": h_after,
        "snapshot_path": str(snap_path),
    })
    _save_history(history)

    print("Calibration applied successfully.")


def _cmd_simulate(_args: argparse.Namespace) -> None:
    outcomes = _load_outcomes()
    if not outcomes:
        print("No outcomes found. Use 'add-outcome' first.")
        return

    current = load_weights()
    proposed = calibrate(outcomes, current)

    errors = validate_weights(proposed)
    if errors:
        print("Proposed weights would be INVALID:")
        for e in errors:
            print(f"  - {e}")
        return

    _print_diff(current, proposed)
    print(f"\n(Simulation only — {len(outcomes)} outcome(s), no changes applied)")


def _cmd_add_outcome(_args: argparse.Namespace) -> None:
    print("Add anonymized audit outcome")
    print("=" * 40)

    outcome = _prompt_choice("Audit outcome", VALID_OUTCOMES)
    company_size = _prompt_choice("Company size bracket", VALID_COMPANY_SIZES)
    industry = _prompt_choice("Industry category", VALID_INDUSTRIES)

    print("\nDimension scores (0-100, as predicted at time of audit):")
    dimension_scores = {}
    for dim in DIMENSIONS:
        dimension_scores[dim] = _prompt_float(f"  {dim}")

    print("\nActual audit findings per dimension:")
    actual_findings = {}
    for dim in DIMENSIONS:
        actual_findings[dim] = _prompt_choice(f"  {dim}", VALID_FINDINGS)

    entry = AuditOutcome(
        outcome_id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc).isoformat(),
        outcome=outcome,
        dimension_scores=dimension_scores,
        actual_findings=actual_findings,
        company_size=company_size,
        industry_category=industry,
    )

    outcomes = _load_outcomes()
    outcomes.append(asdict(entry))
    _save_outcomes(outcomes)

    # Audit log
    current_weights = load_weights()
    h = weight_hash(current_weights)
    log_event(
        event_type="outcome_added",
        details={"outcome_id": entry.outcome_id},
        weight_hash_before=h,
        weight_hash_after=h,  # no weight change when adding outcome
    )

    print(f"\nOutcome added: {entry.outcome_id[:8]}...")
    print(f"Total outcomes: {len(outcomes)}")


def _cmd_history(_args: argparse.Namespace) -> None:
    history = _load_history()
    if not history:
        print("No calibration history found.")
        return
    for entry in history:
        ts = entry.get("timestamp", "?")
        count = entry.get("outcomes_count", "?")
        h_before = entry.get("hash_before", "?")[:12]
        h_after = entry.get("hash_after", "?")[:12]
        print(f"[{ts}] {count} outcomes — {h_before}... -> {h_after}...")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    parser = argparse.ArgumentParser(
        description="Calibration pipeline for CosmicTasha ray tracing weights"
    )
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("run", help="Run calibration and apply changes")
    sub.add_parser("simulate", help="Dry run — show proposed changes")
    sub.add_parser("add-outcome", help="Add a new audit outcome interactively")
    sub.add_parser("history", help="Show calibration history")

    args = parser.parse_args()

    dispatch = {
        "run": _cmd_run,
        "simulate": _cmd_simulate,
        "add-outcome": _cmd_add_outcome,
        "history": _cmd_history,
    }

    if args.command in dispatch:
        dispatch[args.command](args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
