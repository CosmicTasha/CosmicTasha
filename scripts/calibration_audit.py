"""
Audit trail for all weight calibration events.

Stored in calibration_data/audit_log.json. Every calibration, snapshot,
rollback, reset, and outcome addition is logged with before/after weight
hashes, enabling full chain-of-custody verification.

Usage:
    python scripts/calibration_audit.py history       # show recent events
    python scripts/calibration_audit.py verify        # verify chain integrity
"""

import argparse
import getpass
import json
import logging
import os
import platform
import sys
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

log = logging.getLogger(__name__)

AUDIT_DIR = Path("calibration_data")
AUDIT_LOG_PATH = AUDIT_DIR / "audit_log.json"


@dataclass
class CalibrationAuditEntry:
    """A single audit trail entry."""
    event_id: str
    timestamp: str
    event_type: str        # calibration | snapshot | rollback | reset | outcome_added
    operator: str
    details: dict
    weight_hash_before: str
    weight_hash_after: str


def _get_operator() -> str:
    """Return operator identifier (username@hostname)."""
    try:
        user = getpass.getuser()
    except Exception:
        user = "unknown"
    try:
        host = platform.node()
    except Exception:
        host = "unknown"
    return f"{user}@{host}"


def _load_log() -> list:
    """Load the audit log from disk."""
    if not AUDIT_LOG_PATH.exists():
        return []
    try:
        with open(AUDIT_LOG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        log.warning("Audit log is not a list, returning empty")
        return []
    except Exception:
        log.warning("Failed to load audit log, returning empty", exc_info=True)
        return []


def _save_log(entries: list) -> None:
    """Write the audit log to disk."""
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = AUDIT_LOG_PATH.with_suffix(".tmp")
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(entries, f, indent=2)
            f.write("\n")
        if sys.platform == "win32" and AUDIT_LOG_PATH.exists():
            AUDIT_LOG_PATH.unlink()
        os.rename(str(tmp_path), str(AUDIT_LOG_PATH))
    except Exception:
        log.warning("Failed to save audit log", exc_info=True)
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception:
                log.warning("Failed to clean up temp audit log")
        raise


def log_event(
    event_type: str,
    details: dict,
    weight_hash_before: str,
    weight_hash_after: str,
) -> CalibrationAuditEntry:
    """Append a new event to the audit log and return it."""
    entry = CalibrationAuditEntry(
        event_id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc).isoformat(),
        event_type=event_type,
        operator=_get_operator(),
        details=details,
        weight_hash_before=weight_hash_before,
        weight_hash_after=weight_hash_after,
    )
    entries = _load_log()
    entries.append(asdict(entry))
    _save_log(entries)
    log.info("Audit event logged: %s (%s)", event_type, entry.event_id[:8])
    return entry


def get_history(limit: int = 20) -> list:
    """Return the most recent audit entries (as dicts)."""
    entries = _load_log()
    return entries[-limit:]


def verify_chain() -> bool:
    """Verify audit log chain integrity.

    Each entry's weight_hash_before should match the previous entry's
    weight_hash_after. The first entry is always valid (no predecessor).

    Returns True if the chain is valid, False otherwise.
    """
    entries = _load_log()
    if len(entries) <= 1:
        return True

    valid = True
    for i in range(1, len(entries)):
        prev_after = entries[i - 1].get("weight_hash_after", "")
        curr_before = entries[i].get("weight_hash_before", "")
        if prev_after != curr_before:
            log.warning(
                "Chain break at entry %d (%s): "
                "previous after=%s, current before=%s",
                i,
                entries[i].get("event_id", "?")[:8],
                prev_after[:16],
                curr_before[:16],
            )
            valid = False
    return valid


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _cmd_history(args: argparse.Namespace) -> None:
    limit = getattr(args, "limit", 20)
    entries = get_history(limit=limit)
    if not entries:
        print("No audit events found.")
        return
    for entry in entries:
        ts = entry.get("timestamp", "?")
        etype = entry.get("event_type", "?")
        eid = entry.get("event_id", "?")[:8]
        operator = entry.get("operator", "?")
        h_before = entry.get("weight_hash_before", "?")[:12]
        h_after = entry.get("weight_hash_after", "?")[:12]
        print(f"[{ts}] {etype:20s} by {operator} ({eid})")
        print(f"  hash: {h_before}... -> {h_after}...")
        details = entry.get("details", {})
        if details:
            for k, v in details.items():
                print(f"  {k}: {v}")
        print()


def _cmd_verify(_args: argparse.Namespace) -> None:
    if verify_chain():
        entries = _load_log()
        print(f"VALID — {len(entries)} entries, chain intact.")
    else:
        print("BROKEN — chain integrity check failed. See log for details.")
        sys.exit(1)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    parser = argparse.ArgumentParser(
        description="Audit trail for CosmicTasha calibration events"
    )
    sub = parser.add_subparsers(dest="command")

    p_history = sub.add_parser("history", help="Show recent audit events")
    p_history.add_argument("-n", "--limit", type=int, default=20,
                           help="Number of events to show")

    sub.add_parser("verify", help="Verify audit log chain integrity")

    args = parser.parse_args()

    dispatch = {
        "history": _cmd_history,
        "verify": _cmd_verify,
    }

    if args.command in dispatch:
        dispatch[args.command](args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
