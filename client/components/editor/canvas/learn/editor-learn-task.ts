/**
 * @fileoverview Проверка, что пользователь выполнил действие шага
 * @module components/editor/canvas/learn/editor-learn-task
 */

/** Узел холста, нужный для проверки шага */
export interface LearnNode {
  /** Идентификатор */
  id: string;
  /** Тип блока */
  type: string;
  /** Данные блока */
  data?: Record<string, unknown> | null;
}

/** Снимок холста на входе в шаг */
export interface LearnSnapshot {
  /** Идентификаторы триггеров команды */
  commands: Set<string>;
  /** Идентификаторы сообщений */
  messages: Set<string>;
  /** Связи «команда → цель» */
  links: Set<string>;
  /** Текст сообщений на входе в шаг */
  texts: Map<string, string>;
  /** Текст команд на входе в шаг */
  commandTexts: Map<string, string>;
}

/** Какое действие ждёт шаг */
export type EditorLearnTask =
  | 'none'
  | 'add-command'
  | 'add-message'
  | 'connect'
  | 'edit-message'
  | 'edit-command'
  | 'click';

/**
 * Снимает холст, чтобы засчитать только новые действия
 * @param nodes - Узлы текущего листа
 * @returns Снимок
 */
export function snapshotLearnNodes(nodes: LearnNode[]): LearnSnapshot {
  const list = Array.isArray(nodes) ? nodes : [];
  const commands = new Set<string>();
  const messages = new Set<string>();
  const links = new Set<string>();
  const texts = new Map<string, string>();
  const commandTexts = new Map<string, string>();

  for (const node of list) {
    if (node.type === 'command_trigger') {
      commands.add(node.id);
      commandTexts.set(node.id, readCommand(node));
      const to = readTarget(node);
      if (to) links.add(`${node.id}->${to}`);
    }
    if (node.type === 'message') {
      messages.add(node.id);
      texts.set(node.id, readText(node));
    }
  }

  return { commands, messages, links, texts, commandTexts };
}

/**
 * Выполнено ли действие шага относительно снимка на входе
 * @param task - Ожидаемое действие
 * @param nodes - Узлы сейчас
 * @param baseline - Снимок на входе в шаг
 * @returns true если можно нажать «Далее»
 */
export function isEditorTaskDone(task: EditorLearnTask, nodes: LearnNode[], baseline: LearnSnapshot): boolean {
  const list = Array.isArray(nodes) ? nodes : [];
  if (task === 'none') return true;
  if (task === 'click') return false;
  if (task === 'add-command') return list.some((n) => n.type === 'command_trigger' && !baseline.commands.has(n.id));
  if (task === 'add-message') return list.some((n) => n.type === 'message' && !baseline.messages.has(n.id));
  if (task === 'connect') return list.some((n) => isNewCommandLink(n, list, baseline));
  if (task === 'edit-message') return list.some((n) => isEditedMessage(n, baseline));
  return list.some((n) => isEditedCommand(n, baseline));
}

/**
 * Новая стрелка от триггера команды к сообщению
 * @param node - Узел
 * @param nodes - Все узлы
 * @param baseline - Снимок
 * @returns true если связь появилась на этом шаге
 */
function isNewCommandLink(node: LearnNode, nodes: LearnNode[], baseline: LearnSnapshot): boolean {
  if (node.type !== 'command_trigger') return false;
  const to = readTarget(node);
  if (!to || baseline.links.has(`${node.id}->${to}`)) return false;
  return nodes.some((n) => n.id === to && n.type === 'message');
}

/**
 * Текст сообщения изменён относительно снимка
 * @param node - Узел
 * @param baseline - Снимок
 * @returns true если написан свой текст
 */
function isEditedMessage(node: LearnNode, baseline: LearnSnapshot): boolean {
  if (node.type !== 'message') return false;
  const text = readText(node);
  if (!text || text === 'Новое сообщение') return false;
  return text !== (baseline.texts.get(node.id) ?? '');
}

/**
 * Команда в триггере изменена относительно снимка
 * @param node - Узел
 * @param baseline - Снимок
 * @returns true если команда другая
 */
function isEditedCommand(node: LearnNode, baseline: LearnSnapshot): boolean {
  if (node.type !== 'command_trigger') return false;
  const command = readCommand(node);
  if (!command.startsWith('/')) return false;
  return command !== (baseline.commandTexts.get(node.id) ?? '');
}

/**
 * Текст команды
 * @param node - Узел
 * @returns Строка команды
 */
function readCommand(node: LearnNode): string {
  return String(node.data?.command ?? '').trim();
}

/**
 * Текст сообщения
 * @param node - Узел
 * @returns Строка сообщения
 */
function readText(node: LearnNode): string {
  return String(node.data?.messageText ?? '').trim();
}

/**
 * Куда ведёт триггер
 * @param node - Узел
 * @returns Идентификатор цели или пустая строка
 */
function readTarget(node: LearnNode): string {
  return String(node.data?.autoTransitionTo ?? '').trim();
}
