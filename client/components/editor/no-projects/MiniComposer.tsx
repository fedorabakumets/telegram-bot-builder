/** @fileoverview Отправка текстового сообщения в поддержку через питомца Mini. */
import { useRef, useState, type FormEvent } from 'react';
import { ArrowUp, Loader2, X } from 'lucide-react';
import { SUPPORT_MESSAGE_MAX_LENGTH } from '@shared/support/support.types';
import { useSendSupportMessage } from '@/components/support/hooks/use-support-chat';

interface MiniComposerProps {
  /** Закрывает форму и возвращает пользователя к питомцу. */
  onClose(): void;
}

/**
 * Отправляет сообщение в чат поддержки и показывает результат рядом с питомцем.
 * @param props - Действие закрытия формы.
 * @returns Форма и статус отправки в поддержку.
 */
export function MiniComposer({ onClose }: MiniComposerProps) {
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [draft, setDraft] = useState('');
  const sendMessage = useSendSupportMessage();

  /**
   * Отправляет непустое сообщение один раз и сохраняет текст при ошибке.
   * @param event - Отправка формы кнопкой или клавишей Enter.
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy.current) return;
    busy.current = true;
    try {
      await sendMessage.mutateAsync({ text, files: [] });
      setDraft('');
    } catch {
      // Мутация предоставляет состояние ошибки для повторной отправки черновика.
    } finally {
      busy.current = false;
      input.current?.focus();
    }
  }

  return (
    <div className="w-[min(22rem,calc(100vw-1rem))] space-y-1.5">
      <form onSubmit={submit} aria-label="Сообщение в поддержку"
        className="flex items-center gap-1 rounded-full bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-border">
        <button type="button" onClick={onClose} aria-label="Закрыть поле сообщения" title="Закрыть"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-sky-500">
          <X size={16} aria-hidden="true" />
        </button>
        <input ref={input} autoFocus value={draft} readOnly={sendMessage.isPending} maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
          aria-label="Написать в поддержку" placeholder="Написать в поддержку"
          onChange={event => {
            setDraft(event.target.value);
            if (sendMessage.isSuccess || sendMessage.isError) sendMessage.reset();
          }}
          className="min-w-0 flex-1 bg-transparent py-1 text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm" />
        <button type="submit" disabled={sendMessage.isPending || !draft.trim()} aria-label="Отправить в поддержку" title="Отправить в поддержку"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline-sky-500 disabled:opacity-40">
          {sendMessage.isPending ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <ArrowUp size={18} aria-hidden="true" />}
        </button>
      </form>
      <div role="status" aria-live="polite" aria-atomic="true" className="empty:hidden">
        {sendMessage.isPending && <span className="sr-only">Отправка сообщения в поддержку.</span>}
        {(sendMessage.isSuccess || sendMessage.isError) && (
          <p className="max-h-[28dvh] overflow-y-auto whitespace-pre-line break-words rounded-xl bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg ring-1 ring-border">
            {sendMessage.isSuccess ? 'Сообщение отправлено в поддержку.' : 'Не удалось отправить сообщение. Попробуйте ещё раз.'}
          </p>
        )}
      </div>
    </div>
  );
}
