/**
 * @fileoverview Чтение и запись project.json на диск (каталог bots/) с валидацией
 * @module lib/bot-tools/project-io
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { BotDataWithSheets } from '@shared/schema';
import { validateBotProject } from './validate-project.ts';
import type { ValidateProjectResult } from './types.ts';

/**
 * Резолвит пользовательский путь в безопасный путь к project.json внутри каталога bots/
 * @param userPath - Путь к папке бота или к самому project.json внутри bots/
 * @returns Объект с резолвнутым путём или объект с ошибкой при выходе за пределы bots/
 */
function resolveProjectPath(userPath: string): { resolved: string } | { error: string } {
  const botsRoot = path.resolve(process.cwd(), 'bots');
  const dir = userPath.endsWith('project.json') ? path.dirname(userPath) : userPath;
  const resolved = path.resolve(botsRoot, dir, 'project.json');

  if (!resolved.startsWith(botsRoot + path.sep)) {
    return { error: 'Путь вне каталога bots' };
  }

  return { resolved };
}

/**
 * Парсит project_json в объект (строка → JSON.parse, объект → structuredClone)
 * @param input - Объект или JSON-строка
 * @returns project или null при невалидном вводе
 */
function parseProject(input: unknown): BotDataWithSheets | null {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as BotDataWithSheets;
    } catch {
      return null;
    }
  }
  if (input && typeof input === 'object') return structuredClone(input) as BotDataWithSheets;
  return null;
}

/**
 * Читает project.json с диска и прогоняет валидацию
 * @param userPath - Путь к папке бота или к project.json внутри bots/
 * @returns Проект, результат валидации и абсолютный путь, либо объект с ошибкой
 */
export async function loadProject(
  userPath: string,
): Promise<{ project: BotDataWithSheets; validation: ValidateProjectResult; path: string } | { error: string }> {
  const resolvedResult = resolveProjectPath(userPath);
  if ('error' in resolvedResult) return resolvedResult;
  const { resolved } = resolvedResult;

  let content: string;
  try {
    content = await fs.readFile(resolved, 'utf-8');
  } catch {
    return { error: `Файл project.json не найден: ${resolved}` };
  }

  let project: BotDataWithSheets;
  try {
    project = JSON.parse(content) as BotDataWithSheets;
  } catch {
    return { error: 'Невалидный JSON в project.json' };
  }

  const validation = validateBotProject(project);
  return { project, validation, path: resolved };
}

/**
 * Пишет project.json на диск (с валидацией перед записью, без бэкапа)
 * @param userPath - Путь к папке бота или к project.json внутри bots/
 * @param projectJson - Объект project.json или JSON-строка
 * @param options - Опции: skipValidation отключает блокировку записи невалидного проекта
 * @returns Путь, результат валидации и число записанных байт, либо объект с ошибкой
 */
export async function saveProject(
  userPath: string,
  projectJson: unknown,
  options?: { skipValidation?: boolean },
): Promise<{ path: string; validation: ValidateProjectResult; bytesWritten: number } | { error: string }> {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const validation = validateBotProject(project);
  if (!validation.valid && !options?.skipValidation) {
    return { error: 'Проект не прошёл валидацию', validation };
  }

  const resolvedResult = resolveProjectPath(userPath);
  if ('error' in resolvedResult) return resolvedResult;
  const { resolved } = resolvedResult;

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  const content = JSON.stringify(project, null, 2);
  await fs.writeFile(resolved, content, 'utf8');

  return { path: resolved, validation, bytesWritten: Buffer.byteLength(content, 'utf8') };
}
