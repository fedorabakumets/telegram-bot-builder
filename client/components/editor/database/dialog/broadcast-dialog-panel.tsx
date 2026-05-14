/**
 * @fileoverview Панель диалога рассылок — отображает историю рассылок в формате чата
 * @module editor/database/dialog/broadcast-dialog-panel
 */

import { useState, useRef, useEffect } from 'react';
import { Megaphone, X, Send, Paperclip, Hash } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { MultiMediaSelector } from '@/components/editor/properties/media/multi-media-selector';
import { FileIdInput } from '@/components/editor/properties/media/file-id-input';
import { useBroadcasts } from '@/components/editor/broadcast/hooks/use-broadcasts';
import { NewBroadcastModal } from '@/components/editor/broadcast/wizard/new-broadcast-modal';
import { BroadcastMessageBubble } from './components/broadcast-message-bubble';

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
}

/**
 * Панель истории рассылок в формате чата.
 * Показывает рассылки как пузыри сообщений с возможностью создания новой.
 * @param props - Свойства компонента
 * @returns JSX элемент панели рассылок
 */
export function BroadcastDialogPanel({ projectId, selectedTokenId, onClose }: BroadcastDialogPanelProps) {
  const [messageText, setMessageText] = useState('');
  /** Список URL выбранных медиафайлов */
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  /** Флаг видимости медиаселектора */
  const [showMedia, setShowMedia] = useState(false);
  /** Флаг видимости блока ввода Telegram file_id */
  const [showFileId, setShowFileId] = useState(false);
  /** Тип медиа для file_id */
  const [fileIdMediaType, setFileIdMediaType] = useState<'photo' | 'video' | 'audio' | 'document'>('photo');
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillText, setPrefillText] = useState('');
  /** Медиа для передачи в модалку */
  const [prefillMedia, setPrefillMedia] = useState<string[]>([]);
  /** ID рассылки, которая сейчас удаляется */
  const [deletingId, setDeletingId] = useState<number | null>(null);
  /** ID рассылки, которая сейчас редактируется */
  const [editingId, setEditingId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { broadcasts, isLoading, refetch } = useBroadcasts(projectId, selectedTokenId);

  /** Мутация удаления рассылки */
  const deleteMutation = useMutation({
    mutationFn: async (broadcastId: number) => {
      const res = await fetch(`/api/projects/${projectId}/broadcasts/${broadcastId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Ошибка удаления рассылки');
      return res.json();
    },
    onMutate: (broadcastId) => setDeletingId(broadcastId),
    onSettled: () => {
      setDeletingId(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['infinite-users', projectId] });
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
      return res.json();
    },
    onMutate: ({ broadcastId }) => setEditingId(broadcastId),
    onSettled: () => {
      setEditingId(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['infinite-users', projectId] });
    },
  });

  /** Автопрокрутка вниз при загрузке */
  useEffect(() => {
    if (isLoading || broadcasts.length === 0) return;
    setTimeout(() => {
      const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, 100);
  }, [isLoading, broadcasts.length]);

  /** Открыть модалку с предзаполненным текстом и медиа */
  const handleSend = () => {
    if (!messageText.trim()) return;
    setPrefillText(messageText.trim());
    setPrefillMedia([...mediaUrls]);
    setModalOpen(true);
  };

  /** Повторить рассылку — открыть модалку с текстом выбранной рассылки */
  const handleRepeat = (broadcastId: number) => {
    const b = broadcasts.find((br) => br.id === broadcastId);
    if (!b) return;
    setPrefillText(b.messageText ?? '');
    setPrefillMedia(Array.isArray(b.mediaUrls) ? b.mediaUrls : []);
    setModalOpen(true);
  };

  /** Редактировать рассылку — вызвать PUT-запрос */
  const handleEdit = (broadcastId: number, newText: string) => {
    editMutation.mutate({ broadcastId, messageText: newText });
  };

  /** Закрытие модалки — очистка и рефетч с задержкой */
  const handleModalClose = () => {
    setModalOpen(false);
    setPrefillText('');
    setPrefillMedia([]);
    setMessageText('');
    setMediaUrls([]);
    setShowMedia(false);
    setShowFileId(false);
    setTimeout(() => refetch(), 500);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Шапка */}
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

      {/* Область сообщений */}
      <ScrollArea ref={scrollRef} className="min-h-0 flex-1 p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-12">
            <Megaphone className="h-10 w-10 opacity-20" />
            <p className="text-sm">Нет рассылок</p>
            <p className="text-xs">Напишите сообщение ниже чтобы создать первую рассылку</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {[...broadcasts].reverse().map((b) => (
              <BroadcastMessageBubble
                key={b.id}
                broadcast={b}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deletingId === b.id}
                onRepeat={handleRepeat}
                onEdit={handleEdit}
                isEditing={editingId === b.id}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Зона ввода */}
      <div className="flex-shrink-0 p-3 space-y-2">
        <CompactInlineEditor
          value={messageText}
          onChange={setMessageText}
          placeholder="Текст рассылки..."
        />

        {/* Медиаселектор */}
        {showMedia && (
          <div className="border rounded-md p-2 bg-muted/30 max-h-48 overflow-y-auto">
            <MultiMediaSelector
              projectId={projectId}
              value={mediaUrls}
              onChange={setMediaUrls}
              label=""
            />
          </div>
        )}

        {/* Блок ввода Telegram file_id */}
        {showFileId && (
          <div className="border rounded-md p-3 bg-violet-50/30 dark:bg-violet-900/10 border-violet-200/60 dark:border-violet-700/60 max-h-64 overflow-y-auto">
            <FileIdInput
              projectId={projectId}
              mediaType={fileIdMediaType}
              onMediaTypeChange={setFileIdMediaType}
              onAdd={(entry) => {
                setMediaUrls((prev) => [...prev, entry]);
                setShowFileId(false);
              }}
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            {/* Кнопка прикрепления медиафайлов */}
            <Button
              variant={showMedia ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => { setShowMedia((v) => !v); setShowFileId(false); }}
              title="Прикрепить медиафайл"
            >
              <Paperclip className="w-4 h-4" />
              {mediaUrls.length > 0 && (
                <span className="ml-1 text-xs font-semibold">{mediaUrls.length}</span>
              )}
            </Button>

            {/* Кнопка Telegram file_id */}
            <Button
              variant={showFileId ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => { setShowFileId((v) => !v); setShowMedia(false); }}
              title="Добавить Telegram file_id"
              className={showFileId ? '' : 'text-violet-500 hover:text-violet-600'}
            >
              <Hash className="w-4 h-4" />
            </Button>
          </div>

          <Button size="sm" onClick={handleSend} disabled={!messageText.trim()}>
            <Send className="w-4 h-4 mr-1" />
            Отправить рассылку
          </Button>
        </div>
      </div>

      {/* Модалка создания рассылки с предзаполненным текстом и медиа */}
      <NewBroadcastModal
        key={prefillText + prefillMedia.join(',')}
        open={modalOpen}
        onClose={handleModalClose}
        projectId={projectId}
        tokenId={selectedTokenId}
        refetch={refetch}
        initialMessageText={prefillText}
        initialMediaUrls={prefillMedia}
      />
    </div>
  );
}
