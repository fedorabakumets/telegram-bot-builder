/**
 * @fileoverview Компонент ссылки для открытия QR в браузере
 *
 * @module QrLink
 */

/**
 * Пропсы компонента ссылки
 */
export interface QrLinkProps {
  /** URL ссылки */
  url: string;
}

/**
 * Ссылка для открытия QR в браузере
 *
 * @param {QrLinkProps} props - Пропсы компонента
 * @returns {JSX.Element} Ссылка или null
 *
 * @example
 * ```tsx
 * <QrLink url={qrUrl} />
 * ```
 */
export function QrLink({ url }: QrLinkProps) {
  if (!url) return null;

  return (
    <div className="text-center">
      <a
        href={url.replace('tg://', 'https://t.me/')}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline"
      >
        Открыть ссылку в браузере
      </a>
    </div>
  );
}
