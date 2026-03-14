/**
 * @fileoverview Генерация Python-кода с картой узлов
 * 
 * Модуль предоставляет функцию для генерации кода бота
 * с картой соответствия строк кода узлам.
 * 
 * @module bot-generator/map-utils/generatePythonCodeWithMap
 */

import type { BotData } from '@shared/schema';
import type { CodeWithMap } from "../types";
import { generatePythonCode, type GeneratePythonCodeOptions } from '../index';
import { parseCodeMap } from './parseCodeMap';

/**
 * Генерирует Python-код с картой узлов
 * 
 * @param botData - Данные бота
 * @param options - Опции генерации
 * @returns Код с картой узлов
 * 
 * @example
 * const result = generatePythonCodeWithMap(botData, { botName: 'MyBot' });
 */
export function generatePythonCodeWithMap(
  botData: BotData,
  options: GeneratePythonCodeOptions = {}
): CodeWithMap {
  const code = generatePythonCode(botData, options);
  return parseCodeMap(code);
}
