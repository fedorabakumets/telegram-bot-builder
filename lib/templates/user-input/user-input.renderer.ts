/**
 * @fileoverview Renderer для шаблона сбора пользовательского ввода
 * @module templates/user-input/user-input.renderer
 */

import type { Node } from '@shared/schema';
import type { UserInputTemplateParams } from './user-input.params';
import { userInputParamsSchema } from './user-input.schema';
import { renderPartialTemplate } from '../template-renderer';

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
 * Вычисляет список принимаемых режимов ввода из параметров
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

  // Кнопочный ввод
  if (params.inputType === 'button') {
    return params.enableTextInput ? ['button', 'text'] : ['button'];
  }
  // Медиа/текстовый ввод
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
 * Генерирует Python-код блока waiting_for_input из параметров (низкоуровневый API)
 * @param params - параметры шаблона
 * @param indentLevel - отступ для каждой строки (по умолчанию '    ')
 */
export function generateUserInput(params: UserInputTemplateParams, indentLevel: string = '    '): string {
  const validated = userInputParamsSchema.parse(params);
  const modes = buildModes(validated);
  const raw = renderPartialTemplate('user-input/user-input.py.jinja2', { ...validated, modes });
  if (indentLevel === '    ') return raw;
  // Переиндентируем: каждая непустая строка получает нужный отступ вместо 4 пробелов
  return raw
    .split('\n')
    .map(line => line.startsWith('    ') ? indentLevel + line.slice(4) : line)
    .join('\n');
}

/**
 * Собирает UserInputTemplateParams из узла графа
 */
export function nodeToUserInputParams(node: Node): UserInputTemplateParams {
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const isDedicatedInputNode = node.type === 'input';
  const inputSource = isDedicatedInputNode
    ? normalizeInputSource(node.data.inputType || 'any')
    : undefined;
  const acceptsAny = inputSource === 'any';
  const inputVariable = node.data.inputVariable || 'input';

  return {
    nodeId: node.id,
    safeName,
    inputVariable,
    appendVariable: node.data.appendVariable ?? false,
    inputTargetNodeId: node.data.inputTargetNodeId || '',
    inputSource,
    enableTextInput: isDedicatedInputNode
      ? (acceptsAny || inputSource === 'text')
      : (node.data.enableTextInput ?? true),
    enablePhotoInput: isDedicatedInputNode
      ? (acceptsAny || inputSource === 'photo')
      : (node.data.enablePhotoInput ?? false),
    photoInputVariable: resolveDedicatedVariable(
      isDedicatedInputNode,
      inputSource,
      'photo',
      node.data.photoInputVariable,
      inputVariable,
    ),
    enableVideoInput: isDedicatedInputNode
      ? (acceptsAny || inputSource === 'video')
      : (node.data.enableVideoInput ?? false),
    videoInputVariable: resolveDedicatedVariable(
      isDedicatedInputNode,
      inputSource,
      'video',
      node.data.videoInputVariable,
      inputVariable,
    ),
    enableAudioInput: isDedicatedInputNode
      ? (acceptsAny || inputSource === 'audio')
      : (node.data.enableAudioInput ?? false),
    audioInputVariable: resolveDedicatedVariable(
      isDedicatedInputNode,
      inputSource,
      'audio',
      node.data.audioInputVariable,
      inputVariable,
    ),
    enableDocumentInput: isDedicatedInputNode
      ? (acceptsAny || inputSource === 'document')
      : (node.data.enableDocumentInput ?? false),
    documentInputVariable: resolveDedicatedVariable(
      isDedicatedInputNode,
      inputSource,
      'document',
      node.data.documentInputVariable,
      inputVariable,
    ),
    enableLocationInput: isDedicatedInputNode
      ? (acceptsAny || inputSource === 'location')
      : Boolean((node.data as any).enableLocationInput),
    locationInputVariable: resolveDedicatedVariable(
      isDedicatedInputNode,
      inputSource,
      'location',
      (node.data as any).locationInputVariable,
      inputVariable,
    ),
    enableContactInput: isDedicatedInputNode
      ? (acceptsAny || inputSource === 'contact')
      : Boolean((node.data as any).enableContactInput),
    contactInputVariable: resolveDedicatedVariable(
      isDedicatedInputNode,
      inputSource,
      'contact',
      (node.data as any).contactInputVariable,
      inputVariable,
    ),
    inputType: (node.data.buttons?.length > 0 && node.data.collectUserInput) ? 'button' : 'text',
    skipButtons: (node.data.buttons || [])
      .filter((btn: any) => btn.skipDataCollection === true && btn.target)
      .map((btn: any) => ({ text: btn.text, target: btn.target })),
    validationType: ((node.data as any).validationType as UserInputTemplateParams['validationType']) ?? 'none',
    minLength: node.data.minLength ?? 0,
    maxLength: node.data.maxLength ?? 0,
    retryMessage: (node.data as any).retryMessage || 'Пожалуйста, попробуйте еще раз.',
    successMessage: node.data.successMessage || '',
    inputPrompt: (node.data as any).inputPrompt || '',
    inputRequired: (node.data as any).inputRequired ?? true,
    saveToDatabase: node.data.saveToDatabase ?? true,
  };
}

/**
 * Генерирует Python-код блока waiting_for_input из узла графа (высокоуровневый API)
 * @param node - узел графа
 * @param indentLevel - отступ для каждой строки (по умолчанию '    ')
 */
export function generateUserInputFromNode(node: Node, indentLevel: string = '    '): string {
  return generateUserInput(nodeToUserInputParams(node), indentLevel);
}

/**
 * Генерирует callback-обработчик для отдельного input-узла.
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
    `    logging.info(f"📥 Активация input-узла ${node.id} для пользователя {user_id}")`,
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
 * Проверяет, нужно ли генерировать блок сбора ввода для узла
 */
export function nodeHasUserInput(node: Node): boolean {
  return node.type === 'input' || node.data.collectUserInput === true;
}
