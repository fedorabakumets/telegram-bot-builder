export function processInputTargetNavigation(node: any, code: string): string {
    if (node.data.inputTargetNodeId) {
        // Навигация генерируется в цикле while next_node_id, здесь только обновляем all_user_vars
        code += `            # Обновляем all_user_vars для навигации\n`;
        code += `            all_user_vars["${node.data.inputVariable || 'user_response'}"] = response_data\n`;
    } else {
        // Если inputTargetNodeId равен null, это конец цепочки - это нормально
        code += `            # Конец цепочки ввода - завершаем обработку\n`;
        code += `            logging.info("Завершена цепочка сбора пользовательских данных")\n`;
    }
    return code;
}
