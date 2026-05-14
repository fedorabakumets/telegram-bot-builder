/**
 * @fileoverview Модальное окно создания новой рассылки (wizard)
 * @module client/components/editor/broadcast/wizard/new-broadcast-modal
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StepAudience } from './step-audience';
import { StepMessage } from './step-message';
import { StepConfirm } from './step-confirm';
import { BroadcastProgress } from './broadcast-progress';
import { useCreateBroadcast } from '../hooks/use-create-broadcast';
import type { NewBroadcastFormData, Broadcast } from '../types';

/**
 * Пропсы компонента NewBroadcastModal
 */
interface NewBroadcastModalProps {
  /** Флаг открытия модального окна */
  open: boolean;
  /** Обработчик закрытия */
  onClose: () => void;
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId?: number | null;
  /** Колбэк обновления списка рассылок */
  refetch?: () => void;
  /** Предзаполненный текст сообщения (опционально) */
  initialMessageText?: string;
  /** Предзаполненные медиафайлы (опционально) */
  initialMediaUrls?: string[];
}

/** Начальные данные формы */
const INITIAL_FORM: NewBroadcastFormData = {
  name: '',
  messageText: '',
  mediaUrls: [],
  filters: { audienceType: 'all' },
};

/** Заголовки шагов wizard */
const STEP_TITLES = ['Аудитория', 'Сообщение', 'Подтверждение'];

/**
 * Модальное окно wizard создания рассылки.
 * Управляет шагами: аудитория → сообщение → подтверждение → прогресс.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент модального окна
 */
export function NewBroadcastModal({ open, onClose, projectId, tokenId, refetch, initialMessageText, initialMediaUrls }: NewBroadcastModalProps) {
  /** Если текст предзаполнен — пропускаем шаг сообщения */
  const skipMessageStep = !!initialMessageText;
  const [step, setStep] = useState<1 | 2 | 3 | 'progress'>(1);
  const [formData, setFormData] = useState<NewBroadcastFormData>({
    ...INITIAL_FORM,
    messageText: initialMessageText ?? '',
    mediaUrls: initialMediaUrls ?? [],
  });
  const [createdBroadcast, setCreatedBroadcast] = useState<Broadcast | null>(null);

  /** Синхронизируем messageText и mediaUrls при открытии модалки */
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        ...(initialMessageText ? { messageText: initialMessageText } : {}),
        ...(initialMediaUrls ? { mediaUrls: initialMediaUrls } : {}),
      }));
    }
  }, [open, initialMessageText, initialMediaUrls]);

  const updateForm = (data: Partial<NewBroadcastFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const createMutation = useCreateBroadcast({
    projectId,
    tokenId,
    refetch,
    onSuccess: (broadcastId) => {
      // Создаём временный объект broadcast для отображения прогресса
      setCreatedBroadcast({
        id: broadcastId,
        projectId,
        tokenId: tokenId ?? 0,
        name: formData.name,
        messageText: formData.messageText,
        filters: {},
        status: 'running',
        totalCount: 0,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        createdAt: new Date(),
        startedAt: null,
        finishedAt: null,
      });
      setStep('progress');
    },
  });

  const handleClose = () => {
    setStep(1);
    setFormData({ ...INITIAL_FORM, messageText: initialMessageText ?? '', mediaUrls: initialMediaUrls ?? [] });
    setCreatedBroadcast(null);
    onClose();
  };

  const title = step === 'progress'
    ? '📊 Прогресс рассылки'
    : skipMessageStep && step === 3
    ? '📢 Новая рассылка — Подтверждение'
    : `📢 Новая рассылка — ${STEP_TITLES[(step as number) - 1]}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <StepAudience
            projectId={projectId}
            tokenId={tokenId}
            formData={formData}
            onChange={updateForm}
            onNext={() => setStep(skipMessageStep ? 3 : 2)}
            onCancel={handleClose}
          />
        )}
        {step === 2 && (
          <StepMessage
            projectId={projectId}
            formData={formData}
            onChange={updateForm}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepConfirm
            projectId={projectId}
            formData={formData}
            isLoading={createMutation.isPending}
            onConfirm={() => createMutation.mutate(formData)}
            onBack={() => setStep(skipMessageStep ? 1 : 2)}
          />
        )}
        {step === 'progress' && createdBroadcast && (
          <BroadcastProgress
            projectId={projectId}
            broadcast={createdBroadcast}
            refetch={refetch}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
