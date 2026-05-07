/**
 * @fileoverview Фаза 24 — Фабрики узлов для тестов set_variable
 * @module tests/test-phase24-set-variable-factories
 *
 * Содержит фабрики: makeSetVariableNode, makeMessageNode,
 * makeCommandTriggerNode, makeConditionNode.
 */

/** Опции для фабрики узла set_variable. */
type SetVarOptions = {
  /** Список присваиваний переменных. */
  assignments?: Array<{ id: string; variable: string; value: string; mode?: 'text' | 'expression' }>;
  /** ID узла для автоперехода. */
  autoTransitionTo?: string;
  /** Включить автопереход. */
  enableAutoTransition?: boolean;
};

/**
 * Создаёт узел set_variable с разумными значениями по умолчанию.
 * @param id - Идентификатор узла
 * @param options - Параметры узла
 * @returns Объект узла
 */
export function makeSetVariableNode(id: string, options: SetVarOptions = {}) {
  return {
    id,
    type: 'set_variable',
    position: { x: 200, y: 0 },
    data: {
      assignments: options.assignments ?? [
        { id: 'a1', variable: 'greeting', value: 'Привет, {first_name}!', mode: 'text' },
      ],
      autoTransitionTo: options.autoTransitionTo ?? '',
      enableAutoTransition: options.enableAutoTransition ?? false,
    },
  };
}

/**
 * Создаёт узел message с разумными значениями по умолчанию.
 * @param id - Идентификатор узла
 * @param text - Текст сообщения
 * @returns Объект узла
 */
export function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 200 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      enableAutoTransition: false,
      autoTransitionTo: '',
      formatMode: 'none',
      markdown: false,
    },
  };
}

/**
 * Создаёт узел command_trigger с переходом к целевому узлу.
 * @param id - Идентификатор узла
 * @param command - Команда бота
 * @param targetId - Целевой узел
 * @returns Объект узла
 */
export function makeCommandTriggerNode(id: string, command: string, targetId: string) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command,
      description: 'Команда',
      showInMenu: true,
      adminOnly: false,
      requiresAuth: false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт узел condition с набором веток.
 * @param id - Идентификатор узла
 * @param variable - Переменная для проверки
 * @param branches - Ветки условия
 * @returns Объект узла
 */
export function makeConditionNode(id: string, variable: string, branches: any[]) {
  return {
    id,
    type: 'condition',
    position: { x: 200, y: 0 },
    data: { variable, branches },
  };
}
