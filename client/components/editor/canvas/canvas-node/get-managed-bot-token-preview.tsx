/**
 * @fileoverview Превью узла получения токена управляемого бота на канвасе
 * @module components/editor/canvas/canvas-node/get-managed-bot-token-preview
 */
import { Node } from '@shared/schema';

/** Пропсы компонента превью узла получения токена */
interface GetManagedBotTokenPreviewProps {
  /** Узел получения токена управляемого бота */
  node: Node;
}

/**
 * Компонент превью узла получения токена управляемого бота на канвасе.
 * Отображает источник bot_id и переменную для сохранения токена.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function GetManagedBotTokenPreview({ node }: GetManagedBotTokenPreviewProps) {
  const data = node.data as any;
  const source = data.botIdSource || 'variable';
  const isVariable = source === 'variable';
  const botIdLabel = isVariable
    ? (data.botIdVariable || 'bot_id')
    : (data.botIdManual || '—');
  const tokenVar = data.saveTokenTo || 'bot_token';

  return (
    <div className="space-y-2 p-1">
      <div className="flex items-center gap-2">
        <span className="text-base">🔑</span>
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          Получить токен бота
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {isVariable ? 'Из переменной: ' : 'ID бота: '}
        <span className="font-mono text-indigo-600 dark:text-indigo-400">
          {isVariable ? `{${botIdLabel}}` : botIdLabel}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {'→ '}
        <span className="font-mono text-indigo-600 dark:text-indigo-400">
          {'{' + tokenVar + '}'}
        </span>
      </div>
    </div>
  );
}
