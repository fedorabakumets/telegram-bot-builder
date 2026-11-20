/**
 * @fileoverview Панель диалога рассылок — отображает историю рассылок в формате чата
 * @module editor/database/dialog/broadcast-dialog-panel
 */

import type { Broadcast, BroadcastCampaign, Button as MessageButton } from '@shared/schema';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Megaphone, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getBroadcastEditNotice, isBroadcastEditComplete, type BroadcastEditResult } from '@/components/editor/broadcast/hooks/edit-result';
import { useDeleteBroadcast } from '@/components/editor/broadcast/hooks/use-delete-broadcast';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useBroadcasts } from '@/components/editor/broadcast/hooks/use-broadcasts';
import { useBroadcastCampaigns } from '@/components/editor/broadcast/hooks/use-broadcast-campaigns';
import { NewBroadcastModal } from '@/components/editor/broadcast/wizard/new-broadcast-modal';
import { DialogInput } from './components/dialog-input';
import { BroadcastMessageBubble } from './components/broadcast-message-bubble';
import { BroadcastCampaignBubble } from './components/broadcast-campaign-bubble';
import { BroadcastDeleteConfirm } from './components/broadcast-delete-confirm';
import { buildBroadcastTimeline } from './utils/build-broadcast-timeline';

/**
 * Пропсы компонента BroadcastDialogPanel
 */
export interface BroadcastDialogPanelProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Колбэк закрытия панели */
  onClose: () => void;
  /** Скрыть заголовок (если он уже отображается в родительском компоненте) */
  hideHeader?: boolean;
}

/**
 * Панель истории рассылок в формате чата.
 * Показывает рассылки как пузыри сообщений с возможностью создания новой.
 * @param props - Свойства компонента
 * @returns JSX элемент панели рассылок
 */
export function BroadcastDialogPanel({ projectId, selectedTokenId, onClose, hideHeader }: BroadcastDialogPanelProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillText, setPrefillText] = useState('');
  /** Медиа для передачи в модалку */
  const [prefillMedia, setPrefillMedia] = useState<string[]>([]);
  /** Кнопки нового сообщения, передаваемые в мастер рассылки. */
  const [prefillButtons, setPrefillButtons] = useState<MessageButton[]>([]);
  /** Раскладка кнопок подготовленного сообщения. */
  const [prefillButtonsPerRow, setPrefillButtonsPerRow] = useState(0);
  /** Исходное сообщение для повторной рассылки */
  const [repeatSource, setRepeatSource] = useState<Broadcast | BroadcastCampaign | null>(null);
  /** ID рассылки, которая сейчас удаляется */
  const [deletingId, setDeletingId] = useState<number | null>(null);
  /** ID рассылки, которая сейчас редактируется */
  const [editingId, setEditingId] = useState<number | null>(null);
  /** ID одиночной рассылки, для которой открыто подтверждение удаления */
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { broadcasts, isLoading, refetch } = useBroadcasts(projectId, selectedTokenId);
  const { campaigns, refetch: refetchCampaigns } = useBroadcastCampaigns(projectId);

  /** Лента: большие рассылки одной записью, одиночные — как раньше */
  const timeline = useMemo(
    () => buildBroadcastTimeline(campaigns, broadcasts),
    [campaigns, broadcasts],
  );

  /** Обновляет и список рассылок, и список больших рассылок */
  const refetchAll = () => {
    refetch();
    refetchCampaigns();
  };

  /** Мутация удаления одиночной рассылки */
  const deleteMutation = useDeleteBroadcast({
    projectId,
    refetch: () => {
      setDeletingId(null);
      setConfirmDeleteId(null);
      refetchAll();
    },
  });

  /** Мутация редактирования рассылки */
  const editMutation = useMutation({
    mutationFn: async ({ broadcastId, messageText }: { broadcastId: number; messageText: string }) => {
      const res = await fetch(`/api/projects/${projectId}/broadcasts/${broadcastId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Ошибка редактирования рассылки');
      return res.json() as Promise<BroadcastEditResult>;
    },
    onSuccess: (result) => toast(getBroadcastEditNotice(result)),
    onError: () => toast({ title: 'Не удалось изменить рассылку', description: 'Проверьте соединение и повторите сохранение.', variant: 'destructive' }),
    onMutate: ({ broadcastId }) => setEditingId(broadcastId),
    onSettled: () => {
      setEditingId(null);
      refetchAll();
      queryClient.invalidateQueries({ queryKey: ['infinite-users', projectId] });
    },
  });

  /** Автопрокрутка вниз при загрузке */
  useEffect(() => {
    if (isLoading || timeline.length === 0) return;
    setTimeout(() => {
      const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, 100);
  }, [isLoading, timeline.length]);

  /** Открывает мастер с содержимым общего редактора, не отправляя рассылку. */
  const handleSend = (text: string, urls: string[], buttons: MessageButton[], perRow: number) => {
    setRepeatSource(null);
    setPrefillText(text);
    setPrefillMedia(urls);
    setPrefillButtons(buttons);
    setPrefillButtonsPerRow(perRow);
    setModalOpen(true);
  };

  /** Открывает новую рассылку с исходным ботом, текстом, медиа и кнопками */
  const handleRepeat = (broadcastId: number) => {
    const b = broadcasts.find((br) => br.id === broadcastId);
    if (!b) return;
    setRepeatSource(b);
    setPrefillText(b.messageText ?? '');
    setPrefillMedia(Array.isArray(b.mediaUrls) ? b.mediaUrls : []);
    setModalOpen(true);
  };

  /** Предзаполняет новую рассылку содержимым общей кампании. */
  const handleRepeatCampaign = (campaign: BroadcastCampaign) => {
    setRepeatSource(campaign);
    setPrefillText(campaign.messageText ?? "");
    setPrefillMedia(campaign.mediaUrls ?? []);
    setModalOpen(true);
  };

  /** Редактировать рассылку — вызвать PUT-запрос */
  const handleEdit = (broadcastId: number, newText: string) => {
    return editMutation.mutateAsync({ broadcastId, messageText: newText }).then(isBroadcastEditComplete).catch(() => false);
  };

  /** Закрытие модалки — очистка и рефетч с задержкой */
  const handleModalClose = () => {
    setModalOpen(false);
    setPrefillText('');
    setPrefillMedia([]);
    setRepeatSource(null);
    setTimeout(() => refetchAll(), 500);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Шапка */}
      {!hideHeader && (
        <div className="flex items-center justify-between gap-2 p-3 border-b bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="font-medium text-sm">Рассылка</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Область сообщений */}
      <ScrollArea ref={scrollRef} className="min-h-0 flex-1 p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-12">
            <Megaphone className="h-10 w-10 opacity-20" />
            <p className="text-sm">Нет рассылок</p>
            <p className="text-xs">Напишите сообщение ниже чтобы создать первую рассылку</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {[...timeline].reverse().map((item) => (
              item.kind === 'campaign' ? (
                <BroadcastCampaignBubble
                  key={item.key}
                  campaign={item.campaign}
                  onRepeat={handleRepeatCampaign}
                  projectId={projectId}
                  onRefetch={refetchAll}
                />
              ) : (
                <BroadcastMessageBubble
                  key={item.key}
                  broadcast={item.broadcast}
                  projectId={projectId}
                  onDelete={setConfirmDeleteId}
                  isDeleting={deletingId === item.broadcast.id}
                  onRepeat={handleRepeat}
                  onEdit={handleEdit}
                  isEditing={editingId === item.broadcast.id}
                />
              )
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Общий редактор сохраняет одинаковое поведение сообщений и рассылок. */}
      <div className="flex-shrink-0 overflow-y-auto">
        <DialogInput projectId={projectId} isPending={false} onSend={handleSend}
          sendLabel="Отправить рассылку" placeholder="Текст рассылки..." />
      </div>

      {/* Подтверждение удаления одиночной рассылки */}
      <BroadcastDeleteConfirm
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId === null) return;
          setDeletingId(confirmDeleteId);
          deleteMutation.mutate(confirmDeleteId, {
            onSettled: () => setDeletingId(null),
          });
        }}
      />

      {/* Модалка создания рассылки с предзаполненным текстом и медиа */}
      <NewBroadcastModal
        key={`${repeatSource?.id ?? 'new'}:${prefillText}:${prefillMedia.join(',')}`}
        open={modalOpen}
        onClose={handleModalClose}
        projectId={projectId}
        tokenId={repeatSource && "tokenId" in repeatSource ? repeatSource.tokenId : selectedTokenId}
        initialTokenIds={repeatSource ? ("tokenIds" in repeatSource ? repeatSource.tokenIds : [repeatSource.tokenId]) : undefined}
        refetch={refetchAll}
        initialMessageText={prefillText}
        initialMediaUrls={prefillMedia}
        initialButtons={repeatSource?.buttons ?? prefillButtons}
        initialButtonsPerRow={repeatSource?.buttonsPerRow ?? prefillButtonsPerRow}
      />
    </div>
  );
}
