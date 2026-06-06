"""
@fileoverview Редирект на tools/compare_bots/isolate_inf.py
"""
import runpy
from pathlib import Path

runpy.run_path(
    str(Path(__file__).resolve().parent / "isolate_inf.py"),
    run_name="__main__",
)
