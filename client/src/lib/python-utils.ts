/**
 * Возвращает Python-код для функции проверки пользовательских переменных
 * @returns Строку с Python-кодом функции check_user_variable
 */
export function getCheckUserVariableFunction(): string {
  return `                        # Функция для проверки переменных пользователя
                        def check_user_variable(var_name, user_data_dict):
                            if "user_data" in user_data_dict and user_data_dict["user_data"]:
                                try:
                                    import json
                                    parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                                    if var_name in parsed_data:
                                        raw_value = parsed_data[var_name]
                                        if isinstance(raw_value, dict) and "value" in raw_value:
                                            var_value = raw_value["value"]
                                            if var_value is not None and str(var_value).strip() != "":
                                                return True, str(var_value)
                                        else:
                                            if raw_value is not None and str(raw_value).strip() != "":
                                                return True, str(raw_value)
                                except (json.JSONDecodeError, TypeError):
                                    pass
                            if var_name in user_data_dict:
                                variable_data = user_data_dict.get(var_name)
                                if isinstance(variable_data, dict) and "value" in variable_data:
                                    var_value = variable_data["value"]
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                elif variable_data is not None and str(variable_data).strip() != "":
                                    return True, str(variable_data)
                            return False, None
                        `;
}