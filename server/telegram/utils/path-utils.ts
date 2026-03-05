/**
 * @fileoverview Утилиты для работы с директориями и путями файлов
 * @module server/telegram/utils/path-utils
 */

import { existsSync, mkdirSync } from 'fs';
import { join, normalize, relative, isAbsolute } from 'path';
import type { PathValidationResult } from '../types/path-validation.js';

/**
 * Создаёт директорию для загрузки файлов проекта
 * @param projectId - ID проекта для организации файлов
 * @param date - Дата в формате ГГГГ-ММ-ДД
 * @returns Абсолютный путь к созданной директории
 */
export function createUploadDir(projectId: number, date: string): string {
  const uploadDir = join(process.cwd(), 'uploads', String(projectId), date);

  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
}

/**
 * Валидирует путь к файлу для защиты от directory traversal атак
 * @param basePath - Базовая директория
 * @param filePath - Полный путь к файлу
 * @returns Результат валидации с нормализованными путями
 * @throws Error если путь выходит за пределы базовой директории
 */
export function validateFilePath(
  basePath: string,
  filePath: string
): PathValidationResult {
  const normalizedPath = normalize(filePath);
  const rel = relative(basePath, normalizedPath);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('Некорректный путь к файлу - возможна попытка обхода каталогов');
  }

  return {
    normalizedPath,
    relativePath: rel,
    isValid: true,
  };
}
