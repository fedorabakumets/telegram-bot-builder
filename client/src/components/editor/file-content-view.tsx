/**
 * @fileoverview Компонент для отображения содержимого файла с использованием Monaco Editor
 * 
 * Этот компонент предоставляет интерфейс для просмотра содержимого
 * различных типов файлов с подсветкой синтаксиса.
 * 
 * @module FileContentView
 */

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CodeFormat } from '@/hooks/use-code-generator';

/**
 * Свойства компонента отображения содержимого файла
 * @interface FileContentViewProps
 */
interface FileContentViewProps {
  /** Содержимое файла для отображения */
  content: string;
  /** Формат кода для определения языка подсветки синтаксиса */
  format: CodeFormat;
  /** Название файла */
  fileName: string;
  /** Флаг загрузки */
  isLoading?: boolean;
  /** Обработчик закрытия панели просмотра */
  onClose?: () => void;
}

/**
 * Компонент для отображения содержимого файла
 * 
 * Использует Monaco Editor для отображения содержимого файла
 * с соответствующей подсветкой синтаксиса.
 * 
 * @param {FileContentViewProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент отображения содержимого файла
 */
export const FileContentView: React.FC<FileContentViewProps> = ({
  content,
  format,
  fileName,
  isLoading = false,
  onClose
}) => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Определение языка для подсветки синтаксиса в зависимости от формата
  const getLanguage = (): string => {
    switch (format) {
      case 'python':
        return 'python';
      case 'json':
        return 'json';
      case 'requirements':
        return 'plaintext'; // requirements.txt не имеет специального языка
      case 'readme':
        return 'markdown';
      case 'dockerfile':
        return 'dockerfile';
      case 'config':
        return 'yaml';
      default:
        return 'plaintext';
    }
  };

  // Определение темы редактора в зависимости от текущей темы приложения
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  /**
   * Копирование содержимого в буфер обмена
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Содержимое скопировано!",
        description: "Содержимое файла скопировано в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать содержимое в буфер обмена",
        variant: "destructive",
      });
    }
  };

  /**
   * Скачивание файла
   */
  const downloadFile = () => {
    const fileExtensions: Record<CodeFormat, string> = {
      python: '.py',
      json: '.json',
      requirements: '.txt',
      readme: '.md',
      dockerfile: '',
      config: '.yaml'
    };

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName + fileExtensions[format];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Файл загружен!",
      description: `Файл ${link.download} успешно загружен`,
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Заголовок панели */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {format.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate">{fileName}</h3>
            <p className="text-xs text-muted-foreground truncate capitalize">{format}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            disabled={isLoading}
            title="Копировать содержимое"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={downloadFile}
            disabled={isLoading}
            title="Скачать файл"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Закрыть"
          >
            ×
          </Button>
        </div>
      </div>

      {/* Содержимое редактора */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm text-muted-foreground">Загрузка содержимого файла...</p>
            </div>
          </div>
        ) : (
          <Editor
            value={content}
            language={getLanguage()}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            options={{
              readOnly: true,
              lineNumbers: 'on',
              wordWrap: 'on',
              minimap: { enabled: content.split('\n').length > 30 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontSize: 12,
              tabSize: 2,
            }}
          />
        )}
      </div>
    </div>
  );
};