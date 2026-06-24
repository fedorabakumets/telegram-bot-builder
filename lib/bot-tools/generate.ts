/**
 * @fileoverview Генерация Python-кода из project.json
 * @module lib/bot-tools/generate
 */

import { generatePythonCode } from '../bot-generator.ts';
import type { BotDataWithSheets } from '@shared/schema';
import { validateBotProject } from './validate-project.ts';

/** Опции генерации для MCP-тула */
export interface GenerateBotCodeOptions {
  /** Имя бота для генерации */
  botName?: string;
  /** Пропустить валидацию перед генерацией */
  skipValidation?: boolean;
}

/**
 * Генерирует bot.py из project.json
 * @param projectJson - Проект
 * @param options - Опции генерации
 * @returns Python-код или ошибки валидации
 */
export function generateBotCode(projectJson: unknown, options: GenerateBotCodeOptions = {}) {
  let project: Record<string, unknown>;

  if (typeof projectJson === 'string') {
    try {
      project = JSON.parse(projectJson) as Record<string, unknown>;
    } catch {
      return { success: false as const, error: 'Невалидный JSON' };
    }
  } else if (projectJson && typeof projectJson === 'object') {
    project = projectJson as Record<string, unknown>;
  } else {
    return { success: false as const, error: 'Ожидается объект или JSON-строка' };
  }

  if (!options.skipValidation) {
    const validation = validateBotProject(project);
    if (!validation.valid) {
      return { success: false as const, validation };
    }
  }

  try {
    const python = generatePythonCode(project as BotDataWithSheets, {
      botName: options.botName ?? 'Bot',
    });
    return { success: true as const, python, lines: python.split('\n').length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false as const, error: `Ошибка генерации: ${message}` };
  }
}
