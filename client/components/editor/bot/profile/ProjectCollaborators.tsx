/**
 * @fileoverview Компонент управления участниками проекта
 * Список с именем/аватаром; добавление по Telegram ID.
 * @module ProjectCollaborators
 */

import { useId, useMemo, useState } from 'react';
import { Users, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjectCollaborators } from '@/components/editor/files/hooks/use-project-collaborators';
import { CollaboratorAvatar } from './collaborator-avatar';
import { useCollaborators } from './use-collaborators';

/** Пропсы компонента участников проекта */
interface ProjectCollaboratorsProps {
  /** ID проекта */
  projectId: number;
  /** ID владельца проекта; null означает, что владелец не назначен. */
  ownerId?: number | null;
  /** Имеет ли текущий пользователь права управления */
  canManage: boolean;
}

/**
 * Блок управления участниками проекта
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ProjectCollaborators({ projectId, ownerId, canManage }: ProjectCollaboratorsProps) {
  const useProfilesAsRoster = ownerId !== undefined;
  const roster = useCollaborators(projectId, !useProfilesAsRoster);
  const profiles = useProjectCollaborators(projectId);
  const { isAdding, isRemoving, add, remove, currentTelegramId } = roster;
  const { isLoading, isError, refetch } = useProfilesAsRoster ? profiles : roster;
  const [inputValue, setInputValue] = useState('');
  const inputErrorId = useId();

  const participants = useMemo(() => {
    if (useProfilesAsRoster) return profiles.collaborators;
    const byId = new Map(profiles.collaborators.map(profile => [profile.userId, profile]));
    return roster.collaborators.map(({ userId }) => byId.get(userId) ?? { userId, name: `ID ${userId}`, photoUrl: null });
  }, [profiles.collaborators, roster.collaborators, useProfilesAsRoster]);

  const writable = canManage && currentTelegramId !== null;
  const enteredId = inputValue.trim();
  const userId = Number(enteredId);
  const validId = /^[1-9]\d*$/.test(enteredId) && Number.isSafeInteger(userId);
  const inputError = enteredId && !validId ? 'Укажите целый положительный Telegram ID'
    : participants.some(participant => participant.userId === userId) ? 'У этого пользователя уже есть доступ'
    : '';
  const canAdd = writable && validId && !inputError && !isLoading && !isAdding && !isError;

  /**
   * Выдаёт доступ по корректному Telegram ID и очищает поле после успеха.
   * @param event - Событие отправки формы.
   */
  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canAdd && await add(userId)) setInputValue('');
  };

  return (
    <div className="flex flex-col gap-2.5 px-3.5 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-foreground">Участники проекта</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Доступ к проекту в конструкторе</p>
        </div>
        {isLoading && (
          <Loader2 className="mt-1 h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="Загрузка" />
        )}
      </div>

      <div className="space-y-1.5 pl-10">
        {isError && (
          <div className="text-xs text-destructive" role="alert">
            Не удалось загрузить участников.{' '}
            <button type="button" className="underline" onClick={() => void refetch()}>Повторить</button>
          </div>
        )}
        {participants.length === 0 && !isLoading && !isError && (
          <p className="text-xs text-muted-foreground/70">Нет участников</p>
        )}
        {participants.map(({ userId: participantId, name, photoUrl }) => {
          const isOwner = participantId === ownerId;
          return (
            <div key={participantId} className="flex items-center gap-2">
              <CollaboratorAvatar photoUrl={photoUrl} name={name} userId={participantId} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{participantId}</p>
              </div>
              {useProfilesAsRoster && (
                <span className="shrink-0 text-xs text-muted-foreground">{isOwner ? 'Владелец' : 'Участник'}</span>
              )}
              {writable && !isOwner && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(participantId)}
                  disabled={isRemoving}
                  aria-label={`Закрыть доступ участнику ${participantId}`}
                >
                  {isRemoving
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    : <X className="h-3.5 w-3.5" aria-hidden />}
                </Button>
              )}
            </div>
          );
        })}
        {writable && (
          <form onSubmit={handleAdd} className="pt-1">
            <div className="flex items-center gap-1.5">
              <Input
                className="h-8 flex-1 text-xs"
                placeholder="Telegram ID"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-label="Telegram ID нового участника"
                aria-invalid={Boolean(inputError)}
                aria-describedby={inputError ? inputErrorId : undefined}
                inputMode="numeric"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground"
                disabled={!canAdd}
                aria-label="Добавить участника"
              >
                {isAdding
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  : <Plus className="h-3.5 w-3.5" aria-hidden />}
              </Button>
            </div>
            {inputError && <p id={inputErrorId} className="mt-1 text-xs text-destructive">{inputError}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
