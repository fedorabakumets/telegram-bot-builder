/**
 * @fileoverview Утилиты для работы с идентификаторами узлов
 *
 * Содержит функции для извлечения базовых ID и генерации уникальных идентификаторов.
 */

/**
 * Извлекает базовый идентификатор узла, удаляя суффиксы копирования
 *
 * Удаляет все суффиксы формата `_paste_<timestamp>_<random>` и
 * `_copy_<timestamp>` из конца ID, чтобы получить оригинальный ID узла.
 *
 * @param id - Идентификатор узла (возможно уже содержащий суффиксы)
 * @returns Базовый идентификатор без суффиксов копирования
 *
 * @example
 * getBaseId('abc123') // 'abc123'
 * getBaseId('abc123_paste_1772004615750_qj1s3gl3s') // 'abc123'
 * getBaseId('abc123_copy_1771493883542') // 'abc123'
 * getBaseId('abc123_copy_1771493883542_copy_1771494162377') // 'abc123'
 */
export function getBaseId(id: string): string {
  return id.replace(/(_paste_\d+_[a-z0-9]+|_copy_\d+)+$/, '');
}

/**
 * Генерирует новый уникальный идентификатор на основе базового ID
 *
 * Извлекает базовый ID и добавляет суффикс с меткой времени и случайной строкой.
 *
 * @param id - Текущий идентификатор узла
 * @param suffix - Префикс суффикса (по умолчанию 'paste')
 * @returns Новый уникальный идентификатор
 *
 * @example
 * generateNewId('abc123') // 'abc123_paste_1772004615750_qj1s3gl3s'
 * generateNewId('abc123_paste_123_xyz', 'dup') // 'abc123_dup_1772004615750_qj1s3gl3s'
 */
export function generateNewId(id: string, suffix: string = 'paste'): string {
  const baseId = getBaseId(id);
  return `${baseId}_${suffix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
