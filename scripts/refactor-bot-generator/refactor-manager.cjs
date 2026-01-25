#!/usr/bin/env node

/**
 * Менеджер рефакторинга bot-generator.ts
 * Управляет всем процессом рефакторинга с проверками и откатами
 */

const fs = require('fs');
const { execSync } = require('child_process');

class RefactorManager {
  constructor() {
    this.steps = [
      {
        id: 'analyze',
        name: 'Анализ текущего состояния',
        script: 'scripts/analyze-functions.js',
        description: 'Анализирует функции и дублирование в bot-generator.ts',
        risk: 'SAFE',
        required: true
      },
      {
        id: 'remove-duplicates',
        name: 'Удаление дублированных функций',
        script: 'scripts/remove-duplicates.cjs',
        description: 'Удаляет 10 дублированных функций (~200 строк)',
        risk: 'LOW',
        rollback: 'scripts/rollback-duplicates.cjs'
      },
      {
        id: 'split-main',
        name: 'Разбиение главной функции',
        script: 'scripts/split-main-function.cjs',
        description: 'Создает модульную архитектуру для generatePythonCode',
        risk: 'CRITICAL',
        rollback: 'scripts/rollback-main-split.cjs'
      },
      {
        id: 'implement-modules',
        name: 'Реализация модулей',
        script: null, // Ручная работа
        description: 'Реализация заглушек модулей (ручная работа)',
        risk: 'HIGH',
        manual: true
      },
      {
        id: 'validate',
        name: 'Финальная валидация',
        script: 'scripts/validate-fixes.cjs',
        description: 'Проверяет результаты рефакторинга',
        risk: 'SAFE',
        required: true
      }
    ];
    
    this.currentStep = 0;
    this.completedSteps = [];
  }

  // Проверяем текущее состояние
  checkCurrentState() {
    console.log('🔍 Проверяем текущее состояние рефакторинга...');
    
    const botGeneratorExists = fs.existsSync('client/src/lib/bot-generator.ts');
    const modulesExist = fs.existsSync('client/src/lib/bot-generator');
    
    if (!botGeneratorExists) {
      throw new Error('Файл bot-generator.ts не найден!');
    }
    
    // Проверяем размер файла
    const content = fs.readFileSync('client/src/lib/bot-generator.ts', 'utf8');
    const lines = content.split('\\n').length;
    
    console.log(`  📄 Размер bot-generator.ts: ${lines} строк`);
    console.log(`  📁 Модули существуют: ${modulesExist ? '✅' : '❌'}`);
    
    // Определяем текущий этап
    if (lines > 9000) {
      console.log('  📊 Статус: Исходное состояние (дубли не удалены)');
      this.currentStep = 1; // remove-duplicates
    } else if (lines > 2000) {
      console.log('  📊 Статус: Дубли удалены, главная функция не разбита');
      this.currentStep = 2; // split-main
    } else {
      console.log('  📊 Статус: Модульная архитектура создана');
      this.currentStep = 3; // implement-modules
    }
    
    return { lines, modulesExist };
  }

  // Запускаем скрипт с проверками
  runScript(scriptPath, stepName) {
    console.log(`\\n🚀 Выполняем: ${stepName}`);
    console.log(`📜 Скрипт: ${scriptPath}`);
    
    try {
      execSync(`node ${scriptPath}`, { stdio: 'inherit' });
      console.log(`✅ ${stepName} выполнен успешно`);
      return true;
    } catch (error) {
      console.error(`❌ Ошибка в ${stepName}:`, error.message);
      return false;
    }
  }

  // Проверяем TypeScript после изменений
  checkTypeScript() {
    console.log('\\n🔍 Проверяем TypeScript...');
    
    try {
      const result = execSync('npx tsc --noEmit --skipLibCheck client/src/lib/bot-generator.ts', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      console.log('✅ TypeScript компиляция успешна');
      return true;
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const botGeneratorErrors = (output.match(/bot-generator\\.ts/g) || []).length;
      
      console.log(`⚠️ Ошибки TypeScript: ${botGeneratorErrors} в bot-generator.ts`);
      
      if (botGeneratorErrors === 0) {
        console.log('✅ Ошибки не связаны с нашими изменениями');
        return true;
      }
      
      console.log('❌ Есть ошибки в bot-generator.ts');
      return false;
    }
  }

  // Тестируем TypeScript компиляцию
  testApplication() {
    console.log('\\n🧪 Тестируем TypeScript компиляцию...');
    
    try {
      // Проверяем TypeScript компиляцию
      const child = execSync('npm run check', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('✅ TypeScript компиляция прошла успешно');
      return true;
    } catch (error) {
      console.log('⚠️ Проблемы с TypeScript компиляцией');
      console.log('Проверьте ошибки вручную: npm run check');
      return false;
    }
  }

  // Выполняем откат
  rollback(step) {
    if (!step.rollback) {
      console.log('❌ Скрипт отката не найден');
      return false;
    }
    
    console.log(`\\n🔄 Выполняем откат: ${step.name}`);
    console.log(`📜 Скрипт отката: ${step.rollback}`);
    
    try {
      execSync(`node ${step.rollback}`, { stdio: 'inherit' });
      console.log('✅ Откат выполнен успешно');
      return true;
    } catch (error) {
      console.error('❌ Ошибка отката:', error.message);
      return false;
    }
  }

  // Интерактивное меню
  showMenu() {
    console.log('\\n' + '='.repeat(60));
    console.log('🔧 МЕНЕДЖЕР РЕФАКТОРИНГА BOT-GENERATOR.TS');
    console.log('='.repeat(60));
    
    this.steps.forEach((step, index) => {
      const status = index < this.currentStep ? '✅' : 
                    index === this.currentStep ? '🔄' : '⏳';
      const risk = step.risk === 'CRITICAL' ? '🔴' : 
                   step.risk === 'HIGH' ? '🟡' : 
                   step.risk === 'LOW' ? '🟠' : '🟢';
      
      console.log(`${index + 1}. ${status} ${step.name} ${risk}`);
      console.log(`   ${step.description}`);
      if (step.rollback) {
        console.log(`   🔄 Откат: ${step.rollback}`);
      }
      console.log('');
    });
    
    console.log('Команды:');
    console.log('  next    - Выполнить следующий этап');
    console.log('  run <N> - Выполнить конкретный этап');
    console.log('  rollback <N> - Откатить этап');
    console.log('  status  - Показать текущий статус');
    console.log('  analyze - Запустить анализ');
    console.log('  test    - Протестировать приложение');
    console.log('  exit    - Выйти');
    console.log('');
  }

  // Выполняем конкретный этап
  executeStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      console.log('❌ Неверный номер этапа');
      return false;
    }
    
    const step = this.steps[stepIndex];
    
    if (step.manual) {
      console.log(`\\n📋 Этап "${step.name}" требует ручной работы:`);
      console.log(`   ${step.description}`);
      console.log('\\n📖 Инструкции:');
      console.log('   1. Изучите MAIN_FUNCTION_SPLIT_PLAN.md');
      console.log('   2. Реализуйте модули по очереди');
      console.log('   3. Тестируйте после каждого модуля');
      return true;
    }
    
    if (!step.script) {
      console.log('❌ Скрипт не определен для этого этапа');
      return false;
    }
    
    // Проверяем существование скрипта
    if (!fs.existsSync(step.script)) {
      console.log(`❌ Скрипт не найден: ${step.script}`);
      return false;
    }
    
    console.log(`\\n⚠️ ВНИМАНИЕ: Риск этапа - ${step.risk}`);
    if (step.risk === 'CRITICAL') {
      console.log('🔴 КРИТИЧЕСКИЙ РИСК! Убедитесь что у вас есть резервные копии!');
    }
    
    // Выполняем этап
    const success = this.runScript(step.script, step.name);
    
    if (success) {
      // Проверяем результат
      const tsOk = this.checkTypeScript();
      
      if (!tsOk && step.risk !== 'SAFE') {
        console.log('\\n⚠️ Обнаружены проблемы с TypeScript');
        console.log('Хотите откатить изменения? (y/N)');
        
        // В реальном использовании здесь был бы интерактивный ввод
        // Пока что просто предупреждаем
        console.log('💡 Для отката используйте: node scripts/refactor-manager.cjs rollback ' + (stepIndex + 1));
      }
      
      this.completedSteps.push(stepIndex);
      if (stepIndex >= this.currentStep) {
        this.currentStep = stepIndex + 1;
      }
    }
    
    return success;
  }

  // Основной метод выполнения
  async run() {
    try {
      console.log('🚀 Запуск менеджера рефакторинга bot-generator.ts\\n');
      
      // Проверяем текущее состояние
      this.checkCurrentState();
      
      // Показываем меню
      this.showMenu();
      
      // Простая демонстрация - выполняем анализ
      console.log('🔍 Выполняем анализ текущего состояния...');
      this.executeStep(0); // analyze
      
      console.log('\\n📋 Для продолжения используйте:');
      console.log('  node scripts/refactor-manager.cjs next    # Следующий этап');
      console.log('  node scripts/refactor-manager.cjs run 2   # Конкретный этап');
      console.log('  node scripts/refactor-manager.cjs status  # Текущий статус');
      
    } catch (error) {
      console.error('❌ Ошибка менеджера рефакторинга:', error.message);
      process.exit(1);
    }
  }

  // Обработка аргументов командной строки
  handleArgs() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case 'next':
        this.checkCurrentState();
        if (this.currentStep < this.steps.length) {
          this.executeStep(this.currentStep);
        } else {
          console.log('✅ Все этапы завершены!');
        }
        break;
        
      case 'run':
        const stepNum = parseInt(args[1]);
        if (stepNum) {
          this.executeStep(stepNum - 1);
        } else {
          console.log('❌ Укажите номер этапа: run <N>');
        }
        break;
        
      case 'rollback':
        const rollbackNum = parseInt(args[1]);
        if (rollbackNum && rollbackNum > 0 && rollbackNum <= this.steps.length) {
          const step = this.steps[rollbackNum - 1];
          this.rollback(step);
        } else {
          console.log('❌ Укажите номер этапа: rollback <N>');
        }
        break;
        
      case 'status':
        this.checkCurrentState();
        this.showMenu();
        break;
        
      case 'analyze':
        this.executeStep(0);
        break;
        
      case 'test':
        this.testApplication();
        break;
        
      default:
        this.run();
    }
  }
}

// Запускаем менеджер
if (require.main === module) {
  const manager = new RefactorManager();
  manager.handleArgs();
}

module.exports = RefactorManager;