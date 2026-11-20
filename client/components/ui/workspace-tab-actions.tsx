/** @fileoverview Общие действия документации Docusaurus и обновления рабочей вкладки. */
import { BookOpen, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [feedbackUntil, setFeedbackUntil] = useState(0);
  /** Подтверждение нажатия видно даже при мгновенном обновлении. */
  useEffect(() => {
    if (!feedbackUntil) return;
    const timeout = window.setTimeout(() => setFeedbackUntil(0), Math.max(0, feedbackUntil - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [feedbackUntil]);

  return <div className="workspace-tab-actions flex shrink-0 items-center gap-2">
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
      <a href={`https://fedorabakumets.github.io/telegram-bot-builder/docs/${docsPath}`} target="_blank" rel="noopener noreferrer" aria-label={`Документация: ${section}`} title={`Документация: ${section}`}>
        <BookOpen className="h-4 w-4" aria-hidden="true" /><span>Документация</span>
      </a>
    </Button>
    {/* Сохраняем ширину, яркость и наведение кнопки во время запроса. */}
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
      onClick={() => {
        if (isRefreshing) return;
        setFeedbackUntil(Date.now() + 700);
        onRefresh();
      }} aria-disabled={isRefreshing}
      aria-label={`Обновить: ${section}`} title={`Обновить: ${section}`} aria-busy={isRefreshing}>
      {/* Вращение показывает ход запроса, не сдвигая подпись. */}
      <RefreshCw className={isRefreshing || feedbackUntil ? 'h-4 w-4 motion-safe:animate-spin' : 'h-4 w-4'}
        style={isRefreshing || feedbackUntil ? { color: '#3b82f6' } : undefined} aria-hidden="true" /><span>Обновить</span>
    </Button>
  </div>;
}
