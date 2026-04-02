/**
 * @fileoverview Компонент кнопок действий с кодом
 * Содержит кнопки "Копировать" и "Скачать"
 */

import { Button } from '@/components/ui/button';
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
}

/**
 * Компонент кнопок действий с кодом (копировать, скачать)
 * @param props - Свойства компонента
 * @returns JSX элемент с кнопками
 */
export function CodeActions({ content, selectedFormat, fileName }: CodeActionsProps) {
  const { toast } = useToast();

  /**
   * Копирует код в буфер обмена
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Скопировано!', description: 'Код скопирован в буфер обмена' });
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
    <div className="grid grid-cols-2 gap-2 xs:gap-2.5">
      <Button onClick={handleCopy} variant="outline" size="sm" className="w-full h-9 xs:h-10 text-xs xs:text-sm" data-testid="button-copy-code">
        <i className="fas fa-copy text-xs xs:text-sm"></i>
        <span className="hidden xs:inline ml-1.5">Копировать</span>
      </Button>
      <Button onClick={handleDownload} size="sm" className="w-full h-9 xs:h-10 text-xs xs:text-sm" data-testid="button-download-code">
        <i className="fas fa-download text-xs xs:text-sm"></i>
        <span className="hidden xs:inline ml-1.5">Скачать</span>
      </Button>
    </div>
  );
}
