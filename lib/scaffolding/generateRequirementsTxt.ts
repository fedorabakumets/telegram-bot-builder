/**
 * @fileoverview Генераторы дополнительных файлов проекта Python-бота
 * @module lib/scaffolding/generateRequirementsTxt
 */

// ============================================================================
// ГЕНЕРАТОРЫ ДОПОЛНИТЕЛЬНЫХ ФАЙЛОВ ПРОЕКТА
// ============================================================================

/**
 * Генерирует содержимое requirements.txt для Python-бота.
 * Включает все необходимые зависимости с совместимыми версиями,
 * не требующими компиляции Rust.
 * @returns Строка с зависимостями в формате pip requirements
 */
export function generateRequirementsTxt(): string {
  const lines = [
    '# Telegram Bot Requirements - Updated compatible versions',
    '# Install with: pip install -r requirements.txt',
    '# If you get Rust compilation errors, use: pip install --only-binary=all -r requirements.txt',
    '',
    '# Core dependencies (using newer versions to avoid Rust compilation issues)',
    'aiogram>=3.27.0',
    'aiohttp>=3.12.13',
    'requests>=2.32.5',
    'python-dotenv>=1.0.0',
    'aiofiles>=23.2.1',
    'asyncpg>=0.30.0',
    'certifi>=2024.8.30',
    'google-auth>=2.0.0',
    'gspread>=6.0.0',
    'telethon>=1.42.0  # For Client API (Userbot) broadcast functionality',
    'redis>=5.0.0  # Для Redis кэша, FSM хранилища и Pub/Sub уведомлений (redis[asyncio] включён)',
    '',
    '# Note: These versions have pre-compiled wheels and do not require Rust',
    '# If you still encounter issues, try:',
    '# pip install --upgrade pip setuptools wheel',
    '# pip install --only-binary=all aiogram aiohttp requests python-dotenv aiofiles asyncpg',
    '',
    '# Optional dependencies for extended functionality',
    '# motor>=3.3.2  # For MongoDB',
    '# pillow>=10.1.0  # For image processing'
  ];
  return lines.join('\n');
}
