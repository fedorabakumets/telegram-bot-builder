/** @fileoverview Понятный выбор способа создания первого проекта BotCraft. */
import { Download, PanelsTopLeft, Plus, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TELEGRAM_CHAT_URL } from '../header/components/telegram-chat-invite';

/** Свойства способов начала работы. */
export interface NoProjectsActionsProps {
  /** Доступность действий. */
  ready: boolean;
  /** Мгновенное отображение при повторном визите. */
  instant?: boolean;
  /** Создание пустого проекта. */
  onCreate: () => void;
  /** Загрузка файла BotCraft. */
  onImport: () => void;
  /** Открытие каталога шаблонов. */
  onTemplates: () => void;
  /** Выход из учётной записи. */
  onLogout: () => void;
  /** Выполняется импорт файла. */
  isImporting: boolean;
}

/** Свойства одного способа начала работы. */
interface StartOptionProps {
  /** Контурная иконка действия. */
  icon: LucideIcon;
  /** Цвет иконки в светлой и тёмной темах. */
  iconColor: string;
  /** Заголовок действия. */
  title: string;
  /** Пояснение результата. */
  description: string;
  /** Обработчик выбора. */
  onClick: () => void;
  /** Временная недоступность. */
  disabled?: boolean;
}

/**
 * На узком экране центрирует текст между равными полями, размещая иконку слева.
 * @param props - Текст, состояние и обработчик выбора.
 * @returns Кнопка способа начала работы.
 */
function StartOption({ title, icon: Icon, iconColor, description, onClick, disabled }: StartOptionProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`grid w-full grid-cols-[1.5rem_minmax(0,1fr)_1.5rem] items-center gap-3 rounded-xl px-4 py-3 text-center sm:flex sm:text-left sm:flex-col sm:items-start sm:gap-4 sm:px-6 sm:py-5
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50
        bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1e1e22] dark:hover:bg-zinc-800`}>
      <Icon aria-hidden="true" strokeWidth={1.5} className={`size-6 shrink-0 ${iconColor}`} />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block text-base font-normal">{title}</span>
        <span className="block sm:max-w-[19ch] text-sm leading-snug text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

/**
 * Объясняет разницу между пустым проектом, шаблонами и импортом.
 * @param props - Обработчики существующих сценариев создания проекта.
 * @returns Варианты старта и помощь с переносом.
 */
export function NoProjectsActions({ ready, onCreate, onImport, onTemplates, onLogout, isImporting }: NoProjectsActionsProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <StartOption title="Выбрать шаблон" icon={PanelsTopLeft} iconColor="text-sky-700 dark:text-sky-400"
          description="Выберите бота и настройте под себя."
          onClick={onTemplates} disabled={!ready} />
        <StartOption title="Создать с нуля" icon={Plus} iconColor="text-emerald-700 dark:text-emerald-400" description="Соберите свой сценарий."
          onClick={onCreate} disabled={!ready} />
        <StartOption icon={Download} iconColor="text-violet-700 dark:text-violet-400" title={isImporting ? 'Загружаем файл…' : 'Импорт проекта'}
          description="Вставьте JSON или загрузите файл."
          onClick={onImport} disabled={!ready || isImporting} />
      </div>
      <div className="mt-6 w-full max-w-sm rounded-lg bg-zinc-50 px-4 py-4 dark:bg-[#121316] sm:mt-8 text-center text-sm text-pretty">
        <p className="font-normal">Бот в другом конструкторе?</p>
        <p className="mt-1 opacity-70">Напишите в группу, поможем с переносом.</p>
        <a href={TELEGRAM_CHAT_URL} target="_blank" rel="noopener noreferrer"
          className="mt-1 inline-flex rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Написать в группу
        </a>
      </div>
      <Button className="mt-5 h-8 px-4 font-normal text-muted-foreground" variant="ghost" onClick={onLogout} disabled={!ready}>Выйти</Button>
    </div>
  );
}
