import inspect
import os
from typing import Optional


def capture_call_site() -> Optional[dict]:
    frame = inspect.currentframe()
    try:
        while frame is not None:
            frame = frame.f_back
            if frame is None:
                return None
            filename = frame.f_code.co_filename
            if _is_user_frame(filename):
                return _extract(frame)
    finally:
        del frame
    return None


def _is_user_frame(filename: str) -> bool:
    normalized = filename.replace("\\", "/")
    return (
        "keel" not in normalized.split("/")
        and "<" not in filename  # skip <string>, <frozen ...>
    )


def _extract(frame) -> dict:
    filename = frame.f_code.co_filename
    lineno = frame.f_lineno
    function = frame.f_code.co_name

    try:
        rel_path = os.path.relpath(filename)
    except ValueError:
        rel_path = filename

    snippet = None
    snippet_start_line = None

    try:
        with open(filename, "r", encoding="utf-8", errors="replace") as f:
            all_lines = f.readlines()
        start = max(0, lineno - 4)
        end = min(len(all_lines), lineno + 3)
        snippet = "".join(all_lines[start:end])
        snippet_start_line = start + 1  # 1-indexed
    except OSError:
        pass

    return {
        "file": rel_path,
        "line": lineno,
        "function": function,
        "snippet": snippet,
        "snippet_start_line": snippet_start_line,
    }
