"""
@fileoverview Редирект на tools/compare_bots/patch_love.py
"""
import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent / "compare_bots" / "patch_love.py"), run_name="__main__")
