/** @fileoverview Явная проверка оставшихся динамических семейств маршрутов без выполнения серверного кода. */
import type { SourceRouteCandidate } from './source-route-candidates';

/** Результат ручного сопоставления динамического семейства. */
interface DynamicRouteReview {
  /** Исходная регистрация. */
  candidate: SourceRouteCandidate;
  /** Конкретные маршруты семейства. */
  routes: string[];
  /** Проверенное основание сопоставления либо исключения. */
  reason: string;
}

/**
 * Связывает изученные динамические выражения с контрактами; неизвестные выражения остаются незакрытыми.
 * @param candidates - Статические кандидаты регистрации.
 * @param paths - Контракты OpenAPI.
 * @returns Известные семейства, middleware/HTML и требующие исследования выражения.
 */
export function reviewDynamicRoutes(candidates: SourceRouteCandidate[], paths: Record<string, Record<string, unknown>>) {
  const reviewed: DynamicRouteReview[] = [];
  const unresolved: SourceRouteCandidate[] = [];
  for (const candidate of candidates.filter(entry => !entry.resolvedPath)) {
    let routes: string[] = [];
    let reason = '';
    if (candidate.method === 'USE') reason = 'Middleware или статический mount, не отдельная HTTP-операция; не доказательство отсутствия вложенных Router.';
    else if (candidate.file === 'server/admin/setup-admin-routes.ts' && candidate.expression === 'pagePath') reason = 'Пути HTML-страниц админки из pageRoutes; не /api.';
    else if (candidate.file === 'server/auth/agent/routes.ts' && candidate.expression === '`/api/auth/agent/${action}`') {
      routes = ['telegram', 'disconnect'].map(action => `/api/auth/agent/${action}`);
      reason = 'Проверен литеральный цикл telegram/disconnect; операции намеренно не публикуются в MCP.';
    } else if (candidate.file === 'server/routes/media/s3-proxy-route.ts' && candidate.expression === '`${S3_PROXY_BASE}/:configId/*`') {
      routes = ['/api/media/s3-proxy/{configId}/*'];
      reason = 'S3_PROXY_BASE — литерал /api/media/s3-proxy в storage/s3-backend; проверен отдельно от выполнения.';
    } else if (candidate.file === 'server/routes/analytics/acquisition/routes.ts') {
      const suffixes: Record<string, string> = {
        '`${base}/${resource}/:resourceId/history`': '/{resourceId}/history',
        '`${base}/${resource}`': '',
        '`${base}/${resource}/:resourceId`': '/{resourceId}',
      };
      if (Object.hasOwn(suffixes, candidate.expression)) {
        routes = ['sources', 'placements', 'links', 'expenses'].map(resource => `/api/projects/{id}/analytics/acquisition/${resource}${suffixes[candidate.expression]}`);
        reason = 'Проверены base и четыре ключа RESOURCE_TABLES; схемы используют те же общие валидаторы.';
      }
    }
    if (!reason || routes.some(route => !paths[route]?.[candidate.method.toLowerCase()])) unresolved.push(candidate);
    else reviewed.push({ candidate, routes, reason });
  }
  return { reviewed, unresolved };
}
