# Documentation Directory

Централизованная документация проекта Telegram Bot Builder.

## 📁 Структура

### 📋 guides/
Руководства пользователя:
- `README_RU.md` - Основное руководство на русском
- `WINDOWS_SETUP.md` - Установка на Windows
- `quick-start-windows.md` - Быстрый старт для Windows

### 📊 reports/
Отчеты и анализы:
- `NAVIGATION_SUCCESS_REPORT.md` - Отчет об исправлении навигации
- `final_success_report.md` - Итоговый отчет успешных исправлений
- `fedya_test_report.md` - Отчет тестирования шаблонов
- `bot_validation_report.txt` - Отчет валидации ботов
- `final_transition_fix_report.txt` - Отчет исправления переходов

### ⚙️ setup/
Установочные файлы:
- `setup.bat` - Автоматическая установка
- `start-dev.bat` - Запуск разработки (Windows)
- `start-prod.bat` - Запуск продакшна (Windows)
- `create-env.bat` - Создание .env файла
- `fix-postgres.bat` - Исправление PostgreSQL

## 📖 Назначение

Эта структура обеспечивает:
- **Быстрый доступ** к документации
- **Разделение** по типам документов
- **Версионность** отчетов и анализов
- **Централизованное** управление установкой

## 🔍 Навигация

```bash
# Основная документация
cat docs/guides/README_RU.md

# Установка на Windows
docs/setup/setup.bat

# Отчеты разработки
ls docs/reports/

# Все руководства
find docs/guides -name "*.md"
```

---

*Организованная документация для эффективной поддержки проекта*