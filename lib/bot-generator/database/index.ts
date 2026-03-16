export { AliasNodes } from './AliasNodes';
export { generateDatabaseCode } from './generateDatabaseCode';
export { generateDatabaseVariablesBlock, generateDatabaseVariablesBlockCall, type DatabaseVariablesBlockOptions } from './generate-database-variables-block';
export { generateSaveToDatabaseTable, type GenerateSaveToDatabaseTableParams } from './generateSaveToDatabaseTable';
export { generateUniversalVariableReplacement } from './generateUniversalVariableReplacement';
export { getTableForVariable } from './get-table-for-variable';

// Примечание: следующие модули удалены после миграции на Jinja2:
// - generateCheckUserVariableFunction
// - generateGlobalCheckUserVariableFunction
// - generateVariableReplacement
// - generateInitAllUserVars
// - init_user_variables
// - replace_variables_in_text
// - get_moscow_time
// - get_user_data_from_db
// - get_user_from_db
// - get_user_ids_from_db
// - init_database
// - log_message
// - save_user_data_to_db
// - save_user_to_db
// - update_user_data_in_db
// - update_user_variable_in_db
