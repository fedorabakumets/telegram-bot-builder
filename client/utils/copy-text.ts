/**
 * @fileoverview Копирование текста в системный буфер обмена
 * @module utils/copy-text
 */

/**
 * Копирует строку через скрытый textarea и document.execCommand
 * @param text - Текст для копирования
 * @returns true если execCommand('copy') вернул true
 */
function copyViaExecCommand(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  textarea.remove();
  return ok;
}

/**
 * Копирует текст в буфер обмена: Clipboard API, затем execCommand
 * @param text - Строка для копирования
 * @returns true если хотя бы один способ сработал
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  const value = String(text ?? '');
  if (!value) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* запасной путь ниже */
  }

  return copyViaExecCommand(value);
}
