/**
 * @fileoverview Единый источник стилевых констант панели файлового хранилища
 * (Req 13.1, 13.2, 13.3 — задача 12.1). Сюда вынесены повторяющиеся классы
 * (бейджи хранилищ local/S3, чипы активных фильтров, цветовая индикация
 * квоты и размера файла, sticky-колонки таблицы, секции с разделителем).
 * Все цвета — только токены темы (`primary`, `secondary`, `muted`, `card`,
 * `border`, `ring`, `success`, `warning`, `destructive`, `info` и
 * `*-foreground`); хардкод hex/rgb/произвольных значений нет.
 * @module components/editor/files/panel/panel-styles
 */

import type { LucideIcon } from 'lucide-react';
import { HardDrive, Cloud } from 'lucide-react';
import type { BadgeProps } from '@/components/ui/badge';

/** Тип бэкенда хранилища, используемый в UI панели */
export type StorageBackendKindClass = 'local' | 's3' | string | null | undefined;

/** Уровень заполнения квоты (пороги синхронны с сервером compute-quota-warning) */
export type QuotaLevel = 'ok' | 'warn' | 'critical';

/** Уровень размера файла для цветовой индикации в таблице */
export type FileSizeLevel = 'unknown' | 'small' | 'medium' | 'large' | 'huge';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Бейджи хранилищ (local / S3)                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Описание визуала бейджа хранилища: вариант shadcn-бейджа, смысловая
 * иконка lucide-react и базовые классы под токены темы.
 */
export interface StorageBadgeStyle {
  /** Вариант shadcn Badge (default = primary, secondary = muted) */
  variant: NonNullable<BadgeProps['variant']>;
  /** Смысловая иконка типа хранилища */
  icon: LucideIcon;
  /** Базовые классы (без max-width — задаёт потребитель) */
  className: string;
  /** Классы иконки (размер) */
  iconClassName: string;
}

/** Базовые классы бейджа хранилища (один источник для всех консьюмеров) */
const STORAGE_BADGE_BASE = 'gap-1 text-[10px]';

/** Размер иконки в бейдже хранилища */
const STORAGE_BADGE_ICON = 'h-3 w-3';

/**
 * Возвращает визуал бейджа хранилища (вариант, иконка, классы) по типу бэкенда.
 * Для `s3` — акцентный `default`-бейдж, для остального — нейтральный `secondary`.
 * @param backend - Тип бэкенда (`'local'`, `'s3'`, иной или null)
 * @returns Конфигурация визуала бейджа для shadcn Badge
 */
export function getStorageBadgeStyle(backend: StorageBackendKindClass): StorageBadgeStyle {
  const isS3 = backend === 's3';
  return {
    variant: isS3 ? 'default' : 'secondary',
    icon: isS3 ? Cloud : HardDrive,
    className: STORAGE_BADGE_BASE,
    iconClassName: STORAGE_BADGE_ICON,
  };
}

/** Стандартный max-width лейбла в бейдже хранилища таблицы (узкая ячейка) */
export const STORAGE_BADGE_LABEL_TABLE = 'truncate max-w-[80px]';

/** Стандартный max-width лейбла в селекторе цели/строке менеджера (шире) */
export const STORAGE_BADGE_LABEL_WIDE = 'truncate max-w-[120px]';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Табы категорий (CategoryTabs)                                             */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Базовый класс триггера таба категории: единая высота `h-8`, ховер через
 * `muted`, чёткая подсветка активного состояния через `primary/15` +
 * `text-primary` + `ring-1 ring-primary/20` (Req 5.1, 13.1). Модификатор
 * `group` нужен, чтобы дочерний счётчик-пилюля мог реагировать на состояние
 * родителя через `group-data-[state=active]`.
 */
export const CATEGORY_TAB_TRIGGER_CLASS =
  'group h-8 rounded-md px-3 text-xs font-medium text-muted-foreground transition-all ' +
  'hover:bg-background/80 hover:text-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'data-[state=active]:bg-background data-[state=active]:text-primary ' +
  'data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/25';

/** Обёртка табов в toolbar — мягкая «пилюля» */
export const CATEGORY_TABS_EMBEDDED_LIST_CLASS =
  'h-auto flex-wrap justify-start gap-1 rounded-lg border border-border/50 bg-background/70 p-1 shadow-sm';

/**
 * Класс пилюли-счётчика на табе категории. По умолчанию — нейтральный
 * `bg-muted`, в активном табе переключается на `primary` через
 * `group-data-[state=active]` (см. `CATEGORY_TAB_TRIGGER_CLASS`).
 */
export const CATEGORY_TAB_COUNT_CLASS =
  'ml-1.5 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full px-1 ' +
  'text-[10px] font-semibold tabular-nums bg-muted text-muted-foreground ' +
  'group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Кнопка фильтров над таблицей (FiltersButton)                              */
/* ────────────────────────────────────────────────────────────────────────── */

/** Класс кнопки `FiltersButton` — единая высота `h-8` с кнопками шапки */
export const FILTERS_BUTTON_CLASS = 'h-8 gap-1.5 px-2.5 text-xs font-medium';

/** Класс бейджа активного количества фильтров (компактная primary-пилюля) */
export const FILTERS_BUTTON_COUNT_BADGE_CLASS =
  'ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full ' +
  'bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Чипы активных фильтров                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Класс бейджа-чипа активного фильтра: мягкая `secondary`-заливка,
 * радиус, производный от `--radius` (`rounded-md`), и аккуратные
 * вертикальные отступы. Высота `h-6` выровнена с кнопкой «Сбросить всё».
 */
export const ACTIVE_FILTER_CHIP_CLASS =
  'h-6 gap-1.5 rounded-md px-2 py-0 text-xs font-medium';

/**
 * Класс крестика «снять фильтр» внутри чипа — компактный квадрат
 * `h-4 w-4`, ховер через `background/60`, фокус-кольцо на токене `ring`.
 */
export const ACTIVE_FILTER_CHIP_REMOVE_CLASS =
  'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground ' +
  'transition-colors hover:bg-background/60 hover:text-foreground ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

/** Максимальная ширина текста подписи чипа активного фильтра */
export const ACTIVE_FILTER_CHIP_LABEL_CLASS = 'truncate max-w-[16rem]';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Индикатор квоты хранилища                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/** Порог перехода к жёлтому уровню (warn), в процентах (синхронно с сервером) */
export const QUOTA_WARN_PERCENT = 70;

/** Порог перехода к красному уровню (critical), в процентах (синхронно с сервером) */
export const QUOTA_CRITICAL_PERCENT = 90;

/**
 * CSS-классы заливки прогресс-бара квоты по уровню (Req 4.6).
 * Используют токены темы: success (зелёный) / warning (жёлтый) /
 * destructive (красный) — заданы в `client/index.css`.
 */
export const QUOTA_FILL_CLASS: Record<QuotaLevel, string> = {
  ok: 'bg-success',
  warn: 'bg-warning',
  critical: 'bg-destructive',
};

/** Класс трека прогресс-бара квоты (фон-плашка) */
export const QUOTA_TRACK_CLASS = 'h-2 w-full overflow-hidden rounded-full bg-muted';

/**
 * Класс заливки прогресс-бара квоты с плавной анимацией ширины и цвета.
 * Используется вместе с `QUOTA_FILL_CLASS[level]` для итогового вида.
 */
export const QUOTA_FILL_TRANSITION_CLASS =
  'h-full rounded-full transition-[width,background-color] duration-300 ease-out';

/** Класс основной цифры/подписи квоты (моноширинные цифры, плотный трекинг) */
export const QUOTA_CAPTION_PRIMARY_CLASS =
  'font-medium text-foreground tabular-nums tracking-tight';

/** Класс вторичной (приглушённой) подписи квоты с моноширинными цифрами */
export const QUOTA_CAPTION_MUTED_CLASS = 'text-muted-foreground tabular-nums';

/** Бейдж нейтрального состояния «Безлимитно» (без процента и заполнения) */
export const QUOTA_UNLIMITED_BADGE_CLASS =
  'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground';

/** Класс иконки внутри бейджа «Безлимитно» */
export const QUOTA_UNLIMITED_BADGE_ICON_CLASS = 'h-3 w-3 shrink-0 text-muted-foreground';

/** Класс иконки превышения квоты (треугольник) — токен destructive */
export const QUOTA_EXCEEDED_ICON_CLASS = 'h-3.5 w-3.5 shrink-0 text-destructive';

/** Класс подписи превышения квоты — токен destructive */
export const QUOTA_EXCEEDED_TEXT_CLASS = 'mt-1 text-xs text-destructive';

/**
 * Определяет уровень-индикатор квоты по проценту заполнения (Req 4.6).
 * @param percent - Процент заполнения квоты
 * @returns Уровень: `ok` (<70%), `warn` (70–90%), `critical` (>90%)
 */
export function resolveQuotaLevel(percent: number): QuotaLevel {
  if (percent > QUOTA_CRITICAL_PERCENT) return 'critical';
  if (percent >= QUOTA_WARN_PERCENT) return 'warn';
  return 'ok';
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Цветовая индикация размера файла в таблице                                */
/* ────────────────────────────────────────────────────────────────────────── */

/** Пороги размера файла в байтах для цветовой шкалы */
const SIZE_THRESHOLD_SMALL_BYTES = 1_048_576;       // < 1 MB
const SIZE_THRESHOLD_MEDIUM_BYTES = 10_485_760;     // < 10 MB
const SIZE_THRESHOLD_LARGE_BYTES = 52_428_800;      // < 50 MB

/**
 * CSS-классы текста для разных порогов размера файла (Req 7.5).
 * Палитра только из токенов темы; жёлтый и оранжевый порог сведены к
 * `warning`, чтобы не вводить новые цвета (новых цветов не добавляем).
 */
export const FILE_SIZE_TEXT_CLASS: Record<FileSizeLevel, string> = {
  unknown: 'text-muted-foreground',
  small: 'text-success',
  medium: 'text-warning',
  large: 'text-warning',
  huge: 'text-destructive',
};

/**
 * Определяет уровень размера файла по числу байтов.
 * @param size - Размер в байтах или null
 * @returns Уровень: `unknown`, `small`, `medium`, `large`, `huge`
 */
export function resolveFileSizeLevel(size: number | null | undefined): FileSizeLevel {
  if (!size) return 'unknown';
  if (size < SIZE_THRESHOLD_SMALL_BYTES) return 'small';
  if (size < SIZE_THRESHOLD_MEDIUM_BYTES) return 'medium';
  if (size < SIZE_THRESHOLD_LARGE_BYTES) return 'large';
  return 'huge';
}

/**
 * Цветовой класс текста размера файла (для ячейки таблицы и карточки).
 * @param size - Размер в байтах или null
 * @returns Tailwind-класс цвета текста на токенах темы
 */
export function getFileSizeTextClass(size: number | null | undefined): string {
  return FILE_SIZE_TEXT_CLASS[resolveFileSizeLevel(size)];
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Sticky-колонки и секции таблицы / панели                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/** Sticky-класс для колонки выбора (первая, ширина чекбокса) */
export const STICKY_COLUMN_SELECT = 'sticky left-0 z-10 bg-background';

/** Sticky-класс для колонки превью+имя (вторая, после чекбокса) */
export const STICKY_COLUMN_NAME = 'sticky left-9 z-10 bg-background';

/** Sticky-класс для заголовка колонки выбора (поверх фона шапки) */
export const STICKY_COLUMN_SELECT_HEADER = 'sticky left-0 z-30 bg-muted/60';

/** Sticky-класс для заголовка колонки превью+имя */
export const STICKY_COLUMN_NAME_HEADER = 'sticky left-9 z-30 bg-muted/60';

/** Класс выделенной строки таблицы (выбран файл) */
export const TABLE_ROW_SELECTED_CLASS = 'bg-primary/5';

/** Классы строки таблицы по умолчанию (hover-эффект через muted) */
export const TABLE_ROW_CLASS = 'hover:bg-muted/30 transition-colors';

/** Класс шапки таблицы (sticky сверху, фон через muted) */
export const TABLE_HEAD_CLASS = 'sticky top-0 z-20 bg-muted/60 border-b';

/** Класс контейнера секции панели (стандартный отступ + разделитель снизу) */
export const PANEL_SECTION_CLASS = 'px-4 py-2.5 border-b sm:px-6';

/** Класс плотной секции панели (квота / шапка) */
export const PANEL_DENSE_SECTION_CLASS = 'px-4 py-2.5 border-b';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Прочие повторяющиеся классы                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/** Класс плашки массовых действий (sticky снизу + blur) */
export const SELECTION_BAR_CLASS =
  'sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t bg-background/95 px-4 py-2.5 backdrop-blur';

/** Класс блока результата проверки хранилища (успех/ошибка) */
export const STORAGE_TEST_RESULT_BASE =
  'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm';

/** Цветовой класс блока успеха проверки хранилища */
export const STORAGE_TEST_RESULT_OK_CLASS = 'bg-success/10 text-success';

/** Цветовой класс блока ошибки проверки хранилища */
export const STORAGE_TEST_RESULT_ERROR_CLASS = 'bg-destructive/10 text-destructive';

/** Заголовок секции в форме хранилища */
export const STORAGE_CONFIG_FORM_SECTION_TITLE_CLASS =
  'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';

/** Строка переключателя в форме хранилища */
export const STORAGE_CONFIG_FORM_SETTING_ROW_CLASS =
  'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5';

/** Класс пустого состояния таблицы (центр, приглушённый текст) */
export const EMPTY_STATE_CLASS =
  'flex h-full items-center justify-center text-sm text-muted-foreground';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Шапка и верхняя панель (FileStorageHeader / FileStorageToolbar)         */
/* ────────────────────────────────────────────────────────────────────────── */

/** Контейнер шапки в модалке: плотные отступы */
export const HEADER_CONTAINER_MODAL_CLASS = 'px-3 sm:px-4 py-2 border-b bg-background';

/** Подзаголовок под TabHeader на странице «Файлы» */
export const HEADER_SUBTITLE_CLASS =
  'px-4 sm:px-6 pb-2.5 text-xs leading-relaxed text-muted-foreground max-w-3xl';

/** Верхняя панель: категории слева, квота справа */
export const FILE_STORAGE_TOOLBAR_CLASS =
  'flex flex-col gap-3 border-b px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3 ' +
  'bg-muted/15';

/** Строка фильтров и режима прикрепления */
export const FILE_STORAGE_ACTIONS_ROW_CLASS =
  'flex flex-col gap-2 border-b px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-2.5 ' +
  'bg-background/80';

/** Карточка компактной квоты в toolbar — без фона и рамки */
export const QUOTA_COMPACT_CARD_CLASS =
  'flex min-w-0 flex-col gap-1 shrink-0 text-xs sm:min-w-[10rem]';

/** Строка списка в менеджере хранилищ */
export const STORAGE_CONFIG_ROW_BASE_CLASS =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors';

/** Активное хранилище в менеджере */
export const STORAGE_CONFIG_ROW_ACTIVE_CLASS =
  'bg-primary/10 ring-1 ring-primary/20';

/** Неактивное хранилище в менеджере */
export const STORAGE_CONFIG_ROW_IDLE_CLASS = 'hover:bg-muted/25';

/** Иконка типа хранилища в строке менеджера */
export const STORAGE_CONFIG_ROW_ICON_CLASS =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10';
