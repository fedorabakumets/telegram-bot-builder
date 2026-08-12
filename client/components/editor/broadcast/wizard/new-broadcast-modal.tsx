/**
 * @fileoverview Модальное окно создания новой рассылки (wizard)
 * @module client/components/editor/broadcast/wizard/new-broadcast-modal
 */

import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StepAudience } from './step-audience';
import { StepMessage } from './step-message';
import { StepConfirm } from './step-confirm';
import { BroadcastProgress } from './broadcast-progress';
import { CampaignProgress } from './campaign-progress';
import { WizardStepper } from './wizard-stepper';
import { canNavigateBroadcastStep } from './can-navigate-broadcast-step';
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
  tokenIds: [],
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
  /** ID большой рассылки, если отправка идёт сразу от нескольких ботов */
  const [createdCampaignId, setCreatedCampaignId] = useState<number | null>(null);

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
    onSuccess: ({ broadcastId, campaignId }) => {
      // Несколько ботов — сервер вернул большую рассылку, показываем её общий прогресс
      if (campaignId) {
        setCreatedCampaignId(campaignId);
        setStep('progress');
        return;
      }
      if (!broadcastId) return;
      setCreatedBroadcast({
        id: broadcastId,
        projectId,
        campaignId: null,
        tokenId: tokenId ?? 0,
        name: formData.name,
        messageText: formData.messageText,
        filters: {},
        status: 'running',
        totalCount: 0,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        blockedCount: 0,
        deletedCount: 0,
        createdAt: new Date(),
        startedAt: null,
        finishedAt: null,
        mediaUrls: formData.mediaUrls ?? [],
        buttons: formData.buttons ?? [],
        buttonsPerRow: formData.buttonsPerRow ?? 0,
      });
      setStep('progress');
    },
  });

  const handleClose = () => {
    setStep(1);
    setFormData({ ...INITIAL_FORM, messageText: initialMessageText ?? '', mediaUrls: initialMediaUrls ?? [] });
    setCreatedBroadcast(null);
    setCreatedCampaignId(null);
    onClose();
  };

  /** Текущий номер шага для stepper */
  const currentStepNumber = typeof step === 'number' ? step : 3;

  /**
   * Доступен ли клик по шагу в stepper
   * @param target - Номер шага
   * @returns true если переход возможен
   */
  const isStepEnabled = (target: number) =>
    typeof step === 'number' && canNavigateBroadcastStep(target, step, formData);

  /**
   * Переход по клику на шаг в stepper
   * @param target - Номер шага
   */
  const handleStepClick = (target: number) => {
    if (target === 1 || target === 2 || target === 3) {
      if (isStepEnabled(target)) setStep(target);
    }
  };

  /** Общие пропсы stepper (ПК и мобилка) */
  const stepperProps = {
    steps: STEP_TITLES,
    currentStep: currentStepNumber,
    onStepClick: handleStepClick,
    isStepEnabled,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        hideClose
        className={[
          'p-0 gap-0 !flex flex-col overflow-hidden',
          // Мобилка — на весь экран
          'max-sm:!inset-auto max-sm:!left-0 max-sm:!top-0 max-sm:!translate-x-0 max-sm:!translate-y-0',
          'max-sm:!h-[100dvh] max-sm:!w-screen max-sm:!max-h-none max-sm:!max-w-none',
          'max-sm:rounded-none max-sm:border-0',
          // ПК — компактная карточка по ширине формы, без пустых полей по бокам
          'sm:!max-w-3xl sm:w-full sm:h-[min(90vh,840px)] sm:max-h-[min(90vh,840px)]',
          'sm:rounded-xl sm:border sm:shadow-2xl',
        ].join(' ')}
      >
        <div className="flex-shrink-0 border-b border-border/60 bg-card">
          <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3.5">
            <DialogHeader className="min-w-0 flex-1 space-y-0 text-left">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight sm:gap-2.5 sm:text-lg">
                <span className="hidden h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-muted/40 sm:flex">
                  <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden />
                </span>
                Новая рассылка
              </DialogTitle>
            </DialogHeader>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Закрыть"
              className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:h-9 sm:w-9 sm:rounded-lg"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>

          {step !== 'progress' && (
            <>
              <div className="flex items-center gap-3 border-t border-border/40 px-3 py-2 sm:hidden">
                <WizardStepper compact {...stepperProps} />
                <span className="truncate text-xs text-muted-foreground">
                  {currentStepNumber}/{STEP_TITLES.length} · {STEP_TITLES[currentStepNumber - 1]}
                </span>
              </div>
              <div className="hidden px-6 pb-3.5 sm:block">
                <WizardStepper {...stepperProps} />
              </div>
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
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
              tokenId={tokenId}
              formData={formData}
              isLoading={createMutation.isPending}
              onConfirm={() => createMutation.mutate(formData)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 'progress' && createdCampaignId && (
            <CampaignProgress
              projectId={projectId}
              campaignId={createdCampaignId}
              name={formData.name}
              refetch={refetch}
              onClose={handleClose}
            />
          )}
          {step === 'progress' && !createdCampaignId && createdBroadcast && (
            <BroadcastProgress
              projectId={projectId}
              broadcast={createdBroadcast}
              refetch={refetch}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
