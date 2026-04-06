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

/**
 * Компонент превью HTTP запроса на канвасе
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
/**
 * Парсит JSON-строку заголовков и возвращает массив пар ключ-значение
 * @param raw - сырая JSON-строка заголовков
 * @returns массив пар [ключ, значение]
 */
function parseHeaders(raw: string | undefined): [string, string][] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed) as [string, string][];
    }
  } catch {
    // невалидный JSON — не показываем
  }
  return [];
}

/**
 * Компонент превью HTTP запроса на канвасе
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function HttpRequestPreview({ node }: HttpRequestPreviewProps) {
  const method = node.data.httpRequestMethod || 'GET';
  const url = node.data.httpRequestUrl || 'URL не задан';
  const responseVar = node.data.httpRequestResponseVariable;
  const headers = parseHeaders(node.data.httpRequestHeaders as string | undefined);

  return (
    <div className="space-y-2 p-1">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${METHOD_COLORS[method] || METHOD_COLORS.GET}`}>
          {method}
        </span>
        <span className="text-xs text-muted-foreground break-all">{url}</span>
      </div>
      {headers.length > 0 && (
        <div className="space-y-0.5">
          {headers.map(([key, value]) => (
            <div key={key} className="text-xs font-mono text-muted-foreground break-all">
              <span className="text-violet-500 dark:text-violet-400">{key}:</span> {value}
            </div>
          ))}
        </div>
      )}
      {responseVar && (
        <div className="text-xs text-muted-foreground">
          → <span className="font-mono text-cyan-600 dark:text-cyan-400">{'{' + responseVar + '}'}</span>
        </div>
      )}
    </div>
  );
}
