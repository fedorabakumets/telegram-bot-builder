import { Button, ResponseOption } from './bot-generator';
import { generateConditionalMessageLogic } from './Conditional';
import { formatTextForPython, generateButtonText, toPythonBoolean, generateWaitingStateCode, escapeForJsonString } from './format';
import { generateInlineKeyboardCode } from './Keyboard';
import { generateAttachedMediaVars, generateButtonResponseConfig, generateConditionalBranch, generateConditionalMessages, generateInlineKeyboardSend, generateInputWaitingSetup, generateMediaPathResolve, generateMediaSaveVars, generateMediaSend, generateParseMode, generateReplyKeyboardSend, generateTextSend } from './bot-generator/transitions';

export function newgenerateStateTransitionAndRenderLogic(nodes: any[], code: string, allNodeIds: any[], connections: any[]) {
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      code += generateConditionalBranch(index, targetNode.id, '            ');
      
      if (targetNode.type === 'message' && targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKeyboardSend(targetNode, '                ');
      } else if (targetNode.type === 'message' && targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateReplyKeyboardSend(targetNode, '                ');

        if (targetNode.data.enableTextInput || targetNode.data.collectUserInput ||
          targetNode.data.enablePhotoInput || targetNode.data.enableVideoInput ||
          targetNode.data.enableAudioInput || targetNode.data.enableDocumentInput) {
          if (targetNode && targetNode.data) {
            code += generateWaitingStateCode(targetNode, '                ');
          }
        }
      } else if (targetNode.type === 'message') {
        if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
          code += generateConditionalMessages(targetNode, '                ');
        } else {
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          code += `                text = ${formattedText}\n`;
        }

        code += generateParseMode(targetNode, '                ');
        code += generateMediaSaveVars(targetNode, '                ');
        code += generateAttachedMediaVars(targetNode, '                ');
        code += generateMediaSend(targetNode, '                ');
        
        if (!targetNode.data.imageUrl && !targetNode.data.videoUrl && !targetNode.data.audioUrl && !targetNode.data.documentUrl) {
          code += generateTextSend(targetNode, allNodeIds, '                ');
        }
      } else if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
        const inputPrompt = formatTextForPython(targetNode.data.messageText || targetNode.data.inputPrompt || "Введите ваш ответ:");
        const responseType = targetNode.data.responseType || 'text';
        
        code += `                prompt_text = "${escapeForJsonString(inputPrompt)}"\n`;
        const placeholder = targetNode.data.placeholder || "";
        if (placeholder) {
          code += `                placeholder_text = "${placeholder}"\n`;
          code += '                prompt_text += f"\\n\\n💡 {placeholder_text}"\n';
        }

        if (responseType === 'buttons' && targetNode.data.responseOptions && targetNode.data.responseOptions.length > 0) {
          code += generateButtonResponseConfig(targetNode, allNodeIds, connections, '                ');
        } else {
          code += generateInputWaitingSetup(targetNode, connections, '                ');
        }
      } else if (targetNode.type === 'message') {
        // Обработка узлов сообщений
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                await fake_message.answer(${formattedText})\n`;
        code += `                logging.info(f"Отправлено сообщение узла ${targetNode.id}")\n`;
      } else {
        // Для других типов узлов просто логируем
        code += `                logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
      }
    });

    code += '            else:\n';
    code += '                logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
  } else {
    code += '            # No nodes available for navigation\n';
    code += '            logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
  }
  code += '        except Exception as e:\n';
  code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
  code += '\n';
  return code;
}
