/** @fileoverview Раздельные состояния загрузки, ошибки и пустого сохранённого запуска. */
import { Button } from '@/components/ui/button';

/** Состояние запроса не зависит от выбранного фильтра строк. */
interface LaunchHistoryStatusProps {
  /** Идёт первоначальная загрузка. */ isLoading: boolean;
  /** Последний запрос завершился ошибкой. */ isError: boolean;
  /** Выполняется повторный запрос. */ isRefreshing: boolean;
  /** Есть ранее загруженные строки, которые нельзя скрывать при сетевом сбое. */ hasLogs: boolean;
  /** Цвет обычного служебного текста. */ textClassName: string;
  /** Повторяет запрос выбранного запуска. */ onRetry: () => void;
}

/**
 * Показывает причину отсутствия данных, сохраняя таблицу при ошибке обновления.
 * @param props - Состояние запроса и действие повторной загрузки.
 * @returns Доступное сообщение либо отсутствие дополнительного блока.
 */
export function LaunchHistoryStatus({ isLoading, isError, isRefreshing, hasLogs, textClassName, onRetry }: LaunchHistoryStatusProps) {
  if (isLoading) return <div role="status" className={`flex-1 flex items-center justify-center ${textClassName} italic`}>Загрузка логов…</div>;
  if (isError) return (
    <div role="alert" className={`flex items-center justify-center gap-2 p-3 ${hasLogs ? 'shrink-0 flex-wrap border-b border-border/60' : 'flex-1 flex-col'}`}>
      {/* Перенос зависит от ширины панели: текст не сжимается до узкой колонки рядом с кнопкой. */}
      <span className={hasLogs ? 'min-w-0 basis-40 grow' : undefined}>{hasLogs ? 'Не удалось обновить логи. Показаны ранее загруженные строки.' : 'Не удалось загрузить логи запуска.'}</span>
      <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={isRefreshing} onClick={onRetry}>
        {isRefreshing ? 'Загрузка…' : 'Повторить загрузку'}
      </Button>
    </div>
  );
  if (isRefreshing) return <div role="status" className={`shrink-0 px-4 py-1 text-xs ${textClassName}`}>Обновление логов…</div>;
  if (!hasLogs) return <div role="status" className={`flex-1 flex items-center justify-center ${textClassName} italic`}>Логи не сохранены</div>;
  return null;
}
