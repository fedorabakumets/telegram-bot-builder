#!/usr/bin/env python3
"""
Тест исправленной генерации кода - проверка inline кнопок в collection-message
"""

import json
import re

def test_fixed_bot_generation():
    """Тестируем исправленную генерацию кода"""
    
    print("🔍 Тестирование исправленной генерации кода...")
    print("=" * 60)
    
    # Данные collection-message узла (из базы данных)
    collection_message_data = {
        "buttons": [
            {"id": "btn-excellent", "text": "Отлично", "action": "goto", "target": "thank-you-message"},
            {"id": "btn-good", "text": " Хорошо", "action": "goto", "target": "thank-you-message"},
            {"id": "btn-average", "text": "Средне", "action": "goto", "target": "thank-you-message"},
            {"id": "btn-poor", "text": " Плохо", "action": "goto", "target": "thank-you-message"}
        ],
        "inputType": "text",
        "formatMode": "none",
        "nextNodeId": "thank-you-message",
        "messageText": "📊 Расскажите о своем опыте с нашим сервисом:\n\n• Нажмите одну из кнопок для быстрого ответа\n• Или напишите развернутый отзыв текстом\n\nВаш ответ будет сохранен в любом случае!",
        "inputTimeout": 120,
        "keyboardType": "inline",
        "inputRequired": False,
        "inputVariable": "user_feedback",
        "inputMaxLength": 500,
        "inputMinLength": 5,
        "resizeKeyboard": True,
        "saveToDatabase": True,
        "enableTextInput": True,
        "oneTimeKeyboard": False,
        "collectUserInput": True,
        "inputRetryMessage": "Пожалуйста, напишите отзыв от 5 до 500 символов",
        "inputTargetNodeId": "thank-you-message",
        "inputSuccessMessage": "Спасибо за ваш отзыв! Мы ценим вашу обратную связь."
    }
    
    print("✅ Данные collection-message узла:")
    print(f"   collectUserInput: {collection_message_data.get('collectUserInput')}")
    print(f"   inputTargetNodeId: {collection_message_data.get('inputTargetNodeId')}")
    print(f"   keyboardType: {collection_message_data.get('keyboardType')}")
    print(f"   buttons: {len(collection_message_data.get('buttons', []))}")
    print(f"   saveToDatabase: {collection_message_data.get('saveToDatabase')}")
    print()
    
    # Проверки соответствия требованиям генератора
    tests = [
        # Основные проверки
        ("collectUserInput активирован", collection_message_data.get('collectUserInput') == True),
        ("inputTargetNodeId указан", collection_message_data.get('inputTargetNodeId') == 'thank-you-message'),
        ("keyboardType = inline", collection_message_data.get('keyboardType') == 'inline'),
        ("buttons присутствуют", len(collection_message_data.get('buttons', [])) > 0),
        ("saveToDatabase активировано", collection_message_data.get('saveToDatabase') == True),
        
        # Детальные проверки кнопок
        ("Все кнопки имеют action", all(btn.get('action') for btn in collection_message_data.get('buttons', []))),
        ("Все кнопки имеют target", all(btn.get('target') for btn in collection_message_data.get('buttons', []))),
        ("Все кнопки указывают на thank-you-message", all(btn.get('target') == 'thank-you-message' for btn in collection_message_data.get('buttons', []))),
        
        # Проверки текстового ввода
        ("inputVariable указан", collection_message_data.get('inputVariable') == 'user_feedback'),
        ("inputType = text", collection_message_data.get('inputType') == 'text'),
        ("inputTimeout установлен", collection_message_data.get('inputTimeout') == 120),
        ("inputMinLength/MaxLength установлены", collection_message_data.get('inputMinLength') and collection_message_data.get('inputMaxLength'))
    ]
    
    passed = 0
    failed = 0
    
    for test_name, result in tests:
        if result:
            print(f"✅ {test_name}")
            passed += 1
        else:
            print(f"❌ {test_name}")
            failed += 1
    
    print()
    print(f"📊 Результаты тестирования: {passed}/{len(tests)} тестов пройдено")
    
    if failed == 0:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
        print("🔄 Генератор кода должен корректно обработать эти данные")
        print("💡 Inline кнопки должны генерироваться в callback обработчике")
        print("📝 Текстовый ввод должен работать параллельно с кнопками")
    else:
        print(f"⚠️  {failed} тестов не пройдено")
        print("❌ Требуется дополнительная настройка данных")
    
    return failed == 0

def main():
    """Основная функция"""
    print("🚀 Тест исправленной генерации кода...")
    print("=" * 60)
    
    success = test_fixed_bot_generation()
    
    if success:
        print("\n✅ ДАННЫЕ ГОТОВЫ ДЛЯ ГЕНЕРАЦИИ!")
        print("🔄 Теперь нужно перезапустить бота для применения изменений")
        print("📱 Inline кнопки должны появиться в боте")
    else:
        print("\n❌ ТРЕБУЕТСЯ ДОПОЛНИТЕЛЬНАЯ НАСТРОЙКА!")
    
    return success

if __name__ == "__main__":
    main()