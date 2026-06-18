/**
 * @fileoverview Заглушка когда строка лога из ?log= не найдена
 * @module terminal/TerminalLogNotFound
 */

import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Пропсы компонента */
interface TerminalLogNotFoundProps {
  /** ID строки из URL */
  logId: string;
  /** Закрыть панель */
  onClose: () => void;
}

/**
 * Панель «строка не найдена» вместо пустого экрана
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalLogNotFound({ logId, onClose }: TerminalLogNotFoundProps) {
  return (
    <div className="w-[380px] shrink-0 h-full bg-card border-l border-border flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-sm font-medium flex-1">Строка не найдена</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Закрыть">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-4 py-4 text-sm text-muted-foreground space-y-2">
        <p>
          Лог <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{logId}</code> недоступен.
        </p>
        <p className="text-xs leading-relaxed">
          Запись могла быть удалена при очистке терминала или истечении лимита хранения.
        </p>
      </div>
    </div>
  );
}
