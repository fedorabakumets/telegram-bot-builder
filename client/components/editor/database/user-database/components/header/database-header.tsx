/**
 * @fileoverview Компонент компактного заголовка вкладки "Пользователи"
 * @description Строка с иконкой, названием и кнопкой обновления
 */

import { Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Пропсы компонента DatabaseHeader
 */
interface DatabaseHeaderProps {
  /** Название проекта */
  projectName: string;
  /** Обработчик нажатия кнопки обновить */
  onRefresh?: () => void;
}

/**
 * Компактный заголовок панели базы данных пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент заголовка
 */
export function DatabaseHeader({ projectName: _projectName, onRefresh }: DatabaseHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">Пользователи</h2>
      </div>
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
          title="Обновить данные"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          <span className="text-xs">Обновить</span>
        </Button>
      )}
    </div>
  );
}
