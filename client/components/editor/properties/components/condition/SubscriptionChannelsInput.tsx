/**
 * @fileoverview Chips-инпут для ввода нескольких Telegram-каналов/групп.
 * Используется в ветках условия is_subscribed / is_not_subscribed.
 * Первая строка содержит селект режима all/any (при 2+ каналах) и кнопку удаления ветки.
 * @module components/editor/properties/components/condition/SubscriptionChannelsInput
 */
import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Пропсы компонента SubscriptionChannelsInput
 */
interface SubscriptionChannelsInputProps {
  /** Каналы через запятую, например "@chan1,@chan2" */
  value: string;
  /** Режим проверки нескольких каналов */
  subscriptionMode?: 'all' | 'any';
  /** Вызывается при изменении списка каналов */
  onValueChange: (value: string) => void;
  /** Вызывается при изменении режима проверки */
  onModeChange: (mode: 'all' | 'any') => void;
  /** Готовый JSX элемент кнопки удаления ветки — рендерится в первой строке справа */
  deleteButton?: React.ReactNode;
}

/**
 * Нормализует введённое значение канала к виду @username или ссылке.
 * @param rawValue - Сырое значение из поля ввода
 * @returns Нормализованная строка канала
 */
export function normalizeSubscriptionValue(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  const telegramLinkMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(.+)$/i);
  if (telegramLinkMatch) {
    const path = telegramLinkMatch[1].split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
    if (!path) return '';
    if (path.startsWith('+') || path.toLowerCase().startsWith('joinchat/')) return trimmed;
    const slug = path.split('/').pop()?.trim();
    if (slug && /^[a-zA-Z0-9_]+$/.test(slug)) return `@${slug}`;
    return trimmed;
  }

  if (trimmed.startsWith('@')) {
    const username = trimmed.slice(1).trim();
    return /^[a-zA-Z0-9_]+$/.test(username) ? `@${username}` : trimmed;
  }

  if (/^[a-zA-Z0-9_]+$/.test(trimmed)) return `@${trimmed}`;
  return trimmed;
}

/**
 * Chips-инпут для ввода нескольких Telegram-каналов.
 * Строка 1: селект режима all/any (при 2+ каналах) + кнопка удаления справа.
 * Строка 2: chips каналов.
 * Строка 3: поле ввода нового канала.
 * Строка 4: подсказка про администратора.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function SubscriptionChannelsInput({
  value,
  subscriptionMode = 'all',
  onValueChange,
  onModeChange,
  deleteButton,
}: SubscriptionChannelsInputProps) {
  /** Текущий текст в поле ввода нового канала */
  const [inputValue, setInputValue] = useState('');

  /** Список каналов из строки через запятую */
  const channels = value ? value.split(',').map(c => c.trim()).filter(Boolean) : [];

  /**
   * Добавляет новый канал из поля ввода в список.
   */
  const addChannel = () => {
    const normalized = normalizeSubscriptionValue(inputValue);
    if (!normalized || channels.includes(normalized)) {
      setInputValue('');
      return;
    }
    onValueChange([...channels, normalized].join(','));
    setInputValue('');
  };

  /**
   * Удаляет канал по индексу из списка.
   * @param index - Индекс удаляемого канала
   */
  const removeChannel = (index: number) => {
    onValueChange(channels.filter((_, i) => i !== index).join(','));
  };

  /**
   * Обрабатывает нажатие клавиш в поле ввода.
   * @param e - Событие клавиатуры
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChannel();
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Строка 1: селект режима (если 2+ каналов) + кнопка удаления справа — только если есть что показать */}
      {(channels.length >= 2 || deleteButton) && (
        <div className="flex items-center gap-2">
          {channels.length >= 2 && (
            <Select value={subscriptionMode} onValueChange={v => onModeChange(v as 'all' | 'any')}>
              <SelectTrigger className="text-xs h-7 bg-white/60 dark:bg-slate-950/60 border border-violet-300/40 dark:border-violet-700/40 hover:border-violet-400/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-400/30 rounded-md text-violet-900 dark:text-violet-50 w-auto min-w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gradient-to-br from-violet-50/95 to-purple-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-violet-200/50 dark:border-violet-800/50 shadow-xl">
                <SelectItem value="all">
                  <span className="text-xs text-violet-700 dark:text-violet-300">Подписан на все каналы</span>
                </SelectItem>
                <SelectItem value="any">
                  <span className="text-xs text-violet-700 dark:text-violet-300">Подписан хотя бы на один</span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        {/* Кнопка удаления — для subscription передаётся в первую строку вместе с селектом оператора */}
        {deleteButton && <div className="ml-auto">{deleteButton}</div>}
        </div>
      )}

      {/* Строка 2: chips существующих каналов */}
      {channels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {channels.map((ch, i) => (
            <span
              key={i}
              className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 border border-violet-200 dark:border-violet-700"
            >
              {ch}
              <button
                type="button"
                onClick={() => removeChannel(i)}
                className="text-violet-400 hover:text-violet-700 dark:hover:text-violet-200 leading-none"
                aria-label={`Удалить ${ch}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Строка 3: поле ввода нового канала */}
      <Input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addChannel}
        placeholder="+ Добавить канал"
        className="text-sm h-7 w-full"
      />

      {/* Строка 4: подсказка про администратора */}
      <p className="text-xs text-violet-500/80 dark:text-violet-300/70">
        Для проверки членства в группе бот должен быть её администратором. Для каналов это не требуется.
      </p>
    </div>
  );
}
