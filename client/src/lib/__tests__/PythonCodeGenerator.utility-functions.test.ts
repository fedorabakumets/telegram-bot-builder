/**
 * Тесты для проверки извлечения вспомогательных функций из PythonCodeGenerator
 * Задача 4.2: Извлечь вспомогательные функции
 */

import { describe, it, expect } from 'vitest';
import { PythonCodeGenerator } from '../Generators/PythonCodeGenerator';
import { GenerationContext } from '../Core/types';

describe('PythonCodeGenerator - Utility Functions Extraction', () => {
    const createTestContext = (userDatabaseEnabled: boolean = false, hasInlineButtons: boolean = false): GenerationContext => ({
        botData: {} as any,
        botName: 'TestBot',
        groups: [],
        userDatabaseEnabled,
        projectId: 123,
        enableLogging: false,
        nodes: hasInlineButtons ? [{ data: { keyboardType: 'inline', buttons: [{ text: 'Test' }] } }] : [],
        connections: [],
        mediaVariablesMap: new Map(),
        allNodeIds: []
    });

    describe('safe_edit_or_send function generation', () => {
        it('should generate safe_edit_or_send function when inline buttons are present', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(false, true);
            
            const result = generator.generateUtilityFunctions(context);
            
            expect(result).toContain('async def safe_edit_or_send(cbq, text, node_id=None, is_auto_transition=False, **kwargs):');
            expect(result).toContain('Безопасное редактирование сообщения с fallback на новое сообщение');
            expect(result).toContain('При автопереходе сразу отправляет новое сообщение без попытки редактирования');
        });

        it('should not generate safe_edit_or_send function when no inline buttons', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(false, false);
            
            const result = generator.generateUtilityFunctions(context);
            
            expect(result).not.toContain('async def safe_edit_or_send');
        });
    });

    describe('API functions for saving messages', () => {
        it('should generate save_message_to_api function when userDatabaseEnabled is true', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(true, false);
            
            const result = generator.generateUtilityFunctions(context);
            
            expect(result).toContain('async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):');
            expect(result).toContain('Сохраняет сообщение в базу данных через API');
            expect(result).toContain('API_BASE_URL');
            expect(result).toContain('PROJECT_ID');
        });

        it('should generate message wrappers when userDatabaseEnabled is true', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(true, false);
            
            const result = generator.generateUtilityFunctions(context);
            
            expect(result).toContain('async def send_message_with_logging(chat_id, text, *args, node_id=None, **kwargs):');
            expect(result).toContain('async def answer_with_logging(self, text, *args, node_id=None, **kwargs):');
            expect(result).toContain('async def callback_answer_with_logging(self, text=None, *args, node_id=None, **kwargs):');
            expect(result).toContain('bot.send_message = send_message_with_logging');
            expect(result).toContain('types.Message.answer = answer_with_logging');
            expect(result).toContain('types.CallbackQuery.answer = callback_answer_with_logging');
        });

        it('should not generate API functions when userDatabaseEnabled is false', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(false, false);
            
            const result = generator.generateUtilityFunctions(context);
            
            expect(result).not.toContain('async def save_message_to_api');
            expect(result).not.toContain('send_message_with_logging');
        });
    });

    describe('middleware for logging generation', () => {
        it('should generate message logging middleware when userDatabaseEnabled is true', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(true, false);
            
            const result = generator.generateUtilityFunctions(context);
            
            expect(result).toContain('async def message_logging_middleware(handler, event: types.Message, data: dict):');
            expect(result).toContain('Middleware для автоматического сохранения входящих сообщений от пользователей');
        });

        it('should generate callback query middleware when userDatabaseEnabled is true and has inline buttons', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(true, true);
            
            const result = generator.generateUtilityFunctions(context);
            
            expect(result).toContain('async def callback_query_logging_middleware(handler, event: types.CallbackQuery, data: dict):');
            expect(result).toContain('Middleware для автоматического сохранения нажатий на кнопки');
        });

        it('should not generate callback query middleware when no inline buttons', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(true, false);
            
            const result = generator.generateUtilityFunctions(context);
            
            expect(result).not.toContain('callback_query_logging_middleware');
        });
    });

    describe('utility helper functions', () => {
        it('should always generate basic utility functions', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(false, false);
            
            const result = generator.generateUtilityFunctions(context);
            
            expect(result).toContain('async def is_admin(user_id: int) -> bool:');
            expect(result).toContain('async def is_private_chat(message: types.Message) -> bool:');
        });
    });

    describe('integration test', () => {
        it('should generate all utility functions when all features are enabled', () => {
            const generator = new PythonCodeGenerator();
            const context = createTestContext(true, true);
            
            const result = generator.generateUtilityFunctions(context);
            
            // Should contain all utility functions
            expect(result).toContain('save_message_to_api');
            expect(result).toContain('message_logging_middleware');
            expect(result).toContain('callback_query_logging_middleware');
            expect(result).toContain('send_message_with_logging');
            expect(result).toContain('safe_edit_or_send');
            expect(result).toContain('is_admin');
            expect(result).toContain('is_private_chat');
        });
    });
});