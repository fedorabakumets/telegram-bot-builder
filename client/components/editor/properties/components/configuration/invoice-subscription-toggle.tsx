/**
 * @fileoverview Галка «Подписка на 30 дней» для счёта / ссылки на счёт
 * @module components/editor/properties/components/configuration/invoice-subscription-toggle
 */

import { PropertyCheckbox } from '../common/property-checkbox';

/** Пропсы переключателя подписки */
interface InvoiceSubscriptionToggleProps {
  /** Уникальный id чекбокса */
  id: string;
  /** Включена ли подписка */
  checked: boolean;
  /** Смена значения */
  onChange: (checked: boolean) => void;
}

/**
 * Чекбокс подписки Stars: subscription_period = 2592000 в Bot API
 * @param props - Свойства
 * @returns JSX элемент
 */
export function InvoiceSubscriptionToggle({
  id,
  checked,
  onChange,
}: InvoiceSubscriptionToggleProps) {
  return (
    <PropertyCheckbox
      id={id}
      label="Подписка на 30 дней"
      checked={checked}
      onChange={onChange}
      description="Автопродление каждый месяц. Цена не больше 10 000 ⭐. В чат с кнопкой «Оплатить» Telegram подписку не шлёт — только эта ссылка. Отмена продления — отдельный узел позже."
    />
  );
}
