/**
 * @fileoverview Тесты для шаблона сбора пользовательского ввода
 * @module templates/user-input/user-input.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateUserInput, generateUserInputFromNode, generateUserInputNodeHandler, nodeToUserInputParams, nodeHasUserInput } from './user-input.renderer';
import { userInputParamsSchema } from './user-input.schema';
import {
  validParamsMinimal,
  validParamsTextOnly,
  validParamsPhotoInput,
  validParamsMultiMedia,
  validParamsWithValidation,
  validParamsAppendMode,
  validParamsNoTarget,
  validParamsDedicatedAnyInput,
  validParamsDedicatedContactInput,
  validParamsDedicatedLocationInput,
  validParamsButtonInput,
  validParamsButtonWithText,
  validParamsCallbackInput,
  invalidParamsMissingNodeId,
  nodeWithTextInput,
  nodeWithEmailValidation,
  nodeWithPhotoInput,
  nodeWithMultiMedia,
  nodeWithButtons,
  nodeWithoutCollectInput,
  dedicatedInputNode,
  dedicatedAnyInputNode,
  dedicatedCallbackInputNode,
  nodesWithMixedInput,
} from './user-input.fixture';

// ─── generateUserInput() ─────────────────────────────────────────────────────

describe('generateUserInput()', () => {
  it('генерирует waiting_for_input блок', () => {
    const r = generateUserInput(validParamsMinimal);
    assert.ok(r.includes('waiting_for_input'));
    assert.ok(r.includes('"user_name"'));
    assert.ok(r.includes('"msg_ask_name"'));
  });

  it('содержит правильный node_id', () => {
    const r = generateUserInput(validParamsTextOnly);
    assert.ok(r.includes('"node_id": "msg_ask_email"'));
  });

  it('содержит next_node_id', () => {
    const r = generateUserInput(validParamsTextOnly);
    assert.ok(r.includes('"next_node_id": "msg_confirm"'));
  });

  it('пустой next_node_id если не задан', () => {
    const r = generateUserInput(validParamsNoTarget);
    assert.ok(r.includes('"next_node_id": ""'));
  });

  it('содержит validation_type email', () => {
    const r = generateUserInput(validParamsTextOnly);
    assert.ok(r.includes('"validation_type": "email"'));
  });

  it('содержит min_length и max_length', () => {
    const r = generateUserInput(validParamsWithValidation);
    assert.ok(r.includes('"min_length": 7'));
    assert.ok(r.includes('"max_length": 15'));
  });

  it('appendVariable=True в Python', () => {
    const r = generateUserInput(validParamsAppendMode);
    assert.ok(r.includes('"appendVariable": True'));
  });

  it('appendVariable=False по умолчанию', () => {
    const r = generateUserInput(validParamsMinimal);
    assert.ok(r.includes('"appendVariable": False'));
  });

  it('modes содержит только text для текстового ввода', () => {
    const r = generateUserInput(validParamsTextOnly);
    assert.ok(r.includes('"modes": ["text"]'));
  });

  it('modes содержит photo для фото ввода', () => {
    const r = generateUserInput(validParamsPhotoInput);
    assert.ok(r.includes('"photo"'));
    assert.ok(r.includes('"type": "photo"'));
  });

  it('modes содержит несколько типов для мультимедиа', () => {
    const r = generateUserInput(validParamsMultiMedia);
    assert.ok(r.includes('"text"'));
    assert.ok(r.includes('"photo"'));
    assert.ok(r.includes('"video"'));
    assert.ok(r.includes('"audio"'));
  });

  it('photo_variable добавляется при enablePhotoInput', () => {
    const r = generateUserInput(validParamsPhotoInput);
    assert.ok(r.includes('"photo_variable": "user_photo_file"'));
  });

  it('video_variable добавляется при enableVideoInput', () => {
    const r = generateUserInput(validParamsMultiMedia);
    assert.ok(r.includes('"video_variable": "video_var"'));
  });

  it('inputSource=any включает все новые режимы dedicated input-узла', () => {
    const r = generateUserInput(validParamsDedicatedAnyInput);
    assert.ok(r.includes('"modes": ['));
    assert.ok(r.includes('"text"'));
    assert.ok(r.includes('"photo"'));
    assert.ok(r.includes('"video"'));
    assert.ok(r.includes('"audio"'));
    assert.ok(r.includes('"document"'));
    assert.ok(r.includes('"location"'));
    assert.ok(r.includes('"contact"'));
  });

  it('contact_variable добавляется для inputSource=contact', () => {
    const r = generateUserInput(validParamsDedicatedContactInput);
    assert.ok(r.includes('"contact_variable": "user_contact_card"'));
    assert.ok(r.includes('"type": "contact"'));
  });

  it('location_variable добавляется для inputSource=location', () => {
    const r = generateUserInput(validParamsDedicatedLocationInput);
    assert.ok(r.includes('"location_variable": "user_location_point"'));
    assert.ok(r.includes('"type": "location"'));
  });

  it('содержит logging.info с именем переменной', () => {
    const r = generateUserInput(validParamsMinimal);
    assert.ok(r.includes('logging.info'));
    assert.ok(r.includes('user_name'));
  });

  it('save_to_database=True', () => {
    const r = generateUserInput(validParamsTextOnly);
    assert.ok(r.includes('"save_to_database": True'));
  });

  it('save_to_database=False', () => {
    const r = generateUserInput(validParamsNoTarget);
    assert.ok(r.includes('"save_to_database": False'));
  });

  it('inputType button → type=button в Python', () => {
    const r = generateUserInput(validParamsButtonInput);
    assert.ok(r.includes('"type": "button"'));
    assert.ok(r.includes('"modes": ["button"]'));
  });

  it('inputType button + enableTextInput → modes=[button, text]', () => {
    const r = generateUserInput(validParamsButtonWithText);
    assert.ok(r.includes('"button"'));
    assert.ok(r.includes('"text"'));
  });

  it('skip_buttons добавляется в блок', () => {
    const r = generateUserInput(validParamsButtonInput);
    assert.ok(r.includes('"skip_buttons"'));
    assert.ok(r.includes('Пропустить'));
    assert.ok(r.includes('msg_skip'));
  });

  it('skip_buttons отсутствует если пустой массив', () => {
    const r = generateUserInput(validParamsMinimal);
    assert.ok(!r.includes('"skip_buttons"'));
  });

  it('inputType callback → type=callback и modes=["callback"]', () => {
    const r = generateUserInput(validParamsCallbackInput);
    assert.ok(r.includes('"type": "callback"'));
    assert.ok(r.includes('"modes": ["callback"]'));
  });

  it('inputType callback → переменная сохраняется корректно', () => {
    const r = generateUserInput(validParamsCallbackInput);
    assert.ok(r.includes('"variable": "callback_response"'));
    assert.ok(r.includes('"next_node_id": "msg_done"'));
  });

  it('дефолт inputVariable = "input" (совпадает с реальным кодом)', () => {
    const result = userInputParamsSchema.parse({ nodeId: 'n', safeName: 'n' });
    assert.strictEqual(result.inputVariable, 'input');
  });
});

// ─── userInputParamsSchema ───────────────────────────────────────────────────

describe('userInputParamsSchema', () => {
  it('принимает минимальные параметры', () => {
    assert.ok(userInputParamsSchema.safeParse(validParamsMinimal).success);
  });

  it('принимает полные параметры с валидацией', () => {
    assert.ok(userInputParamsSchema.safeParse(validParamsWithValidation).success);
  });

  it('принимает мультимедиа параметры', () => {
    assert.ok(userInputParamsSchema.safeParse(validParamsMultiMedia).success);
  });

  it('отклоняет параметры без nodeId', () => {
    assert.ok(!userInputParamsSchema.safeParse(invalidParamsMissingNodeId).success);
  });

  it('применяет дефолты для необязательных полей', () => {
    const result = userInputParamsSchema.parse(validParamsMinimal);
    assert.strictEqual(result.appendVariable, false);
    assert.strictEqual(result.enableTextInput, true);
    assert.strictEqual(result.validationType, 'none');
    assert.strictEqual(result.minLength, 0);
    assert.strictEqual(result.saveToDatabase, true);
  });
});

// ─── nodeToUserInputParams() ─────────────────────────────────────────────────

describe('nodeToUserInputParams()', () => {
  it('извлекает inputVariable из node.data', () => {
    const params = nodeToUserInputParams(nodeWithTextInput);
    assert.strictEqual(params.inputVariable, 'user_name');
  });

  it('извлекает inputTargetNodeId', () => {
    const params = nodeToUserInputParams(nodeWithTextInput);
    assert.strictEqual(params.inputTargetNodeId, 'msg_next');
  });

  it('извлекает enablePhotoInput', () => {
    const params = nodeToUserInputParams(nodeWithPhotoInput);
    assert.strictEqual(params.enablePhotoInput, true);
    assert.strictEqual(params.photoInputVariable, 'user_photo_file');
  });

  it('извлекает validationType', () => {
    const params = nodeToUserInputParams(nodeWithEmailValidation);
    assert.strictEqual(params.validationType, 'email');
  });

  it('извлекает inputSource и contact mode из dedicated input-узла', () => {
    const params = nodeToUserInputParams(dedicatedInputNode);
    assert.strictEqual(params.inputSource, 'contact');
    assert.strictEqual(params.enableContactInput, true);
    assert.strictEqual(params.enableTextInput, false);
  });

  it('dedicated input any включает location и contact', () => {
    const params = nodeToUserInputParams(dedicatedAnyInputNode);
    assert.strictEqual(params.inputSource, 'any');
    assert.strictEqual(params.enableLocationInput, true);
    assert.strictEqual(params.enableContactInput, true);
  });

  it('генерирует safeName из nodeId', () => {
    const params = nodeToUserInputParams(nodeWithTextInput);
    assert.strictEqual(params.safeName, 'msg_ask_name');
  });

  it('дефолт inputVariable если не задан', () => {
    const params = nodeToUserInputParams(nodeWithoutCollectInput);
    assert.strictEqual(params.inputVariable, 'input');
  });
});

// ─── nodeHasUserInput() ──────────────────────────────────────────────────────

describe('nodeHasUserInput()', () => {
  it('возвращает true если collectUserInput=true', () => {
    assert.strictEqual(nodeHasUserInput(nodeWithTextInput), true);
  });

  it('возвращает false если collectUserInput=false', () => {
    assert.strictEqual(nodeHasUserInput(nodeWithoutCollectInput), false);
  });

  it('возвращает true для dedicated input-узла', () => {
    assert.strictEqual(nodeHasUserInput(dedicatedInputNode), true);
  });

  it('фильтрует узлы с вводом из массива', () => {
    const inputNodes = nodesWithMixedInput.filter(nodeHasUserInput);
    assert.strictEqual(inputNodes.length, 5);
  });
});

// ─── generateUserInputFromNode() ─────────────────────────────────────────────

describe('generateUserInputFromNode()', () => {
  it('генерирует код из узла с текстовым вводом', () => {
    const r = generateUserInputFromNode(nodeWithTextInput);
    assert.ok(r.includes('waiting_for_input'));
    assert.ok(r.includes('"user_name"'));
    assert.ok(r.includes('"msg_ask_name"'));
  });

  it('генерирует код из узла с email валидацией', () => {
    const r = generateUserInputFromNode(nodeWithEmailValidation);
    assert.ok(r.includes('"validation_type": "email"'));
    assert.ok(r.includes('"user_email"'));
  });

  it('генерирует код из узла с фото вводом', () => {
    const r = generateUserInputFromNode(nodeWithPhotoInput);
    assert.ok(r.includes('"photo"'));
    assert.ok(r.includes('"photo_variable"'));
  });

  it('генерирует код из узла с мультимедиа', () => {
    const r = generateUserInputFromNode(nodeWithMultiMedia);
    assert.ok(r.includes('"text"'));
    assert.ok(r.includes('"photo"'));
    assert.ok(r.includes('"video"'));
  });

  it('генерирует type=button для узла с кнопками', () => {
    const r = generateUserInputFromNode(nodeWithButtons);
    assert.ok(r.includes('"type": "button"'));
    assert.ok(r.includes('"skip_buttons"'));
    assert.ok(r.includes('Пропустить'));
  });

  it('генерирует waiting_for_input из dedicated input-узла', () => {
    const r = generateUserInputFromNode(dedicatedInputNode);
    assert.ok(r.includes('"type": "contact"'));
    assert.ok(r.includes('"contact_variable": "user_contact"'));
    assert.ok(r.includes('"next_node_id": "msg_done"'));
  });

  it('генерирует type=callback для dedicated callback input-узла', () => {
    const r = generateUserInputFromNode(dedicatedCallbackInputNode);
    assert.ok(r.includes('"type": "callback"'));
    assert.ok(r.includes('"modes": ["callback"]'));
    assert.ok(r.includes('"variable": "callback_response"'));
  });
});

describe('generateUserInputNodeHandler()', () => {
  it('генерирует callback-handler для dedicated input-узла', () => {
    const r = generateUserInputNodeHandler(dedicatedInputNode);
    assert.ok(r.includes('@dp.callback_query(lambda c: c.data == "input_contact_1")'));
    assert.ok(r.includes('async def handle_callback_input_contact_1'));
    assert.ok(r.includes('"waiting_for_input"'));
    assert.ok(r.includes('"contact_variable": "user_contact"'));
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateUserInput: быстрее 10ms', () => {
    const start = Date.now();
    generateUserInput(validParamsMultiMedia);
    assert.ok(Date.now() - start < 10);
  });

  it('generateUserInputFromNode: быстрее 10ms', () => {
    const start = Date.now();
    generateUserInputFromNode(nodeWithMultiMedia);
    assert.ok(Date.now() - start < 10);
  });
});
