# Формат project.json

Проект имеет `version: 2`, `activeSheetId` и массив `sheets`. Каждый лист содержит `id`, `name`, `nodes` и необязательный `viewState`. Нода имеет уникальные `id`, `type`, `position` и `data`.

Перед созданием ноды вызови `list_node_types`, затем `get_node_schema` и `get_node_example`. Не придумывай поля `data`; копируй форму рабочего примера. После изменения вызывай `validate_node` и `validate_bot_project`.

ID переходов должны указывать на существующие ноды. Для `condition` используй только `branches`; формат `conditions` + `defaultTarget` не существует.
