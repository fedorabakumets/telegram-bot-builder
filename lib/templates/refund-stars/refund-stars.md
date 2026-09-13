/**
 * @fileoverview Документация шаблона refund_stars
 * @module templates/refund-stars
 *
 * Узел «Вернуть звёзды» вызывает Bot API `refundStarPayment`
 * (`bot.refund_star_payment`) с user_id и telegram_payment_charge_id.
 * Выходы на холсте: Успех / Пустой код / Код не найден / Уже возвращён.
 * Без целевого выхода — fallback `refundMsg*` (+ опционально ignoreErrors → успех).
 */

export {};
