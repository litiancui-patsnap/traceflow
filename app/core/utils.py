from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return the current time as a timezone-aware UTC datetime.

    Single source of truth for "now" across models and repositories so that
    tests can patch one symbol instead of nine.
    """
    return datetime.now(timezone.utc)
