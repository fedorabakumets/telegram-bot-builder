/**
 * @fileoverview Компактная ссылка на справку по файловому хранилищу.
 */
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Открывает документацию из правой части заголовка вкладки.
 * @returns Кнопка-ссылка с доступным названием
 */
export function FileStorageDocsLink() {
  return (
    <Button variant="ghost" size="icon" className="files-action h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
      <a href="https://fedorabakumets.github.io/wikinest/interface/files" target="_blank" rel="noopener noreferrer"
        aria-label="Документация по файлам" title="Документация по файлам" data-testid="file-storage-docs-link">
        <BookOpen className="h-4 w-4" aria-hidden="true" />
        <span className="files-heading-action-label">Документация</span>
      </a>
    </Button>
  );
}
