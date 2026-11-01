/** @fileoverview Кнопка полноэкранного режима приложения с синхронизацией выхода через Escape. */
import { useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { cn } from '@/utils/utils';

/** Свойства кнопки полноэкранного режима. */
interface FullscreenButtonProps {
  /** Компактный вид бокового меню. */
  isCollapsed?: boolean;
}
/**
 * Переключает полноэкранный режим и отражает выход средствами браузера.
 * @param props - Режим отображения бокового меню.
 * @returns Кнопка переключения и сообщение при отказе браузера.
 */
export function FullscreenButton({ isCollapsed }: FullscreenButtonProps) {
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    /** Синхронизирует состояние при входе и выходе из полноэкранного режима. */
    const sync = () => setActive(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  /**
   * Запрашивает переключение в рамках пользовательского нажатия.
   * @returns Завершение запроса к браузеру.
   */
  async function toggle() {
    setPending(true);
    setError('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setError('Браузер не разрешил полноэкранный режим. Попробуйте F11.');
    } finally { setPending(false); }
  }
  const label = active ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим';
  return (
    <>
      <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={pending}
        onClick={toggle} className={cn('flex h-9 items-center gap-2 rounded-lg border border-transparent px-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40', isCollapsed ? 'w-9 justify-center px-0' : 'w-full')}>
        {active ? <Minimize className="h-4 w-4 shrink-0" /> : <Maximize className="h-4 w-4 shrink-0" />}
        {!isCollapsed && <span className="text-sm">{label}</span>}
      </button>
      {error && <p role="alert" className="max-w-full break-words text-xs text-destructive" title={error}>{isCollapsed ? 'F11' : error}</p>}
    </>
  );
}
