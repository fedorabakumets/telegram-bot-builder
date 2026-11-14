/** @fileoverview Обезличенные фоновые роли для локального сравнения общего runtime. */
import { generatePythonCode } from '../lib/bot-generator';

/** Создаёт четыре независимых полных сценария по известным агрегатам, без копии production-данных.
 * @param projectId - ID исключительно локального тестового проекта.
 * @returns Исходники ролей; номера обозначают форму сценария, а не настоящие токены.
 */
export function generateBackgroundSources(projectId: number): Record<string, string> {
  const sources: Record<string, string> = {};
  for (const role of ['47', '26', '5', '11']) {
    /** Общий ответ нужен для проверки обычного Dispatcher и переменных таблиц. */
    const nodes = [
      { id: 'start', type: 'command_trigger', position: { x: 0, y: 0 },
        data: { command: '/start', description: 'Фоновая проверка', messageText: '',
          buttons: [], keyboardType: 'none', showInMenu: false, autoTransitionTo: 'reply' } },
      { id: 'reply', type: 'message', position: { x: 200, y: 0 },
        data: { messageText: role === '11' ? 'Проверка {fixture_nested.value}' : 'Проверка',
          buttons: [], keyboardType: 'none' } },
    ];
    if (role === '26') {
      // Одно расписание без отправок: запись переменной воспроизводит локальное выполнение цепочки.
      nodes.push({ id: 'scheduled', type: 'schedule_trigger', position: { x: 0, y: 200 },
        data: { autoTransitionTo: 'scheduled-value', rules: [{ mode: 'interval', intervalMinutes: 1 }],
          timezone: 'UTC', runOnStart: false, enabled: true, maxConcurrent: 1 } } as never);
      nodes.push({ id: 'scheduled-value', type: 'set_variable', position: { x: 200, y: 200 },
        data: { assignments: [{ id: 'fixture-tick', variable: 'fixture_tick', value: '1', mode: 'text' }], buttons: [] } } as never);
    }
    sources[role] = generatePythonCode({ nodes, connections: [] } as never, {
      botName: `Обезличенная фоновая роль ${role}`, userDatabaseEnabled: true,
      projectId, contentCache: role === '11', botRuntimeRole: true,
    });
  }
  return sources;
}
