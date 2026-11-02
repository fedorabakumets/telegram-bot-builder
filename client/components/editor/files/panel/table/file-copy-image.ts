/** @fileoverview Подготовка изображения к копированию в поддерживаемом формате PNG. */
/** Загружает и преобразует изображение в PNG. @param href - Адрес файла. @returns Изображение PNG для буфера обмена. */
export async function prepareClipboardImage(href: string): Promise<Blob> {
  let response: Response;
  try { response = await fetch(href, { credentials: 'same-origin' }); } catch { throw new Error('Не удалось загрузить файл. Проверьте соединение.'); }
  if (!response.ok) throw new Error('Не удалось загрузить файл. Попробуйте скачать его.');
  const blob = await response.blob();
  if (blob.type === 'image/png') return blob;
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context || !canvas.width || !canvas.height) throw new Error();
    context.drawImage(image, 0, 0);
    const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error();
    return png;
  } catch { throw new Error('Не удалось подготовить изображение. Попробуйте скачать файл.'); }
  finally { URL.revokeObjectURL(url); }
}
