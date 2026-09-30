/**
 * @fileoverview Картинка сообщения поддержки: превью в ленте и увеличение по клику
 * @module components/support/support-attachment-image
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/utils/utils";

/** Пропсы картинки вложения */
interface SupportAttachmentImageProps {
  /** Защищённый адрес файла */
  src: string;
  /** Имя файла для подписи */
  alt: string;
  /** Дополнительные классы обёртки, например отступ сверху */
  className?: string;
}

/**
 * Превью картинки. По нажатию открывает её на весь экран
 * @param props - Адрес и подпись
 * @returns JSX элемент превью и диалога
 */
export function SupportAttachmentImage({ src, alt, className }: SupportAttachmentImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        title="Увеличить"
        className={cn("block cursor-zoom-in border-0 bg-transparent p-0", className)}
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt} className="max-h-48 rounded-lg object-contain" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-auto max-w-[92vw] border-0 bg-transparent p-2 shadow-none sm:max-w-[92vw]">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <DialogDescription className="sr-only">Увеличенная картинка</DialogDescription>
          <img src={src} alt={alt} className="max-h-[85vh] max-w-[90vw] object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
