/**
 * @fileoverview Компонент кнопки применения изменений
 *
 * Обрабатывает сохранение изменений узла и проекта.
 *
 * @module ApplyButton
 */

import { Button as UIButton } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * Пропсы компонента кнопки применения
 */
interface ApplyButtonProps {
  /** Функция обновления данных узла */
  onNodeUpdate?: () => void;
  /** Функция сохранения проекта */
  onSaveProject?: () => void;
  /** Функция логирования действий */
  onActionLog?: (type: string, description: string) => void;
}

/**
 * Компонент кнопки применения изменений
 *
 * Выполняет:
 * - Визуальное подтверждение применения
 * - Логирование действия
 * - Сохранение проекта
 *
 * @param {ApplyButtonProps} props - Пропсы компонента
 * @returns {JSX.Element} Кнопка применения
 */
export function ApplyButton({ onNodeUpdate, onSaveProject, onActionLog }: ApplyButtonProps) {
  const { toast } = useToast();

  const handleApply = () => {
    // Логируем применение изменений
    if (onActionLog) {
      onActionLog('apply', 'Применены изменения в панели свойств');
    }

    // Вызываем обновление узла (если передано)
    if (onNodeUpdate) {
      onNodeUpdate();
    }

    // Сохраняем проект
    if (onSaveProject) {
      onSaveProject();
    }

    // Показываем уведомление об успехе
    toast({
      title: 'Изменения применены',
      description: 'Проект сохранён',
    });
  };

  return (
    <UIButton
      size="sm"
      className="flex-1 text-xs sm:text-sm h-8 sm:h-9 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 transition-all duration-200 shadow-sm hover:shadow-md"
      onClick={handleApply}
    >
      <i className="fas fa-check mr-1.5"></i>
      Применить
    </UIButton>
  );
}
