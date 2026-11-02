/** @fileoverview Копирование содержимого файла в системный буфер, если формат поддерживается браузером. */
import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { prepareClipboardImage } from './file-copy-image';

/** Кнопка копирования файла с сообщением об ошибке. @param props - Адрес и название файла. @returns Действие и статус. */
export function FileCopyButton({ href, name, image }: { /** Адрес содержимого. */ href: string; /** Название файла. */ name: string; /** Файл является изображением. */ image: boolean }) {
  const [status, setStatus] = useState<'idle' | 'busy' | 'copied' | 'error'>('idle');
  const [error, setError] = useState('');
  /** Убирает временное сообщение и отметку после копирования. */
  useEffect(() => {
    if (status !== 'error' && status !== 'copied') return;
    const timer = window.setTimeout(() => { setStatus('idle'); setError(''); }, 5000);
    return () => window.clearTimeout(timer);
  }, [status, error]);
  /** Сохраняет изображение в PNG во время действия пользователя. @returns Завершение копирования. */
  async function copyFile() {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') { setError('Копирование изображений недоступно в этом браузере.'); setStatus('error'); return; }
    if (!image) { setError('Этот тип файла нельзя скопировать через браузер. Скачайте файл.'); setStatus('error'); return; }
    setStatus('busy'); setError('');
    try {
      const png = prepareClipboardImage(href);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      setStatus('copied');
    } catch (cause) {
      setError(cause instanceof DOMException && cause.name === 'NotAllowedError' ? 'Браузер не разрешил доступ к буферу обмена.' : cause instanceof Error && cause.message.startsWith('Не удалось') ? cause.message : 'Не удалось скопировать изображение. Попробуйте ещё раз.');
      setStatus('error');
    }
  }
  return <>
    <Button type="button" variant="ghost" size="icon" disabled={status === 'busy'} onClick={() => void copyFile()} aria-label={`Копировать файл ${name}`} title="Копировать файл">{status === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
    {status === 'copied' && <span role="status" className="sr-only">Изображение скопировано</span>}
    {status === 'error' && <span role="alert" className="text-xs text-muted-foreground">{error}</span>}
  </>;
}
