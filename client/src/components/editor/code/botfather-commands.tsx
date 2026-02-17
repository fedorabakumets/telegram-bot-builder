/**
 * @fileoverview Компонент для отображения команд BotFather
 * Предоставляет функциональность для просмотра и копирования команд бота
 */

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BotData } from '@shared/schema';
import { useMemo } from 'react';

/**
 * Свойства компонента команд BotFather
 * @interface BotFatherCommandsProps
 */
interface BotFatherCommandsProps {
  /** Данные бота для генерации команд */
  botData: BotData;
}

/**
 * Компонент для отображения и копирования команд BotFather
 * @param botData - Данные бота для генерации команд
 * @returns JSX элемент компонента команд
 */
export function BotFatherCommands({ botData }: BotFatherCommandsProps) {
  const { toast } = useToast();

  /**
   * Генерация команд BotFather на основе узлов бота
   * Извлекает команды из всех листов бота
   */
  const botFatherCommands = useMemo(() => {
    const nodes: any[] = [];
    if ((botData as any).sheets && Array.isArray((botData as any).sheets)) {
      (botData as any).sheets.forEach((sheet: any) => {
        if (sheet.nodes && Array.isArray(sheet.nodes)) {
          nodes.push(...sheet.nodes);
        }
      });
    } else {
      nodes.push(...(botData.nodes || []));
    }

    const commandNodes = nodes.filter((node) =>
      (node.type === 'start' || node.type === 'command') &&
      node.data?.command &&
      node.data?.showInMenu !== false
    );

    if (commandNodes.length === 0) {
      return '';
    }

    return commandNodes
      .map((node) => {
        const command = node.data.command.replace('/', '');
        const description = node.data.description || 'Команда бота';
        return `${command} - ${description}`;
      })
      .join('\n');
  }, [botData]);

  /**
   * Копирование команд в буфер обмена
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(botFatherCommands);
      toast({
        title: 'Команды скопированы!',
        description: 'Команды для BotFather скопированы в буфер обмена',
      });
    } catch {
      toast({
        title: 'Ошибка копирования',
        description: 'Не удалось скопировать команды',
        variant: 'destructive',
      });
    }
  };

  if (!botFatherCommands) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 xs:p-4 rounded-lg border border-blue-200 dark:border-blue-800/40 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm xs:text-base">
          <i className="fas fa-robot mr-2"></i>
          Команды для @BotFather
        </h4>
        <Button onClick={copyToClipboard} variant="outline" size="sm" className="h-8 xs:h-9 text-xs">
          <i className="fas fa-copy mr-1.5"></i>
          <span className="hidden xs:inline">Копировать</span>
        </Button>
      </div>
      <pre className="bg-background p-2 xs:p-3 rounded text-xs overflow-auto max-h-32 border border-blue-200/50 dark:border-blue-800/30">
        {botFatherCommands}
      </pre>
    </div>
  );
}
