/**
 * @fileoverview Форма создания ручного коммита-чекпоинта проекта
 *
 * Маленький инпут сообщения + кнопка сохранения. Переиспользуется в попапе
 * тулбара и во вкладке истории версий.
 *
 * @module editor/versions/commit-form
 */

import { useCallback, useState } from 'react';
import { GitCommit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCreateProjectCommit } from '@/hooks/use-project-versions';

/** Пропсы формы создания чекпоинта */
export interface CommitFormProps {
  /** ID проекта */
  projectId: number;
  /** Компактный режим (для узкого попапа тулбара) */
  compact?: boolean;
}

/**
 * Форма создания ручного коммита-чекпоинта
 * @param props - Свойства компонента
 * @returns JSX элемент формы
 */
export function CommitForm({ projectId, compact }: CommitFormProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const commitMutation = useCreateProjectCommit(projectId);

  /** Обработчик сохранения чекпоинта */
  const handleSubmit = useCallback(() => {
    const text = message.trim();
    if (!text || commitMutation.isPending) return;
    commitMutation.mutate({ message: text }, {
      onSuccess: () => {
        setMessage('');
        toast({ title: 'Чекпоинт создан', description: text });
      },
      onError: () => {
        toast({ title: 'Ошибка', description: 'Не удалось создать чекпоинт', variant: 'destructive' });
      },
    });
  }, [message, commitMutation, toast]);

  return (
    <div className={`flex items-center gap-2 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="Название чекпоинта…"
        className="h-8 text-sm"
      />
      <Button
        size={compact ? 'icon' : 'sm'}
        className={compact ? 'h-8 w-8 shrink-0' : 'shrink-0'}
        disabled={!message.trim() || commitMutation.isPending}
        onClick={handleSubmit}
        title="Сохранить чекпоинт"
      >
        <GitCommit className={compact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 mr-1.5'} />
        {!compact && (commitMutation.isPending ? 'Сохранение…' : 'Сохранить чекпоинт')}
      </Button>
    </div>
  );
}
