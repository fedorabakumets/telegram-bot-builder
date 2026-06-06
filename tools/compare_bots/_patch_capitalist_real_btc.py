"""
@fileoverview Редирект на tools/compare_bots/patch_capitalist.py
"""
import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent / "patch_capitalist.py"), run_name="__main__")
