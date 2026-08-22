/**
 * @fileoverview Отпечаток входных данных для повторного использования сгенерированного кода
 * @module server/bots/generatedCodeFingerprint
 */

import { createHash } from 'node:crypto';

/** Поля, влияющие на generatePythonCode при запуске бота */
export interface GeneratedCodeInput {
  /** sha256(JSON.stringify(project.data)) */
  projectDataChecksum: string;
  /** Имя проекта — влияет на имя файла */
  projectName: string;
  userDatabaseEnabled: boolean;
  saveIncomingMedia: boolean;
  catchAllHandlers: boolean;
  protectContent: boolean;
  contentCache: boolean;
  /** Контрольная сумма lib/bot-generator + templates + scaffolding */
  generatorVersion: string;
}

/**
 * Контрольная сумма данных проекта для отпечатка.
 * @param projectData - project.data из БД
 * @returns hex sha256
 */
export function checksumProjectData(projectData: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(projectData))
    .digest('hex');
}

/**
 * Строит отпечаток входных данных генерации кода.
 * @param input - Поля, влияющие на результат generatePythonCode
 * @returns hex sha256
 */
export function buildGeneratedCodeFingerprint(input: GeneratedCodeInput): string {
  const payload = JSON.stringify({
    projectDataChecksum: input.projectDataChecksum,
    projectName: input.projectName,
    userDatabaseEnabled: input.userDatabaseEnabled,
    saveIncomingMedia: input.saveIncomingMedia,
    catchAllHandlers: input.catchAllHandlers,
    protectContent: input.protectContent,
    contentCache: input.contentCache,
    generatorVersion: input.generatorVersion,
  });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Можно ли использовать готовые файлы бота без перегенерации.
 * @param savedFingerprint - fingerprint из .generated-code.json или null
 * @param currentFingerprint - текущий отпечаток
 * @param mainFileExists - существует ли основной .py
 * @returns true если файлы актуальны
 */
export function canReuseGeneratedCode(
  savedFingerprint: string | null | undefined,
  currentFingerprint: string,
  mainFileExists: boolean,
): boolean {
  if (!mainFileExists) return false;
  if (!savedFingerprint) return false;
  return savedFingerprint === currentFingerprint;
}
