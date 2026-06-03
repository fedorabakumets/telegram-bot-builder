"""
@fileoverview Редирект на tools/compare_bots/restore_all_bots.py
"""
import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent / "compare_bots" / "restore_all_bots.py"), run_name="__main__")
