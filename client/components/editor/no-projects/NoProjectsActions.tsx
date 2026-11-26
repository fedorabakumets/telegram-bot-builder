/** @fileoverview Понятный выбор способа создания первого проекта BotCraft. */
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
 * Показывает плитку действия; на узком экране сохраняет компактную строку.
 * @param props - Текст, состояние и обработчик выбора.
 * @returns Кнопка способа начала работы.
 */
function StartOption({ title, description, onClick, disabled }: StartOptionProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`group flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-center
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50
        border-border bg-background hover:bg-card`}>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block text-base font-semibold text-foreground">{title}</span>
        <span className="block text-sm text-foreground opacity-70 text-pretty">{description}</span>
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
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StartOption title="Выбрать шаблон"
          description="Выберите бота и настройте под себя."
          onClick={onTemplates} disabled={!ready} />
        <StartOption title="Создать с нуля" description="Соберите свой сценарий."
          onClick={onCreate} disabled={!ready} />
        <StartOption title={isImporting ? 'Загружаем файл…' : 'Импорт проекта'}
          description="Вставьте JSON или загрузите файл."
          onClick={onImport} disabled={!ready || isImporting} />
      </div>
      <div className="w-full rounded-lg bg-[color-mix(in_srgb,var(--background)_35%,var(--card))] px-4 py-3 text-center text-sm text-pretty">
        <p className="font-medium">Бот в другом конструкторе?</p>
        <p className="mt-1 text-foreground opacity-70">Напишите в группу, поможем с переносом.</p>
        <a href={TELEGRAM_CHAT_URL} target="_blank" rel="noopener noreferrer"
          className="mt-1 inline-flex rounded-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Написать в группу
        </a>
      </div>
      <Button className="h-8 w-full text-foreground opacity-70" variant="ghost" onClick={onLogout} disabled={!ready}>Выйти</Button>
    </div>
  );
}
