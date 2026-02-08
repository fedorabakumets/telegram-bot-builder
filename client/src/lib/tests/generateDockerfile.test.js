import { strict as assert } from 'assert';
import { generateDockerfile } from '../scaffolding/generateDockerfile';

/**
 * Тестирование функции generateDockerfile
 * 
 * Эта функция генерирует содержимое файла Dockerfile для бота.
 */
console.log('Running tests for generateDockerfile...');

// Тест 1: Проверка, что функция возвращает строку
const dockerfile = generateDockerfile();
assert.strictEqual(typeof dockerfile, 'string', 'Function should return a string');

// Тест 2: Проверка, что строка не пустая
assert.notStrictEqual(dockerfile.length, 0, 'Dockerfile should not be empty');

// Тест 3: Проверка наличия основных инструкций
assert.ok(dockerfile.includes('FROM python:3.11-slim'), 'Dockerfile should include base image');
assert.ok(dockerfile.includes('WORKDIR /app'), 'Dockerfile should include working directory');
assert.ok(dockerfile.includes('COPY . .'), 'Dockerfile should include copy instruction');
assert.ok(dockerfile.includes('CMD ["python", "bot.py"]'), 'Dockerfile should include CMD instruction');

// Тест 4: Проверка установки системных зависимостей
assert.ok(dockerfile.includes('RUN apt-get update && apt-get install -y'), 'Dockerfile should include system dependencies installation');
assert.ok(dockerfile.includes('gcc'), 'Dockerfile should include gcc installation');

// Тест 5: Проверка установки Python зависимостей
assert.ok(dockerfile.includes('COPY requirements.txt .'), 'Dockerfile should include copying requirements.txt');
assert.ok(dockerfile.includes('pip install --no-cache-dir -r requirements.txt'), 'Dockerfile should include pip install command');

// Тест 6: Проверка безопасности
assert.ok(dockerfile.includes('RUN adduser --disabled-password'), 'Dockerfile should include creating user for security');
assert.ok(dockerfile.includes('USER botuser'), 'Dockerfile should switch to non-root user');

// Тест 7: Проверка комментариев
assert.ok(dockerfile.includes('# Dockerfile для Telegram бота'), 'Dockerfile should include header comment');

// Тест 8: Проверка структуры файла
const lines = dockerfile.split('\n');
const nonEmptyLines = lines.filter(line => line.trim() !== '');
assert.ok(nonEmptyLines.length > 5, 'Dockerfile should have multiple non-empty lines');

console.log('All tests for generateDockerfile passed!');