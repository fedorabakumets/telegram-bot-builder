/**
 * @fileoverview Проверки вставки вложений из буфера без потери текстового ввода.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ClipboardEvent } from 'react';
import { usePastedMedia } from '../../hooks/use-pasted-media';
const { mutateAsync, toast } = vi.hoisted(() => ({ mutateAsync: vi.fn(), toast: vi.fn() }));
vi.mock('@/components/editor/properties/hooks/use-media', () => ({ useUploadMedia: () => ({ mutateAsync }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/components/editor/files/panel/use-file-upload', () => ({ MAX_UPLOAD_FILES: 10 }));
/** Создаёт событие буфера с заданными файлами. */
function event(files: File[]) {
  return { clipboardData: { files }, preventDefault: vi.fn(), stopPropagation: vi.fn() };
}
describe('Вставка вложений', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('пропускает обычный текст текстовому редактору', () => {
    const attached = vi.fn();
    const { result } = renderHook(() => usePastedMedia(9, attached));
    const e = event([]);
    act(() => result.current.onPasteCapture(e as unknown as ClipboardEvent<HTMLElement>));
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
  it('загружает скриншот и передаёт его адрес вложениям', async () => {
    let finish!: (value: { url: string }) => void;
    mutateAsync.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const attached = vi.fn();
    const { result } = renderHook(() => usePastedMedia(9, attached));
    const file = new File(['png'], 'screenshot.png', { type: 'image/png' });
    const e = event([file]);
    act(() => result.current.onPasteCapture(e as unknown as ClipboardEvent<HTMLElement>));
    expect(e.preventDefault).toHaveBeenCalled();
    expect(e.stopPropagation).toHaveBeenCalled();
    expect(result.current.isUploading).toBe(true);
    await act(async () => finish({ url: '/uploads/9/screenshot.png' }));
    await waitFor(() => expect(result.current.isUploading).toBe(false));
    expect(attached).toHaveBeenCalledWith(['/uploads/9/screenshot.png']);
  });
  it('сохраняет успешный файл при частичной ошибке и снимает загрузку', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('Нет доступа')).mockResolvedValueOnce({ url: '/uploads/9/ok.pdf' });
    const attached = vi.fn();
    const { result } = renderHook(() => usePastedMedia(9, attached));
    act(() => result.current.onPasteCapture(event([new File(['a'], 'a.png'), new File(['b'], 'ok.pdf')]) as unknown as ClipboardEvent<HTMLElement>));
    await waitFor(() => expect(attached).toHaveBeenCalledWith(['/uploads/9/ok.pdf']));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(result.current.isUploading).toBe(false);
  });
});
