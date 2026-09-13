/**
 * @fileoverview Тексты пояснений для карточек вкладки «Аналитика»
 * @module client/components/editor/analytics/analytics-chart-info-texts
 */

import React from 'react';
import { ChartInfoSpoiler } from './chart-info-spoiler';

/**
 * Пояснение: всего пользователей и прирост
 * @returns JSX спойлера
 */
export function TotalUsersChartInfo(): React.JSX.Element {
  return (
    <ChartInfoSpoiler>
      <p>
        Общее число людей, которые написали боту, и график прироста —
        сколько новых появлялось в каждом отрезке времени.
      </p>
      <p>
        Можно смотреть общий прирост или разбить по источникам (ссылкам).
        Режим «Накопительно» складывает прирост нарастающим итогом.
      </p>
    </ChartInfoSpoiler>
  );
}

/**
 * Пояснение: активность сообщений
 * @returns JSX спойлера
 */
export function MessagesActivityChartInfo(): React.JSX.Element {
  return (
    <ChartInfoSpoiler>
      <p>
        Сколько сообщений прошло между ботом и людьми за каждый отрезок.
        Можно смотреть все вместе или разделить на входящие и исходящие.
      </p>
      <p>
        Короткие периоды считаются по истории диалогов; длинные —
        по дневным счётчикам, которые не обнуляются при очистке старых сообщений.
      </p>
    </ChartInfoSpoiler>
  );
}

/**
 * Пояснение: активность пользователей
 * @returns JSX спойлера
 */
export function UsersActivityChartInfo(): React.JSX.Element {
  return (
    <ChartInfoSpoiler>
      <p>
        Сколько <b>разных людей</b> что-то сделали за отрезок: написали
        сообщение (в том числе команду вроде /start) или нажали кнопку.
        Ответы бота не считаются. Один человек за отрезок — один раз.
      </p>
      <p>
        «Новички» — впервые появились в этом отрезке; остальные — «вернувшиеся».
        Большое число — уникальные за весь период, не сумма по отрезкам.
      </p>
    </ChartInfoSpoiler>
  );
}

/**
 * Пояснение: динамика источников трафика
 * @returns JSX спойлера
 */
export function SourcesTrendChartInfo(): React.JSX.Element {
  return (
    <ChartInfoSpoiler>
      <p>
        Откуда приходили новые люди со временем: по каким ссылкам и меткам.
        Столбцы или области показывают вклад каждого источника в отрезке.
      </p>
    </ChartInfoSpoiler>
  );
}

/**
 * Пояснение: круговая диаграмма источников
 * @returns JSX спойлера
 */
export function SourcesDonutChartInfo(): React.JSX.Element {
  return (
    <ChartInfoSpoiler label="Что это за диаграмма?">
      <p>
        Доли всех людей по источнику первого визита — с какой ссылки
        или метки они попали к боту. Сумма долей — вся аудитория.
      </p>
    </ChartInfoSpoiler>
  );
}

/**
 * Пояснение: топ кнопок
 * @returns JSX спойлера
 */
export function PopularButtonsChartInfo(): React.JSX.Element {
  return (
    <ChartInfoSpoiler>
      <p>
        Десять самых частых нажатий на кнопки под сообщениями бота
        за выбранный период. Чем длиннее полоса, тем больше нажатий.
      </p>
    </ChartInfoSpoiler>
  );
}

/**
 * Пояснение: Premium
 * @returns JSX спойлера
 */
export function PremiumDonutChartInfo(): React.JSX.Element {
  return (
    <ChartInfoSpoiler label="Что это за диаграмма?">
      <p>
        Доля людей с подпиской Telegram Premium среди аудитории бота
        и доля обычных пользователей без неё.
      </p>
    </ChartInfoSpoiler>
  );
}

/**
 * Пояснение: языки
 * @returns JSX спойлера
 */
export function LanguagesDonutChartInfo(): React.JSX.Element {
  return (
    <ChartInfoSpoiler label="Что это за диаграмма?">
      <p>
        На каких языках интерфейса Telegram общаются люди вашего бота.
        Язык берётся из настроек профиля в Telegram.
      </p>
    </ChartInfoSpoiler>
  );
}
