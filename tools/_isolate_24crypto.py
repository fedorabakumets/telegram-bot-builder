"""
@fileoverview Редирект на tools/compare_bots/isolate_24crypto.py
"""
import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent / "compare_bots" / "isolate_24crypto.py"), run_name="__main__")
