/** @fileoverview Пути ресурсов приложения, одинаковые для исходников и серверного бандла. */
import { resolve } from "node:path";

/**
 * Возвращает путь ресурса от корня приложения, независимо от расположения JavaScript.
 * @param segments - Части пути внутри каталога приложения
 * @returns Абсолютный путь ресурса
 */
export function appPath(...segments: string[]): string {
  return resolve(process.env.BOTCRAFT_APP_ROOT?.trim() || process.cwd(), ...segments);
}
