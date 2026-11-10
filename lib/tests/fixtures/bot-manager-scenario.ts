/**
 * @fileoverview Синтетический проект управляющего бота для фаз 33 и 34.
 */

/** Служебные значения узлов тестового проекта. */
type NodeData = Record<string, unknown>;

/**
 * Создаёт узел сценария.
 * @param id - Имя узла
 * @param type - Тип узла
 * @param data - Параметры узла
 * @returns Узел генератора
 */
function node(id: string, type: string, data: NodeData = {}) {
  return { id, type, position: { x: 0, y: 0 }, data: {
    buttons: [], keyboardType: 'none', messageText: id,
    ...data,
  } };
}

/**
 * Создаёт HTTP-запрос к тестовому API.
 * @param id - Имя узла
 * @param path - Путь API
 * @param method - Метод HTTP
 * @param responseVariable - Переменная ответа
 * @param target - Следующий узел
 * @returns Узел HTTP-запроса
 */
function request(id: string, path: string, method = 'GET', responseVariable = id.replace(/-/g, '_'), target = '') {
  return node(id, 'http_request', {
    httpRequestUrl: `https://studio.example.test${path}`,
    httpRequestMethod: method, httpRequestResponseVariable: responseVariable,
    httpRequestStatusVariable: `${responseVariable}_status`,
    httpRequestHeaders: '', httpRequestBody: '', httpRequestTimeout: 30,
    autoTransitionTo: target,
  });
}

/**
 * Создаёт условие с успешной и запасной ветками.
 * @param id - Имя узла
 * @param variable - Проверяемая переменная
 * @param success - Узел успешной ветки
 * @param fallback - Узел запасной ветки
 * @returns Узел условия
 */
function condition(id: string, variable: string, success: string, fallback: string) {
  return node(id, 'condition', { variable, branches: [
    { id: `${id}-ok`, operator: 'equals', value: '200', target: success },
    { id: `${id}-else`, operator: 'else', value: '', target: fallback },
  ] });
}

/**
 * Создаёт клавиатуру с указанными кнопками.
 * @param id - Имя узла
 * @param buttons - Подписи и цели кнопок
 * @returns Узел клавиатуры
 */
function keyboard(id: string, buttons: Array<[string, string]>) {
  return node(id, 'keyboard', { keyboardType: 'inline', buttons: buttons.map(([text, target], index) => ({
    id: `${id}-button-${index}`, text, targetNodeId: target, action: 'goto',
  })) });
}

/**
 * Создаёт независимый сценарий с основными маршрутами управления проектами и токенами.
 * @returns Проект для фазовых тестов
 */
export function makeBotManagerScenario() {
  const nodes = [
    node('trigger-start', 'command_trigger', { command: '/start', description: 'Показать проекты', showInMenu: true, autoTransitionTo: 'fetch-projects' }),
    request('fetch-projects', '/api/bot/projects?telegram_id={user_id}', 'GET', 'projects', 'check-projects-status'),
    condition('check-projects-status', 'projects_status', 'check-projects-empty', 'projects-error-msg'),
    condition('check-projects-empty', 'projects.count', 'projects-msg', 'no-projects-msg'),
    node('projects-msg', 'message', { messageText: 'Ваши проекты', keyboardNodeId: 'projects-actions-keyboard' }),
    node('projects-error-msg', 'message', { messageText: 'Не удалось загрузить проекты' }),
    node('no-projects-msg', 'message', { messageText: 'У вас пока нет проектов' }),
    node('projects-actions-keyboard', 'keyboard', { keyboardType: 'inline', buttons: [
      { id: 'new-project', text: '➕ Новый проект', targetNodeId: 'ask-project-name-msg', action: 'goto' },
    ], enableDynamicButtons: true, dynamicButtons: { sourceVariable: 'projects', arrayPath: 'items',
      textTemplate: '📁 {name}', callbackTemplate: 'project_{id}', columns: 1 } }),
    node('incoming-callback-trigger', 'incoming_callback_trigger', { callbackPattern: 'project_', callbackMatchType: 'startsWith', autoTransitionTo: 'fetch-project-detail' }),
    request('fetch-project-detail', '/api/bot/projects/{callback_data}?telegram_id={user_id}', 'GET', 'project_detail', 'fetch-project-tokens'),
    request('fetch-project-tokens', '/api/bot/projects/{project_detail.id}/tokens', 'GET', 'project_tokens', 'check-bot-status'),
    condition('check-bot-status', 'project_detail.status', 'project-card-running', 'project-card-stopped'),
    node('project-card-running', 'message', { messageText: 'Проект {project_detail.name}', keyboardNodeId: 'project-actions-keyboard' }),
    node('project-card-stopped', 'message', { messageText: 'Проект {project_detail.name}', keyboardNodeId: 'project-actions-keyboard' }),
    node('project-card-unknown', 'message', { messageText: 'Проект {project_detail.name}', keyboardNodeId: 'project-actions-keyboard' }),
    node('project-actions-keyboard', 'keyboard', { keyboardType: 'inline', buttons: [
      { id: 'back', text: 'К списку', targetNodeId: 'fetch-projects', action: 'goto' },
      { id: 'rename', text: 'Переименовать', targetNodeId: 'rename-project-ask', action: 'goto' },
      { id: 'delete', text: 'Удалить', targetNodeId: 'delete-project-confirm', action: 'goto' },
      { id: 'token', text: 'Добавить токен', targetNodeId: 'ask-new-token-value-msg', action: 'goto' },
    ], enableDynamicButtons: true, dynamicButtons: { sourceVariable: 'project_tokens', arrayPath: 'items',
      textTemplate: '{name}', callbackTemplate: 'token_{id}', columns: 1 } }),
    request('reload-project', '/api/bot/projects/{project_detail.id}', 'GET', 'project_detail', 'fetch-project-tokens'),
    request('action-start', '/api/projects/{project_detail.id}/bot/start', 'POST', 'start_result', 'check-start-status'),
    request('action-stop', '/api/projects/{project_detail.id}/bot/stop', 'POST', 'stop_result', 'check-stop-status'),
    request('action-restart', '/api/projects/{project_detail.id}/bot/restart', 'POST', 'restart_result', 'check-restart-status'),
    condition('check-start-status', 'start_result_status', 'action-result-msg', 'action-error-msg'),
    condition('check-stop-status', 'stop_result_status', 'action-result-msg', 'action-error-msg'),
    condition('check-restart-status', 'restart_result_status', 'action-result-msg', 'action-error-msg'),
    node('action-result-msg', 'message', { messageText: 'Действие выполнено', keyboardNodeId: 'result-keyboard' }),
    node('action-error-msg', 'message', { messageText: 'Ошибка выполнения действия', keyboardNodeId: 'result-keyboard' }),
    keyboard('result-keyboard', [['К проекту', 'reload-project'], ['К списку', 'fetch-projects']]),
    keyboard('create-project-keyboard', [['Создать проект', 'create-project-action']]),
    request('create-project-action', '/api/bot/projects', 'POST', 'created_project', 'check-create-status'),
    condition('check-create-status', 'created_project_status', 'create-success-msg', 'create-error-msg'),
    node('create-success-msg', 'message', { messageText: 'Проект создан', keyboardNodeId: 'after-create-keyboard' }),
    node('create-error-msg', 'message', { messageText: 'Не удалось создать проект' }),
    keyboard('after-create-keyboard', [['К списку проектов', 'fetch-projects']]),
    node('rename-project-ask', 'message', { messageText: 'Введите новое название', autoTransitionTo: 'rename-project-input' }),
    node('rename-project-input', 'input', { inputVariable: 'renamed_project_name', autoTransitionTo: 'rename-project-action' }),
    request('rename-project-action', '/api/bot/projects/{project_detail.id}', 'PATCH', 'renamed_project', 'check-rename-status'),
    condition('check-rename-status', 'renamed_project_status', 'rename-success-msg', 'rename-error-msg'),
    node('rename-success-msg', 'message', { messageText: 'Проект переименован' }),
    node('rename-error-msg', 'message', { messageText: 'Не удалось переименовать проект' }),
    node('delete-project-confirm', 'message', { messageText: 'Удаление необратимо. Подтвердите действие', keyboardNodeId: 'delete-confirm-keyboard' }),
    keyboard('delete-confirm-keyboard', [['Да, удалить', 'delete-project-action'], ['Отмена', 'reload-project']]),
    request('delete-project-action', '/api/bot/projects/{project_detail.id}', 'DELETE', 'deleted_project', 'check-delete-status'),
    condition('check-delete-status', 'deleted_project_status', 'delete-success-msg', 'delete-error-msg'),
    node('delete-success-msg', 'message', { messageText: 'Проект удалён' }),
    node('delete-error-msg', 'message', { messageText: 'Не удалось удалить проект' }),
    request('fetch-tokens', '/api/bot/projects/{project_detail.id}/tokens', 'GET', 'tokens', 'check-tokens-status'),
    condition('check-tokens-status', 'tokens_status', 'check-tokens-empty', 'tokens-error-msg'),
    condition('check-tokens-empty', 'tokens.count', 'project-actions-keyboard', 'no-tokens-msg'),
    node('no-tokens-msg', 'message', { messageText: 'У проекта нет токенов' }),
    node('tokens-error-msg', 'message', { messageText: 'Не удалось загрузить токены' }),
    node('incoming-token-trigger', 'incoming_callback_trigger', { callbackPattern: 'token_', callbackMatchType: 'startsWith', autoTransitionTo: 'fetch-token-status' }),
    condition('check-token-username', 'token.username', 'token-card-msg-with-username', 'token-card-msg'),
    node('token-card-msg', 'message', { messageText: 'Бот {token_status.instance.botName} — {project_detail.name}: {token_status.instance.statusLabel}', keyboardNodeId: 'token-actions-keyboard' }),
    node('token-card-msg-with-username', 'message', { messageText: 'Бот @{token_status.instance.botUsername} https://t.me/{token_status.instance.botUsername}', keyboardNodeId: 'token-actions-keyboard' }),
    keyboard('token-actions-keyboard', [['Запустить', 'token-action-start'], ['Остановить', 'token-action-stop'], ['Администраторы', 'fetch-token-admins']]),
    node('delete-token-confirm', 'message', { messageText: 'Удалить токен?', keyboardNodeId: 'delete-token-confirm-keyboard' }),
    keyboard('delete-token-confirm-keyboard', [['Удалить', 'delete-token-action'], ['Отмена', 'token-card-msg']]),
    request('delete-token-action', '/api/bot/tokens/{callback_data}', 'DELETE', 'deleted_token', 'check-delete-token-status'),
    condition('check-delete-token-status', 'deleted_token_status', 'delete-token-success-msg', 'delete-token-error-msg'),
    node('delete-token-success-msg', 'message', { messageText: 'Токен удалён' }),
    node('delete-token-error-msg', 'message', { messageText: 'Ошибка удаления токена' }),
    node('ask-new-token-value-msg', 'message', { messageText: 'Введите токен', autoTransitionTo: 'ask-new-token-value' }),
    node('ask-new-token-value', 'input', { inputVariable: 'new_token_value', autoTransitionTo: 'add-token-to-project' }),
    request('add-token-to-project', '/api/bot/projects/{project_detail.id}/tokens', 'POST', 'added_token', 'check-add-token-status'),
    condition('check-add-token-status', 'added_token_status', 'add-token-success-msg', 'add-token-error-msg'),
    node('add-token-success-msg', 'message', { messageText: 'Токен добавлен' }),
    node('add-token-error-msg', 'message', { messageText: 'Ошибка добавления токена' }),
    request('fetch-bot-photo', '/api/bot/getChat?token={bot_token}', 'GET', 'bot_chat_info', 'check-bot-photo'),
    condition('check-bot-photo', 'bot_photo_status', 'check-photo-exists', 'token-card-msg'),
    condition('check-photo-exists', 'bot_chat_info.result.photo.big_file_id', 'fetch-photo-file', 'token-card-msg'),
    request('fetch-photo-file', '/api/bot/getFile?file_id={bot_photos[0][0].file_id}', 'GET', 'bot_photo_file_info', 'token-card-with-photo'),
    node('token-card-with-photo', 'message', { messageText: 'Фото {bot_photo_file_info.result.file_path}', keyboardNodeId: 'token-actions-keyboard' }),
    node('ask-project-name-msg', 'message', { messageText: 'Введите название', autoTransitionTo: 'ask-project-name' }),
    node('ask-project-name', 'input', { inputVariable: 'new_project_name', autoTransitionTo: 'ask-token-value-msg' }),
    node('ask-token-value-msg', 'message', { messageText: 'Введите токен', autoTransitionTo: 'ask-token-value' }),
    node('ask-token-value', 'input', { inputVariable: 'new_token_value', autoTransitionTo: 'create-project-with-token' }),
    request('create-project-with-token', '/api/bot/projects', 'POST', 'new_project', 'check-new-project-status'),
    condition('check-new-project-status', 'new_project_status', 'create-token-for-project', 'new-project-error-msg'),
    request('create-token-for-project', '/api/bot/projects/{new_project.id}/tokens', 'POST', 'new_token', 'check-new-token-status'),
    condition('check-new-token-status', 'new_token_status', 'load-new-project', 'new-token-error-msg'),
    request('load-new-project', '/api/bot/projects/{new_project.id}', 'GET', 'project_detail', 'project-card-running'),
    node('new-project-error-msg', 'message', { messageText: 'Ошибка создания проекта' }),
    node('new-token-error-msg', 'message', { messageText: 'Ошибка создания токена' }),
    request('fetch-token-status', '/api/bot/tokens/{callback_data}/status', 'GET', 'token_status', 'check-token-username'),
    request('token-action-start', '/api/projects/{project_detail.id}/bot/start?tokenId={callback_data}', 'POST', 'token_start', 'check-token-start-status'),
    request('token-action-stop', '/api/projects/{project_detail.id}/bot/stop?tokenId={callback_data}', 'POST', 'token_stop', 'check-token-stop-status'),
    condition('check-token-start-status', 'token_start_status', 'token-action-result-msg', 'token-action-error-msg'),
    condition('check-token-stop-status', 'token_stop_status', 'token-action-result-msg', 'token-action-error-msg'),
    node('token-action-result-msg', 'message', { messageText: 'Готово', keyboardNodeId: 'token-result-keyboard' }),
    node('token-action-error-msg', 'message', { messageText: 'Ошибка', keyboardNodeId: 'token-result-keyboard' }),
    keyboard('token-result-keyboard', [['К проекту', 'reload-project']]),
    request('fetch-token-admins', '/api/projects/{project_detail.id}/admin-ids', 'GET', 'admins_data', 'token-admins-msg'),
    node('token-admins-msg', 'message', { messageText: 'Администраторы: {admins_data}', keyboardNodeId: 'token-admins-keyboard' }),
    keyboard('token-admins-keyboard', [['Добавить', 'ask-admin-id-input'], ['К проекту', 'reload-project']]),
    node('ask-admin-id-input', 'input', { inputVariable: 'new_admin_id', autoTransitionTo: 'add-admin-action' }),
    request('add-admin-action', '/api/projects/{project_detail.id}/admin-ids', 'PUT', 'added_admin', 'add-admin-success-msg'),
    node('add-admin-success-msg', 'message', { messageText: 'Администратор добавлен' }),
    node('add-admin-error-msg', 'message', { messageText: 'Ошибка добавления администратора' }),
  ];
  return { sheets: [{ id: 'manager-sheet', name: 'Управление', nodes }], version: 2, activeSheetId: 'manager-sheet' };
}
