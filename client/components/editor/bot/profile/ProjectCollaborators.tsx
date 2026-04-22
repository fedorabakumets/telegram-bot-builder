/**
 * @fileoverview Компонент управления участниками проекта
 *
 * Отображает список коллабораторов проекта с возможностью
 * добавления и удаления (только для владельца проекта).
 *
 * @module ProjectCollaborators
 */

import { useState } from 'react';
import { Users, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCollaborators } from './use-collaborators';

/** Пропсы компонента участников проекта */
interface ProjectCollaboratorsProps {
  /** ID проекта */
  projectId: number;
  /** Является ли текущий пользователь владельцем проекта */
  isOwner: boolean;
}

/**
 * Блок управления участниками проекта
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ProjectCollaborators({ projectId, isOwner }: ProjectCollaboratorsProps) {
  const { collaborators, isLoading, isAdding, isRemoving, add, remove } =
    useCollaborators(projectId);

  /** Значение поля ввода нового участника */
  const [inputValue, setInputValue] = useState('');

  /**
   * Обработчик добавления участника
   */
  const handleAdd = async () => {
    const userId = parseInt(inputValue.trim(), 10);
    if (!userId || isNaN(userId)) return;
    await add(userId);
    setInputValue('');
  };

  /**
   * Обработчик нажатия Enter в поле ввода
   * @param e - Событие клавиатуры
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="flex flex-col gap-2 p-2.5 sm:p-3 rounded-lg border transition-all bg-blue-500/8 border-blue-500/30 dark:bg-blue-500/10 dark:border-blue-500/40 col-span-full">
      {/* Заголовок блока */}
      <div className="flex items-center gap-2">
        <Users
          className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400"
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 flex-1">
          Участники
        </span>
        {isLoading && (
          <Loader2
            className="w-3.5 h-3.5 animate-spin text-blue-500"
            aria-label="Загрузка участников"
          />
        )}
      </div>

      {/* Список коллабораторов */}
      {collaborators.length === 0 && !isLoading && (
        <p className="text-xs text-blue-500/60 dark:text-blue-400/50 pl-0.5">
          Нет участников
        </p>
      )}

      {collaborators.map((collab) => (
        <div key={collab.userId} className="flex items-center gap-1.5">
          <span className="text-xs flex-1 text-blue-700 dark:text-blue-300 truncate">
            {collab.userId}
          </span>
          {isOwner && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-shrink-0 text-blue-400 hover:text-blue-600 hover:bg-blue-500/20"
              onClick={() => remove(collab.userId)}
              disabled={isRemoving}
              aria-label={`Удалить участника ${collab.userId}`}
              title="Удалить участника"
            >
              {isRemoving
                ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                : <X className="w-3 h-3" aria-hidden="true" />
              }
            </Button>
          )}
        </div>
      ))}

      {/* Поле добавления нового участника (только для владельца) */}
      {isOwner && (
        <div className="flex items-center gap-1.5">
          <Input
            className="h-7 text-xs flex-1 bg-transparent border-blue-500/30 focus-visible:ring-blue-500/40 text-blue-700 dark:text-blue-300 placeholder:text-blue-400/60"
            placeholder="Telegram ID участника"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Telegram ID нового участника"
            type="number"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
            onClick={handleAdd}
            disabled={isAdding || !inputValue.trim()}
            aria-label="Добавить участника"
            title="Добавить участника"
          >
            {isAdding
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              : <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            }
          </Button>
        </div>
      )}
    </div>
  );
}
