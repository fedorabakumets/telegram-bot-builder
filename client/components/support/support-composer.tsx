/**
 * @fileoverview Поле ввода сообщения поддержки: текст, картинки, Enter — отправить
 * @module components/support/support-composer
 */

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { SUPPORT_MESSAGE_MAX_LENGTH } from "@shared/support/support.types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/utils";
import { useSupportComposerFiles } from "./hooks/use-support-composer-files";
import type { SupportComposerPayload } from "./post-support-message";

/** Пропсы поля ввода */
interface SupportComposerProps {
  /** Отправка текста и картинок */
  onSend: (payload: SupportComposerPayload) => Promise<unknown>;
  /** Идёт отправка */
  isSending: boolean;
  /** Подсказка в пустом поле */
  placeholder: string;
}

/**
 * Поле ввода: кнопка выбора картинок, вставка из буфера и перетаскивание на поле
 * @param props - Свойства компонента
 * @returns JSX элемент поля ввода
 */
export function SupportComposer({ onSend, isSending, placeholder }: SupportComposerProps) {
  const [text, setText] = useState("");
  const files = useSupportComposerFiles();
  const trimmed = text.trim();
  const canSend = (trimmed.length > 0 || files.images.length > 0) && !isSending;

  /**
   * Отправляет сообщение и очищает поле при успехе
   */
  const submit = async () => {
    if (!canSend) return;
    try {
      await onSend({ text: trimmed, files: files.images.map((image) => image.file) });
      setText("");
      files.clearImages();
    } catch {
      // Текст и картинки остаются, ошибку показывает вызывающий код
    }
  };

  /**
   * Enter без Shift отправляет сообщение
   * @param event - Событие клавиатуры
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };

  /**
   * Добавляет файлы из кнопки и сбрасывает input, чтобы тот же файл можно было выбрать снова
   * @param event - Событие выбора файлов
   */
  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files ? [...event.target.files] : [];
    event.target.value = "";
    void files.addFiles(picked);
  };

  return (
    <div
      className={cn("border-t", files.dragOver && "bg-blue-50 ring-2 ring-inset ring-blue-500")}
      onDragOver={files.onDragOver}
      onDragLeave={files.onDragLeave}
      onDrop={files.onDrop}
    >
      {files.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-3">
          {files.images.map((image) => (
            <div key={image.url} className="relative h-14 w-14 shrink-0">
              <img src={image.url} alt={image.file.name} className="h-14 w-14 rounded-md object-cover" />
              <button
                type="button"
                className="absolute -right-1 -top-1 rounded-full bg-background p-0.5 shadow"
                title="Убрать"
                onClick={() => files.removeImage(image.url)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 p-3">
        <input
          ref={files.inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handlePick}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          title="Прикрепить картинки"
          disabled={isSending}
          onClick={() => files.inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={files.onPaste}
          placeholder={placeholder}
          maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
          rows={2}
          className="min-h-[44px] resize-none"
        />
        <Button size="icon" onClick={() => void submit()} disabled={!canSend} title="Отправить">
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {files.error && <p className="px-3 pb-3 text-xs text-destructive">{files.error}</p>}
    </div>
  );
}
