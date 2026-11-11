/**
 * @fileoverview Краткое превью сохранённых данных пользователя с доступом к подробностям.
 */
import { Button } from '@/components/ui/button';
import { UserBotData } from '@shared/schema';

/** Свойства превью пользовательских данных. */
interface MobileUserDataPreviewProps {
  /** Данные пользователя. */
  user: UserBotData;
  /** Открывает полные сведения о пользователе. */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
}

/**
 * Получает безопасное краткое представление значения.
 * @param value - Сохранённое значение поля.
 * @returns Текст значения для превью.
 */
function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) return 'Нет значения';
  if (typeof value === 'object') {
    if ('value' in value) return formatPreviewValue(value.value);
    return Array.isArray(value) ? `Элементов: ${value.length}` : 'Составные данные';
  }
  return String(value);
}

/**
 * Показывает первое сохранённое поле, не выдавая его за последний ответ.
 * @param props - Пользователь и обработчик открытия подробностей.
 * @returns Строка превью и переход к данным.
 */
export function MobileUserDataPreview({ user, onOpenUserDetailsPanel }: MobileUserDataPreviewProps): React.JSX.Element {
  const entries = user.userData && typeof user.userData === 'object' && !Array.isArray(user.userData)
    ? Object.entries(user.userData) : [];
  const firstEntry = entries[0];
  return (
    <div className="flex min-w-0 items-center gap-3 border-t border-border/60 pt-3">
      <div className="min-w-0 flex-1 text-xs text-muted-foreground">
        {firstEntry ? (
          <div className="truncate" title={`${firstEntry[0]}: ${formatPreviewValue(firstEntry[1])}`}>
            {firstEntry[0]}: <span className="text-foreground">{formatPreviewValue(firstEntry[1])}</span>
          </div>
        ) : 'Нет сохранённых данных'}
      </div>
      {onOpenUserDetailsPanel && (
        <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs"
          onClick={() => onOpenUserDetailsPanel(user)} aria-label={`Открыть данные пользователя ${user.userId}`}>
          Данные{entries.length > 0 ? ` · ${entries.length}` : ''}
        </Button>
      )}
    </div>
  );
}
