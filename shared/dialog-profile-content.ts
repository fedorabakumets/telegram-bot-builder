/** @fileoverview Открытые данные сохранённых фото и ссылок профиля без адресов хранилища. */
export interface DialogProfilePhoto {
  /** Идентификатор сохранённого файла. */ id: number;
  /** Имя файла для подписи и доступности. */ name: string;
}
export interface DialogProfileContentItem {
  /** Идентификатор исходного сообщения. */ messageId: number;
  /** Бот, сохранивший сообщение. */ tokenId: number | null;
  /** Дата сообщения. */ createdAt: string | null;
  /** Сохранённые фотографии. */ photos: DialogProfilePhoto[];
  /** Ссылки с разрешённой схемой HTTP или HTTPS. */ links: string[];
}
export interface DialogProfileContentPage {
  /** Материалы в порядке от новых к старым. */ items: DialogProfileContentItem[];
  /** Курсор следующей страницы сохранённых сообщений. */ beforeId: number | null;
}
