"""
Скрипт для реорганизации листов в файле новый.json.
Распределяет 59 узлов по 6 тематическим листам.

Запуск из корня проекта:
    python scripts/reorganize_sheets.py
"""

import json
import shutil
import uuid
from pathlib import Path

# Пути к файлам
BOT_FILE = Path("bots/новый/новый.json")
BACKUP_FILE = Path("bots/новый/новый.json.bak")

# Распределение узлов по листам
SHEETS = {
    "Список проектов": [
        "trigger-start", "fetch-projects", "check-projects-status",
        "check-projects-empty", "projects-msg", "projects-keyboard",
        "projects-actions-keyboard", "projects-error-msg", "no-projects-msg",
        "incoming-callback-trigger",
    ],
    "Карточка проекта": [
        "fetch-project-detail", "check-bot-status",
        "project-card-running", "project-card-stopped", "project-card-unknown",
        "project-actions-keyboard", "reload-project", "result-keyboard",
    ],
    "Действия с ботом": [
        "action-start", "action-stop", "action-restart",
        "check-start-status", "check-stop-status", "check-restart-status",
        "action-result-msg", "action-error-msg",
    ],
    "Управление проектом": [
        "rename-project-ask", "rename-project-action", "check-rename-status",
        "rename-success-msg", "rename-error-msg",
        "delete-project-confirm", "delete-confirm-keyboard",
        "delete-project-action", "check-delete-status",
        "delete-success-msg", "delete-error-msg",
        "create-project-keyboard", "create-project-action", "check-create-status",
        "create-success-msg", "create-error-msg", "after-create-keyboard",
    ],
    "Создание с токеном": [
        "ask-project-name", "ask-token-value",
        "create-project-with-token", "check-new-project-status",
        "create-token-for-project", "check-new-token-status",
        "load-new-project", "new-project-error-msg", "new-token-error-msg",
    ],
    "Токены": [
        "fetch-tokens", "check-tokens-status", "check-tokens-empty",
        "tokens-msg", "tokens-keyboard", "no-tokens-msg", "tokens-error-msg",
    ],
}

# Количество узлов в одном ряду при расстановке позиций
NODES_PER_ROW = 4
# Шаг по горизонтали и вертикали
STEP_X = 300
STEP_Y = 200


def расставить_позиции(узлы: list) -> list:
    """
    Расставляет узлы в сетку: по 4 в ряд.

    :param узлы: список узлов листа
    :returns: список узлов с обновлёнными позициями
    """
    for индекс, узел in enumerate(узлы):
        col = индекс % NODES_PER_ROW
        row = индекс // NODES_PER_ROW
        узел["position"] = {"x": col * STEP_X, "y": row * STEP_Y}
    return узлы


def main():
    # Проверяем наличие исходного файла
    if not BOT_FILE.exists():
        print(f"❌ Файл не найден: {BOT_FILE}")
        return

    # Читаем исходный JSON
    with BOT_FILE.open(encoding="utf-8") as f:
        данные = json.load(f)

    # Берём все узлы из всех листов (поддержка повторного запуска)
    исходный_лист = данные["sheets"][0]
    все_узлы = [узел for лист in данные["sheets"] for узел in лист["nodes"]]

    # Строим словарь узлов по id для быстрого доступа
    узлы_по_id: dict = {узел["id"]: узел for узел in все_узлы}

    # Проверяем, что все узлы из SHEETS присутствуют в файле
    все_id_в_схеме = [nid for ids in SHEETS.values() for nid in ids]
    не_найдены = [nid for nid in все_id_в_схеме if nid not in узлы_по_id]
    if не_найдены:
        print(f"⚠️  Узлы из схемы не найдены в файле: {не_найдены}")

    # Проверяем, что все узлы файла попали в схему
    id_в_схеме = set(все_id_в_схеме)
    не_распределены = [nid for nid in узлы_по_id if nid not in id_в_схеме]
    if не_распределены:
        print(f"⚠️  Узлы из файла не попали ни в один лист: {не_распределены}")

    # Копируем метаданные из оригинального листа
    created_at = исходный_лист.get("createdAt", "")
    updated_at = исходный_лист.get("updatedAt", "")

    # Создаём новые листы
    новые_листы = []
    первый_id = None

    for название, список_id in SHEETS.items():
        # Собираем узлы для этого листа (только те, что есть в файле)
        узлы_листа = [
            узлы_по_id[nid]
            for nid in список_id
            if nid in узлы_по_id
        ]

        # Расставляем позиции в сетку
        узлы_листа = расставить_позиции(узлы_листа)

        # Генерируем уникальный id листа
        sheet_id = str(uuid.uuid4())
        if первый_id is None:
            первый_id = sheet_id

        лист = {
            "id": sheet_id,
            "name": название,
            "nodes": узлы_листа,
            "createdAt": created_at,
            "updatedAt": updated_at,
            "viewState": {"pan": {"x": 0, "y": 0}, "zoom": 100},
        }
        новые_листы.append(лист)

        print(f"  📄 {название}: {len(узлы_листа)} узлов")

    # Делаем бэкап оригинала
    shutil.copy2(BOT_FILE, BACKUP_FILE)
    print(f"\n💾 Бэкап сохранён: {BACKUP_FILE}")

    # Обновляем данные
    данные["sheets"] = новые_листы
    данные["activeSheetId"] = первый_id

    # Сохраняем результат
    with BOT_FILE.open("w", encoding="utf-8") as f:
        json.dump(данные, f, ensure_ascii=False, indent=2)

    # Итоговая статистика
    итого = sum(len(л["nodes"]) for л in новые_листы)
    print(f"\n✅ Готово! Всего узлов распределено: {итого}")
    print(f"   Листов создано: {len(новые_листы)}")
    print(f"   activeSheetId = {первый_id}")


if __name__ == "__main__":
    main()
