/**
 * @fileoverview Монтирование uploads в контейнер воркера.
 * Запись сохраняется, пока не включён WORKER_DOCKER_UPLOADS_READONLY.
 * @module server/bots/workerDockerMounts
 */

import { join } from "node:path";
import { isWorkerDockerIsolate, isWorkerUploadsReadonly } from "./workerDockerFlags";

/**
 * Собирает аргументы -v для каталогов uploads.
 * projectIds === null и выключенная изоляция — весь каталог, байт в байт как раньше.
 * При изоляции весь каталог не монтируется: только переданные ID.
 * Пустой список не подменяется всем uploads.
 * @param host - Перевод локального пути в путь хоста Docker
 * @param appRoot - Корень приложения на сервере
 * @param containerAppRoot - Корень приложения в контейнере
 * @param projectIds - Проекты воркера или null
 * @param env - Окружение с флагами изоляции и readonly
 * @returns пары "-v" и спецификации тома
 */
export function uploadVolumeArgs(
  host: (localPath: string) => string,
  appRoot: string,
  containerAppRoot: string,
  projectIds: readonly number[] | null,
  env: NodeJS.ProcessEnv,
): string[] {
  const readonly = isWorkerUploadsReadonly(env);
  const ids = projectIds === null && isWorkerDockerIsolate(env) ? [] : projectIds;
  const uploads = join(appRoot, "uploads");
  const spec = (hostPath: string, containerPath: string) =>
    readonly ? `${hostPath}:${containerPath}:ro` : `${hostPath}:${containerPath}`;
  if (ids === null) return ["-v", spec(host(uploads), `${containerAppRoot}/uploads`)];
  const args: string[] = [];
  for (const id of ids) {
    args.push("-v", spec(host(join(uploads, String(id))), `${containerAppRoot}/uploads/${id}`));
  }
  return args;
}
