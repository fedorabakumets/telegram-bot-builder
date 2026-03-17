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

export const validParamsNoTarget: UserInputTemplateParams = {
  nodeId: 'msg_final_input',
  safeName: 'msg_final_input',
  inputVariable: 'final_answer',
  enableTextInput: true,
  saveToDatabase: false,
};

export const invalidParamsMissingNodeId = {
  safeName: 'test',
  inputVariable: 'var',
} as unknown as UserInputTemplateParams;

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

export const nodesWithMixedInput: Node[] = [
  nodeWithTextInput,
  nodeWithEmailValidation,
  nodeWithPhotoInput,
  nodeWithoutCollectInput,
];
