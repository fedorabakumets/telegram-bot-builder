/**
 * @fileoverview Генерация заголовка файла для браузера
 * 
 * Browser-совместимая версия без использования Node.js API
 * Использует конкатенацию строк вместо шаблонов
 * 
 * @module bot-generator/templates/generate-header-browser
 */

/**
 * Опции для генерации заголовка
 */
export interface HeaderOptions {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Есть ли inline кнопки */
  hasInlineButtons?: boolean;
  /** Есть ли узлы с медиа */
  hasMediaNodes?: boolean;
}

/**
 * Генерирует UTF-8 кодировку для Python файла (browser версия)
 * 
 * @param _options - Опции генерации (не используются)
 * @returns Строка с UTF-8 кодировкой
 */
export function generateHeaderBrowser(_options: HeaderOptions = {}): string {
  let code = '';

  code += '# -*- coding: utf-8 -*-\n';
  code += 'import os\n';
  code += 'import sys\n';
  code += '\n';
  code += '# Устанавливаем UTF-8 кодировку для вывода\n';
  code += 'if sys.platform.startswith("win"):\n';
  code += '    # Для Windows устанавливаем UTF-8 кодировку\n';
  code += '    os.environ["PYTHONIOENCODING"] = "utf-8"\n';
  code += '    try:\n';
  code += '        import codecs\n';
  code += '        sys.stdout.reconfigure(encoding="utf-8")\n';
  code += '        sys.stderr.reconfigure(encoding="utf-8")\n';
  code += '    except (AttributeError, UnicodeError):\n';
  code += '        # Fallback для старых версий Python\n';
  code += '        import codecs\n';
  code += '        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())\n';
  code += '        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())\n';
  code += '\n';

  return code;
}
