"""Верификация всех изменений edit-ask-amount-loading."""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

# 1. Проверяем bot-cond-in-progress в sheet-bots
sheet_bots = [s for s in data["sheets"] if s["id"] == "sheet-bots"][0]
node = [n for n in sheet_bots["nodes"] if n["id"] == "bot-cond-in-progress"][0]
br = [b for b in node["data"]["branches"] if b["id"] == "branch_free"][0]
assert br["target"] == "edit-ask-amount-loading", f"FAIL: {br['target']}"
print(f"✅ bot-cond-in-progress.branch_free → {br['target']}")

# 2. Проверяем sheet-compare-rates
sheet_cr = [s for s in data["sheets"] if s["id"] == "sheet-compare-rates"][0]
node_ids = {n["id"] for n in sheet_cr["nodes"]}

assert "edit-ask-amount-loading" in node_ids, "FAIL: edit-ask-amount-loading not found"
print("✅ Нода edit-ask-amount-loading присутствует в sheet-compare-rates")

assert "edit-ask-amount-loading-sites" in node_ids, "FAIL: edit-ask-amount-loading-sites not found"
print("✅ Нода edit-ask-amount-loading-sites присутствует в sheet-compare-rates")

# 3. Проверяем cond-refresh-route
node_cr = [n for n in sheet_cr["nodes"] if n["id"] == "cond-refresh-route"][0]
br_sites = [b for b in node_cr["data"]["branches"] if b["id"] == "br_sites"][0]
assert br_sites["target"] == "edit-ask-amount-loading-sites", f"FAIL: {br_sites['target']}"
print(f"✅ cond-refresh-route.br_sites → {br_sites['target']}")

# 4. Проверяем setv-amt-* ноды
setv_amt_nodes = [n for n in sheet_cr["nodes"] if n["id"].startswith("setv-amt-")]
for n in setv_amt_nodes:
    at = n["data"].get("autoTransitionTo", "")
    assert at == "edit-ask-amount-loading-sites", f"FAIL: {n['id']} → {at}"
    print(f"✅ {n['id']}.autoTransitionTo → {at}")

print(f"\n🎉 Все {len(setv_amt_nodes)} setv-amt-* нод и все branches верифицированы!")
