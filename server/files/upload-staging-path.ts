/** @fileoverview Граница временных файлов загрузки и ключи объектов хранилища. */
import { realpath } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';

/** Физический путь загрузки и её логический ключ. */
interface UploadStagingPath {
  /** Путь с разрешённым родительским каталогом. */
  path: string;
  /** Относительное имя объекта в хранилище, всегда с POSIX-разделителями. */
  key: string;
}

/**
 * Вычисляет ключ только для файла внутри серверной папки загрузок.
 * @param stagedPath - Локальный путь подготовленного файла.
 * @returns Относительный ключ объекта.
 */
export function getUploadStagingKey(stagedPath: string): string {
  const root = resolve(process.cwd(), 'uploads');
  const target = resolve(stagedPath);
  if (!target.startsWith(root + sep)) throw new Error('Недопустимый путь загрузки');
  const key = target.slice(root.length + 1).split(sep).join('/');
  if (/[\u0000-\u001f\\:*?"<>|]/.test(key)) throw new Error('Недопустимое имя файла загрузки');
  return key;
}

/**
 * Проверяет физический каталог, позволяя разместить саму папку uploads по ссылке.
 * Переходы по ссылкам внутри неё запрещены, чтобы не менять каталог проекта.
 * @param stagedPath - Путь существующего или ещё не созданного файла.
 * @returns Проверенный путь назначения и ключ объекта.
 */
export async function resolveUploadStagingPath(stagedPath: string): Promise<UploadStagingPath> {
  const root = resolve(process.cwd(), 'uploads');
  const key = getUploadStagingKey(stagedPath);
  const canonicalRoot = await realpath(root);
  const directory = await realpath(dirname(join(root, key)));
  const expectedDirectory = dirname(join(canonicalRoot, key));
  if (directory !== expectedDirectory) throw new Error('Каталог загрузки не соответствует пути проекта');
  const target = join(directory, basename(key));
  if (!target.startsWith(canonicalRoot + sep)) throw new Error('Недопустимый путь загрузки');
  return { path: target, key };
}
