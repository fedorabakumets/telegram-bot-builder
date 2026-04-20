/**
 * @fileoverview Фаза — Сценарий управляющего бота (часть 2: действия, навигация, обработка ошибок)
 *
 * Блок E: Действия start/stop/restart
 * Блок F: Навигация назад
 * Блок G: Обработка ошибок (condition узлы после fetch-projects и действий)
 * Блок K: Читаемый статус бота
 *   K06: replace_variables_in_text вызывается для текста карточки проекта
 *
 * @module tests/test-phase-bot-manager-scenario-2
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Загружает project.json сценария управляющего бота */
function loadProject() {
  const raw = fs.readFileSync('bots/импортированный_проект_2316_157_131/project.json', 'utf-8');
  return JSON.parse(raw);
}

/**
 * Генерирует Python-код из проекта
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, {
    botName: `BotManager_${label}`,
    userDatabaseEnabled: false,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода через py_compile
 * @param code - Python-код
 * @param label - Метка для временного файла
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_bms2_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: e.stderr?.toString() ?? String(e) };
  }
}

type Result = { id: string; name: string; passed: boolean; note: string };
const results: Result[] = [];

/**
 * Запускает тест и записывает результат
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Тело теста
 */
function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ✅ ${id}. ${name}`);
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message });
    console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`);
  }
}

/** Бросает ошибку если условие ложно */
function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

// ─── Загружаем проект один раз ───────────────────────────────────────────────
const project = loadProject();
const code = gen(project, 'p2');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║   Фаза — Сценарий управляющего бота (часть 2)                      ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// ══ Блок E: Действия start/stop/restart ══════════════════════════════════════
console.log('══ Блок E: Действия start/stop/restart ══════════════════════════════');

test('E01', 'action-start делает POST к /api/projects/.../bot/start', () => {
  ok(code.includes('/bot/start'), 'URL /bot/start не найден');
});

test('E02', 'action-stop делает POST к /api/projects/.../bot/stop', () => {
  ok(code.includes('/bot/stop'), 'URL /bot/stop не найден');
});

test('E03', 'action-restart делает POST к /api/projects/.../bot/restart', () => {
  ok(code.includes('/bot/restart'), 'URL /bot/restart не найден');
});

test('E04', 'URL действий содержит {project_detail.id}', () => {
  ok(code.includes('project_detail'), 'project_detail.id не найден в URL действий');
});

test('E05', 'action-start ведёт к check-start-status', () => {
  ok(code.includes('check_start_status'), 'переход к check-start-status не найден');
});

test('E06', 'action-stop ведёт к check-stop-status', () => {
  ok(code.includes('check_stop_status'), 'переход к check-stop-status не найден');
});

test('E07', 'action-restart ведёт к check-restart-status', () => {
  ok(code.includes('check_restart_status'), 'переход к check-restart-status не найден');
});

// ══ Блок F: Навигация назад ═══════════════════════════════════════════════════
console.log('\n══ Блок F: Навигация назад ═══════════════════════════════════════════');

test('F01', 'result-keyboard содержит кнопку "К проекту"', () => {
  ok(code.includes('К проекту'), 'кнопка "К проекту" не найдена');
});

test('F02', 'result-keyboard содержит кнопку "К списку"', () => {
  ok(code.includes('К списку'), 'кнопка "К списку" не найдена');
});

test('F03', '"К проекту" ведёт к reload-project (перезагрузка без перезаписи callback_data)', () => {
  ok(code.includes('reload_project'), 'узел reload-project не найден в коде');
});

test('F04', '"К списку" ведёт к fetch-projects', () => {
  ok(code.includes('fetch_projects'), 'callback_data для fetch-projects не найден');
});

// ══ Блок G: Обработка ошибок ══════════════════════════════════════════════════
console.log('\n══ Блок G: Обработка ошибок ══════════════════════════════════════════');

test('G01', 'check-projects-status condition узел присутствует в коде', () => {
  ok(code.includes('check_projects_status'), 'узел check-projects-status не найден');
});

test('G02', 'projects-error-msg содержит текст об ошибке загрузки', () => {
  ok(code.includes('Не удалось загрузить проекты'), 'текст ошибки загрузки проектов не найден');
});

test('G02b', 'check-projects-empty condition узел присутствует в коде', () => {
  ok(code.includes('check_projects_empty'), 'узел check-projects-empty не найден');
});

test('G02c', 'no-projects-msg содержит текст об отсутствии проектов', () => {
  ok(code.includes('У вас пока нет проектов'), 'текст "У вас пока нет проектов" не найден');
});

test('G03', 'check-start-status condition узел присутствует в коде', () => {
  ok(code.includes('check_start_status'), 'узел check-start-status не найден');
});

test('G04', 'check-stop-status condition узел присутствует в коде', () => {
  ok(code.includes('check_stop_status'), 'узел check-stop-status не найден');
});

test('G05', 'check-restart-status condition узел присутствует в коде', () => {
  ok(code.includes('check_restart_status'), 'узел check-restart-status не найден');
});

test('G06', 'action-error-msg содержит текст об ошибке действия', () => {
  ok(code.includes('Ошибка выполнения действия'), 'текст ошибки действия не найден');
});

test('G07', 'action-error-msg использует result-keyboard для навигации', () => {
  ok(code.includes('action_error_msg'), 'узел action-error-msg не найден в коде');
});

test('G08', 'condition узлы проверяют статус == 200', () => {
  ok(code.includes('== 200') || code.includes('== "200"'), 'проверка статуса 200 не найдена');
});

// ══ Блок H: Создание проекта ══════════════════════════════════════════════════
console.log('\n══ Блок H: Создание проекта ══════════════════════════════════════════');

test('H01', 'create-project-action делает POST к /api/bot/projects', () => {
  ok(code.includes('/api/bot/projects') && (code.includes('POST') || code.includes('post')), 'POST /api/bot/projects не найден');
});

test('H02', 'check-create-status condition узел присутствует в коде', () => {
  ok(code.includes('check_create_status'), 'узел check-create-status не найден');
});

test('H03', 'create-success-msg содержит текст об успешном создании', () => {
  ok(code.includes('Проект создан'), 'текст "Проект создан" не найден');
});

test('H04', 'create-error-msg содержит текст об ошибке создания', () => {
  ok(code.includes('Не удалось создать проект'), 'текст ошибки создания не найден');
});

test('H05', 'after-create-keyboard содержит кнопку возврата к списку', () => {
  ok(code.includes('К списку проектов'), 'кнопка "К списку проектов" не найдена');
});

// ══ Блок I: Переименование проекта ════════════════════════════════════════════
console.log('\n══ Блок I: Переименование проекта ════════════════════════════════════');

test('I01', 'rename-project-ask собирает ввод пользователя', () => {
  ok(code.includes('rename_project_ask'), 'узел rename-project-ask не найден');
});

test('I02', 'rename-project-action делает PATCH к /api/bot/projects/', () => {
  ok(code.includes('PATCH') || code.includes('patch'), 'метод PATCH не найден');
  ok(code.includes('/api/bot/projects/'), 'URL /api/bot/projects/ не найден для PATCH');
});

test('I03', 'check-rename-status condition узел присутствует в коде', () => {
  ok(code.includes('check_rename_status'), 'узел check-rename-status не найден');
});

test('I04', 'rename-success-msg содержит текст об успешном переименовании', () => {
  ok(code.includes('переименован'), 'текст "переименован" не найден');
});

test('I05', 'rename-error-msg содержит текст об ошибке переименования', () => {
  ok(code.includes('Не удалось переименовать'), 'текст ошибки переименования не найден');
});

// ══ Блок J: Удаление проекта ══════════════════════════════════════════════════
console.log('\n══ Блок J: Удаление проекта ══════════════════════════════════════════');

test('J01', 'delete-project-confirm содержит предупреждение о необратимости', () => {
  ok(code.includes('delete_project_confirm'), 'узел delete-project-confirm не найден');
  ok(code.includes('необратимо'), 'текст "необратимо" не найден');
});

test('J02', 'delete-confirm-keyboard содержит кнопки подтверждения и отмены', () => {
  ok(code.includes('Да, удалить'), 'кнопка "Да, удалить" не найдена');
  ok(code.includes('Отмена'), 'кнопка "Отмена" не найдена');
});

test('J03', 'delete-project-action делает DELETE к /api/bot/projects/', () => {
  ok(code.includes('DELETE') || code.includes('delete'), 'метод DELETE не найден');
});

test('J04', 'check-delete-status condition узел присутствует в коде', () => {
  ok(code.includes('check_delete_status'), 'узел check-delete-status не найден');
});

test('J05', 'delete-success-msg содержит текст об успешном удалении', () => {
  ok(code.includes('удалён') || code.includes('удален'), 'текст "удалён" не найден');
});

test('J06', 'delete-error-msg содержит текст об ошибке удаления', () => {
  ok(code.includes('Не удалось удалить'), 'текст ошибки удаления не найден');
});

// ══ Блок K: Читаемый статус бота ══════════════════════════════════════════════
console.log('\n══ Блок K: Читаемый статус бота ══════════════════════════════════════');

test('K01', 'check-bot-status condition узел присутствует в коде', () => {
  ok(code.includes('check_bot_status'), 'узел check-bot-status не найден');
});

test('K02', 'project-card-running содержит только название проекта (статус в кнопках токенов)', () => {
  // Эмодзи статуса убраны из текста карточки — теперь показываются в кнопках токенов через botStatus
  ok(code.includes('project_card_running'), 'узел project-card-running не найден');
  ok(code.includes('project_detail.name'), 'project_detail.name не найден в карточке');
});

test('K03', 'project-card-stopped содержит только название проекта (статус в кнопках токенов)', () => {
  ok(code.includes('project_card_stopped'), 'узел project-card-stopped не найден');
});

test('K04', 'project-card-unknown содержит только название проекта (статус в кнопках токенов)', () => {
  ok(code.includes('project_card_unknown'), 'узел project-card-unknown не найден');
});

test('K05', 'старый узел project-card-msg отсутствует (заменён тремя вариантами)', () => {
  // Проверяем что нет прямого отображения botStatus через code
  ok(!code.includes('project_card_msg'), 'старый узел project-card-msg всё ещё присутствует в коде');
});

test('K06', 'replace_variables_in_text вызывается для текста карточки проекта', () => {
  // Проверяем что в обработчиках карточек проекта вызывается replace_variables_in_text
  // Это гарантирует что {project_detail.name} будет подставлен при отправке
  ok(code.includes('replace_variables_in_text'), 'replace_variables_in_text не найден в коде');
  // Проверяем что init_all_user_vars вызывается перед replace_variables_in_text
  const initIdx = code.indexOf('init_all_user_vars');
  const replaceIdx = code.indexOf('replace_variables_in_text');
  ok(initIdx !== -1, 'init_all_user_vars не найден');
  ok(replaceIdx !== -1, 'replace_variables_in_text не найден');
  ok(initIdx < replaceIdx, 'init_all_user_vars должен вызываться ДО replace_variables_in_text');
});

// ══ Блок L: Токены проекта ════════════════════════════════════════════════════
console.log('\n══ Блок L: Токены проекта ════════════════════════════════════════════');

test('L01', 'fetch-tokens делает GET к /api/bot/projects/.../tokens', () => {
  ok(code.includes('/tokens'), 'URL /tokens не найден');
});

test('L02', 'check-tokens-status condition узел присутствует в коде', () => {
  ok(code.includes('check_tokens_status'), 'узел check-tokens-status не найден');
});

test('L03', 'check-tokens-empty использует dot-notation tokens.count', () => {
  ok(code.includes('check_tokens_empty'), 'узел check-tokens-empty не найден');
});

test('L04', 'project-actions-keyboard генерирует динамические кнопки из project_tokens', () => {
  ok(code.includes('project_actions_keyboard'), 'узел project-actions-keyboard не найден');
  ok(code.includes('project_tokens'), 'динамические кнопки токенов (project_tokens) не найдены');
});

test('L04b', 'старый tokens-msg отсутствует', () => {
  ok(!/\btokens_msg\b/.test(code), 'старый узел tokens-msg все еще присутствует в коде');
});

test('L05', 'no-tokens-msg содержит текст об отсутствии токенов', () => {
  ok(code.includes('нет токенов'), 'текст "нет токенов" не найден');
});

test('L06', 'tokens-error-msg содержит текст об ошибке загрузки токенов', () => {
  ok(code.includes('Не удалось загрузить токены'), 'текст ошибки загрузки токенов не найден');
});

test('L07', 'кнопка "➕ Добавить токен" присутствует в project-actions-keyboard', () => {
  ok(code.includes('Добавить токен'), 'кнопка "Добавить токен" не найдена');
});



// ══ Блок N: Создание проекта с токеном ═══════════════════════════════════════
console.log('\n══ Блок N: Создание проекта с токеном ═══════════════════════════════');
test('N01', 'ask-project-name собирает ввод в new_project_name', () => {
  ok(code.includes('ask_project_name'), 'узел ask-project-name не найден');
  ok(code.includes('new_project_name'), 'переменная new_project_name не найдена');
});

test('N02', 'ask-token-value собирает ввод в new_token_value', () => {
  ok(code.includes('ask_token_value'), 'узел ask-token-value не найден');
  ok(code.includes('new_token_value'), 'переменная new_token_value не найдена');
});

test('N03', 'create-project-with-token делает POST к /api/bot/projects', () => {
  ok(code.includes('create_project_with_token'), 'узел create-project-with-token не найден');
  ok(code.includes('/api/bot/projects'), 'URL /api/bot/projects не найден');
});

test('N04', 'create-token-for-project делает POST к /api/bot/projects/.../tokens', () => {
  ok(code.includes('create_token_for_project'), 'узел create-token-for-project не найден');
  ok(code.includes('/tokens'), 'URL /tokens не найден в create-token-for-project');
});

test('N05', 'load-new-project загружает детали нового проекта', () => {
  ok(code.includes('load_new_project'), 'узел load-new-project не найден');
  ok(code.includes('new_project'), 'переменная new_project не найдена');
});

test('N06', 'синтаксис Python OK для всего проекта (с новыми узлами)', () => {
  const r = checkSyntax(code, 'n06');
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
});

// ══ Блок O: Управление токенами ═══════════════════════════════════════════════
console.log('\n══ Блок O: Управление токенами ═══════════════════════════════════════');

test('O01', 'incoming-token-trigger присутствует в коде', () => {
  ok(code.includes('incoming_token_trigger'), 'узел incoming-token-trigger не найден в коде');
});

test('O02', 'token-card-msg присутствует в коде', () => {
  ok(code.includes('token_card_msg'), 'узел token-card-msg не найден в коде');
});

test('O02b', 'карточка токена разделяется по наличию username', () => {
  ok(code.includes('check_token_username'), 'узел check-token-username не найден');
  ok(code.includes('token_card_msg_with_username'), 'узел token-card-msg-with-username не найден');
});

test('O03', 'delete-token-action делает DELETE к /api/bot/tokens/', () => {
  ok(code.includes('delete_token_action'), 'узел delete-token-action не найден');
  ok(code.includes('/api/bot/tokens/'), 'URL /api/bot/tokens/ не найден в delete-token-action');
});

test('O04', 'check-delete-token-status присутствует в коде', () => {
  ok(code.includes('check_delete_token_status'), 'узел check-delete-token-status не найден');
});

test('O05', 'delete-token-success-msg содержит текст "Токен удалён"', () => {
  ok(code.includes('Токен удалён'), 'текст "Токен удалён" не найден в delete-token-success-msg');
});

test('O06', 'ask-new-token-value собирает ввод пользователя', () => {
  ok(code.includes('ask_new_token_value'), 'узел ask-new-token-value не найден');
  ok(code.includes('new_token_value'), 'переменная new_token_value не найдена в ask-new-token-value');
});

test('O07', 'add-token-to-project делает POST к /api/bot/projects/.../tokens', () => {
  ok(code.includes('add_token_to_project'), 'узел add-token-to-project не найден');
  ok(code.includes('/api/bot/projects/'), 'URL /api/bot/projects/ не найден в add-token-to-project');
});

test('O08', 'синтаксис Python OK (блок O)', () => {
  const r = checkSyntax(code, 'o08');
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
});

// ══ Блок Q: Расширенная карточка токена ═══════════════════════════════════════
console.log('\n══ Блок Q: Расширенная карточка токена ═══════════════════════════════');

test('Q01', 'fetch-token-status делает GET к /api/bot/tokens/.../status', () => {
  ok(code.includes('fetch_token_status'), 'узел fetch-token-status не найден');
  ok(code.includes('/api/bot/tokens/'), 'URL /api/bot/tokens/ не найден в fetch-token-status');
  ok(code.includes('/status'), 'путь /status не найден в fetch-token-status');
});

test('Q02', 'token-card-msg показывает бота, проект и читаемый статус', () => {
  ok(code.includes('token_card_msg'), 'узел token-card-msg не найден');
  ok(code.includes('token_status.instance.botName'), 'имя бота не найдено в token-card-msg');
  ok(code.includes('project_detail.name'), 'имя проекта не найдено в token-card-msg');
  ok(code.includes('token_status.instance.statusLabel'), 'читаемый статус бота не найден в token-card-msg');
  ok(!code.includes('🆔 Callback'), 'старый текст про callback всё ещё присутствует в карточке токена');
});

test('Q02b', 'token-card-msg-with-username показывает username, когда он доступен', () => {
  ok(code.includes('token_card_msg_with_username'), 'узел token-card-msg-with-username не найден');
  ok(code.includes('token_status.instance.botUsername'), 'username бота не найден в token-card-msg-with-username');
  ok(code.includes('https://t.me/'), 'ссылка на Telegram не найдена в token-card-msg-with-username');
});

test('Q03', 'token-actions-keyboard содержит кнопки Запустить и Остановить', () => {
  ok(code.includes('token_actions_keyboard'), 'узел token-actions-keyboard не найден');
  ok(code.includes('Запустить'), 'кнопка "Запустить" не найдена в token-actions-keyboard');
  ok(code.includes('Остановить'), 'кнопка "Остановить" не найдена в token-actions-keyboard');
});

test('Q04', 'token-actions-keyboard содержит кнопку Администраторы', () => {
  ok(code.includes('Администраторы'), 'кнопка "Администраторы" не найдена в token-actions-keyboard');
});

test('Q05', 'token-action-start делает POST к /api/projects/.../bot/start с tokenId', () => {
  ok(code.includes('token_action_start'), 'узел token-action-start не найден');
  ok(code.includes('/bot/start'), 'URL /bot/start не найден в token-action-start');
  ok(code.includes('tokenId'), 'поле tokenId не найдено в body token-action-start');
});

test('Q06', 'token-action-stop делает POST к /api/projects/.../bot/stop с tokenId', () => {
  ok(code.includes('token_action_stop'), 'узел token-action-stop не найден');
  ok(code.includes('/bot/stop'), 'URL /bot/stop не найден в token-action-stop');
  ok(code.includes('tokenId'), 'поле tokenId не найдено в body token-action-stop');
});

test('Q07', 'check-token-start-status и check-token-stop-status присутствуют в коде', () => {
  ok(code.includes('check_token_start_status'), 'узел check-token-start-status не найден');
  ok(code.includes('check_token_stop_status'), 'узел check-token-stop-status не найден');
});

test('Q08', 'token-action-result-msg и token-action-error-msg присутствуют в коде', () => {
  ok(code.includes('token_action_result_msg'), 'узел token-action-result-msg не найден');
  ok(code.includes('token_action_error_msg'), 'узел token-action-error-msg не найден');
});

test('Q09', 'token-result-keyboard содержит только кнопку "К проекту"', () => {
  ok(code.includes('token_result_keyboard'), 'узел token-result-keyboard не найден');
  ok(code.includes('К проекту'), 'кнопка "К проекту" не найдена в token-result-keyboard');
  ok(!code.includes('К токену'), 'кнопка "К токену" все еще присутствует в token-result-keyboard');
  ok(!code.includes('К токенам'), 'кнопка "К токенам" все еще присутствует в token-result-keyboard');
});

test('Q10', 'fetch-token-admins делает GET к /api/projects/.../admin-ids', () => {
  ok(code.includes('fetch_token_admins'), 'узел fetch-token-admins не найден');
  ok(code.includes('/admin-ids'), 'URL /admin-ids не найден в fetch-token-admins');
});

test('Q10b', 'token-admins-keyboard возвращает к проекту', () => {
  ok(code.includes('token_admins_keyboard'), 'узел token-admins-keyboard не найден');
  ok(code.includes('К проекту'), 'кнопка "К проекту" не найдена в token-admins-keyboard');
  ok(!code.includes('К токену'), 'кнопка "К токену" все еще присутствует в token-admins-keyboard');
});

test('Q11', 'token-admins-msg показывает список администраторов через admins_data', () => {
  ok(code.includes('token_admins_msg'), 'узел token-admins-msg не найден');
  ok(code.includes('admins_data'), 'переменная admins_data не найдена в token-admins-msg');
});

test('Q12', 'token-admins-keyboard содержит кнопку "Добавить"', () => {
  ok(code.includes('token_admins_keyboard'), 'узел token-admins-keyboard не найден');
  ok(code.includes('Добавить'), 'кнопка "Добавить" не найдена в token-admins-keyboard');
});

test('Q13', 'ask-admin-id-input собирает ввод в переменную new_admin_id', () => {
  ok(code.includes('ask_admin_id_input'), 'узел ask-admin-id-input не найден');
  ok(code.includes('new_admin_id'), 'переменная new_admin_id не найдена');
});

test('Q14', 'add-admin-action делает PUT к /api/projects/.../admin-ids', () => {
  ok(code.includes('add_admin_action'), 'узел add-admin-action не найден');
  ok(code.includes('/admin-ids'), 'URL /admin-ids не найден в add-admin-action');
  ok(code.includes('PUT') || code.includes('put'), 'метод PUT не найден в add-admin-action');
});

test('Q15', 'add-admin-success-msg и add-admin-error-msg присутствуют в коде', () => {
  ok(code.includes('add_admin_success_msg'), 'узел add-admin-success-msg не найден');
  ok(code.includes('add_admin_error_msg'), 'узел add-admin-error-msg не найден');
});

test('Q16', 'синтаксис Python OK для всего расширенного сценария (блок Q)', () => {
  const r = checkSyntax(code, 'q16');
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
});

// ══ Блок R: Dot-notation глубже одного уровня ══════════════════════════════
console.log('\n══ Блок R: Dot-notation глубже одного уровня ══════════════════════');

test('R01', 'init_all_user_vars содержит рекурсивную функцию _flatten_dict', () => {
  ok(code.includes('_flatten_dict'), 'рекурсивная функция _flatten_dict не найдена — двухуровневые переменные не будут подставляться');
  ok(code.includes('_max_depth'), 'параметр _max_depth не найден — нет защиты от глубокой рекурсии');
});

test('R02', 'token_status.instance.statusLabel подставляется через одноуровневый ключ', () => {
  ok(code.includes('token_status'), 'переменная token_status не найдена в коде');
  ok(code.includes('statusLabel'), 'читаемая метка статуса не найдена в коде');
});

test('R03', 'синтаксис Python OK после добавления рекурсивного разворачивания', () => {
  const r = checkSyntax(code, 'r03');
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
});

// ══ Итог ══════════════════════════════════════════════════════════════════════
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
const summary = `  Итог: ${passed}/${total} пройдено  |  Провалено: ${failed}`;
console.log(`║${summary}${' '.repeat(Math.max(0, 62 - summary.length))}║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\nПровалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     ${r.note}`);
  });
  process.exit(1);
}
