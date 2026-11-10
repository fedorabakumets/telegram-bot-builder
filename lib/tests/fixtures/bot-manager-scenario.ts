/**
 * @fileoverview Синтетический сценарий управления проектами для фазовых тестов.
 */

/**
 * Создаёт проект с командой, запросом списка и переходом по callback.
 * @returns Независимый от локальных пользовательских проектов сценарий
 */
export function makeBotManagerScenario() {
  const nodes = [
    {
      id: 'manager-start', type: 'command_trigger', position: { x: 0, y: 0 },
      data: {
        command: '/start', description: 'Показать проекты', showInMenu: true,
        autoTransitionTo: 'fetch-projects', buttons: [], keyboardType: 'none',
      },
    },
    {
      id: 'fetch-projects', type: 'http_request', position: { x: 200, y: 0 },
      data: {
        httpRequestUrl: 'https://studio.example.test/api/bot/projects?telegram_id={user_id}',
        httpRequestMethod: 'GET', httpRequestResponseVariable: 'projects',
        httpRequestStatusVariable: 'projects_status', httpRequestTimeout: 30,
        httpRequestHeaders: '', httpRequestBody: '', autoTransitionTo: 'projects-message',
      },
    },
    {
      id: 'projects-message', type: 'message', position: { x: 400, y: 0 },
      data: {
        messageText: 'Выберите проект', keyboardType: 'inline', formatMode: 'none',
        markdown: false, buttons: [{ id: 'open-project', text: 'Открыть проект',
          type: 'callback', callbackData: 'project_1' }],
      },
    },
    {
      id: 'manager-callback', type: 'incoming_callback_trigger', position: { x: 0, y: 200 },
      data: { autoTransitionTo: 'fetch-project-detail', buttons: [], keyboardType: 'none' },
    },
    {
      id: 'fetch-project-detail', type: 'http_request', position: { x: 200, y: 200 },
      data: {
        httpRequestUrl: 'https://studio.example.test/api/bot/projects/{callback_data}',
        httpRequestMethod: 'GET', httpRequestResponseVariable: 'project_detail',
        httpRequestStatusVariable: 'detail_status', httpRequestTimeout: 30,
        httpRequestHeaders: '', httpRequestBody: '', autoTransitionTo: 'detail-message',
      },
    },
    {
      id: 'detail-message', type: 'message', position: { x: 400, y: 200 },
      data: { messageText: 'Проект: {project_detail.name}', buttons: [],
        keyboardType: 'none', formatMode: 'none', markdown: false },
    },
  ];
  return { sheets: [{ id: 'manager-sheet', name: 'Управление', nodes }],
    version: 2, activeSheetId: 'manager-sheet' };
}
