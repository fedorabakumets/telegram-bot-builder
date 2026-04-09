"""
Исправляет в project.json:
1. Пробелы в тексте кнопок (strip)
2. Antarctic Wallet — добавляет url
3. BTC MONOPOLY в Партнёрах — добавляет keyboard-узел с кнопкой
"""
import json, uuid

PATH = "bots/обменники_133_126/project.json"

with open(PATH, "r", encoding="utf-8") as f:
    d = json.load(f)

root = d.get("data") if "data" in d else d

fixes = []

for sheet in root["sheets"]:
    for node in sheet["nodes"]:
        data = node["data"]

        # 1. Trim пробелы в тексте кнопок
        for btn in data.get("buttons", []):
            original = btn.get("text", "")
            stripped = original.strip()
            if stripped != original:
                btn["text"] = stripped
                fixes.append(f"Trim пробел: '{original}' → '{stripped}'")

        # 2. Antarctic Wallet — кнопка без target/url
        for btn in data.get("buttons", []):
            if btn.get("text", "").strip() == "Antarctic Wallet":
                if not btn.get("url") and not btn.get("target"):
                    btn["url"] = "https://t.me/AntarcticWalletBot"
                    btn["action"] = "url"
                    btn["style"] = "primary"
                    fixes.append("Antarctic Wallet: добавлен url")

        # 3. BTC MONOPOLY в Партнёрах — message без keyboardNodeId
        if (node["type"] == "message"
                and "BTC_Monopoly_bot" in data.get("messageText", "")
                and not data.get("keyboardNodeId")):

            kb_id = "btc_monopoly_keyboard_" + str(uuid.uuid4())[:8]
            data["keyboardNodeId"] = kb_id

            # Создаём keyboard-узел
            kb_node = {
                "id": kb_id,
                "type": "keyboard",
                "position": {
                    "x": node["position"]["x"] + 395,
                    "y": node["position"]["y"],
                },
                "data": {
                    "buttons": [
                        {
                            "id": "btc_monopoly_btn_1",
                            "text": "BTC MONOPOLY",
                            "action": "url",
                            "url": "https://t.me/BTC_Monopoly_bot?start=7733607050",
                            "target": "",
                            "style": "primary",
                            "hideAfterClick": False,
                            "skipDataCollection": False,
                        },
                        {
                            "id": "btc_monopoly_btn_2",
                            "text": "Назад",
                            "action": "goto",
                            "target": "start_dup_1775330630988_2w4z6c8t9",
                            "style": "primary",
                            "hideAfterClick": False,
                            "skipDataCollection": False,
                        },
                    ],
                    "keyboardType": "inline",
                    "keyboardLayout": {
                        "rows": [{"buttonIds": ["btc_monopoly_btn_1"]}, {"buttonIds": ["btc_monopoly_btn_2"]}],
                        "columns": 1,
                        "autoLayout": False,
                    },
                    "markdown": False,
                    "adminOnly": False,
                    "showInMenu": True,
                    "messageText": "",
                    "requiresAuth": False,
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "enableStatistics": True,
                },
            }
            sheet["nodes"].append(kb_node)
            fixes.append(f"BTC MONOPOLY: добавлен keyboard-узел {kb_id}")

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"Исправлений: {len(fixes)}")
for fix in fixes:
    print(f"  ✓ {fix}")
print(f"\nГотово → {PATH}")
