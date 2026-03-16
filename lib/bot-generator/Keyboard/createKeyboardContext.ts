/**
 * @fileoverview Адаптер для создания контекста клавиатуры из Node данных
 * @module lib/bot-generator/Keyboard/createKeyboardContext
 */

import { Node } from '@shared/schema';
import { generateUniqueShortId } from '../format/generateUniqueShortId';
import type { KeyboardTemplateParams, Button, ConditionalMessage } from '../../templates/keyboard/keyboard.params';

/**
 * Контекст клавиатуры для передачи в Jinja2 шаблон
 */
export interface KeyboardContext extends KeyboardTemplateParams {
  /** Тип клавиатуры */
  keyboardType: 'inline' | 'reply' | 'none';
  /** Кнопки */
  buttons: Button[];
  /** Short ID узла для callback_data */
  shortNodeId: string;
}

/**
 * Создаёт контекст клавиатуры из данных узла
 * 
 * @param node - Узел для генерации клавиатуры
 * @param allNodeIds - Массив всех ID узлов для генерации коротких ID
 * @returns Контекст для Jinja2 шаблона
 * 
 * @example
 * ```typescript
 * const context = createKeyboardContext(node, allNodeIds);
 * const code = templateEngine.render('keyboard/keyboard.py.jinja2', context);
 * ```
 */
export function createKeyboardContext(
  node: Node,
  allNodeIds: string[] = []
): KeyboardContext {
  const nodeData = node.data || {};
  
  // Генерируем короткий ID узла
  const shortNodeId = generateUniqueShortId(node.id, allNodeIds);
  
  // Преобразуем кнопки в формат контекста
  const buttons: Button[] = (nodeData.buttons || []).map((btn: any) => ({
    id: btn.id || '',
    text: btn.text || 'Button',
    action: btn.action || 'goto',
    url: btn.url,
    target: btn.target,
    requestContact: btn.requestContact,
    requestLocation: btn.requestLocation,
  }));
  
  // Определяем кнопку завершения
  const completeButtonData = buttons.find(btn => btn.action === 'complete');
  const completeButton = completeButtonData ? {
    text: completeButtonData.text,
    target: completeButtonData.target || node.id,
  } : undefined;
  
  // Определяем наличие медиа
  const hasImage = !!(nodeData.imageUrl && nodeData.imageUrl.trim() !== '' && nodeData.imageUrl !== 'undefined');
  const hasDocument = !!(nodeData.documentUrl && nodeData.documentUrl.trim() !== '');
  const hasVideo = !!(nodeData.videoUrl && nodeData.videoUrl.trim() !== '');
  const hasAudio = !!(nodeData.audioUrl && nodeData.audioUrl.trim() !== '');
  
  // Определяем parseMode
  let parseMode: 'html' | 'markdown' | 'none' = 'none';
  if (nodeData.formatMode === 'html') {
    parseMode = 'html';
  } else if (nodeData.formatMode === 'markdown') {
    parseMode = 'markdown';
  }

  // Условные сообщения - преобразуем в формат ConditionalMessage
  const conditionalMessages: ConditionalMessage[] = (nodeData.conditionalMessages || []).map((cm: any) => ({
    variable: cm.variable || cm.condition || '',
    operator: cm.operator || 'equals',
    value: cm.value || '',
    message: cm.message || cm.messageText || '',
    keyboard: cm.keyboard,
  }));

  // Собираем контекст
  const context: KeyboardContext = {
    // Базовые параметры
    keyboardType: nodeData.keyboardType || 'reply',
    buttons,
    keyboardLayout: nodeData.keyboardLayout,
    resizeKeyboard: nodeData.resizeKeyboard !== false,
    oneTimeKeyboard: nodeData.oneTimeKeyboard === true,

    // Множественный выбор
    allowMultipleSelection: nodeData.allowMultipleSelection === true,
    multiSelectVariable: nodeData.multiSelectVariable || `multi_select_${node.id}`,
    nodeId: node.id,
    completeButton,

    // Условные сообщения
    enableConditionalMessages: nodeData.enableConditionalMessages === true,
    conditionalMessages,
    conditionalKeyboardVar: undefined, // Это свойство не используется в текущей схеме
    
    // Медиа
    hasImage,
    imageUrl: hasImage ? nodeData.imageUrl : undefined,
    documentUrl: hasDocument ? nodeData.documentUrl : undefined,
    videoUrl: hasVideo ? nodeData.videoUrl : undefined,
    audioUrl: hasAudio ? nodeData.audioUrl : undefined,
    
    // Форматирование
    parseMode,
    
    // Служебные
    indentLevel: '',
    allNodeIds,
    shortNodeId,
  };
  
  return context;
}

/**
 * Создаёт контекст клавиатуры с явными параметрами
 * 
 * @param params - Параметры контекста
 * @param allNodeIds - Массив всех ID узлов
 * @returns Контекст для Jinja2 шаблона
 */
export function createKeyboardContextFromParams(
  params: Partial<KeyboardContext>,
  allNodeIds: string[] = []
): KeyboardContext {
  const nodeId = params.nodeId || '';
  const shortNodeId = generateUniqueShortId(nodeId, allNodeIds);

  // Преобразуем conditionalMessages если нужно
  const conditionalMessages: ConditionalMessage[] = (params.conditionalMessages || []).map((cm: any) => ({
    variable: cm.variable || cm.condition || '',
    operator: cm.operator || 'equals',
    value: cm.value || '',
    message: cm.message || cm.messageText || '',
    keyboard: cm.keyboard,
  }));

  return {
    keyboardType: params.keyboardType || 'none',
    buttons: params.buttons || [],
    keyboardLayout: params.keyboardLayout,
    resizeKeyboard: params.resizeKeyboard ?? true,
    oneTimeKeyboard: params.oneTimeKeyboard ?? false,
    allowMultipleSelection: params.allowMultipleSelection ?? false,
    multiSelectVariable: params.multiSelectVariable || `multi_select_${nodeId}`,
    nodeId,
    completeButton: params.completeButton,
    enableConditionalMessages: params.enableConditionalMessages ?? false,
    conditionalMessages,
    conditionalKeyboardVar: params.conditionalKeyboardVar || undefined,
    hasImage: params.hasImage ?? false,
    imageUrl: params.imageUrl,
    documentUrl: params.documentUrl,
    videoUrl: params.videoUrl,
    audioUrl: params.audioUrl,
    parseMode: params.parseMode || 'none',
    indentLevel: params.indentLevel || '',
    allNodeIds,
    shortNodeId,
  };
}
