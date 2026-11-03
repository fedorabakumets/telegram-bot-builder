/** @fileoverview Читаемый отчёт событий Node.js с поддержкой UTF-8. */
import type { TestEvent } from 'node:test/reporters';

/** Собирает и выводит результаты тестов. */
export class UTF8Reporter {
  /** Количество успешных тестов. */
  private passed = 0;
  /** Количество неуспешных тестов. */
  private failed = 0;
  /** Количество пропущенных тестов. */
  private skipped = 0;
  /** Количество отложенных тестов. */
  private todo = 0;

  /** Выводит начало отчёта. */
  start(): void { console.log('\n🧪 Запуск тестов...\n'); }

  /**
   * Обрабатывает реальное событие тестового потока Node.js.
   * @param event - Событие теста.
   */
  onTestEvent(event: TestEvent): void {
    if (event.type === 'test:pass') {
      if (event.data.details.type === 'suite') return;
      if (event.data.skip) { this.skipped++; console.log(`  ⏭️  ${event.data.name}`); }
      else if (event.data.todo) { this.todo++; console.log(`  📝 ${event.data.name}`); }
      else { this.passed++; console.log(`  ✅ ${event.data.name}`); }
    } else if (event.type === 'test:fail') {
      if (event.data.details.type === 'suite') return;
      this.failed++;
      console.log(`  ❌ ${event.data.name}`);
      console.log(`     └─ ${event.data.details.error?.message?.split('\n')[0] || 'Неизвестная ошибка'}`);
    }
  }

  /** Выводит итоги и устанавливает код ошибки при неуспешных тестах. */
  end(): void {
    const total = this.passed + this.failed + this.skipped + this.todo;
    console.log(`\n📊 Всего: ${total} · Прошло: ${this.passed} · Провалено: ${this.failed} · Пропущено: ${this.skipped} · Отложено: ${this.todo}\n`);
    if (this.failed > 0) process.exitCode = 1;
  }
}
