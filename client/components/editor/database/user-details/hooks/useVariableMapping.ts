/**
 * @fileoverview Хук карты переменных проекта
 * @description Создаёт карту соответствия переменных вопросам из проекта
 */

import { useMemo } from 'react';
import { BotProject } from '@shared/schema';

/**
 * Создаёт карту переменных и вопросов проекта
 * @param {BotProject | undefined} project - Данные проекта
 * @returns {Record<string, string>} Карта переменных
 */
export function useVariableMapping(project: BotProject | undefined): Record<string, string> {
  return useMemo(() => {
    const mapping: Record<string, string> = {};
    if (!project?.data) return mapping;

    try {
      const flowData = typeof project.data === 'string'
        ? JSON.parse(project.data as string)
        : project.data as any;

      const sheets = flowData?.sheets || [];
      for (const sheet of sheets) {
        const nodes = sheet?.nodes || [];
        for (const node of nodes) {
          const data = node?.data;
          if (!data) continue;

          const questionText = data.messageText;
          if (!questionText) continue;

          if (data.inputVariable) mapping[data.inputVariable] = questionText;
          if (data.photoInputVariable) mapping[data.photoInputVariable] = questionText;
          if (data.videoInputVariable) mapping[data.videoInputVariable] = questionText;
          if (data.audioInputVariable) mapping[data.audioInputVariable] = questionText;
          if (data.documentInputVariable) mapping[data.documentInputVariable] = questionText;
        }
      }
    } catch (e) {
      console.error('Ошибка разбора данных проекта для карты переменных:', e);
    }

    return mapping;
  }, [project?.data]);
}
