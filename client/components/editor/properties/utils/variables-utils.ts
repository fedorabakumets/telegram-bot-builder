/**
 * @fileoverview Утилиты для работы с переменными
 * Для Telegram Bot Builder.
 * @module variables-utils
 */

import { Node } from '@shared/schema';
import { SYSTEM_VARIABLES } from '../components/variables/system-variables';

/** Переменная проекта */
export interface ProjectVariable {
  name: string;
  nodeId: string;
  nodeType: string;
  description?: string;
  mediaType?: string;
  sourceTable?: string;
  /** Все узлы, где используется эта переменная */
  nodeIds?: string[];
}

/** Результат извлечения переменных */
export interface VariablesResult {
  textVariables: ProjectVariable[];
  mediaVariables: ProjectVariable[];
}

/**
 * Извлекает вопросы из узлов с пользовательским вводом.
 * @param {Node[]} allNodes - Все узлы проекта
 * @returns {ProjectVariable[]} Массив вопросов без дубликатов
 */
export function collectAvailableQuestions(allNodes: Node[]): ProjectVariable[] {
  const questions: ProjectVariable[] = [];
  allNodes.forEach(node => {
    if (node.data.collectUserInput && node.data.inputVariable) {
      questions.push({ name: node.data.inputVariable, nodeId: node.id, nodeType: node.type });
    }
    if (node.data.enablePhotoInput && node.data.photoInputVariable) {
      questions.push({ name: node.data.photoInputVariable, nodeId: node.id, nodeType: node.type, mediaType: 'photo' });
    }
    if (node.data.enableVideoInput && node.data.videoInputVariable) {
      questions.push({ name: node.data.videoInputVariable, nodeId: node.id, nodeType: node.type, mediaType: 'video' });
    }
    if (node.data.enableAudioInput && node.data.audioInputVariable) {
      questions.push({ name: node.data.audioInputVariable, nodeId: node.id, nodeType: node.type, mediaType: 'audio' });
    }
    if (node.data.enableDocumentInput && node.data.documentInputVariable) {
      questions.push({ name: node.data.documentInputVariable, nodeId: node.id, nodeType: node.type, mediaType: 'document' });
    }
  });
  // Удаляем дубликаты по имени
  return questions.filter((q, i, self) => i === self.findIndex(v => v.name === q.name));
}

/**
 * Извлекает и разделяет переменные на текстовые и медиа.
 * @param {Node[]} allNodes - Все узлы проекта
 * @returns {VariablesResult} Объект с текстовыми и медиа переменными
 */
export function extractVariables(allNodes: Node[]): VariablesResult {
  const variablesMap = new Map<string, ProjectVariable>();
  allNodes.forEach(node => {
    if (node.data.collectUserInput && node.data.inputVariable && !variablesMap.has(node.data.inputVariable)) {
      variablesMap.set(node.data.inputVariable, { 
        name: node.data.inputVariable, 
        nodeId: node.id, 
        nodeType: node.type, 
        sourceTable: 'bot_users', 
        description: `Данные из узла типа ${node.type}`,
        nodeIds: [node.id]
      });
    } else if (node.data.collectUserInput && node.data.inputVariable && variablesMap.has(node.data.inputVariable)) {
      // Переменная уже существует — добавляем ещё один узел
      const existing = variablesMap.get(node.data.inputVariable)!;
      if (!existing.nodeIds) existing.nodeIds = [];
      if (!existing.nodeIds.includes(node.id)) {
        existing.nodeIds.push(node.id);
      }
    }
    if (node.data.enablePhotoInput && node.data.photoInputVariable && !variablesMap.has(node.data.photoInputVariable)) {
      variablesMap.set(node.data.photoInputVariable, { 
        name: node.data.photoInputVariable, 
        nodeId: node.id, 
        nodeType: node.type, 
        mediaType: 'photo', 
        sourceTable: 'bot_users', 
        description: 'File ID фотографии',
        nodeIds: [node.id]
      });
    }
    if (node.data.enableVideoInput && node.data.videoInputVariable && !variablesMap.has(node.data.videoInputVariable)) {
      variablesMap.set(node.data.videoInputVariable, { 
        name: node.data.videoInputVariable, 
        nodeId: node.id, 
        nodeType: node.type, 
        mediaType: 'video', 
        sourceTable: 'bot_users', 
        description: 'File ID видео',
        nodeIds: [node.id]
      });
    }
    if (node.data.enableAudioInput && node.data.audioInputVariable && !variablesMap.has(node.data.audioInputVariable)) {
      variablesMap.set(node.data.audioInputVariable, { 
        name: node.data.audioInputVariable, 
        nodeId: node.id, 
        nodeType: node.type, 
        mediaType: 'audio', 
        sourceTable: 'bot_users', 
        description: 'File ID аудио',
        nodeIds: [node.id]
      });
    }
    if (node.data.enableDocumentInput && node.data.documentInputVariable && !variablesMap.has(node.data.documentInputVariable)) {
      variablesMap.set(node.data.documentInputVariable, { 
        name: node.data.documentInputVariable, 
        nodeId: node.id, 
        nodeType: node.type, 
        mediaType: 'document', 
        sourceTable: 'bot_users', 
        description: 'File ID документа',
        nodeIds: [node.id]
      });
    }
    if (node.data.allowMultipleSelection && node.data.multiSelectVariable && !variablesMap.has(node.data.multiSelectVariable)) {
      variablesMap.set(node.data.multiSelectVariable, { 
        name: node.data.multiSelectVariable, 
        nodeId: node.id, 
        nodeType: node.type, 
        sourceTable: 'bot_users', 
        description: 'Множественный выбор (список)',
        nodeIds: [node.id]
      });
    }
    if (node.data.conditionalMessages) {
      node.data.conditionalMessages.forEach((c: any) => {
        if (c.textInputVariable && !variablesMap.has(c.textInputVariable)) {
          variablesMap.set(c.textInputVariable, { 
            name: c.textInputVariable, 
            nodeId: node.id, 
            nodeType: 'conditional', 
            sourceTable: 'bot_users', 
            description: `Условный ввод: ${c.messageText?.substring(0, 50) || 'Условное сообщение'}...`,
            nodeIds: [node.id]
          });
        } else if (c.textInputVariable && variablesMap.has(c.textInputVariable)) {
          const existing = variablesMap.get(c.textInputVariable)!;
          if (!existing.nodeIds) existing.nodeIds = [];
          if (!existing.nodeIds.includes(node.id)) {
            existing.nodeIds.push(node.id);
          }
        }
      });
    }
  });
  // Добавляем переменные от http_request-узлов
  allNodes.forEach(node => {
    if ((node.type as string) !== 'http_request') return;
    const data = node.data as any;
    if (data.httpRequestResponseVariable) {
      const key = `http_response__${node.id}`;
      if (!variablesMap.has(key)) {
        variablesMap.set(key, {
          name: data.httpRequestResponseVariable,
          nodeId: node.id,
          nodeType: 'http_request' as any,
          description: `Ответ HTTP запроса (${data.httpRequestMethod || 'GET'} ${data.httpRequestUrl || ''})`,
        });
      }
    }
    if (data.httpRequestStatusVariable) {
      const key = `http_status__${node.id}`;
      if (!variablesMap.has(key)) {
        variablesMap.set(key, {
          name: data.httpRequestStatusVariable,
          nodeId: node.id,
          nodeType: 'http_request' as any,
          description: `Статус-код HTTP запроса (${data.httpRequestMethod || 'GET'} ${data.httpRequestUrl || ''})`,
        });
      }
    }
  });

  // Добавляем переменные от отдельных input-узлов (type === 'input')
  allNodes.forEach(node => {
    if (node.type !== 'input') return;
    const data = node.data as any;
    if (data.inputVariable) {
      const key = `input_node__${node.id}`;
      if (!variablesMap.has(key)) {
        variablesMap.set(key, {
          name: data.inputVariable,
          nodeId: node.id,
          nodeType: 'input' as any,
          sourceTable: 'bot_users',
          description: `Ответ пользователя (${data.inputType || 'any'})`,
        });
      }
    }
  });

  // Добавляем переменные от managed_bot_updated_trigger нод (Bot API 9.6)
  allNodes.forEach(node => {
    if ((node.type as string) !== 'managed_bot_updated_trigger') return;
    const data = node.data as any;
    const vars: Array<{ key: string; name: string; description: string }> = [
      { key: 'saveBotIdTo', name: data.saveBotIdTo || 'bot_id', description: 'ID созданного управляемого бота' },
      { key: 'saveBotUsernameTo', name: data.saveBotUsernameTo || 'bot_username', description: 'Username созданного управляемого бота' },
      { key: 'saveBotNameTo', name: data.saveBotNameTo || 'bot_name', description: 'Имя созданного управляемого бота' },
      { key: 'saveCreatorIdTo', name: data.saveCreatorIdTo || 'creator_id', description: 'ID пользователя, создавшего бота' },
      { key: 'saveCreatorUsernameTo', name: data.saveCreatorUsernameTo || 'creator_username', description: 'Username пользователя, создавшего бота' },
    ];
    vars.forEach(({ key, name, description }) => {
      if (!name) return;
      const mapKey = `managed_bot__${node.id}__${key}`;
      if (!variablesMap.has(mapKey)) {
        variablesMap.set(mapKey, {
          name,
          nodeId: node.id,
          nodeType: 'managed_bot_updated_trigger' as any,
          description,
        });
      }
    });
  });
  // Добавляем переменные от get_managed_bot_token нод (Bot API 9.6)
  allNodes.forEach(node => {
    if ((node.type as string) !== 'get_managed_bot_token') return;
    const data = node.data as any;
    const vars: Array<{ key: string; name: string; description: string }> = [
      { key: 'saveTokenTo', name: data.saveTokenTo || 'bot_token', description: 'Токен управляемого бота' },
      { key: 'saveErrorTo', name: data.saveErrorTo || '', description: 'Ошибка при получении токена' },
    ];
    vars.forEach(({ key, name, description }) => {
      if (!name) return;
      const mapKey = `get_managed_bot_token__${node.id}__${key}`;
      if (!variablesMap.has(mapKey)) {
        variablesMap.set(mapKey, {
          name,
          nodeId: node.id,
          nodeType: 'get_managed_bot_token' as any,
          description,
        });
      }
    });
  });
  /**
   * Добавляем переменные saveMessageIdTo из message/start/command-узлов.
   * Эти переменные хранят ID отправленного сообщения для последующего редактирования.
   */
  allNodes.forEach(node => {
    if (node.type !== 'message' && node.type !== 'start' && node.type !== 'command') return;
    const saveMessageIdTo: string = (node.data as any)?.saveMessageIdTo || '';
    if (!saveMessageIdTo.trim()) return;
    const mapKey = `save_message_id__${node.id}`;
    if (!variablesMap.has(mapKey)) {
      variablesMap.set(mapKey, {
        name: saveMessageIdTo,
        nodeId: node.id,
        nodeType: 'message_id' as any,
        description: `ID сообщения из узла "${(node.data as any)?.messageText?.substring(0, 30) || node.id}"`,
      });
    }
  });
  // Добавляем переменные от callback_trigger нод
  allNodes.forEach(node => {
    if ((node.type as string) !== 'callback_trigger') return;
    const callbackData: string = (node.data as any).callbackData ?? '';
    if (!callbackData.trim()) return;

    // Ищем текст кнопки по callbackData среди всех кнопок проекта
    let buttonText = '';
    allNodes.forEach(n => {
      const buttons: any[] = (n.data as any).buttons ?? [];
      const btn = buttons.find(b => b.customCallbackData === callbackData);
      if (btn) buttonText = btn.text || '';
    });

    const cbKey = `callback_data__${node.id}`;
    const btKey = `button_text__${node.id}`;

    if (!variablesMap.has(cbKey)) {
      variablesMap.set(cbKey, {
        name: 'callback_data',
        nodeId: node.id,
        nodeType: 'callback_trigger',
        description: `Данные кнопки: ${callbackData}`,
      });
    }

    if (!variablesMap.has(btKey)) {
      variablesMap.set(btKey, {
        name: 'button_text',
        nodeId: node.id,
        nodeType: 'callback_trigger',
        description: buttonText ? `Текст кнопки: "${buttonText}"` : `Триггер: ${callbackData}`,
      });
    }
  });

  // Добавляем переменные от инлайн-кнопок клавиатуры.
  // Только action-типы которые реально генерируют callback_data в Telegram:
  // goto, command, selection, complete, default — остальные (url, web_app, contact, location, copy_text) не имеют callback_data
  const CALLBACK_ACTIONS = new Set(['goto', 'command', 'selection', 'complete', 'default']);
  allNodes.forEach(node => {
    if ((node.data as any).keyboardType !== 'inline') return;
    const buttons: any[] = (node.data as any).buttons ?? [];
    buttons.forEach(btn => {
      if (!btn.text) return;
      // Пропускаем кнопки без callback_data (url, web_app, contact, location, copy_text)
      if (!CALLBACK_ACTIONS.has(btn.action) && !btn.customCallbackData) return;
      /** Значение callback_data: customCallbackData если задан, иначе target (nodeId) */
      const cbValue: string = btn.customCallbackData || btn.target || btn.id || '';
      const cbKey = `callback_data__btn__${btn.id}`;
      const btKey = `button_text__btn__${btn.id}`;

      if (!variablesMap.has(cbKey)) {
        variablesMap.set(cbKey, {
          name: 'callback_data',
          nodeId: node.id,
          nodeType: 'callback_trigger',
          description: cbValue ? `Данные кнопки: ${cbValue}` : `Кнопка: ${btn.text}`,
        });
      }
      if (!variablesMap.has(btKey)) {
        variablesMap.set(btKey, {
          name: 'button_text',
          nodeId: node.id,
          nodeType: 'callback_trigger',
          description: `Текст кнопки: "${btn.text}"`,
        });
      }
    });
  });

  // Добавляем системные переменные
  SYSTEM_VARIABLES.forEach(v => { 
    if (!variablesMap.has(v.name)) {
      variablesMap.set(v.name, { 
        name: v.name, 
        nodeId: v.nodeId, 
        nodeType: v.nodeType, 
        description: v.description,
        sourceTable: v.sourceTable
      });
    }
  });
  // Разделяем на текстовые и медиа
  const all = Array.from(variablesMap.values());
  return { textVariables: all.filter(v => !v.mediaType), mediaVariables: all.filter(v => v.mediaType) };
}
