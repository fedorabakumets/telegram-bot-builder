/**
 * @fileoverview Локальные состояния загрузки и ошибки списка пользователей.
 */
import { Button } from '@/components/ui/button';

/** Параметры состояния списка. */
interface UsersListStateProps {
  /** Выполняется первоначальный запрос. */
  pending?: boolean;
  /** Ошибка получения пользователей. */
  error?: Error | null;
  /** Повторяет запрос данных. */
  onRetry: () => void;
}

/**
 * Сохраняет фильтры доступными во время загрузки и при ошибке.
 * @param props - Состояние запроса и повторная загрузка.
 * @returns Сообщение о состоянии или пустой результат.
 */
export function UsersListState({ pending, error, onRetry }: UsersListStateProps): React.JSX.Element | null {
  if (pending) return (
    <div role="status" aria-label="Загрузка пользователей" className="space-y-3 py-4 motion-reduce:animate-none">
      {[0, 1, 2].map((key) => <div key={key} aria-hidden="true" className="space-y-4 rounded-lg border border-border p-4">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-8 w-full rounded bg-muted" />
      </div>)}
    </div>
  );
  if (!error) return null;
  return (
    <div role="alert" className="space-y-3 rounded-md border border-border p-6 text-center">
      <p className="text-sm font-medium">Не удалось загрузить пользователей</p>
      <p className="text-sm text-muted-foreground">Проверьте соединение и повторите попытку.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Повторить</Button>
    </div>
  );
}
