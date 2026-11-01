/**
 * @fileoverview Форма именованного чекпоинта с доступной валидацией и состоянием сохранения.
 * @module editor/versions/commit-form
 */
import { useId, useRef, useState, type FormEvent } from 'react';
import { GitCommit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkspaceActionButton as Button } from '@/components/ui/workspace-action-button';
import { useToast } from '@/hooks/use-toast';
import { useCreateProjectCommit } from '@/hooks/use-project-versions';

/** Свойства формы сохранения чекпоинта. */
export interface CommitFormProps {
  /** Идентификатор проекта. */
  projectId: number;
  /** Компактный режим для всплывающей панели. */
  compact?: boolean;
}

/**
 * Сохраняет текущее состояние проекта с понятным пользователю названием.
 * @param props - Проект и режим отображения формы.
 * @returns Форма чекпоинта с сообщениями валидации и ошибки запроса.
 */
export function CommitForm({ projectId, compact }: CommitFormProps) {
  const { toast } = useToast();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const commitMutation = useCreateProjectCommit(projectId);

  /**
   * Проверяет название и сохраняет чекпоинт без повторной отправки.
   * @param event - Событие отправки формы.
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (commitMutation.isPending) return;
    const text = message.trim();
    if (!text) {
      setFieldError(true);
      inputRef.current?.focus();
      return;
    }
    setRequestError(false);
    commitMutation.mutate({ message: text }, {
      /** Очищает форму после успешного сохранения. */
      onSuccess: () => {
        setMessage('');
        toast({ title: 'Чекпоинт сохранён', description: text });
      },
      /** Сохраняет название и показывает возможность повторной попытки. */
      onError: () => setRequestError(true),
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={commitMutation.isPending}
      className={compact ? 'space-y-2 px-3 py-2' : 'versions-surface versions-checkpoint space-y-3 rounded-xl border p-4'}>
      <div className={compact ? 'flex items-start gap-2' : 'checkpoint-fields flex items-end gap-3'}>
        <div className="min-w-0 flex-1 space-y-2">
          <div className={compact ? 'sr-only' : 'flex flex-wrap items-center justify-between gap-2'}>
            <Label htmlFor={`${id}-name`} className={`text-sm ${fieldError ? 'text-destructive' : ''}`}>Название чекпоинта</Label>
            <span className="text-xs text-muted-foreground">Обязательно</span>
          </div>
          <Input ref={inputRef} id={`${id}-name`} value={message} required disabled={commitMutation.isPending}
            onChange={(event) => { setMessage(event.target.value); if (event.target.value.trim()) setFieldError(false); }}
            placeholder="Например, настроен вход через Telegram" aria-invalid={fieldError}
            aria-describedby={fieldError ? `${id}-error` : undefined} className={`checkpoint-input text-sm ${compact ? 'h-8' : 'h-10 rounded-lg'}`} />
        </div>
        <Button type="submit" size={compact ? 'icon' : 'default'} disabled={commitMutation.isPending || (!!compact && !message.trim())}
          className={`versions-action shrink-0 px-3 font-semibold ${compact ? 'h-8 w-8' : ''}`} aria-label="Сохранить чекпоинт" title="Сохранить чекпоинт">
          <GitCommit className="h-4 w-4" aria-hidden="true" />
          {!compact && (commitMutation.isPending ? 'Сохранение…' : 'Сохранить')}
        </Button>
      </div>
      {!compact && !fieldError && <p className="text-pretty text-xs text-muted-foreground">Именованный снимок текущего состояния проекта.</p>}
      {fieldError && <p id={`${id}-error`} role="alert" className="text-pretty text-xs text-destructive">Укажите название, чтобы найти этот чекпоинт в истории.</p>}
      {requestError && <p role="alert" className="text-pretty text-sm text-destructive">Не удалось сохранить чекпоинт. Название сохранено в поле, попробуйте ещё раз.</p>}
    </form>
  );
}
