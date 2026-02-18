/**
 * @fileoverview Компонент кнопки синхронизации проектов из файлов
 * Позволяет синхронизировать проекты из директории bots/ с базой данных
 */

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface SyncFromFileButtonProps {
  /** Функция для обновления списка проектов после синхронизации */
  onSyncComplete?: () => void;
}

/**
 * Кнопка для синхронизации проектов из файлов в директории bots/
 *
 * @component
 * @param {SyncFromFileButtonProps} props - Свойства компонента
 * @param {function} props.onSyncComplete - Функция, вызываемая после успешной синхронизации
 * @returns {JSX.Element} Кнопка синхронизации
 */
export function SyncFromFileButton({ onSyncComplete }: SyncFromFileButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSync = async () => {
    try {
      // Выполняем запрос на синхронизацию
      const response = await fetch('/api/projects/import-from-files', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Показываем уведомление о результате
      toast({
        title: "Синхронизация завершена",
        description: `Импортировано ${result.length} проектов из файлов`,
      });

      // Обновляем кэш запросов
      await queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      // Также инвалидируем все запросы, связанные с конкретными проектами
      const projectKeys = queryClient.getQueryCache().findAll().map(query => query.queryKey).filter(key => 
        Array.isArray(key) && key[0]?.toString().startsWith('/api/projects/')
      );
      for (const key of projectKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      
      // Вызываем колбэк, если он передан
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Ошибка при синхронизации проектов из файлов:', error);
      toast({
        title: "Ошибка синхронизации",
        description: "Не удалось импортировать проекты из файлов",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      title="Синхронизировать проекты из файлов"
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      Синхронизировать из файлов
    </Button>
  );
}