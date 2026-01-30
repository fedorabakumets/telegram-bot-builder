#!/usr/bin/env python3
"""
Тестовый скрипт для проверки исправления SSL ошибки
"""

def test_ssl_logic():
    """
    Тестирует логику определения SSL в различных сценариях
    """
    print("Тестирование логики определения SSL...")
    
    # Тест 1: localhost URL
    api_url = "http://localhost:5000/api/test"
    use_ssl = not (api_url.startswith("http://") or "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url)
    if "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url:
        use_ssl = False
    
    print(f"Тест 1 - localhost URL: {api_url}")
    print(f"Ожидаемый результат: use_ssl = False")
    print(f"Фактический результат: use_ssl = {use_ssl}")
    print(f"Тест 1: {'ПРОЙДЕН' if use_ssl == False else 'НЕ ПРОЙДЕН'}\n")
    
    # Тест 2: 127.0.0.1 URL
    api_url = "http://127.0.0.1:5000/api/test"
    use_ssl = not (api_url.startswith("http://") or "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url)
    if "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url:
        use_ssl = False
    
    print(f"Тест 2 - 127.0.0.1 URL: {api_url}")
    print(f"Ожидаемый результат: use_ssl = False")
    print(f"Фактический результат: use_ssl = {use_ssl}")
    print(f"Тест 2: {'ПРОЙДЕН' if use_ssl == False else 'НЕ ПРОЙДЕН'}\n")
    
    # Тест 3: production URL
    api_url = "https://mydomain.com/api/test"
    use_ssl = not (api_url.startswith("http://") or "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url)
    if "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url:
        use_ssl = False
    
    print(f"Тест 3 - production URL: {api_url}")
    print(f"Ожидаемый результат: use_ssl = True")
    print(f"Фактический результат: use_ssl = {use_ssl}")
    print(f"Тест 3: {'ПРОЙДЕН' if use_ssl == True else 'НЕ ПРОЙДЕН'}\n")
    
    # Тест 4: http внешний URL
    api_url = "http://external-site.com/api/test"
    use_ssl = not (api_url.startswith("http://") or "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url)
    if "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url:
        use_ssl = False
    
    print(f"Тест 4 - http внешний URL: {api_url}")
    print(f"Ожидаемый результат: use_ssl = False")
    print(f"Фактический результат: use_ssl = {use_ssl}")
    print(f"Тест 4: {'ПРОЙДЕН' if use_ssl == False else 'НЕ ПРОЙДЕН'}\n")


if __name__ == "__main__":
    test_ssl_logic()