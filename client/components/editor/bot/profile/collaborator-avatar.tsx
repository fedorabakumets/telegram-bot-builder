/**
 * @fileoverview Аватар коллаборатора проекта (фото или инициал)
 * @module bot/profile/collaborator-avatar
 */

/**
 * Круглый аватар: photoUrl из telegram_users или буква имени
 * @param props - photoUrl, name, userId
 * @returns JSX элемент
 */
export function CollaboratorAvatar({
  photoUrl,
  name,
  userId,
}: {
  /** URL фото или null */
  photoUrl?: string | null;
  /** Отображаемое имя */
  name: string;
  /** Telegram ID */
  userId: number;
}) {
  const initial = (name.replace(/^@/, '').charAt(0) || String(userId).charAt(0)).toUpperCase();
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="h-7 w-7 shrink-0 rounded-full object-cover bg-muted"
      />
    );
  }
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground"
      aria-hidden
    >
      {initial}
    </div>
  );
}
