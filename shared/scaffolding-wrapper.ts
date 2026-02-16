/**
 * @fileoverview Обертка для экспорта функций из клиентской части
 * 
 * Этот файл позволяет серверной части импортировать функции из клиентской части
 * через shared директорию, обходя ограничения конфигурации TypeScript.
 */

// Экспортируем функции из клиентской части
export {
  generateRequirementsTxt,
  generateReadme,
  generateDockerfile,
  generateConfigYaml
} from '../client/src/lib/scaffolding';

export {
  normalizeProjectData
} from '../client/src/utils/normalize-project-data';