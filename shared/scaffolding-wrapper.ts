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
  generateEnvFile
} from '../client/lib/scaffolding';

export {
  normalizeProjectData
} from '../client/utils/normalize-project-data';