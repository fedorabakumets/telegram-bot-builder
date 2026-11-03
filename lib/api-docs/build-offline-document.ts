/** @fileoverview Сборка зарегистрированных контрактов без запуска HTTP-сервера, фоновых задач и базы. */
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { documentedRegistry } from '../../server/swagger/register-documented-paths';
import { withStableOperationIds } from './operation-ids';

/**
 * Собирает только явно документированные маршруты; не подменяет аудит runtime-покрытия.
 * @param previous - Предыдущий снимок для явного сохранения ещё не описанных runtime-маршрутов.
 * @returns Документ из реестра контрактов без побочных эффектов registerRoutes.
 */
export function buildOfflineDocument(previous?: Record<string, any>) {
  const generator = new OpenApiGeneratorV3(documentedRegistry.definitions);
  const document = generator.generateDocument({
    openapi: '3.0.3',
    info: { title: 'Telegram Bot Builder API', version: '2.2.0.5', description:
      'Явно документированные контракты. Сборка без запуска приложения; не включает автоматически обнаруживаемые недокументированные маршруты.' },
    security: [{ cookieAuth: [] }, { agentToken: [] }],
  });
  /** Старые runtime-only пути сохраняются явно как неперепроверенные, а не исчезают из документа. */
  const paths = { ...(previous?.paths ?? {}) };
  for (const [path, methods] of Object.entries(paths)) {
    paths[path] = Object.fromEntries(Object.entries(methods as Record<string, any>).map(([method, operation]) =>
      [method, { ...operation, 'x-offline-unverified': true }]));
  }
  for (const [path, methods] of Object.entries(document.paths)) paths[path] = { ...(paths[path] ?? {}), ...methods };
  return withStableOperationIds({ ...document, paths, components: {
    ...previous?.components, ...document.components,
    schemas: { ...previous?.components?.schemas, ...document.components?.schemas },
  } });
}
