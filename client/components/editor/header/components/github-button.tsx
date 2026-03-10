/**
 * @fileoverview Кнопка перехода на GitHub
 * @description Компактная кнопка для открытия репозитория проекта на GitHub
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
 * Компактная кнопка перехода на GitHub (только иконка)
 */
export function GithubButton({ className }: GithubButtonProps) {
  return (
    <Button
      size="icon"
      variant="ghost"
      asChild
      className={cn(
        'h-5 w-5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
        className
      )}
      data-testid="button-github"
    >
      <a
        href="https://github.com/fedorabakumets/telegram-bot-builder"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center"
      >
        <Github className="h-3.5 w-3.5" />
      </a>
    </Button>
  );
}
