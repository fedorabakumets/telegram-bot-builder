/**
 * @fileoverview Кастомный репортер для тестов с поддержкой UTF-8
 * Выводит результаты тестов в читаемом формате с эмодзи
 * @module tests/utf8-reporter
 */

import { TestEvent, TestReporter } from 'node:test/reporters';

export class UTF8Reporter implements TestReporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private todo = 0;
  private currentSuite: string[] = [];

  start(): void {
    console.log('\n🧪 Запуск тестов...\n');
  }

  onTestEvent(event: TestEvent): void {
    switch (event.type) {
      case 'test:start':
        // Начало теста
        break;

      case 'test:pass':
        this.passed++;
        const testName = this.extractTestName(event.data);
        console.log(`  ✅ ${testName}`);
        break;

      case 'test:fail':
        this.failed++;
        const failedName = this.extractTestName(event.data);
        const errorMsg = event.data.details?.error?.message || 'Неизвестная ошибка';
        console.log(`  ❌ ${failedName}`);
        console.log(`     └─ ${errorMsg.split('\n')[0]}`);
        break;

      case 'test:skip':
        this.skipped++;
        const skipName = this.extractTestName(event.data);
        console.log(`  ⏭️  ${skipName}`);
        break;

      case 'test:todo':
        this.todo++;
        const todoName = this.extractTestName(event.data);
        console.log(`  📝 ${todoName}`);
        break;

      case 'suite:start':
        if (event.data.name) {
          this.currentSuite.push(event.data.name);
          console.log(`\n📁 ${this.currentSuite.join(' › ')}`);
        }
        break;

      case 'suite:end':
        this.currentSuite.pop();
        break;
    }
  }

  end(): void {
    const total = this.passed + this.failed + this.skipped + this.todo;
    console.log('\n' + '═'.repeat(50));
    console.log(`📊 Результаты тестов:`);
    console.log(`   Всего:  ${total}`);
    console.log(`   ✅ Прошло: ${this.passed}`);
    console.log(`   ❌ Провалено: ${this.failed}`);
    console.log(`   ⏭️  Пропущено: ${this.skipped}`);
    console.log(`   📝 Отложено: ${this.todo}`);
    console.log('═'.repeat(50) + '\n');

    if (this.failed > 0) {
      console.log('❌ Тесты не прошли!\n');
      process.exitCode = 1;
    } else {
      console.log('✅ Все тесты прошли успешно!\n');
    }
  }

  private extractTestName(data: any): string {
    // Получаем имя теста из данных события
    return data.name || data.testName || 'Без названия';
  }
}
