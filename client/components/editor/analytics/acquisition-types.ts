/** @fileoverview Контракты форм источников, размещений и точных рекламных расходов. */
export interface AcquisitionSource {
  /** Идентификатор. */ id: number;
  /** Название площадки. */ name: string;
  /** Вид площадки. */ kind: 'telegram' | 'website' | 'social' | 'other';
  /** Публичный адрес. */ url: string | null;
  /** Дата архивирования. */ archivedAt: string | null;
}
export interface AcquisitionPlacement {
  /** Идентификатор. */ id: number;
  /** Бот. */ tokenId: number;
  /** Источник. */ sourceId: number;
  /** Название размещения. */ name: string;
  /** Начало размещения. */ startsOn: string | null;
  /** Окончание размещения. */ endsOn: string | null;
  /** Пояс учёта дней. */ timezone: string;
  /** Дата архивирования. */ archivedAt: string | null;
}
export interface AcquisitionLink {
  /** Идентификатор. */ id: number;
  /** Бот. */ tokenId: number;
  /** Источник. */ sourceId: number;
  /** Размещение. */ placementId: number;
  /** Компактная метка. */ code: string;
  /** Назначение. */ purpose: string;
  /** Подтверждённый пригласивший. */ referrerId: string | null;
  /** Готовая Telegram-ссылка при известном username. */ url: string | null;
  /** Дата архивирования. */ archivedAt: string | null;
}
export interface AcquisitionExpense {
  /** Идентификатор. */ id: number;
  /** Размещение. */ placementId: number;
  /** Точная исходная сумма. */ amount: string;
  /** Исходная валюта. */ currency: 'RUB' | 'USD';
  /** Дата, к которой относится расход. */ day: string;
  /** Ручной курс рублей за доллар. */ exchangeRateRubPerUsd: string | null;
  /** Учётная дата ручного курса. */ exchangeRateDate?: string | null;
  /** Примечание. */ note: string | null;
  /** Отмена с сохранением истории. */ archivedAt?: string | null;
}
export interface AcquisitionCatalog {
  /** Источники. */ sources: AcquisitionSource[];
  /** Размещения. */ placements: AcquisitionPlacement[];
  /** Ссылки. */ links: AcquisitionLink[];
  /** Расходы. */ expenses: AcquisitionExpense[];
}
export interface AcquisitionReportRow {
  /** Размещение. */ placementId: number | null;
  /** Стабильный ключ автоматической строки без размещения. */ rowKey?: string;
  /** Ключ обнаруженного источника. */ sourceKey?: string;
  /** Название размещения. */ name: string;
  /** Бот. */ tokenId: number | null;
  /** Источник. */ sourceId: number | null;
  /** Название источника. */ sourceName: string;
  /** Новые люди. */ newUsers: number;
  /** Первые сохранённые обращения по явно привязанной исторической метке. */ historicalUsers?: number;
  /** Демонстрационная связь расходов с историей. */ isDemo?: boolean;
  /** Условная цена сохранённого контакта только для демонстрации. */ demoCostPerContact?: string | null;
  /** Вернувшиеся по ссылке. */ returningUsers: number;
  /** Повторные старты. */ repeatStarts: number;
  /** Исходные расходы; null означает отсутствие записей. */ spend: { /** Рубли. */ RUB: string | null; /** Доллары. */ USD: string | null };
  /** Пересчитанный расход. */ convertedSpend: string | null;
  /** Цена привлечения. */ costPerUser: string | null;
  /** Цена по каждой исходной валюте без предположений о курсе. */ costPerUserByCurrency?: { /** Рубли. */ RUB: string | null; /** Доллары. */ USD: string | null };
  /** Валюта сравнения. */ currency: 'RUB' | 'USD';
  /** Достоверность результата. */ complete: boolean;
  /** Причина отсутствия точной цены. */ reason: string | null;
  /** Использовано оценочное распределение по дням. */ estimated?: boolean;
  /** Включён незавершённый календарный день. */ currentDay?: boolean;
}
