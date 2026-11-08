/** @fileoverview Единая загрузка генератора для исходников разработки и production-бандла. */
import { pathToFileURL } from 'node:url';
import { appPath } from './app-root';

/** Тип генератора без загрузки исполняемого модуля при импорте помощника. */
type BotGenerator = typeof import('../../lib/bot-generator')['generatePythonCode'];

/**
 * В разработке перечитывает исходник, а в production использует встроенный JavaScript.
 * @returns Функция генерации Python-кода
 */
export async function loadBotGenerator(): Promise<BotGenerator> {
  if (process.env.NODE_ENV === 'development') {
    const source = pathToFileURL(appPath('lib', 'bot-generator.ts'));
    source.searchParams.set('t', String(Date.now()));
    return (await import(source.href)).generatePythonCode;
  }
  return (await import('../../lib/bot-generator')).generatePythonCode;
}
