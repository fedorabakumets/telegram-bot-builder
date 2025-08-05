"""
Прямое тестирование текущего генератора кода
"""
import json

def create_minimal_test():
    """Создает минимальный тест команды с инлайн кнопками"""
    
    # Используем существующий сгенерированный код как пример
    code_check = """
# Пример того, как ДОЛЖЕН выглядеть правильный код:

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = '''🎉 Добро пожаловать!

Это тестовый бот для проверки команд с инлайн кнопками.

Попробуйте написать 'помощь' или 'старт' как обычное сообщение.'''
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Синонимы ДОЛЖНЫ вызывать тот же обработчик:
@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)  # ЭТО КЛЮЧЕВОЕ - вызывает основной обработчик!
"""
    
    print("🔍 Анализ правильного кода:")
    print("1. Команда /start создает инлайн клавиатуру и отправляет ее")
    print("2. Синоним 'старт' вызывает тот же обработчик start_handler")
    print("3. Значит синоним ДОЛЖЕН отправлять те же инлайн кнопки")
    print()
    print("❓ Если синонимы не отправляют инлайн кнопки, проблема может быть:")
    print("- В самом генераторе команд (generateCommandHandler)")
    print("- В обработке клавиатур (generateKeyboard)")
    print("- В вызове синонимов (generateSynonymHandler)")
    
    return code_check

def analyze_existing_bots():
    """Анализирует существующие сгенерированные боты"""
    
    existing_files = [
        'complex_test_bot_3.py',
        'generated_advanced_bot.py', 
        'test_command_inline_bot.py'
    ]
    
    for filename in existing_files:
        try:
            print(f"\n📁 Анализ файла: {filename}")
            with open(filename, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Проверяем структуру команд
            has_command_start = '@dp.message(CommandStart())' in content
            has_command_help = '@dp.message(Command("help"))' in content
            has_inline_keyboard = 'InlineKeyboardBuilder()' in content
            has_synonyms = 'synonym' in content.lower()
            has_keyboard_markup = 'reply_markup=keyboard' in content
            
            print(f"✓ Команда /start: {'Да' if has_command_start else 'Нет'}")
            print(f"✓ Команда /help: {'Да' if has_command_help else 'Нет'}")
            print(f"✓ Инлайн клавиатуры: {'Да' if has_inline_keyboard else 'Нет'}")
            print(f"✓ Синонимы: {'Да' if has_synonyms else 'Нет'}")
            print(f"✓ Отправка клавиатур: {'Да' if has_keyboard_markup else 'Нет'}")
            
            # Ищем проблемные паттерны
            if has_command_start and has_inline_keyboard:
                # Проверяем, правильно ли команда отправляет клавиатуру
                start_handler_lines = []
                lines = content.split('\n')
                in_start_handler = False
                
                for line in lines:
                    if '@dp.message(CommandStart())' in line:
                        in_start_handler = True
                        continue
                    elif in_start_handler and line.startswith('@') and 'dp.' in line:
                        break  # Начался следующий обработчик
                    elif in_start_handler:
                        start_handler_lines.append(line)
                
                start_handler_code = '\n'.join(start_handler_lines)
                
                has_keyboard_builder = 'InlineKeyboardBuilder()' in start_handler_code
                has_markup_answer = 'reply_markup=' in start_handler_code
                
                print(f"  🔍 В start_handler:")
                print(f"    - Создает клавиатуру: {'Да' if has_keyboard_builder else 'Нет'}")
                print(f"    - Отправляет с клавиатурой: {'Да' if has_markup_answer else 'Нет'}")
                
                if not has_keyboard_builder or not has_markup_answer:
                    print(f"    ❌ ПРОБЛЕМА: start_handler НЕ отправляет инлайн кнопки!")
                else:
                    print(f"    ✅ start_handler корректно отправляет инлайн кнопки")
                    
        except FileNotFoundError:
            print(f"❌ Файл {filename} не найден")
        except Exception as e:
            print(f"❌ Ошибка при анализе {filename}: {e}")

def main():
    """Основная функция анализа"""
    print("🔍 ПРЯМОЙ АНАЛИЗ ПРОБЛЕМЫ С ИНЛАЙН КНОПКАМИ В КОМАНДАХ")
    print("=" * 60)
    
    create_minimal_test()
    analyze_existing_bots()
    
    print("\n💡 ВЫВОДЫ:")
    print("Если команды /start и /help не отправляют инлайн кнопки, то:")
    print("1. Проблема в генераторе функции generateCommandHandler или generateStartHandler")
    print("2. Нужно проверить функцию generateKeyboard")
    print("3. Возможно проблема в том, что команды не вызывают generateKeyboard")

if __name__ == "__main__":
    main()