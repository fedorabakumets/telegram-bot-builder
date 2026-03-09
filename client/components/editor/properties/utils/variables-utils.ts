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
