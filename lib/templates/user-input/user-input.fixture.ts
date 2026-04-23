/**
 * @fileoverview Тестовые данные для шаблона сбора пользовательского ввода
 * @module templates/user-input/user-input.fixture
 */

import type { UserInputTemplateParams } from './user-input.params';
import type { Node } from '@shared/schema';

// ─── Низкоуровневые фикстуры (UserInputTemplateParams) ───────────────────────

export const validParamsMinimal: UserInputTemplateParams = {
  nodeId: 'msg_ask_name',
  safeName: 'msg_ask_name',
  inputVariable: 'user_name',
};

export const validParamsTextOnly: UserInputTemplateParams = {
  nodeId: 'msg_ask_email',
  safeName: 'msg_ask_email',
  inputVariable: 'user_email',
  enableTextInput: true,
  validationType: 'email',
  retryMessage: 'Введите корректный email.',
  inputTargetNodeId: 'msg_confirm',
  saveToDatabase: true,
};

export const validParamsPhotoInput: UserInputTemplateParams = {
  nodeId: 'msg_ask_photo',
  safeName: 'msg_ask_photo',
  inputVariable: 'user_photo',
  enableTextInput: false,
  enablePhotoInput: true,
  photoInputVariable: 'user_photo_file',
  inputTargetNodeId: 'msg_next',
  saveToDatabase: true,
};

export const validParamsMultiMedia: UserInputTemplateParams = {
  nodeId: 'msg_ask_media',
  safeName: 'msg_ask_media',
  inputVariable: 'user_media',
  enableTextInput: true,
  enablePhotoInput: true,
  photoInputVariable: 'photo_var',
  enableVideoInput: true,
  videoInputVariable: 'video_var',
  enableAudioInput: true,
  audioInputVariable: 'audio_var',
  enableDocumentInput: false,
  inputTargetNodeId: 'msg_done',
  saveToDatabase: true,
};

export const validParamsWithValidation: UserInputTemplateParams = {
  nodeId: 'msg_ask_phone',
  safeName: 'msg_ask_phone',
  inputVariable: 'user_phone',
  enableTextInput: true,
  validationType: 'phone',
  minLength: 7,
  maxLength: 15,
  retryMessage: 'Введите корректный номер телефона.',
  successMessage: 'Номер сохранён!',
  inputTargetNodeId: 'msg_next',
  saveToDatabase: true,
};

export const validParamsAppendMode: UserInputTemplateParams = {
  nodeId: 'msg_collect_list',
  safeName: 'msg_collect_list',
  inputVariable: 'collected_items',
  appendVariable: true,
  enableTextInput: true,
  inputTargetNodeId: '',
  saveToDatabase: true,
};

export const validParamsButtonInput: UserInputTemplateParams = {
  nodeId: 'msg_ask_choice',
  safeName: 'msg_ask_choice',
  inputVariable: 'user_choice',
  inputType: 'button',
  enableTextInput: false,
  inputTargetNodeId: 'msg_next',
  skipButtons: [{ text: 'Пропустить', target: 'msg_skip' }],
  saveToDatabase: true,
};

export const validParamsButtonWithText: UserInputTemplateParams = {
  nodeId: 'msg_ask_choice2',
  safeName: 'msg_ask_choice2',
  inputVariable: 'user_choice2',
  inputType: 'button',
  enableTextInput: true,
  inputTargetNodeId: 'msg_next',
  saveToDatabase: true,
};

export const validParamsNoTarget: UserInputTemplateParams = {
  nodeId: 'msg_final_input',
  safeName: 'msg_final_input',
  inputVariable: 'final_answer',
  enableTextInput: true,
  saveToDatabase: false,
};

export const validParamsDedicatedAnyInput: UserInputTemplateParams = {
  nodeId: 'input_any_1',
  safeName: 'input_any_1',
  inputVariable: 'user_response',
  inputSource: 'any',
  inputTargetNodeId: 'msg_done',
  saveToDatabase: true,
};

export const validParamsDedicatedContactInput: UserInputTemplateParams = {
  nodeId: 'input_contact_1',
  safeName: 'input_contact_1',
  inputVariable: 'user_contact',
  inputSource: 'contact',
  enableContactInput: true,
  contactInputVariable: 'user_contact_card',
  inputTargetNodeId: 'msg_done',
  saveToDatabase: true,
};

export const validParamsDedicatedLocationInput: UserInputTemplateParams = {
  nodeId: 'input_location_1',
  safeName: 'input_location_1',
  inputVariable: 'user_location',
  inputSource: 'location',
  enableLocationInput: true,
  locationInputVariable: 'user_location_point',
  inputTargetNodeId: 'msg_done',
  saveToDatabase: true,
};

export const invalidParamsMissingNodeId = {
  safeName: 'test',
  inputVariable: 'var',
} as unknown as UserInputTemplateParams;

/** Фикстура: inputType=callback — ожидание нажатия inline-кнопки */
export const validParamsCallbackInput: UserInputTemplateParams = {
  nodeId: 'input_callback_1',
  safeName: 'input_callback_1',
  inputVariable: 'callback_response',
  inputType: 'callback',
  inputTargetNodeId: 'msg_done',
  saveToDatabase: true,
};

/** Фикстура: узел типа input с inputType=callback */
export const dedicatedCallbackInputNode: Node = makeNode('input_callback_1', 'input', {
  inputType: 'callback',
  inputVariable: 'callback_response',
  inputTargetNodeId: 'msg_done',
  appendVariable: false,
  saveToDatabase: true,
});
// ─── Высокоуровневые фикстуры (Node[]) ───────────────────────────────────────

function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

export const nodeWithTextInput: Node = makeNode('msg_ask_name', 'message', {
  collectUserInput: true,
  inputVariable: 'user_name',
  enableTextInput: true,
  inputTargetNodeId: 'msg_next',
  saveToDatabase: true,
});

export const nodeWithEmailValidation: Node = makeNode('msg_ask_email', 'message', {
  collectUserInput: true,
  inputVariable: 'user_email',
  enableTextInput: true,
  validationType: 'email',
  retryMessage: 'Введите корректный email.',
  inputTargetNodeId: 'msg_confirm',
  saveToDatabase: true,
});

export const nodeWithPhotoInput: Node = makeNode('msg_ask_photo', 'message', {
  collectUserInput: true,
  inputVariable: 'user_photo',
  enableTextInput: false,
  enablePhotoInput: true,
  photoInputVariable: 'user_photo_file',
  inputTargetNodeId: 'msg_next',
  saveToDatabase: true,
});

export const nodeWithMultiMedia: Node = makeNode('msg_ask_media', 'message', {
  collectUserInput: true,
  inputVariable: 'user_media',
  enableTextInput: true,
  enablePhotoInput: true,
  photoInputVariable: 'photo_var',
  enableVideoInput: true,
  videoInputVariable: 'video_var',
  saveToDatabase: true,
});

export const nodeWithoutCollectInput: Node = makeNode('msg_plain', 'message', {
  collectUserInput: false,
  inputVariable: '',
});

export const dedicatedInputNode: Node = makeNode('input_contact_1', 'input', {
  inputType: 'contact',
  inputVariable: 'user_contact',
  inputTargetNodeId: 'msg_done',
  appendVariable: false,
  saveToDatabase: true,
});

export const dedicatedAnyInputNode: Node = makeNode('input_any_1', 'input', {
  inputType: 'any',
  inputVariable: 'user_response',
  inputTargetNodeId: 'msg_done',
  appendVariable: false,
  saveToDatabase: true,
});

export const nodeWithButtons: Node = makeNode('msg_ask_choice', 'message', {
  collectUserInput: true,
  inputVariable: 'user_choice',
  buttons: [
    { id: 'btn1', text: 'Да', skipDataCollection: false, target: '' },
    { id: 'btn2', text: 'Пропустить', skipDataCollection: true, target: 'msg_skip' },
  ],
  keyboardType: 'reply',
  enableTextInput: false,
  inputTargetNodeId: 'msg_next',
  saveToDatabase: true,
});

export const nodesWithMixedInput: Node[] = [
  nodeWithTextInput,
  nodeWithEmailValidation,
  nodeWithPhotoInput,
  nodeWithButtons,
  dedicatedInputNode,
  nodeWithoutCollectInput,
];
