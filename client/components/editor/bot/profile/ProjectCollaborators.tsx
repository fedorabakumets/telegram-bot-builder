/**
 * @fileoverview Компонент управления участниками проекта
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
  /** Имеет ли текущий пользователь права управления */
  canManage: boolean;
}

/**
 * Блок управления участниками проекта
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ProjectCollaborators({ projectId, canManage }: ProjectCollaboratorsProps) {
  const { collaborators, isLoading, isAdding, isRemoving, add, remove } =
    useCollaborators(projectId);
  const [inputValue, setInputValue] = useState('');

  /** Добавить участника по Telegram ID */
  const handleAdd = async () => {
    const userId = parseInt(inputValue.trim(), 10);
    if (!userId || isNaN(userId)) return;
    await add(userId);
    setInputValue('');
  };

  /**
   * Enter в поле ввода — добавить
   * @param e - Событие клавиатуры
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="flex flex-col gap-2.5 px-3.5 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-foreground">Коллабораторы</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Доступ к проекту</p>
        </div>
        {isLoading && (
          <Loader2 className="mt-1 h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="Загрузка" />
        )}
      </div>

      <div className="space-y-1.5 pl-10">
        {collaborators.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground/70">Нет коллабораторов</p>
        )}
        {collaborators.map((collab) => (
          <div key={collab.userId} className="flex items-center gap-1.5">
            <span className="flex-1 truncate text-xs text-foreground">{collab.userId}</span>
            {canManage && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(collab.userId)}
                disabled={isRemoving}
                aria-label={`Удалить коллаборатора ${collab.userId}`}
              >
                {isRemoving
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  : <X className="h-3.5 w-3.5" aria-hidden />}
              </Button>
            )}
          </div>
        ))}
        {canManage && (
          <div className="flex items-center gap-1.5">
            <Input
              className="h-8 flex-1 text-xs"
              placeholder="Telegram ID"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Telegram ID нового коллаборатора"
              type="number"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              onClick={handleAdd}
              disabled={isAdding || !inputValue.trim()}
              aria-label="Добавить коллаборатора"
            >
              {isAdding
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                : <Plus className="h-3.5 w-3.5" aria-hidden />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
