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
export function HttpRequestPreview({ node }: HttpRequestPreviewProps) {
  const method = node.data.httpRequestMethod || 'GET';
  const url = node.data.httpRequestUrl || 'URL не задан';
  const responseVar = node.data.httpRequestResponseVariable;

  return (
    <div className="space-y-2 p-1">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${METHOD_COLORS[method] || METHOD_COLORS.GET}`}>
          {method}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[160px]">{url}</span>
      </div>
      {responseVar && (
        <div className="text-xs text-muted-foreground">
          → <span className="font-mono text-cyan-600 dark:text-cyan-400">{'{' + responseVar + '}'}</span>
        </div>
      )}
    </div>
  );
}
