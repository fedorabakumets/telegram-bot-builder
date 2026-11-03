<!-- @fileoverview Доказательная матрица пользовательских возможностей HTTP/MCP и оставшихся пробелов. -->

# Покрытие вкладок конструктора через MCP

Снимок текущего дерева на 3 ноября 2026 года. Основной MCP: [регистрация](../../lib/bot-tools/mcp-register-tools.ts), [машинный каталог](action-catalog.json). Это аудит кода и изолированных тестов, а не утверждение о проверке каждой операции на работающем сервере. Реальные сообщения, пользовательские проекты и серверные файлы не использовались. Матрица отдельного OpenAPI→MCP адаптера сюда не включена.

Состав панелей подтверждён [lazy-panels](../../client/pages/editor/lazy-panels.tsx) и [навигацией](../../client/pages/editor/hooks/use-tab-navigation.ts). JSON и код входят в общую export-панель; другие возможности могут быть внутренними панелями вкладки.

## Обозначения и предел доказательств

- **Реализовано** — связаны registration, schema и handler. Это не означает проверку всех ветвей живого сервера.
- **Непроверено** — конкретному свойству недостаёт полного доказательства. Особенно это относится к доставке live-события, применению открытым UI и работающим ботом.
- **Отсутствует** — нет соответствующего MCP-действия или безопасного серверного контракта.
- **Исключено** — намеренная граница доступа, которую нельзя убрать публикацией произвольного HTTP endpoint.
- **Локальный UI** — несохранённый буфер, выделение, zoom или иное состояние конкретного браузера.

Авторизация: **P** — [requireProjectAccess](../../server/middleware/requireProjectAccess.ts), владелец/коллаборатор; **T** — [resource ownership](../../server/middleware/requireResourceOwnership.ts), реальный проект ресурса плюс совпадение проекта URL; **M** — media ownership; **O** — [owner/visibility шаблона](../../server/routes/templates/template-access.ts). Над ними действует общая API-аутентификация. Встроенные проверки handlers отмечены отдельно. В таблицах сокращённые HTTP-пути начинаются после общего префикса `/api/`; `project`, `token` и `:id` обозначают соответствующие ID из указанного route source, а не произвольный URL для call_action.

`persistence.confirmed=true` подтверждает указанную запись или readback, а не все внешние эффекты. HTTP 2xx, отсутствие ошибки, `partial`, `unknown` и `unverified` не равны полному сохранению. Durable `requestId` запрещает повтор исполнения одной заявки, но после crash может потребоваться ручная сверка неизвестного исхода.

Точные аргументы всех действий: `describe_actions`, [action-catalog.json](action-catalog.json), карточки `tools/<action_id>.md`. Ссылка на тестовый файл означает область доказательств, а не отдельный integration-тест для каждого перечисленного действия.

## Редактор и JSON

UI: [editor](../../client/pages/editor), [code/JSON](../../client/components/editor/code). HTTP: [project routes](../../server/routes/setupProjectRoutes.ts), [update handler](../../server/routes/projectRoutes/handlers/updateProjectHandler.ts). Документы: [update-project](workflows/update-project.md), [create-node](workflows/create-node.md), [button-navigation](workflows/button-navigation.md).

| Возможность UI | HTTP API | Auth | MCP action | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| Читать сценарий/ноды/связи | GET projects/:id | P | `get_project_db`, `db_project_summary`, `db_get_node`, `db_list_nodes`, `db_find_nodes`, `db_list_connections`, `db_find_inbound` | [node-query](../../lib/bot-tools/node-query-db.ts), каталог | Read, ревизия исходного снимка | Несохранённый холст не читается | [project-persistence](../../lib/bot-tools/project-persistence.test.ts); реализовано |
| Добавить/изменить/удалить/связать/двигать ноду | GET + PUT projects/:id | P | `db_add_node`, `db_update_node`, `db_remove_node`, `db_connect_nodes`, `db_disconnect_nodes`, `db_move_node`, `db_duplicate_node`, `db_auto_layout` | [scenario-operation-schema](../../shared/scenario-operation-schema.ts) | CAS expectedRevision, 409, saved revision | Side effects отдельно от commit | [HTTP persistence](../../lib/bot-tools/project-http-persistence.test.ts), [canvas revision](../../lib/bot-tools/canvas-revision-order.test.ts); полная живая UI-проверка отсутствует |
| Пакет сценария | GET + PUT projects/:id | P | `db_apply_ops` | Discriminated operations, общая schema | CAS целого снимка; GET→PUT не общая БД-транзакция | Canvas delivery отдельно | Persistence tests; конкретная receipt определяет исход |
| Листы и перенос между проектами | GET/PUT одного или двух проектов | P обоих | `db_add_sheet`, `db_duplicate_sheet`, `db_rename_sheet`, `db_remove_sheet`, `db_set_active_sheet`, `db_list_sheets`, `db_reorder_sheets`, `db_move_sheet_to_project` | [sheet ops](../../lib/bot-tools/sheet-ops-db.ts), [move](../../lib/bot-tools/sheet-move-ops-db.ts) | Проверять обе записи/partial | Два обновления UI | Реализовано; атомарность переноса двух проектов не доказана |
| Навигация кнопок | GET/PUT projects/:id | P | `db_report_button_navigation`, `db_rewrite_button_navigation` | [navigation adapter](../../lib/bot-tools/scenario-navigation-db.ts) | Report read; rewrite saved revision | Переход runtime отдельно | Реализовано; [workflow](workflows/button-navigation.md) |
| Подготовка JSON | Нет HTTP | Без записи | `create_node`, `scaffold_minimal_project`, `add_node`, `update_node`, `remove_node`, `connect_nodes` | Основной registry | **prepared**, не saved | UI не меняется | [result normalization](../../lib/bot-tools/mcp-action-result.ts); намеренная подготовка |
| Применение JSON | PUT projects/:id | P | `update_project_db` | Validation + revision | Серверная receipt | Delivery не является commit | [HTTP persistence](../../lib/bot-tools/project-http-persistence.test.ts) |
| Undo/Redo, выделение, zoom, clipboard, несохранённый текст | Нет серверного ресурса | Локально | Нет | UI state | Нет | Текущая вкладка | **Локальный UI**, не пропущенный CRUD |
| Предпросмотр | Tab hook ведёт к /preview/:id | Router отдельно | Нет полноценной симуляции | JSON validation не runtime preview | Нет | Работа preview не доказана | **Непроверено**: маршрут и пользовательский поток |

## Код и экспорт

UI: [code](../../client/components/editor/code). Документы: [code-flow](workflows/code-flow.md).

| Возможность | HTTP API | Auth | MCP | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| Python из JSON | Локальный генератор; UI POST projects/:id/generate | P для HTTP | `generate_bot_code` | Основной registry, генератор | Возвращает код, не сохраняет сценарий | Не запускает бот | Реализовано; не deploy |
| Экспорт сохранённого проекта | POST projects/:id/export | P | `db_export_project` только stdio; remote: read JSON + `generate_bot_code` | Lifecycle adapter, каталог | Локальный атомарный файл/readback | Runtime не меняется | Remote search/describe/call исключают запись серверного файла; не все UI-варианты скачивания доказаны |
| Локальный project.json | Нет remote HTTP | stdio only | `load_project`, `save_project` | File-tool schemas | **file**, не запись проекта | Нет | Remote FS исключён; [compact profile](compact-profile.md) |
| Python/README буфер и форматирование | Локально | Локально | Нет | UI buffer | Не saved | Только панель | **Локальный UI** |

## Боты, настройки, профиль, ENV

UI: [bot](../../client/components/editor/bot). HTTP: [management](../../server/routes/setupBotManagementRoutes.ts), [settings routes](../../server/routes/routes.ts), [safe DTO](../../server/routes/projectRoutes/handlers/getBotSettingsHandler.ts). Contracts: [settings](../../shared/schema/bot-settings-contracts.ts), [ENV](../../shared/schema/tables/bot-env-variables.ts). Документы: [start](workflows/start-bot.md), [restart](workflows/restart-bot.md), [userbot](workflows/telethon-userbot.md), карточки каталога.

| Возможность | HTTP API | Auth | MCP | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| Список/add/replace/delete токена | GET tokens/list; POST/PUT/DELETE tokens | P/T + handler | `db_list_bot_tokens`, `db_add_bot_token`, `db_update_bot_token`, `db_delete_bot_token` | Registry/token adapters | Не выводить raw token; старые receipts отдельно | Замена может требовать restart | [create](../../lib/bot-tools/bot-token-create-db.test.ts), [update](../../lib/bot-tools/bot-token-update-db.test.ts); реализовано |
| Lifecycle/status | GET statuses; POST start/stop/restart/restart-all/start-offline-all | P | `db_bot_status`, `db_start_bot`, `db_stop_bot`, `db_restart_bot`, `db_restart_all_bots`, `db_start_offline_bots` | Registry/lifecycle handlers | 2xx не доказывает дальнейшую работоспособность | Проверять status/logs после операции | Реальные боты не запускались |
| Настройки read | GET projects/:id/tokens/:tokenId/settings | P + exact token.projectId | `db_get_bot_settings` | Whitelist DTO | Read, секретов нет | Сохранённое состояние | [feature-extra](../../lib/bot-tools/feature-extra-tools.test.ts), crossproject/secret tests |
| Auto-restart/protect/media/catch-all/blocks/groups/cache/log/launch | PUT token/{setting} | T + URL match до write | `db_set_bot_settings` | Общий union, [HTTP validator](../../server/middleware/require-bot-setting-body.ts) | Публичные поля readback; secret требует server receipt | Runtime apply/restart отдельно | [feature-extra](../../lib/bot-tools/feature-extra-tools.test.ts), [contracts](../../lib/bot-tools/user-feature-contracts.test.ts); все runtime варианты непроверены |
| Name/description/shortDescription | PUT token/bot-info | T | `db_set_bot_profile` | Общая profile schema | Telegram + DB неатомарны; readback поля | Внешний эффект | Mocked checks, реальные Telegram calls не выполнялись |
| Retention сообщений | PUT token messages-retention | T | `db_set_messages_retention` | Registry retention enum | Настройка saved отдельно от очистки | Scheduler/runtime отдельно | Реализовано; живая очистка непроверена |
| Userbot settings/auth/2FA | userbot/send-code/sign-in/sign-in-2fa | T | `db_set_userbot_settings`, `db_userbot_send_code`, `db_userbot_sign_in`, `db_userbot_sign_in_2fa` | [userbot registration](../../lib/bot-tools/mcp-register-userbot-tools.ts) | Pending auth не saved session | Внешний процесс | Userbot isolated tests; реальный вход не выполнялся |
| ENV list/create/update/delete | token/env-variables[/:id] | T + variable.tokenId | `db_list_bot_env`, `db_create_bot_env`, `db_update_bot_env`, `db_delete_bot_env` | Shared ENV insert/partial | Server returning/delete; MCP скрывает **все** values | Для применения restart | [feature-extra](../../lib/bot-tools/feature-extra-tools.test.ts); runtime ENV непроверен |
| Admin IDs read | GET projects/:id/admin-ids | P | `db_get_bot_admin_ids` | Project ID | Read | Прав не выдаёт | Реализовано; fallback чтения .env отдельно непроверен |
| Admin IDs write, ENV reveal, arbitrary env-batch | Существующие sensitive routes | P/T | Нет обычного действия | Не обходить через data patch | **Исключено**: self-grant/reveal | Нет | Требуется отдельная модель полномочий |

## Пользователи и ответы

UI: [database](../../client/components/editor/database/user-database), [details](../../client/components/editor/database/user-details). HTTP: [точная карточка](../../server/routes/botUsers/handlers/getBotUserDataHandler.ts), [user routes](../../server/routes/routes.ts). Schema: [user-data](../../shared/schema/user-data-contracts.ts). Документы: `db_list_users`, `db_get_user`, `db_get_user_variables` в [каталоге](action-catalog.json).

| Возможность | HTTP API | Auth | MCP | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| Поиск/фильтры/страницы | GET projects/:id/users | Встроенный project access | `db_list_users` | tokenId, limit/offset/search/filter/sort | Read, userData | Фильтры UI передаются явно | [user feature](../../lib/bot-tools/user-data-feature-tools.test.ts); страницы не общий snapshot |
| Точная карточка с ответами | GET projects/:projectId/users/:userId | P + effective token | `db_get_user` | Project/token/user ID | SQL WHERE трёх IDs; 404 | Не скачивает аватар/не вызывает Telegram | [contracts](../../lib/bot-tools/user-feature-contracts.test.ts); реализовано |
| Variables в колонках | GET users/variables | P | `db_get_user_variables` | token_id/limit | Read, ограниченная выборка | Нет гарантии live | Не полный экспорт всей базы |
| Active flag | PUT users/:userId | P + token | `db_update_user` | Shared isActive | SQL RETURNING, zero-row 404 | Не Telegram block/unblock | Реализовано; UI event отдельно непроверен |
| Delete one/all selected bot | DELETE users/:userId; DELETE users | P | `db_delete_user`, `db_clear_users` | Явный token_id | Транзакция messages+users, COMMIT receipt/rollback | Telegram не удаляется | [user feature](../../lib/bot-tools/user-data-feature-tools.test.ts); ложный успех исправлен |
| Включить базу | PUT projects/:id | P | `db_set_user_database_enabled` | enabled + expected_revision | Project CAS, 409 | Runtime apply отдельно | Общий HTTP persistence покрывает CAS; отдельный runtime toggle непроверен |
| Произвольно менять userData/ответы | Без подтверждённого безопасного контракта | Нужно P/T | Нет | Требуются типы/разрешённые поля/CAS | **Отсутствует**, если нужен write | Не имитировать isActive действием | Отдельный gap |

## Диалоги, рассылки, кампании

UI: [dialog](../../client/components/editor/database/dialog), [broadcast](../../client/components/editor/broadcast). HTTP: [integration routes](../../server/routes/setupBotIntegrationRoutes.ts), [broadcast routes](../../server/routes/setupBroadcastRoutes.ts). Schema: [dialog](../../shared/schema/dialog-write-contracts.ts), [broadcast](../../shared/schema/broadcast-contracts.ts), [requestId](../../shared/action-request-id.ts), [media guard](../../server/routes/botIntegration/handlers/messages/media-reference-security.ts). Документы: соответствующие карточки [каталога](action-catalog.json).

| Возможность | HTTP API | Auth | MCP | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| List/search/history | GET dialogs, messages/search, dialogs/:chatId/messages | P + token/chat type | `db_list_dialogs`, `db_search_dialog_messages`, `db_get_dialog_messages` | Query/cursor schemas | Read сохранённой истории/retention | Не текущий Telegram | [dialogs-api](../../lib/bot-tools/dialogs-api.test.ts), dialog/search tests |
| Check/access job/poll/cancel | POST check-access/chat-access-checks; GET active; POST job/cancel | P + token/job project | `db_check_chat_access`, `db_start_chat_access_check`, `db_get_chat_access_check`, `db_cancel_chat_access_check` | Token/chat/job IDs | Job status; cancelling не completed | Progress отдельно | Existing access tests + [user feature](../../lib/bot-tools/user-data-feature-tools.test.ts); Telegram mocked |
| Send user/node/group | POST send-message/send-node-message/send-group-message | P до claim; token/media ownership | `db_send_dialog_message`, `db_send_node_message`, `db_send_group_message` | MCP requestId required; strict media | Durable state/messageId; не транзакция Telegram+history | Handler history/event, delivery отдельно | [media-security](../../lib/bot-tools/media-reference-security.test.ts), durable tests; no real sends |
| Edit/delete sent message | PATCH/DELETE messages/:messageId | P + message/token | `db_edit_dialog_message`, `db_delete_dialog_message` | Message body/IDs | Возможен внешний/DB partial; полного receipt нет | Project event отдельно | Реализовано; durable requestId для edit/delete отсутствует |
| Clear saved history | DELETE users/:userId/messages | P + token | `db_clear_dialog_history` | User/token scope | Не Telegram; legacy boolean не durable receipt | UI refresh отдельно | Реализовано, полное подтверждение непроверено |
| Sync group | POST groups/:groupId/sync | P + token/group | `db_sync_dialog_group` | IDs | Telegram→сохранённые сведения | Не отправляет сообщение | Реализовано; live Telegram не проверялся |
| Audience preview | POST broadcasts/preview-audience | P + selected tokens | `db_preview_broadcast_audience` | Shared preview filters | Read/расчёт | Не резервирует аудиторию | Может измениться до запуска |
| Start broadcast/campaign | POST broadcasts | P до claim | `db_start_broadcast` | requestId + create schema; tokenIds→campaign | Durable broadcastId/campaignId/broadcastIds | Background queue, poll | [durable wrapper](../../server/services/action-requests/durable-action.ts); доставка всем адресатам непроверена |
| List/details | GET broadcasts[/:id], broadcast-campaigns[/:id] | P + child lookup | `db_list_broadcasts`, `db_get_broadcast`, `db_list_broadcast_campaigns`, `db_get_campaign` | Project/resource/list filters | Read status | Poll/progress отдельно | Campaign list не обещает ту же пагинацию, что broadcasts |
| Stop/edit/delete broadcast/campaign | POST :id/stop; PUT/DELETE :id | P + child lookup | `db_stop_broadcast`, `db_stop_campaign`, `db_edit_broadcast`, `db_edit_campaign`, `db_delete_broadcast`, `db_delete_campaign` | Shared edit schemas/IDs | Telegram partial возможен; irreversible | Stop не отзывает доставленное | Реализовано; полные массовые внешние эффекты непроверены |

## Аналитика

UI: [analytics](../../client/components/editor/analytics). HTTP: [v2](../../server/routes/analytics/v2/setup-routes.ts), [acquisition](../../server/routes/analytics/acquisition/routes.ts), [activity](../../server/routes/analytics/setup-activity-leaders.ts). Документы: [analytics-acquisition](workflows/analytics-acquisition.md).

| Возможность | HTTP API | Auth | MCP | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| Snapshot/period/compare | GET analytics/v2/snapshot, analytics/range | P + token filter | `db_get_analytics_v2`, `db_get_analytics_range`, `db_compare_analytics` | Shared snapshot/range schemas | Read as_of/revision/coverage/previous | Не обещает полную историю/real-time | [analytics-v2-mcp](../../lib/bot-tools/analytics-v2-mcp.test.ts) |
| Users/premium/languages/active/buttons/traffic/groups/messages | Legacy/range analytics | P/встроенная project check | Семейства `db_get_*summary/chart`, popular/premium/languages/traffic/active/users tools | Каталог, analytics registrations | Read; legacy/v2 семантику сверять | Poll | Изолированные analytics tests; история реального проекта непроверена |
| Sources/placements/links/expenses list/create/update/archive | GET/POST/PATCH acquisition/{resource} | P + linked IDs | `db_list_analytics_sources/placements/links/expenses`, `db_create_analytics_source/placement/link/expense`, `db_update_analytics_source/placement/link/expense` | Shared acquisition schemas | Audit/DB; проверять конкретный receipt | Refresh отдельно | [analytics-v2-mcp](../../lib/bot-tools/analytics-v2-mcp.test.ts); реальные платежи не выполнялись |
| Acquisition report/history | GET acquisition/report, resource/:id/history | P | `db_get_acquisition_report`, `db_get_analytics_history` | reportInput/resource enum | Read; null/reason не ноль | Нет mutation | Реализовано; руководство выше |
| USD/RUB | GET acquisition/exchange-rate | P | `db_get_analytics_exchange_rate` | day | Read, расходы не пересчитывает | Внешний CBR | Allowlist исправлен; доступность источника не гарантируется |
| Link budget | POST acquisition/budgets | P | `db_save_analytics_link_budget` | linkBudgetInput + requestId | Транзакция/защита повторной оплаты | Refresh отдельно | [budget-idempotency](../../lib/bot-tools/analytics-budget-idempotency.test.ts) |
| Activity leaders | GET analytics/activity-leaders | P | `db_get_activity_leaders` | token/granularity enum | Read | Нет mutation | Реализовано; учитывать нестандартные значения granularity |

## Таблицы

UI: [tables](../../client/components/editor/tables). HTTP: [table routes](../../server/routes/tables/setupTablesRoutes.ts), [chart](../../server/routes/tables/chart/setup-table-chart-routes.ts). Документы: [project-tables](project-tables.md), [workflow](workflows/tables.md).

| Возможность | HTTP API | Auth | MCP | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| List/search/schema/summary | GET tables/search/:id/summary | P + table project | `db_list_tables`, `db_find_tables`, `db_get_table`, `db_get_table_summary` | [table read](../../lib/bot-tools/mcp-register-table-read.ts) | Read; _content restrictions | Не users/messages system tables | [scope](../../lib/bot-tools/bot-tables-scope.test.ts), MCP tests |
| Table/column CRUD/order | POST/PUT/DELETE tables/columns | P + table/column lookup | `db_create_table`, `db_rename_table`, `db_delete_table`, `db_add_table_column`, `db_rename_table_column`, `db_delete_table_column`, `db_reorder_table_columns` | [table write](../../lib/bot-tools/mcp-register-table-write.ts) | Receipts/returning; confirm destructive; _content guarded | Event≠delivery | [receipts](../../lib/bot-tools/table-write-receipts.test.ts), [live](../../lib/bot-tools/tables-live.test.ts) |
| Rows read/find/count/CRUD/import/reindex/clear | rows/query/count/import/reindex routes | P + table/row/column | `db_list_table_rows`, `db_find_table_rows`, `db_count_table_rows`, `db_get_table_row`, `db_add_table_rows`, `db_update_table_row`, `db_patch_table_row`, `db_delete_table_row`, `db_reindex_table_rows`, `db_clear_table_rows`, `db_import_table_rows` | Filter/cells schemas, limits | Unconditional старые writes отдельно от expected writes | UI отдельно | [races](../../lib/bot-tools/table-write-races.test.ts), SQL/scope tests; нет snapshot страниц |
| Column types/labels/required/bounds | PUT columns/:id/settings | P + column | `db_set_table_column_settings` | [table-column-settings](../../shared/table-column-settings.ts) | Full replacement/defaults; _content запрещена | UI ack отдельно | [contracts-extra](../../lib/bot-tools/table-contracts-extra.test.ts) |
| Conditional range/patch | POST cells/edit; PATCH rows/:id | P + locks/schema | `db_edit_table_cells`, `db_patch_table_row_expected` | [table-cell-edit](../../shared/table-cell-edit.ts), before/after/expected | Transaction, 409 no-write; _content revision | UI отдельно | [content revision](../../lib/bot-tools/table-content-revision.test.ts), races |
| Batch operations | POST apply-ops | P | `db_apply_table_ops` | До 50 typed operations | Transaction/failed_op_index | Event отдельно | SQL/receipt tests |
| Chart/suggest | Chart routes | P + columns/date filter | `db_get_table_chart`, `db_suggest_table_chart` | dateColumnId/from/to включены | Read data, не PNG | UI render отдельно | [chart-api](../../lib/bot-tools/table-chart-api.test.ts), [chart-mcp](../../lib/bot-tools/table-chart-mcp.test.ts) |
| Remote inline import/export | POST tables/import; schema+rows page | P | `db_import_tables_data`, `db_export_table_data` | [table-bundle](../../shared/table-bundle-schema.ts) | No confirm→prepared; import tx; export complete/next_offset | Страницы без общего snapshot | [registration](../../lib/bot-tools/mcp-register-table-bundle-tools.ts); полноту server roundtrip проверять отдельно |
| CSV/JSON local files | Local FS→HTTP | stdio only | [table file actions](../../lib/bot-tools/mcp-register-table-files.ts) | File contracts | file отдельно от DB | Remote FS исключён | [file tests](../../lib/bot-tools/bot-tables-files.test.ts) |

## Файлы и хранилища

UI: [files](../../client/components/editor/files). HTTP: [integration](../../server/routes/setupBotIntegrationRoutes.ts), [media routes](../../server/routes/routes.ts). Contracts: [file enums](../../shared/schema/project-file-contracts.ts), [metadata whitelist](../../shared/schema/media-metadata-contracts.ts). Документы: соответствующие карточки каталога.

| Возможность | HTTP API | Auth | MCP | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| Sources/search/filters/pages | GET project/files | P | `db_list_project_files` | Shared enums, page/limit/name/date/size/uploader/storage | Read; filePath исключён | UI filters отдельно | [feature-extra](../../lib/bot-tools/feature-extra-tools.test.ts), server file tests |
| Quota | GET project/storage-quota | P | `db_get_storage_quota` | project ID | Read; soft quota не запрет upload | Нет live guarantee | Реальная квота непроверена |
| Upload | POST multipart media/upload/:projectId | P | `db_upload_project_file` | Base64≤2 МиБ; filename без каталогов | ID + owned media readback | UI появление отдельно | [feature-extra](../../lib/bot-tools/feature-extra-tools.test.ts); server paths не принимаются |
| Metadata | PUT media/:id | M | `db_update_file_metadata` | Strict description/tags/isPublic; path/URL/owner forbidden | Readback полей | Не меняет адрес объекта | [contracts](../../lib/bot-tools/user-feature-contracts.test.ts) |
| Usage counter | POST media/:id/use | M | `db_mark_file_used` | media ID | Повтор увеличивает снова; полного receipt нет | Не отправляет файл | Реализовано, idempotent false |
| Delete selections | DELETE project/files | P + SQL project | `db_delete_project_files` | items(id,source), ≤100 | DELETE RETURNING; requested/missing; physical counters; partial при absent/failure | Incoming/outgoing удаляет сохранённые сообщения, не Telegram | [actual delete handler](../../lib/bot-tools/project-files-delete.test.ts): zero/subset/physical failure |
| URL ingestion/batch upload/file_id management | download-url(s), upload-multiple, media/:id/file-id | P/M | Нет отдельных действий | API presence не safe MCP | **Исключено пока**: URL/redirect/DNS policy требует аудита | Нет | Gap; batch можно выполнить ограниченными uploads |
| Storage backend registry CRUD/test | /api/storage-configs | Global API auth, tenant ACL недостаточен | Нет | DTO скрывает credentials | **Исключено**: глобальный реестр не проектный ресурс | Не выдавать credentials | [routes](../../server/routes/setupStorageConfigRoutes.ts), [list](../../server/routes/storageConfigs/handlers/listStorageConfigsHandler.ts) |

## Версии, терминал, проекты, шаблоны

UI: [versions](../../client/components/editor/versions), [terminal](../../client/components/editor/terminal), [templates](../../client/components/editor/scenariy). Документы: [logs](bot-logs.md), [diagnose](workflows/diagnose-logs.md), [update project](workflows/update-project.md).

| Возможность | HTTP API | Auth | MCP | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| Version list/snapshot | GET versions[/:versionId] | P + version.project | `db_list_versions`, `db_get_version` | Project/version IDs | Read; list без snapshot | Query UI отдельно | [extra adapter](../../lib/bot-tools/version-log-extra-db.ts) |
| Checkpoint | POST versions/commit | P | `db_create_checkpoint` | message/project | Version create + readback | versions-changed отдельно | [feature-extra](../../lib/bot-tools/feature-extra-tools.test.ts); повтор создаёт версию |
| Restore/delete/prune | POST restore; DELETE version; POST prune | P | `db_restore_version`, `db_delete_version`, `db_prune_versions` | Revision/version/filter | Restore CAS; delete/prune receipts отдельно | Canvas/events отдельно | [HTTP persistence](../../lib/bot-tools/project-http-persistence.test.ts); живой prune непроверен |
| Live/launch/search logs | logs/launch-history/launch logs | P/T/handler ownership | `db_bot_logs`, `db_bot_launch_history`, `db_list_bot_launches`, `db_get_launch_logs`, `db_search_bot_logs` | Time/text/limit schemas | Read, retention limits | Не бесконечный stream UI | [registration tests](../../lib/bot-tools/mcp-register-log-tools.test.ts), log-search tests |
| Log by ID | GET bot-logs/:logId | Handler проверяет log.projectId | `db_get_bot_log` | log ID | Read | Нет | [handler](../../server/routes/botManagement/handlers/botLogByIdHandler.ts); actual IDOR regression полезен |
| Clear live logs | DELETE project/token/logs | P + SQL project/token | `db_clear_bot_logs` | IDs | Strict DB delete, ошибка не скрывается; launch history остаётся | Flush buffer, UI отдельно | [strict code](../../server/terminal/botLogsBuffer.ts); actual DB failure test ещё нужен |
| Export logs file | Local FS adapter | stdio only | `db_export_bot_logs` | Output path | file | Нет | [export tests](../../lib/bot-tools/bot-log-search-export.test.ts) |
| Projects lifecycle | [project routes](../../server/routes/setupProjectRoutes.ts) | P/owner/list scope | `db_list_projects`, `db_create_project`, `db_rename_project`, `db_duplicate_project`, `db_archive_project`, `db_unarchive_project`, `db_reorder_projects`, `db_export_project` (stdio), `db_delete_project` | Registry/lifecycle adapters | Readback; create/duplicate optional request_id/ledger0039; без ID старый режим | Archive не stop; delete требует stop/cancel | Legacy proof/HTTP/CAS tests; не полный roundtrip всех lifecycle |
| Project import | bot-facing import/:id/data; local prepare+update | Actor/project | Нет отдельного общего remote import | File load не live save | **Частично**: можно validate JSON + explicit save | File picker локален | Gap: bounded remote import/rollback |
| Templates list/get/CRUD | templates[/:id] | O; self write | `db_list_templates`, `db_get_template`, `db_create_template`, `db_update_template`, `db_delete_template` | [template contracts](../../shared/schema/template-contracts.ts), no privileged fields | Create/update/delete readback; list включает private self | UI query отдельно | [access](../../server/routes/templates/template-access.test.ts), feature tests |
| Use template | POST templates/:id/use | O **до claim** | `db_use_template` | requestId required MCP | Project checkpoint после первого шага; unknown не повторяется; readback IDs | Две сущности не одна транзакция | [actual handler durable](../../lib/bot-tools/template-use-handler-durable.test.ts), [wrapper→adapter](../../lib/bot-tools/durable-feature-integration.test.ts) |
| Featured/category/search templates | /templates/featured/category/search | Visibility handlers | Нет специальных действий | Основной list/get не server search | **Частично** | UI filters отдельно | Gap: bounded search/pagination при росте каталога |

## Подключения агентов и служебные возможности

UI: [AgentTokensPanel](../../client/components/editor/agent/AgentTokensPanel.tsx). HTTP: [token routes](../../server/routes/setupAgentTokenRoutes.ts). Документы: [remote HTTP](remote-http.md), [playbook](agent-playbook.md), [compact](compact-profile.md).

| Возможность | HTTP API | Auth | MCP | Schema/source | Receipt | Live/runtime | Проверка / статус |
|---|---|---|---|---|---|---|---|
| Discovery/call | /mcp или stdio | Request-scoped PAT | `list_sections`, `search_actions`, `describe_actions`, `call_action` | Общий реальный registry | Нормализация исхода; сам каталог не write | Не arbitrary HTTP proxy | [profile tests](../../lib/bot-tools/mcp-profile.test.ts); compact публикует 4 tools |
| Docs search/read | MCP docs tools | Known doc IDs | `search_tool_docs` и readers | Containment/known IDs | Read | Нет | [docs tests](../../lib/bot-tools/mcp-tool-docs.test.ts); не arbitrary server file |
| PAT/session/collaborator grants | agent-tokens/profile sessions/bot collaborators | User/owner sensitive | Нет обычных действий | Отдельная auth model | **Исключено** self-management/self-grant | Не создаёт новый ключ автоматически | Не считать обычным CRUD gap |
| Telegram Agent connections | Отдельный subsystem/сервис | Требует отдельного аудита | Полное управление основным MCP не подтверждено | Не выводить из основного registry | **Непроверено / отсутствует здесь** | Соседний сервис не тестировался | Нужен отдельный connection/state/revoke аудит |
| OpenAPI→MCP | Отдельный generated adapter | Security alternatives subset | Не основной registry | [prepare-spec](../../tools/mcp-openapi/prepare-spec.mjs) | Не открывает все API автоматически | Отдельный процесс/подключение | Coverage этой матрицы не переносится автоматически |

## Открытые проверяемые пробелы

1. **Полный живой путь:** isolated adapters/handlers/transaction helpers не заменяют тестовую БД, WebSocket клиента и тестовый runtime. Для каждого write family нужны commit→readback→event→UI/runtime с отдельными исходами.
2. **Внешние неатомарные операции:** Telegram send/edit/delete и история БД могут разойтись. Durable ledger предотвращает повтор unknown, но не восстанавливает потерянный message ID. Template use имеет окно crash между createProject и checkpoint; не обещать rollback.
3. **Остальные create/copy/retry:** project create/duplicate и новые table wrappers защищены при передаче optional requestId; без него сохраняют совместимый режим. Template create, file upload/use и любые adds без requestId могут дублироваться. Автоматические retry по timeout запрещать без контракта идемпотентности.
4. **Старые receipts:** пройти legacy lifecycle/token/dialog edit/delete/history-clear/version prune/file usage. Без конкретного подтверждения оставлять unverified, а не saved.
5. **Медиа вне новых send paths:** остальные upload/download/file_id endpoints требуют общего аудита. URL ingestion исключён до политики redirects/DNS/private backends.
6. **Ответы:** чтение userData/variables есть; произвольный write ответов требует разрешённых полей, типов, CAS и серверного контракта.
7. **UI completeness:** preview route, несохранённые buffers, часть exports и template server search не покрываются автоматически. Local UI не имитировать как серверную запись.
8. **Привилегированные ресурсы:** storage tenant ACL, admin write, ENV reveal, PAT/session/collaborator grants намеренно исключены; расширение требует отдельных ролей/полномочий.
9. **OpenAPI:** покрытие generated адаптера проверять отдельно, включая auth, output schemas и расхождения с основным registry.
10. **Контрактная документация:** карточки и machine catalog генерировать из регистраций; ручную матрицу обновлять при изменении UI/HTTP, а не только количества tools.

## Правило обновления матрицы

Для новой возможности указать UI точку, HTTP метод/путь, auth **до side effects**, reused schema, action/effect, receipt/partial/unknown, состояние live/runtime, тесты success/denied/conflict/retry и документ. Пока звено не проверено, отмечать конкретное свойство непроверенным. Наличие имени в tools/list доказывает только регистрацию.
