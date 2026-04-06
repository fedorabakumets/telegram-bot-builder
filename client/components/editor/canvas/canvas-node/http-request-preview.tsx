/**
 * @fileoverview Превью узла HTTP запроса на канвасе
 * @module components/editor/canvas/canvas-node/http-request-preview
 */
import { Node } from '@shared/schema';

/** Пропсы компонента превью HTTP запроса */
interface HttpRequestPreviewProps {
  /** Узел HTTP запроса */
  node: Node;
}

/** Цвета для HTTP методов */
const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PATCH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/** Метки типов аутентификации */
const AUTH_LABELS: Record<string, string> = {
  bearer: 'Bearer',
  basic: 'Basic',
  header: 'Header',
  query: 'Query',
};

/**
 * Считает количество query параметров из JSON строки
 * @param raw - JSON строка параметров
 * @returns количество параметров
 */
function countQueryParams(raw: string | undefined): number {
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => p.key).length : 0;
  } catch { return 0; }
}

/**
 * Компонент превью HTTP запроса на канвасе
 * @param props - свойства компонента
 * @returns JSX элемент
 */
export function HttpRequestPreview({ node }: HttpRequestPreviewProps) {
  const d = node.data;
  const method = (d.httpRequestMethod as string) || 'GET';
  const url = (d.httpRequestUrl as string) || 'URL не задан';
  const responseVar = d.httpRequestResponseVariable as string | undefined;
  const statusVar = d.httpRequestStatusVariable as string | undefined;
  const authType = (d.httpRequestAuthType as string) || 'none';
  const queryCount = countQueryParams(d.httpRequestQueryParams as string | undefined);
  const ignoreSsl = !!(d.httpRequestIgnoreSsl);
  const ignoreErrors = !!(d.httpRequestIgnoreHttpErrors);
  const noRedirects = d.httpRequestFollowRedirects === false;

  return (
    <div className="space-y-1.5 p-1">
      {/* Метод + URL */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${METHOD_COLORS[method] || METHOD_COLORS.GET}`}>
          {method}
        </span>
        <span className="text-xs text-muted-foreground break-all">{url}</span>
      </div>

      {/* Бейджи: auth + query params */}
      {(authType !== 'none' || queryCount > 0) && (
        <div className="flex items-center gap-1 flex-wrap">
          {authType !== 'none' && AUTH_LABELS[authType] && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
              {AUTH_LABELS[authType]}
            </span>
          )}
          {queryCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono">
              ?{queryCount} params
            </span>
          )}
        </div>
      )}

      {/* Переменная ответа */}
      {responseVar && (
        <div className="text-xs text-muted-foreground">
          <span className="text-slate-400 dark:text-slate-500">ответ → </span>
          <span className="font-mono text-cyan-600 dark:text-cyan-400">{'{' + responseVar + '}'}</span>
        </div>
      )}

      {/* Переменная статуса */}
      {statusVar && (
        <div className="text-xs text-muted-foreground">
          <span className="text-slate-400 dark:text-slate-500">статус → </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">{'{' + statusVar + '}'}</span>
        </div>
      )}

      {/* Иконки опций */}
      {(ignoreSsl || ignoreErrors || noRedirects) && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {ignoreSsl && <span title="Игнорировать SSL">🔒</span>}
          {noRedirects && <span title="Не следовать редиректам">↩</span>}
          {ignoreErrors && <span title="Игнорировать HTTP ошибки">⚠</span>}
        </div>
      )}
    </div>
  );
}
