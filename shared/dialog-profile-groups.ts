/** @fileoverview Сохранённые сведения о группах пользователя без утверждения актуального членства. */

/** Одна группа в области конкретного бота проекта. */
export interface DialogProfileGroup {
  /** Telegram ID группы. */ groupId: string;
  /** Сохранённое название либо Telegram ID. */ name: string;
  /** Тип группового чата. */ chatType: string;
  /** Бот, наблюдавший сведения; null для старых общих записей группы. */ tokenId: number | null;
  /** Сохранённое имя бота. */ botName: string | null;
  /** Публичный username бота. */ botUsername: string | null;
  /** Есть ли отдельная сохранённая запись участника; сообщения сами по себе этого не доказывают. */ membershipKnown: boolean;
  /** Последний сохранённый статус участника, включая left и kicked. */ membershipStatus: string | null;
  /** Когда обновлялась запись участника, а не время новой проверки Telegram. */ membershipCheckedAt: string | null;
  /** Время последнего сохранённого сообщения этого пользователя в группе. */ lastActivityAt: string | null;
  /** Количество сохранённых входящих сообщений этого пользователя в группе. */ messageCount: number;
}

/** Ответ группы общего профиля пользователя. */
export interface DialogProfileGroupsData {
  /** Группы с сохранённым участием или собственными сообщениями пользователя. */ groups: DialogProfileGroup[];
}
