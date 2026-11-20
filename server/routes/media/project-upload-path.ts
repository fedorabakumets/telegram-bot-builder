/** @fileoverview Пути временных файлов загрузки внутри выделенной папки проекта. */
import { randomUUID } from 'node:crypto';
import { mkdir, realpath, unlink } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { resolveUploadStagingPath } from '../../files/upload-staging-path';

/**
 * Принимает числовой идентификатор проекта из маршрута без лишних символов.
 * @param raw - Значение параметра маршрута.
 * @returns Положительный числовой идентификатор.
 */
export function parseProjectUploadId(raw: string): number {
  const projectId = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(projectId) || projectId < 1 || projectId > 2147483647) {
    throw Object.assign(new Error('Некорректный идентификатор проекта'), { status: 400 });
  }
  return projectId;
}

/**
 * Создаёт локальную папку загрузки. Корень можно смонтировать отдельно, вложенные ссылки запрещены.
 * @param projectId - Числовой идентификатор проекта.
 * @param date - Дата загрузки в формате ГГГГ-ММ-ДД.
 * @returns Абсолютный путь каталога для multer и импорта по ссылке.
 */
export async function ensureProjectUploadDirectory(projectId: number, date: string): Promise<string> {
  const project = String(parseProjectUploadId(String(projectId)));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Некорректная дата загрузки');
  const root = join(process.cwd(), 'uploads');
  await mkdir(root, { recursive: true });
  const physicalRoot = await realpath(root);
  const projectPath = join(root, project);
  const physicalProjectPath = join(physicalRoot, project);
  await mkdir(projectPath, { recursive: true });
  if (await realpath(projectPath) !== physicalProjectPath) throw new Error('Папка проекта находится вне места загрузки');
  const directory = join(projectPath, date);
  await mkdir(directory, { recursive: true });
  if (await realpath(directory) !== join(physicalProjectPath, date)) throw new Error('Папка загрузки является ссылкой');
  return directory;
}

/**
 * Создаёт уникальное имя для диска из безопасной основы и расширения.
 * @param originalName - Человекочитаемое имя, полученное при загрузке.
 * @param fallbackExtension - Расширение при отсутствии допустимого расширения.
 * @returns Сгенерированное имя файла без компонентов пути.
 */
export function createProjectUploadName(originalName: string, fallbackExtension: 'bin' | 'jpg'): string {
  const name = basename(originalName.replace(/\\/g, '/'));
  const suffix = extname(name).slice(1).toLowerCase();
  const extension = /^[a-z0-9]{1,16}$/.test(suffix) ? suffix : fallbackExtension;
  const baseName = name.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'file';
  return `${randomUUID()}-${baseName}.${extension}`;
}

/**
 * Удаляет только временный файл текущего проекта и сохраняет первоначальную ошибку обработки.
 * @param projectId - Идентификатор проекта из запроса.
 * @param stagedPath - Путь файла, выданный обработчиком загрузки.
 * @returns Завершение очистки.
 */
export async function cleanupProjectUpload(projectId: number, stagedPath?: string): Promise<void> {
  if (!stagedPath || !Number.isSafeInteger(projectId) || projectId < 1) return;
  try {
    const location = await resolveUploadStagingPath(stagedPath);
    const [project, date, name, ...extra] = location.key.split('/');
    if (project !== String(projectId) || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !name || extra.length) return;
    await unlink(location.path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.warn('Не удалось очистить временный файл загрузки');
  }
}
