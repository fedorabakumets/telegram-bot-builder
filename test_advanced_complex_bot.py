"""
Комплексный тест продвинутого бота для анализа качества генератора кода
"""

import requests
import json
import re
from typing import Dict, List, Any

def get_bot_project(project_id: int = 2):
    """Получает данные проекта бота по ID"""
    try:
        response = requests.get(f'http://localhost:5000/api/projects/{project_id}')
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка получения проекта: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return None

def generate_bot_code(project_data):
    """Генерирует код бота через API экспорта"""
    try:
        project_id = project_data["id"]
        
        response = requests.post(
            f'http://localhost:5000/api/projects/{project_id}/export',
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("code", "")
        else:
            print(f"❌ Ошибка генерации кода: {response.status_code}")
            print(f"Ответ: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

def analyze_bot_structure(project_data) -> Dict:
    """Анализирует структуру бота"""
    bot_data = project_data["data"]
    nodes = bot_data.get("nodes", [])
    connections = bot_data.get("connections", [])
    
    analysis = {
        "total_nodes": len(nodes),
        "total_connections": len(connections),
        "node_types": {},
        "commands": [],
        "keyboards": {"inline": 0, "reply": 0},
        "buttons": {"total": 0, "inline": 0, "reply": 0, "special": 0},
        "special_features": [],
        "complexity_score": 0
    }
    
    # Анализ узлов
    for node in nodes:
        node_type = node.get("type", "unknown")
        analysis["node_types"][node_type] = analysis["node_types"].get(node_type, 0) + 1
        
        node_data = node.get("data", {})
        
        # Команды
        if "command" in node_data:
            command_info = {
                "command": node_data["command"],
                "has_synonyms": bool(node_data.get("synonyms")),
                "synonyms_count": len(node_data.get("synonyms", []))
            }
            analysis["commands"].append(command_info)
        
        # Клавиатуры
        keyboard_type = node_data.get("keyboardType")
        if keyboard_type:
            analysis["keyboards"][keyboard_type] = analysis["keyboards"].get(keyboard_type, 0) + 1
            
            buttons = node_data.get("buttons", [])
            analysis["buttons"]["total"] += len(buttons)
            
            if keyboard_type == "inline":
                analysis["buttons"]["inline"] += len(buttons)
            elif keyboard_type == "reply":
                analysis["buttons"]["reply"] += len(buttons)
                
                # Специальные кнопки
                for button in buttons:
                    if button.get("action") in ["contact", "location"]:
                        analysis["buttons"]["special"] += 1
    
    # Специальные функции
    if any(cmd["has_synonyms"] for cmd in analysis["commands"]):
        analysis["special_features"].append("Синонимы команд")
    
    if analysis["buttons"]["special"] > 0:
        analysis["special_features"].append("Специальные кнопки (contact/location)")
    
    if analysis["keyboards"]["inline"] > 0 and analysis["keyboards"]["reply"] > 0:
        analysis["special_features"].append("Смешанные клавиатуры")
    
    # URL кнопки
    url_buttons = 0
    for node in nodes:
        buttons = node.get("data", {}).get("buttons", [])
        url_buttons += len([b for b in buttons if b.get("action") == "url"])
    
    if url_buttons > 0:
        analysis["special_features"].append(f"Внешние ссылки ({url_buttons})")
    
    # Расчет сложности
    complexity = 0
    complexity += analysis["total_nodes"] * 2
    complexity += analysis["total_connections"] * 1
    complexity += len(analysis["commands"]) * 3
    complexity += analysis["keyboards"]["inline"] * 2
    complexity += analysis["keyboards"]["reply"] * 3
    complexity += analysis["buttons"]["special"] * 5
    complexity += len(analysis["special_features"]) * 10
    
    analysis["complexity_score"] = complexity
    
    return analysis

def analyze_generated_code(code: str) -> Dict:
    """Анализирует качество сгенерированного кода"""
    if not code:
        return {"error": "Код не сгенерирован"}
    
    analysis = {
        "lines_of_code": len(code.split('\n')),
        "imports": [],
        "handlers": [],
        "commands": [],
        "callback_handlers": [],
        "reply_handlers": [],
        "special_handlers": [],
        "keyboard_builders": {"inline": 0, "reply": 0},
        "error_handling": False,
        "logging": False,
        "code_quality_score": 0
    }
    
    lines = code.split('\n')
    
    # Импорты
    for line in lines:
        if line.strip().startswith(('import ', 'from ')):
            analysis["imports"].append(line.strip())
    
    # Обработчики
    handler_pattern = r'async def (\w+_handler)'
    handlers = re.findall(handler_pattern, code)
    analysis["handlers"] = handlers
    
    # Команды
    command_pattern = r'@dp\.message\(Command\("([^"]+)"\)'
    commands = re.findall(command_pattern, code)
    analysis["commands"] = commands
    
    # Callback обработчики
    callback_pattern = r'@dp\.callback_query'
    analysis["callback_handlers"] = len(re.findall(callback_pattern, code))
    
    # Reply обработчики
    reply_pattern = r'@dp\.message\(F\.text == "([^"]+)"\)'
    reply_handlers = re.findall(reply_pattern, code)
    analysis["reply_handlers"] = reply_handlers
    
    # Специальные обработчики
    if 'F.contact' in code:
        analysis["special_handlers"].append("contact")
    if 'F.location' in code:
        analysis["special_handlers"].append("location")
    
    # Клавиатуры
    analysis["keyboard_builders"]["inline"] = code.count('InlineKeyboardBuilder()')
    analysis["keyboard_builders"]["reply"] = code.count('ReplyKeyboardBuilder()')
    
    # Обработка ошибок и логирование
    analysis["error_handling"] = 'try:' in code and 'except' in code
    analysis["logging"] = any(log in code for log in ['logging', 'logger', 'log.'])
    
    # Оценка качества кода
    quality = 0
    quality += len(analysis["imports"]) * 2
    quality += len(analysis["handlers"]) * 5
    quality += len(analysis["commands"]) * 3
    quality += analysis["callback_handlers"] * 4
    quality += len(analysis["reply_handlers"]) * 3
    quality += len(analysis["special_handlers"]) * 6
    quality += (analysis["keyboard_builders"]["inline"] + analysis["keyboard_builders"]["reply"]) * 2
    
    if analysis["error_handling"]:
        quality += 10
    if analysis["logging"]:
        quality += 5
    
    analysis["code_quality_score"] = quality
    
    return analysis

def test_specific_features(code: str) -> Dict:
    """Тестирует специфические функции бота"""
    tests = {
        "command_synonyms": False,
        "inline_buttons": False,
        "reply_buttons": False,
        "external_urls": False,
        "special_buttons": False,
        "proper_imports": False,
        "async_handlers": False,
        "keyboard_removal": False,
        "callback_query_answer": False
    }
    
    # Синонимы команд
    if 'F.text.in_(' in code:
        tests["command_synonyms"] = True
    
    # Inline кнопки
    if 'InlineKeyboardButton' in code:
        tests["inline_buttons"] = True
    
    # Reply кнопки
    if 'ReplyKeyboardBuilder' in code:
        tests["reply_buttons"] = True
    
    # Внешние ссылки
    if 'url=' in code and 'http' in code:
        tests["external_urls"] = True
    
    # Специальные кнопки
    if 'request_contact=True' in code or 'request_location=True' in code:
        tests["special_buttons"] = True
    
    # Правильные импорты
    required_imports = ['aiogram', 'types', 'Dispatcher', 'Bot']
    tests["proper_imports"] = all(imp in code for imp in required_imports)
    
    # Асинхронные обработчики
    tests["async_handlers"] = 'async def' in code
    
    # Удаление клавиатуры
    tests["keyboard_removal"] = 'ReplyKeyboardRemove' in code
    
    # Ответ на callback
    tests["callback_query_answer"] = 'callback_query.answer()' in code
    
    return tests

def run_comprehensive_test():
    """Запускает комплексный тест продвинутого бота"""
    print("🚀 Запуск комплексного теста продвинутого бота...")
    print("=" * 60)
    
    # Получаем данные проекта
    project_data = get_bot_project(2)
    if not project_data:
        print("❌ Не удалось получить данные проекта")
        return
    
    print(f"✅ Проект загружен: {project_data['name']}")
    print()
    
    # Анализируем структуру
    structure_analysis = analyze_bot_structure(project_data)
    print("📊 АНАЛИЗ СТРУКТУРЫ БОТА:")
    print(f"   • Общее количество узлов: {structure_analysis['total_nodes']}")
    print(f"   • Общее количество связей: {structure_analysis['total_connections']}")
    print(f"   • Типы узлов: {dict(structure_analysis['node_types'])}")
    print(f"   • Команды: {len(structure_analysis['commands'])}")
    print(f"   • Клавиатуры: {structure_analysis['keyboards']}")
    print(f"   • Кнопки: {structure_analysis['buttons']}")
    print(f"   • Специальные функции: {structure_analysis['special_features']}")
    print(f"   • Оценка сложности: {structure_analysis['complexity_score']}/100")
    print()
    
    # Генерируем код
    print("🔧 Генерация Python кода...")
    bot_code = generate_bot_code(project_data)
    
    if not bot_code:
        print("❌ Не удалось сгенерировать код")
        return
    
    print("✅ Код успешно сгенерирован")
    print()
    
    # Анализируем код
    code_analysis = analyze_generated_code(bot_code)
    print("🔍 АНАЛИЗ СГЕНЕРИРОВАННОГО КОДА:")
    print(f"   • Строк кода: {code_analysis['lines_of_code']}")
    print(f"   • Импортов: {len(code_analysis['imports'])}")
    print(f"   • Обработчиков: {len(code_analysis['handlers'])}")
    print(f"   • Команд: {len(code_analysis['commands'])}")
    print(f"   • Callback обработчиков: {code_analysis['callback_handlers']}")
    print(f"   • Reply обработчиков: {len(code_analysis['reply_handlers'])}")
    print(f"   • Специальных обработчиков: {code_analysis['special_handlers']}")
    print(f"   • Inline клавиатур: {code_analysis['keyboard_builders']['inline']}")
    print(f"   • Reply клавиатур: {code_analysis['keyboard_builders']['reply']}")
    print(f"   • Обработка ошибок: {'✅' if code_analysis['error_handling'] else '❌'}")
    print(f"   • Логирование: {'✅' if code_analysis['logging'] else '❌'}")
    print(f"   • Оценка качества: {code_analysis['code_quality_score']}/100")
    print()
    
    # Тестируем специфические функции
    feature_tests = test_specific_features(bot_code)
    print("🧪 ТЕСТ СПЕЦИФИЧЕСКИХ ФУНКЦИЙ:")
    for feature, passed in feature_tests.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {feature.replace('_', ' ').title()}")
    
    passed_tests = sum(feature_tests.values())
    total_tests = len(feature_tests)
    print(f"\n📈 Результат тестов: {passed_tests}/{total_tests} ({passed_tests/total_tests*100:.1f}%)")
    
    # Общая оценка
    print("\n" + "=" * 60)
    print("🏆 ОБЩАЯ ОЦЕНКА ГЕНЕРАТОРА:")
    
    overall_score = (
        min(structure_analysis['complexity_score'], 100) * 0.3 +
        min(code_analysis['code_quality_score'], 100) * 0.4 +
        (passed_tests / total_tests * 100) * 0.3
    )
    
    print(f"   • Сложность структуры: {min(structure_analysis['complexity_score'], 100)}/100")
    print(f"   • Качество кода: {min(code_analysis['code_quality_score'], 100)}/100")
    print(f"   • Функциональные тесты: {passed_tests/total_tests*100:.1f}/100")
    print(f"   • ИТОГОВАЯ ОЦЕНКА: {overall_score:.1f}/100")
    
    if overall_score >= 90:
        print("🥇 ОТЛИЧНО! Генератор работает превосходно!")
    elif overall_score >= 80:
        print("🥈 ХОРОШО! Генератор работает стабильно!")
    elif overall_score >= 70:
        print("🥉 УДОВЛЕТВОРИТЕЛЬНО. Есть области для улучшения.")
    else:
        print("⚠️ ТРЕБУЕТСЯ ДОРАБОТКА генератора кода.")
    
    # Сохраняем сгенерированный код для проверки
    with open("generated_advanced_bot.py", "w", encoding="utf-8") as f:
        f.write(bot_code)
    
    print(f"\n💾 Сгенерированный код сохранен в 'generated_advanced_bot.py'")
    print("🚀 Готов для запуска в Telegram!")
    
    return {
        "structure": structure_analysis,
        "code": code_analysis,
        "features": feature_tests,
        "overall_score": overall_score
    }

def main():
    """Основная функция тестирования"""
    try:
        result = run_comprehensive_test()
        
        if result and result["overall_score"] >= 80:
            print("\n✅ ТЕСТ УСПЕШНО ПРОЙДЕН!")
            print("🎯 Рекомендации для реального тестирования:")
            print("1. Создайте бота через @BotFather")
            print("2. Получите токен")
            print("3. Используйте вкладку 'Бот' в редакторе для запуска")
            print("4. Протестируйте все команды и переходы")
            print("5. Проверьте работу кнопок и клавиатур")
        else:
            print("\n⚠️ Обнаружены проблемы в генераторе кода")
            
    except Exception as e:
        print(f"❌ Ошибка во время тестирования: {e}")

if __name__ == "__main__":
    main()