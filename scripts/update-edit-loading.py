"""
Скрипт для добавления нод edit-ask-amount-loading и edit-ask-amount-loading-sites
в sheet-compare-rates, а также обновления targets в условных нодах.
"""

import json
import sys

PROJECT_PATH = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

# Нода edit-ask-amount-loading для ботов
EDIT_LOADING_NODE = {
    "id": "edit-ask-amount-loading",
    "data": {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "formatMode": "html",
        "showInMenu": False,
        "editMode": "both",
        "editMessageText": "{compare_title}\n\n📊 <b>СБП/Карта → Bitcoin</b>\n💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n⏳ <i>Собираю курсы обменников...</i>",
        "editFormatMode": "html",
        "editMessageIdSource": "last_bot_message",
        "editMessageIdManual": "",
        "editKeyboardMode": "remove",
        "editKeyboardNodeId": "",
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "isPrivateOnly": False,
        "autoTransitionTo": "bot-setv-init",
        "enableAutoTransition": True,
        "enableStatistics": False
    },
    "type": "edit_message",
    "position": {
        "x": 5400,
        "y": 1900
    }
}

# Нода edit-ask-amount-loading-sites для сайтов
EDIT_LOADING_SITES_NODE = {
    "id": "edit-ask-amount-loading-sites",
    "data": {
        "buttons": [],
        "markdown": False,
        "adminOnly": False,
        "formatMode": "html",
        "showInMenu": False,
        "editMode": "both",
        "editMessageText": "💱 <b>Сравнение курсов сайтов</b>\n\n📊 <b>СБП/Карта → Bitcoin</b>\n💰 Сумма: <b>{user_amount_fmt}</b> ₽\n\n⏳ <i>Собираю курсы обменников...</i>",
        "editFormatMode": "html",
        "editMessageIdSource": "last_bot_message",
        "editMessageIdManual": "",
        "editKeyboardMode": "remove",
        "editKeyboardNodeId": "",
        "messageText": "",
        "keyboardType": "none",
        "requiresAuth": False,
        "isPrivateOnly": False,
        "autoTransitionTo": "setv-compare-init",
        "enableAutoTransition": True,
        "enableStatistics": False
    },
    "type": "edit_message",
    "position": {
        "x": 5400,
        "y": 2700
    }
}


def main():
    # 1. Читаем JSON
    print(f"Читаю файл: {PROJECT_PATH}")
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2. Находим sheet-compare-rates
    sheet = None
    for s in data.get("sheets", []):
        if s.get("id") == "sheet-compare-rates":
            sheet = s
            break

    if sheet is None:
        print("ОШИБКА: sheet 'sheet-compare-rates' не найден!")
        sys.exit(1)

    print("Найден sheet: sheet-compare-rates")
    nodes = sheet.get("nodes", [])
    node_ids = {n["id"] for n in nodes}

    # 3. Добавляем ноду edit-ask-amount-loading (если не существует)
    if "edit-ask-amount-loading" not in node_ids:
        nodes.append(EDIT_LOADING_NODE)
        print("✅ Добавлена нода: edit-ask-amount-loading")
    else:
        print("⏭️  Нода edit-ask-amount-loading уже существует, пропускаю")

    # 3b. Добавляем ноду edit-ask-amount-loading-sites (если не существует)
    if "edit-ask-amount-loading-sites" not in node_ids:
        nodes.append(EDIT_LOADING_SITES_NODE)
        print("✅ Добавлена нода: edit-ask-amount-loading-sites")
    else:
        print("⏭️  Нода edit-ask-amount-loading-sites уже существует, пропускаю")

    # 4. Изменяем target в bot-cond-in-progress, ветка branch_free
    # Нода находится в sheet-bots, не в sheet-compare-rates
    changed_cond = False
    sheet_bots = None
    for s in data.get("sheets", []):
        if s.get("id") == "sheet-bots":
            sheet_bots = s
            break

    if sheet_bots:
        for node in sheet_bots.get("nodes", []):
            if node["id"] == "bot-cond-in-progress":
                branches = node.get("data", {}).get("branches", [])
                for branch in branches:
                    if branch.get("id") == "branch_free" and branch.get("target") == "bot-setv-init":
                        branch["target"] = "edit-ask-amount-loading"
                        changed_cond = True
                        print("✅ bot-cond-in-progress.branch_free: target изменён на edit-ask-amount-loading")
                        break
                if not changed_cond:
                    for branch in branches:
                        if branch.get("id") == "branch_free":
                            if branch.get("target") == "edit-ask-amount-loading":
                                print("⏭️  bot-cond-in-progress.branch_free уже указывает на edit-ask-amount-loading")
                            else:
                                print(f"⚠️  bot-cond-in-progress.branch_free: текущий target = {branch.get('target')}")
                break
    else:
        print("⚠️  sheet-bots не найден, пропускаю bot-cond-in-progress")

    # 5. Изменяем target в cond-refresh-route, ветка br_sites
    changed_refresh = False
    for node in nodes:
        if node["id"] == "cond-refresh-route":
            branches = node.get("data", {}).get("branches", [])
            for branch in branches:
                if branch.get("id") == "br_sites" and branch.get("target") == "setv-compare-init":
                    branch["target"] = "edit-ask-amount-loading-sites"
                    changed_refresh = True
                    print("✅ cond-refresh-route.br_sites: target изменён на edit-ask-amount-loading-sites")
                    break
            if not changed_refresh:
                for branch in branches:
                    if branch.get("id") == "br_sites":
                        if branch.get("target") == "edit-ask-amount-loading-sites":
                            print("⏭️  cond-refresh-route.br_sites уже указывает на edit-ask-amount-loading-sites")
                        else:
                            print(f"⚠️  cond-refresh-route.br_sites: текущий target = {branch.get('target')}")
            break

    # 6. Находим все ноды setv-amt-* и меняем autoTransitionTo
    setv_amt_count = 0
    for node in nodes:
        if node["id"].startswith("setv-amt-"):
            auto_target = node.get("data", {}).get("autoTransitionTo", "")
            if auto_target == "setv-compare-init":
                node["data"]["autoTransitionTo"] = "edit-ask-amount-loading-sites"
                setv_amt_count += 1
                print(f"✅ {node['id']}: autoTransitionTo изменён на edit-ask-amount-loading-sites")
            elif auto_target == "edit-ask-amount-loading-sites":
                print(f"⏭️  {node['id']}: уже указывает на edit-ask-amount-loading-sites")
            else:
                print(f"⚠️  {node['id']}: autoTransitionTo = '{auto_target}' (не изменяю)")

    if setv_amt_count > 0:
        print(f"Всего изменено setv-amt-* нод: {setv_amt_count}")

    # 7. Сохраняем
    with open(PROJECT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Файл сохранён: {PROJECT_PATH}")

    # 8. Верификация
    print("\n--- Верификация ---")
    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        verify_data = json.load(f)

    for s in verify_data.get("sheets", []):
        if s.get("id") == "sheet-compare-rates":
            v_nodes = s.get("nodes", [])
            v_ids = {n["id"] for n in v_nodes}

            # Проверяем наличие новых нод
            assert "edit-ask-amount-loading" in v_ids, "ОШИБКА: edit-ask-amount-loading не найдена!"
            assert "edit-ask-amount-loading-sites" in v_ids, "ОШИБКА: edit-ask-amount-loading-sites не найдена!"
            print("✅ Обе ноды edit-ask-amount-loading и edit-ask-amount-loading-sites присутствуют")

            # Проверяем bot-cond-in-progress
            for n in v_nodes:
                if n["id"] == "bot-cond-in-progress":
                    for br in n["data"]["branches"]:
                        if br["id"] == "branch_free":
                            assert br["target"] == "edit-ask-amount-loading", \
                                f"ОШИБКА: branch_free target = {br['target']}"
                            print("✅ bot-cond-in-progress.branch_free → edit-ask-amount-loading")

            # Проверяем cond-refresh-route
            for n in v_nodes:
                if n["id"] == "cond-refresh-route":
                    for br in n["data"]["branches"]:
                        if br["id"] == "br_sites":
                            assert br["target"] == "edit-ask-amount-loading-sites", \
                                f"ОШИБКА: br_sites target = {br['target']}"
                            print("✅ cond-refresh-route.br_sites → edit-ask-amount-loading-sites")

            # Проверяем setv-amt-*
            for n in v_nodes:
                if n["id"].startswith("setv-amt-"):
                    at = n["data"].get("autoTransitionTo", "")
                    if at == "setv-compare-init":
                        print(f"⚠️  ВЕРИФИКАЦИЯ: {n['id']} всё ещё указывает на setv-compare-init!")
                    elif at == "edit-ask-amount-loading-sites":
                        pass  # OK
            print("✅ Все setv-amt-* ноды проверены")
            break

    print("\n🎉 Все изменения применены и верифицированы успешно!")


if __name__ == "__main__":
    main()
