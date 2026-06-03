"""
@fileoverview Редирект на tools/compare_bots/patch_scooby.py
"""
import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent / "compare_bots" / "patch_scooby.py"), run_name="__main__")
