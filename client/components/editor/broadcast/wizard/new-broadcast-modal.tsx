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
import { WizardStepper } from './wizard-stepper';
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
  buttons: [],
  buttonsPerRow: 0,
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

  /** Текущий номер шага для stepper */
  const currentStepNumber = typeof step === 'number' ? step : 3;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className={[
          '!inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0',
          '!w-screen !h-screen !max-w-none !max-h-screen',
          'sm:!max-w-none md:!max-w-none lg:!max-w-none',
          'rounded-none border-0 p-0 gap-0',
          '!flex flex-col overflow-hidden',
          'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100',
          'data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0',
          'data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0',
        ].join(' ')}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          transform: 'none',
        }}
      >
        <div className="flex-shrink-0 px-4 sm:px-8 pt-4 sm:pt-6 pb-3 border-b border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              📢 Новая рассылка
            </DialogTitle>
          </DialogHeader>

          {step !== 'progress' && (
            <div className="mt-4 max-w-3xl">
              <WizardStepper steps={STEP_TITLES} currentStep={currentStepNumber} />
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="mx-auto w-full max-w-3xl">
            {step === 1 && (
              <StepAudience
                projectId={projectId}
                tokenId={tokenId}
                formData={formData}
                onChange={updateForm}
                onNext={() => setStep(2)}
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
                onBack={() => setStep(2)}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
