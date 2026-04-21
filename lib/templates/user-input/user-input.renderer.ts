/**
 * @fileoverview Renderer для шаблона сбора пользовательского ввода
 * @module templates/user-input/user-input.renderer
 */

import type { Node } from '@shared/schema';
import type { UserInputTemplateParams } from './user-input.params';
import { userInputParamsSchema } from './user-input.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Нормализует источник ввода до поддерживаемого перечисления.
 * @param value - Исходное значение
 * @returns Нормализованный источник ввода
 */
function normalizeInputSource(value: unknown): UserInputTemplateParams['inputSource'] {
  switch (value) {
    case 'any':
    case 'text':
    case 'photo':
    case 'video':
    case 'audio':
    case 'document':
    case 'location':
    case 'contact':
      return value;
    default:
      return 'text';
  }
}

/**
 * Выбирает переменную для специализированного типа ввода.
 * @param isDedicatedInputNode - Является ли узел отдельным input-узлом
 * @param inputSource - Источник ввода
 * @param expectedSource - Ожидаемый тип ввода
 * @param explicitVariable - Явно указанная переменная
 * @param fallbackVariable - Резервное имя переменной
 * @returns Итоговое имя переменной
 */
function resolveDedicatedVariable(
  isDedicatedInputNode: boolean,
  inputSource: UserInputTemplateParams['inputSource'] | undefined,
  expectedSource: Exclude<UserInputTemplateParams['inputSource'], 'any' | 'text'>,
  explicitVariable: string | undefined,
  fallbackVariable: string,
): string {
  if (explicitVariable) return explicitVariable;
  if (isDedicatedInputNode && inputSource === expectedSource) return fallbackVariable;
  return '';
}

/**
 * Вычисляет список принимаемых режимов ввода.
 * @param params - Параметры шаблона
 * @returns Поддерживаемые режимы ввода
 */
function buildModes(params: UserInputTemplateParams): string[] {
  if (params.inputSource) {
    switch (params.inputSource) {
      case 'any':
        return ['text', 'photo', 'video', 'audio', 'document', 'location', 'contact'];
      case 'text':
        return ['text'];
      case 'photo':
        return ['photo'];
      case 'video':
        return ['video'];
      case 'audio':
        return ['audio'];
      case 'document':
        return ['document'];
      case 'location':
        return ['location'];
      case 'contact':
        return ['contact'];
      default:
        break;
    }
  }

  if (params.inputType === 'button') {
    return params.enableTextInput ? ['button', 'text'] : ['button'];
  }

  const modes: string[] = [];
  if (params.enableTextInput !== false) modes.push('text');
  if (params.enablePhotoInput) modes.push('photo');
  if (params.enableVideoInput) modes.push('video');
  if (params.enableAudioInput) modes.push('audio');
  if (params.enableDocumentInput) modes.push('document');
  if (params.enableLocationInput) modes.push('location');
  if (params.enableContactInput) modes.push('contact');
  return modes.length > 0 ? modes : ['text'];
}

/**
 * Генерирует Python-код блока waiting_for_input из параметров.
 * @param params - Параметры шаблона
 * @param indentLevel - Отступ для каждой строки
 * @returns Сгенерированный блок Python-кода
 */
export function generateUserInput(
  params: UserInputTemplateParams,
  indentLevel: string = '    ',
): string {
  const validated = userInputParamsSchema.parse(params);
  const modes = buildModes(validated as UserInputTemplateParams);
  const raw = renderPartialTemplate('user-input/user-input.py.jinja2', { ...validated, modes });

  if (indentLevel === '    ') return raw;

  return raw
    .split('\n')
    .map(line => line.startsWith('    ') ? indentLevel + line.slice(4) : line)
    .join('\n');
}

/**
 * Собирает UserInputTemplateParams из узла графа.
 * @param node - Узел графа
 * @returns Параметры шаблона user-input
 */
export function nodeToUserInputParams(node: Node): UserInputTemplateParams {
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const isDedicatedInputNode = node.type === 'input';
  const nodeData = node.data as Record<string, any>;
  const inputSource = isDedicatedInputNode
    ? normalizeInputSource(nodeData.inputType || 'any')
    : undefined;
  const acceptsAny = inputSource === 'any';
  const inputVariable = nodeData.inputVariable || 'input';

  return {
    nodeId: node.id,
    safeName,
    inputVariable,
    appendVariable: nodeData.appendVariable ?? false,
    inputTargetNodeId: nodeData.inputTargetNodeId || (isDedicatedInputNode ? (nodeData.autoTransitionTo || '') : ''),
    inputSource,
    enableTextInput: isDedicatedInputNode ? (acceptsAny || inputSource === 'text') : (nodeData.enableTextInput ?? true),
    enablePhotoInput: isDedicatedInputNode ? (acceptsAny || inputSource === 'photo') : (nodeData.enablePhotoInput ?? false),
    photoInputVariable: resolveDedicatedVariable(isDedicatedInputNode, inputSource, 'photo', nodeData.photoInputVariable, inputVariable),
    enableVideoInput: isDedicatedInputNode ? (acceptsAny || inputSource === 'video') : (nodeData.enableVideoInput ?? false),
    videoInputVariable: resolveDedicatedVariable(isDedicatedInputNode, inputSource, 'video', nodeData.videoInputVariable, inputVariable),
    enableAudioInput: isDedicatedInputNode ? (acceptsAny || inputSource === 'audio') : (nodeData.enableAudioInput ?? false),
    audioInputVariable: resolveDedicatedVariable(isDedicatedInputNode, inputSource, 'audio', nodeData.audioInputVariable, inputVariable),
    enableDocumentInput: isDedicatedInputNode ? (acceptsAny || inputSource === 'document') : (nodeData.enableDocumentInput ?? false),
    documentInputVariable: resolveDedicatedVariable(isDedicatedInputNode, inputSource, 'document', nodeData.documentInputVariable, inputVariable),
    enableLocationInput: isDedicatedInputNode ? (acceptsAny || inputSource === 'location') : Boolean(nodeData.enableLocationInput),
    locationInputVariable: resolveDedicatedVariable(isDedicatedInputNode, inputSource, 'location', nodeData.locationInputVariable, inputVariable),
    enableContactInput: isDedicatedInputNode ? (acceptsAny || inputSource === 'contact') : Boolean(nodeData.enableContactInput),
    contactInputVariable: resolveDedicatedVariable(isDedicatedInputNode, inputSource, 'contact', nodeData.contactInputVariable, inputVariable),
    inputType: (nodeData.buttons?.length > 0 && nodeData.collectUserInput) ? 'button' : 'text',
    skipButtons: (nodeData.buttons || [])
      .filter((btn: any) => btn.skipDataCollection === true && btn.target)
      .map((btn: any) => ({ text: btn.text, target: btn.target })),
    validationType: (nodeData.validationType as UserInputTemplateParams['validationType']) ?? 'none',
    minLength: nodeData.minLength ?? 0,
    maxLength: nodeData.maxLength ?? 0,
    retryMessage: nodeData.retryMessage || 'Пожалуйста, попробуйте еще раз.',
    successMessage: nodeData.successMessage || '',
    inputPrompt: nodeData.inputPrompt || '',
    inputRequired: nodeData.inputRequired ?? true,
    saveToDatabase: nodeData.saveToDatabase ?? true,
  };
}

/**
 * Генерирует Python-код блока waiting_for_input из узла графа.
 * @param node - Узел графа
 * @param indentLevel - Отступ для каждой строки
 * @returns Сгенерированный блок Python-кода
 */
export function generateUserInputFromNode(node: Node, indentLevel: string = '    '): string {
  return generateUserInput(nodeToUserInputParams(node), indentLevel);
}

/**
 * Генерирует callback-обработчик для отдельного input-узла.
 * @param node - Узел типа input
 * @returns Python-код обработчика
 */
export function generateUserInputNodeHandler(node: Node): string {
  const params = nodeToUserInputParams(node);
  const waitingStateBlock = generateUserInput(params, '    ');
  const safeName = params.safeName;

  return [
    `@dp.callback_query(lambda c: c.data == "${node.id}")`,
    `async def handle_callback_${safeName}(callback_query: types.CallbackQuery):`,
    `    """Обработчик узла сбора ответа ${node.id}."""`,
    '    user_id = callback_query.from_user.id',
    `    logging.info(f"Активирован input-узел ${node.id} для пользователя {user_id}")`,
    '',
    '    try:',
    '        await callback_query.answer()',
    '    except Exception:',
    '        pass',
    '',
    '    if user_id not in user_data:',
    '        user_data[user_id] = {}',
    '',
    waitingStateBlock,
    '    return',
  ].join('\n');
}

/**
 * Проверяет, нужен ли узлу блок пользовательского ввода.
 * @param node - Узел графа
 * @returns true, если нужно генерировать waiting_for_input
 */
export function nodeHasUserInput(node: Node): boolean {
  return node.type === 'input' || node.data.collectUserInput === true;
}
