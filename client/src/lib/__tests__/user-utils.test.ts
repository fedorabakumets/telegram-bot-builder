/**
 * Тесты для утилит работы с пользовательскими данными
 */

import { 
  generateInitUserVariablesFunction, 
  generateReplaceVariablesFunction,
  generateUniversalVariableReplacement,
  SYSTEM_VARIABLES,
  generateVariablesDocumentation
} from '../user-utils';

describe('user-utils', () => {
  describe('generateInitUserVariablesFunction', () => {
    it('should generate init_user_variables function code', () => {
      const code = generateInitUserVariablesFunction();
      
      expect(code).toContain('def init_user_variables(user_id, user_obj):');
      expect(code).toContain('user_name = first_name or username or "Пользователь"');
      expect(code).toContain('user_data[user_id]["user_name"] = user_name');
      expect(code).toContain('return user_name');
    });

    it('should support custom indentation', () => {
      const code = generateInitUserVariablesFunction('    ');
      
      expect(code).toContain('    def init_user_variables(user_id, user_obj):');
    });
  });

  describe('generateReplaceVariablesFunction', () => {
    it('should generate replace_variables_in_text function code', () => {
      const code = generateReplaceVariablesFunction();
      
      expect(code).toContain('def replace_variables_in_text(text_content, variables_dict):');
      expect(code).toContain('placeholder = "{" + var_name + "}"');
      expect(code).toContain('text_content.replace(placeholder, var_value)');
    });
  });

  describe('generateUniversalVariableReplacement', () => {
    it('should generate universal variable replacement code', () => {
      const code = generateUniversalVariableReplacement('    ');
      
      expect(code).toContain('init_user_variables(user_id, user_obj)');
      expect(code).toContain('user_vars = await get_user_from_db(user_id)');
    });
  });

  describe('SYSTEM_VARIABLES', () => {
    it('should contain all expected system variables', () => {
      expect(SYSTEM_VARIABLES).toHaveProperty('user_name');
      expect(SYSTEM_VARIABLES).toHaveProperty('first_name');
      expect(SYSTEM_VARIABLES).toHaveProperty('last_name');
      expect(SYSTEM_VARIABLES).toHaveProperty('username');
    });

    it('should have proper structure for each variable', () => {
      Object.entries(SYSTEM_VARIABLES).forEach(([varName, info]) => {
        expect(info).toHaveProperty('description');
        expect(info).toHaveProperty('example');
        expect(info).toHaveProperty('source');
        expect(typeof info.description).toBe('string');
        expect(typeof info.example).toBe('string');
        expect(typeof info.source).toBe('string');
      });
    });
  });

  describe('generateVariablesDocumentation', () => {
    it('should generate documentation for all system variables', () => {
      const doc = generateVariablesDocumentation();
      
      expect(doc).toContain('# Доступные системные переменные');
      expect(doc).toContain('## {user_name}');
      expect(doc).toContain('## {first_name}');
      expect(doc).toContain('## {last_name}');
      expect(doc).toContain('## {username}');
    });
  });
});