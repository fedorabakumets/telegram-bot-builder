/**
 * @fileoverview Инструкция BotFather с опубликованного сайта документации во фрейме настроек.
 * @module components/admin/settings/botfather-steps
 */

/** Адрес инструкции по получению реквизитов входа в BotFather */
const BOTFATHER_DOCS_URL = 'https://fedorabakumets.github.io/telegram-bot-builder/docs/development/INSTALLATION#botfather';

/**
 * Показывает опубликованную инструкцию рядом с полями авторизации.
 * @returns JSX элемент фрейма документации
 */
export function BotfatherSteps() {
  return (
    <section className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-5">
        <h3 className="text-base font-semibold">Как получить данные в BotFather</h3>
        <a href={BOTFATHER_DOCS_URL} target="_blank" rel="noopener noreferrer"
          className="text-sm text-primary hover:underline shrink-0">
          Открыть отдельно
        </a>
      </div>
      <iframe title="Инструкция BotFather" src={BOTFATHER_DOCS_URL}
        className="w-full h-[700px] border-0 bg-background" loading="lazy" />
    </section>
  );
}
