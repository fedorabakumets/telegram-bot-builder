/** @fileoverview Общие действия документации Docusaurus и обновления рабочей вкладки. */
import { BookOpen, RefreshCw } from 'lucide-react';
import { Button } from './button';

/** Параметры служебных действий вкладки. */
interface WorkspaceTabActionsProps {
  /** Относительный путь документации внутри Docusaurus. */
  docsPath: string;
  /** Название раздела для доступных подписей. */
  section: string;
  /** Обновить данные текущей вкладки. */
  onRefresh: () => void;
  /** Запрос уже выполняется. */
  isRefreshing?: boolean;
}

/**
 * Показывает документацию и обновление с компактными подписями на широких панелях.
 * @param props - Раздел документации и обработчик обновления
 * @returns Группа служебных действий
 */
export function WorkspaceTabActions({ docsPath, section, onRefresh, isRefreshing = false }: WorkspaceTabActionsProps) {
  return <div className="workspace-tab-actions flex shrink-0 items-center gap-2">
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
      <a href={`https://fedorabakumets.github.io/telegram-bot-builder/docs/${docsPath}`} target="_blank" rel="noopener noreferrer" aria-label={`Документация: ${section}`} title={`Документация: ${section}`}>
        <BookOpen className="h-4 w-4" aria-hidden="true" /><span>Документация</span>
      </a>
    </Button>
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onRefresh} disabled={isRefreshing}
      aria-label={`Обновить: ${section}`} title={`Обновить: ${section}`} aria-busy={isRefreshing}>
      <RefreshCw className="h-4 w-4" aria-hidden="true" /><span>{isRefreshing ? 'Обновление…' : 'Обновить'}</span>
    </Button>
  </div>;
}
