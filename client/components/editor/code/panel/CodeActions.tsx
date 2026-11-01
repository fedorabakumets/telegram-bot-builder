/**
 * @fileoverview Компонент кнопок действий с кодом
 * Содержит кнопки "Копировать" и "Скачать"
 */

import { WorkspaceActionButton as Button } from '@/components/ui/workspace-action-button';
import { useToast } from '@/hooks/use-toast';
import { CodeFormat } from '../hooks/use-code-generator';

/**
 * Свойства компонента кнопок действий
 */
interface CodeActionsProps {
  /** Содержимое кода для копирования/скачивания */
  content: string;
  /** Выбранный формат */
  selectedFormat: CodeFormat;
  /** Название файла для скачивания (без расширения) */
  fileName: string;
  /** Выполняется ли генерация файла. */
  isLoading?: boolean;
}

/**
 * Компонент кнопок действий с кодом (копировать, скачать)
 * @param props - Свойства компонента
 * @returns JSX элемент с кнопками
 */
export function CodeActions({ content, selectedFormat, fileName, isLoading }: CodeActionsProps) {
  const { toast } = useToast();
  const unavailable = !!isLoading || !content.trim() || content.startsWith('# Ошибка');

  /**
   * Копирует код в буфер обмена
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: 'Код скопирован', description: 'Можно вставить его в редактор.' });
    } catch {
      toast({ title: 'Не удалось скопировать', description: 'Разрешите доступ к буферу обмена или скачайте файл.', variant: 'destructive' });
    }
  };

  /**
   * Скачивает файл с кодом
   */
  const handleDownload = () => {
    const extensions: Record<CodeFormat, string> = {
      python: '.py', json: '.json', requirements: '.txt',
      readme: '.md', dockerfile: '', env: '',
    };
    const names: Record<CodeFormat, string> = {
      python: fileName, json: `${fileName}_data`, requirements: `requirements_${fileName}`,
      readme: `README_${fileName}`, dockerfile: `Dockerfile_${fileName}`, env: `.env_${fileName}`,
    };
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = names[selectedFormat] + extensions[selectedFormat];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Файл скачан', description: `Файл ${link.download} успешно загружен` });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button onClick={handleCopy} disabled={unavailable} variant="outline" className="code-action w-full px-3 text-sm font-semibold" data-testid="button-copy-code">
        Копировать
      </Button>
      <Button onClick={handleDownload} disabled={unavailable} className="code-action w-full px-3 text-sm font-semibold" data-testid="button-download-code">
        Скачать файл
      </Button>
    </div>
  );
}
