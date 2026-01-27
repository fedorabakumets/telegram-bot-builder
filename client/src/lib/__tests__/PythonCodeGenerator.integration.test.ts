/**
 * Интеграционный тест для проверки соответствия извлеченных вспомогательных функций
 * оригинальной реализации в bot-generator.ts
 */

import { describe, it, expect } from 'vitest';
import { PythonCodeGenerator } from '../Generators/PythonCodeGenerator';
import { GenerationContext } from '../Core/types';

describe('PythonCodeGenerator - Integration with Original Implementation', () => {
    const createFullContext = (): GenerationContext => ({
        botData: {} as any,
        botName: 'TestBot',
        groups: [],
        userDatabaseEnabled: true,
        projectId: 123,
        enableLogging: false,
        nodes: [
            { 
                id: 'test1',
                data: { 
                    keyboardType: 'inline', 
                    buttons: [{ text: 'Test Button', callback_data: 'test' }],
                    enableAutoTransition: true,
                    autoTransitionTo: 'test2'
                } 
            }
        ] as any,
        connections: [],
        mediaVariablesMap: new Map(),
        allNodeIds: ['test1', 'test2']
    });

    describe('Extracted utility functions should match original patterns', () => {
        it('should generate save_message_to_api with correct SSL handling', () => {
            const generator = new PythonCodeGenerator();
            const context = createFullContext();
            
            const result = generator.generateUtilityFunctions(context);
            
            // Проверяем ключевые элементы из оригинальной реализации
            expect(result).toContain('import ssl');
            expect(result).toContain('ssl_context = None');
            expect(result).toContain('if "localhost" in api_url or "127.0.0.1" in api_url:');
            expect(result).toContain('ssl_context = False');
            expect(result).toContain('connector = aiohttp.TCPConnector(ssl=ssl_context)');
            expect(result).toContain('timeout=aiohttp.ClientTimeout(total=5)');
        });

        it('should generate safe_edit_or_send with correct auto-transition handling', () => {
            const generator = new PythonCodeGenerator();
            const context = createFullContext();
            
            const result = generator.generateUtilityFunctions(context);
            
            // Проверяем логику автопереходов из оригинала
            expect(result).toContain('if is_auto_transition:');
            expect(result).toContain('logging.info(f"⚡ Автопереход: отправляем новое сообщение вместо редактирования")');
            expect(result).toContain('logging.info(f"⚡ Автопереход: {e}, отправляем новое сообщение")');
            expect(result).toContain('logging.warning(f"Не удалось отредактировать сообщение: {e}, отправляем новое")');
        });

        it('should generate callback query middleware with button text extraction', () => {
            const generator = new PythonCodeGenerator();
            const context = createFullContext();
            
            const result = generator.generateUtilityFunctions(context);
            
            // Проверяем извлечение текста кнопки из оригинала
            expect(result).toContain('# Пытаемся найти текст кнопки из сообщения');
            expect(result).toContain('button_text = None');
            expect(result).toContain('if hasattr(btn, "callback_data") and btn.callback_data == callback_data:');
            expect(result).toContain('button_text = btn.text');
            expect(result).toContain('message_text_to_save = f"[Нажата кнопка: {button_text}]" if button_text else "[Нажата кнопка]"');
        });

        it('should generate message wrappers with complete button extraction logic', () => {
            const generator = new PythonCodeGenerator();
            const context = createFullContext();
            
            const result = generator.generateUtilityFunctions(context);
            
            // Проверяем полную логику извлечения кнопок
            expect(result).toContain('# Обработка inline клавиатуры');
            expect(result).toContain('if hasattr(reply_markup, "inline_keyboard"):');
            expect(result).toContain('button_info = {"text": btn.text}');
            expect(result).toContain('if hasattr(btn, "url") and btn.url:');
            expect(result).toContain('button_info["url"] = btn.url');
            expect(result).toContain('if hasattr(btn, "callback_data") and btn.callback_data:');
            expect(result).toContain('button_info["callback_data"] = btn.callback_data');
            
            // Проверяем обработку reply клавиатуры
            expect(result).toContain('# Обработка reply клавиатуры');
            expect(result).toContain('if hasattr(btn, "request_contact") and btn.request_contact:');
            expect(result).toContain('if hasattr(btn, "request_location") and btn.request_location:');
        });

        it('should generate media registration logic in message middleware', () => {
            const generator = new PythonCodeGenerator();
            const context = createFullContext();
            
            const result = generator.generateUtilityFunctions(context);
            
            // Проверяем логику регистрации медиа из оригинала
            expect(result).toContain('# Если есть фото и сообщение сохранено, регистрируем медиа');
            expect(result).toContain('media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"');
            expect(result).toContain('"messageId": saved_message["id"]');
            expect(result).toContain('"fileId": photo_file_id');
            expect(result).toContain('"botToken": BOT_TOKEN');
            expect(result).toContain('"mediaType": "photo"');
        });
    });

    describe('Generated code structure should be consistent', () => {
        it('should maintain proper function ordering and comments', () => {
            const generator = new PythonCodeGenerator();
            const context = createFullContext();
            
            const result = generator.generateUtilityFunctions(context);
            
            // Проверяем порядок функций
            const saveMessageIndex = result.indexOf('async def save_message_to_api');
            const middlewareIndex = result.indexOf('async def message_logging_middleware');
            const callbackMiddlewareIndex = result.indexOf('async def callback_query_logging_middleware');
            const wrappersIndex = result.indexOf('async def send_message_with_logging');
            const safeEditIndex = result.indexOf('async def safe_edit_or_send');
            
            expect(saveMessageIndex).toBeGreaterThan(-1);
            expect(middlewareIndex).toBeGreaterThan(saveMessageIndex);
            expect(callbackMiddlewareIndex).toBeGreaterThan(middlewareIndex);
            expect(wrappersIndex).toBeGreaterThan(callbackMiddlewareIndex);
            expect(safeEditIndex).toBeGreaterThan(wrappersIndex);
        });

        it('should include all necessary imports and dependencies', () => {
            const generator = new PythonCodeGenerator();
            const context = createFullContext();
            
            const result = generator.generateUtilityFunctions(context);
            
            // Проверяем, что все необходимые зависимости упоминаются в коде
            expect(result).toContain('aiohttp.ClientSession');
            expect(result).toContain('aiohttp.TCPConnector');
            expect(result).toContain('aiohttp.ClientTimeout');
            expect(result).toContain('types.Message');
            expect(result).toContain('types.CallbackQuery');
        });
    });
});