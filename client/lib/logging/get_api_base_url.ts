/**
 * @fileoverview Утилита для генерации кода функции определения базового URL API
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию определения базового URL API с учетом
 * различных условий развертывания (локально, на Repl.it и т.д.).
 *
 * @module get_api_base_url
 */

import { escapePythonString } from '../bot-generator/format/escapePythonString';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для определения URL базового адреса API
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 * @param {number | null} projectId - ID проекта для использования в конфигурации
 */
export function get_api_base_url(codeLines: string[], projectId: number | null) {
    const apiUrlCodeLines: string[] = [];
    
    apiUrlCodeLines.push('# API configuration для сохранения сообщений');
    apiUrlCodeLines.push('# Определяем URL сервера автоматически');
    apiUrlCodeLines.push('def get_api_base_url():');
    apiUrlCodeLines.push('    # Сначала пробуем получить из переменных окружения');
    apiUrlCodeLines.push('    env_url = os.getenv("API_BASE_URL", os.getenv("REPLIT_DEV_DOMAIN"))');
    apiUrlCodeLines.push('    if env_url:');
    apiUrlCodeLines.push('        # Если URL начинается с http/https, используем как есть');
    apiUrlCodeLines.push('        if env_url.startswith(("http://", "https://")):');
    apiUrlCodeLines.push('            # ИСПРАВЛЕНИЕ: Для локальных адресов всегда используем http, а не https');
    apiUrlCodeLines.push('            if "localhost" in env_url or "127.0.0.1" in env_url or "0.0.0.0" in env_url:');
    apiUrlCodeLines.push('                if env_url.startswith("https://"):');
    apiUrlCodeLines.push('                    # Заменяем https на http для локальных адресов');
    apiUrlCodeLines.push('                    env_url = "http://" + env_url[8:]  # Убираем "https://" и добавляем "http://"');
    apiUrlCodeLines.push('            return env_url');
    apiUrlCodeLines.push('        # Если нет, добавляем протокол');
    apiUrlCodeLines.push('        elif ":" in env_url:  # содержит порт');
    apiUrlCodeLines.push('            return f"http://{env_url}"');
    apiUrlCodeLines.push('        else:  # домен без порта');
    apiUrlCodeLines.push('            return f"https://{env_url}"');
    apiUrlCodeLines.push('    ');
    apiUrlCodeLines.push('    # Пытаемся определить URL автоматически');
    apiUrlCodeLines.push('    try:');
    apiUrlCodeLines.push('        import socket');
    apiUrlCodeLines.push('        # Получаем IP-адрес машины');
    apiUrlCodeLines.push('        hostname = socket.gethostname()');
    apiUrlCodeLines.push('        local_ip = socket.gethostbyname(hostname)');
    apiUrlCodeLines.push('        ');
    apiUrlCodeLines.push('        # Определяем порт из переменной окружения или используем 5000 по умолчанию');
    apiUrlCodeLines.push('        port = os.getenv("API_PORT", "5000")');
    apiUrlCodeLines.push('        ');
    apiUrlCodeLines.push('        # Проверяем, является ли IP локальным');
    apiUrlCodeLines.push('        if local_ip.startswith(("127.", "192.168.", "10.", "172.")) or local_ip == "::1":');
    apiUrlCodeLines.push('            # Для локальных IP используем localhost');
    apiUrlCodeLines.push('            return f"http://localhost:{port}"');
    apiUrlCodeLines.push('        else:');
    apiUrlCodeLines.push('            # Для внешних IP используем IP-адрес');
    apiUrlCodeLines.push('            return f"http://{local_ip}:{port}"');
    apiUrlCodeLines.push('    except:');
    apiUrlCodeLines.push('        # Если не удалось определить автоматически, используем localhost с портом из переменной окружения');
    apiUrlCodeLines.push('        port = os.getenv("API_PORT", "5000")');
    apiUrlCodeLines.push('        return f"http://localhost:{port}"');
    apiUrlCodeLines.push('');
    apiUrlCodeLines.push('API_BASE_URL = get_api_base_url()');
    apiUrlCodeLines.push('logging.info(f"📡 API Base URL определён как: {API_BASE_URL}")');
    apiUrlCodeLines.push(`PROJECT_ID = int(os.getenv("PROJECT_ID", ${escapePythonString(projectId || 0)}))  # ID проекта в системе`);
    apiUrlCodeLines.push('# Путь к папке проекта (например, bots/импортированный_проект_0312_40_35)');
    apiUrlCodeLines.push('PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))');
    apiUrlCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(apiUrlCodeLines, 'get_api_base_url.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
