/**
 * @fileoverview Кнопка перехода на GitHub
 * @description Мобильная кнопка для открытия репозитория проекта на GitHub
 */

import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства кнопки GitHub
 */
export interface GithubButtonProps {
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Мобильная кнопка перехода на GitHub
 */
export function GithubButton({ className }: GithubButtonProps) {
  return (
    <Button
      size="sm"
      asChild
      className={cn(
        'flex items-center justify-center gap-2 px-3 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium text-xs sm:text-sm transition-all',
        className
      )}
      data-testid="button-mobile-github"
    >
      <a
        href="https://github.com/fedorabakumets/telegram-bot-builder"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full"
      >
        <Github className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        <span>GitHub</span>
      </a>
    </Button>
  );
}
