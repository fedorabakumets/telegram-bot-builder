"""
@fileoverview Редирект на tools/compare_bots/check.py (раньше дамп calc id).
"""
import runpy
from pathlib import Path

runpy.run_path(
    str(Path(__file__).resolve().parent / "check.py"),
    run_name="__main__",
)
