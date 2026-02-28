import { Button, ResponseOption } from './bot-generator';
import { generateConditionalMessageLogic } from './Conditional';
import { formatTextForPython } from './format';
import { generateAttachedMediaVars, generateButtonResponseConfig, generateConditionalBranch, generateConditionalMessages, generateErrorHandler, generateFallbackNode, generateInlineKeyboardSend, generateInputWaitingSetup, generateMediaSaveVars, generateMediaSend, generateNoNodesAvailableWarning, generateParseMode, generateReplyKeyboardSend, generateTextSend, generateUnknownNextNodeWarning, generateUnknownNodeHandler } from './bot-generator/transitions';

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
        code += generateFallbackNode(targetNode, '                ');
      } else {
        code += generateUnknownNodeHandler(targetNode.id, targetNode.type, '                ');
      }
    });

    code += generateUnknownNextNodeWarning('            ');
  } else {
    code += generateNoNodesAvailableWarning('            ');
  }
  
  code += generateErrorHandler('        ');
  return code;
}
