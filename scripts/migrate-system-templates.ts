/**
 * @fileoverview Одноразовая миграция старых системных шаблонов в актуальный формат editor.
 *
 * Скрипт прогоняет шаблоны через тот же порядок миграций, что и canvas-editor,
 * а затем пересобирает связи по уже нормализованным узлам.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { nodeSchema, type Node, insertBotTemplateSchema } from "@shared/schema";
import { migrateSynonymsToTextTriggers } from "../client/components/editor/canvas/canvas/utils/migrate-synonyms";
import { migrateCommandsToCommandTriggers } from "../client/components/editor/canvas/canvas/utils/migrate-command-triggers";
import { migrateLegacyNodeTypes } from "../client/components/editor/canvas/canvas/utils/migrate-legacy-node-types";
import { migrateForwardMessageSourceLinks } from "../client/components/editor/canvas/canvas/utils/migrate-forward-message-source-links";
import { migrateConditionalMessagesToConditionNodes } from "../client/components/editor/canvas/canvas/utils/migrate-conditional-messages";
import { migrateMessageKeyboardsToNodes } from "../client/components/editor/canvas/canvas/utils/migrate-message-keyboards";
import { migrateLegacyMessageInputToLinkedInputs } from "../client/components/editor/canvas/canvas/utils/migrate-message-input";
import { migrateInputNodeTarget } from "../client/components/editor/canvas/canvas/utils/migrate-input-node-target";

/**
 * Связь, которую мы сохраняем в JSON шаблона.
 */
type TemplateConnection = {
  /** Уникальный идентификатор связи */
  id: string;
  /** Идентификатор исходного узла */
  source: string;
  /** Идентификатор целевого узла */
  target: string;
  /** Тип связи */
  type?: string;
  /** Подпись связи */
  label?: string;
  /** Идентификатор кнопки для связи button-goto */
  buttonId?: string;
};

/**
 * Список старых системных шаблонов, которые нужно мигрировать.
 */
const TEMPLATE_FILES = [
  "server/templates/vprogulke-admin-panel.json",
  "server/templates/kotik-simple-anketa.json",
] as const;

/**
 * Проверяет, может ли узел быть источником для forward_message.
 *
 * @param {Node | undefined} node Проверяемый узел
 * @returns {boolean} `true`, если узел поддерживает привязку как источник пересылки
 */
function canBeForwardMessageSource(node: Node | undefined): boolean {
  return Boolean(
    node &&
    new Set<Node["type"]>([
      "message",
      "media",
      "photo",
      "video",
      "audio",
      "document",
      "sticker",
      "voice",
      "animation",
      "location",
      "contact",
    ]).has(node.type),
  );
}

/**
 * Собирает связи для шаблона по актуальным узлам.
 *
 * @param {Node[]} nodes Нормализованные узлы листа
 * @returns {TemplateConnection[]} Связи в формате JSON шаблона
 */
function collectTemplateConnections(nodes: Node[]): TemplateConnection[] {
  const existingIds = new Set(nodes.map((node) => node.id));
  const connections: TemplateConnection[] = [];
  const seen = new Set<string>();

  const addConnection = (connection: TemplateConnection) => {
    const key = [
      connection.source,
      connection.target,
      connection.type ?? "",
      connection.buttonId ?? "",
      connection.label ?? "",
    ].join("|");

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    connections.push(connection);
  };

  for (const node of nodes) {
    const data = node.data as Record<string, unknown>;

    if (canBeForwardMessageSource(node) && data.enableAutoTransition && typeof data.autoTransitionTo === "string") {
      const targetId = data.autoTransitionTo.trim();
      const targetNode = nodes.find((candidate) => candidate.id === targetId);
      const isLegacyForwardSourceLink =
        targetNode?.type === "forward_message" &&
        (targetNode.data as any)?.sourceMessageNodeId === node.id;

      if (targetId && existingIds.has(targetId) && !isLegacyForwardSourceLink) {
        addConnection({
          id: `auto-${node.id}-${targetId}`,
          source: node.id,
          target: targetId,
          type: "auto-transition",
        });
      }
    }

    const buttons: any[] = Array.isArray(data.buttons) ? data.buttons : [];
    for (const button of buttons) {
      if (button.action === "goto" && button.target && existingIds.has(button.target)) {
        addConnection({
          id: `button-${node.id}-${button.id}-${button.target}`,
          source: node.id,
          target: button.target,
          type: "button-goto",
          label: button.text,
          buttonId: button.id,
        });
      }
    }

    const inputTargetNodeId = (typeof data.inputTargetNodeId === "string" && data.inputTargetNodeId.trim())
      ? data.inputTargetNodeId.trim()
      : (node.type === "input" && typeof data.autoTransitionTo === "string" ? data.autoTransitionTo.trim() : "");
    if (inputTargetNodeId && existingIds.has(inputTargetNodeId)) {
      addConnection({
        id: `input-${node.id}-${inputTargetNodeId}`,
        source: node.id,
        target: inputTargetNodeId,
        type: "input-target",
      });
    }

    if (
      (node.type === "command_trigger" ||
        node.type === "text_trigger" ||
        node.type === "incoming_message_trigger" ||
        node.type === "group_message_trigger" ||
        node.type === "callback_trigger" ||
        node.type === "incoming_callback_trigger" ||
        node.type === "outgoing_message_trigger" ||
        node.type === "managed_bot_updated_trigger") &&
      typeof data.autoTransitionTo === "string"
    ) {
      const targetId = data.autoTransitionTo.trim();
      if (targetId && existingIds.has(targetId)) {
        addConnection({
          id: `trigger-${node.id}-${targetId}`,
          source: node.id,
          target: targetId,
          type: "trigger-next",
        });
      }
    }

    if (node.type === "condition") {
      const branches: any[] = Array.isArray((data as any).branches) ? (data as any).branches : [];
      for (const branch of branches) {
        if (branch.target && existingIds.has(branch.target)) {
          addConnection({
            id: `condition-${node.id}-${branch.id}-${branch.target}`,
            source: node.id,
            target: branch.target,
            type: "button-goto",
            label: branch.label,
            buttonId: branch.id,
          });
        }
      }

      const sourceNodeId = typeof (data as any).sourceNodeId === "string"
        ? (data as any).sourceNodeId.trim()
        : "";
      if (sourceNodeId && existingIds.has(sourceNodeId)) {
        addConnection({
          id: `condition-source-${sourceNodeId}-${node.id}`,
          source: sourceNodeId,
          target: node.id,
          type: "condition-source",
        });
      }
    }

    if (node.type === "forward_message") {
      const sourceNodeId = typeof (data as any).sourceMessageNodeId === "string"
        ? (data as any).sourceMessageNodeId.trim()
        : "";
      const sourceMode = typeof (data as any).sourceMessageIdSource === "string"
        ? (data as any).sourceMessageIdSource
        : "current_message";

      if (sourceNodeId && existingIds.has(sourceNodeId) && (sourceMode === "current_message" || sourceMode === "last_message")) {
        addConnection({
          id: `forward-${sourceNodeId}-${node.id}`,
          source: sourceNodeId,
          target: node.id,
          type: "forward-source",
        });
      }
    }

    if (node.type === "message") {
      const keyboardNodeId = typeof (data as any).keyboardNodeId === "string"
        ? (data as any).keyboardNodeId.trim()
        : "";
      if (keyboardNodeId && existingIds.has(keyboardNodeId)) {
        addConnection({
          id: `keyboard-${node.id}-${keyboardNodeId}`,
          source: node.id,
          target: keyboardNodeId,
          type: "keyboard-link",
        });
      }
    }
  }

  return connections;
}

/**
 * Нормализует устаревшие enum-значения, которые больше не проходят текущую схему.
 *
 * @param {Node[]} nodes Узлы листа после миграций
 * @returns {Node[]} Узлы с приведёнными enum-значениями
 */
function normalizeLegacyEnumValues(nodes: Node[]): Node[] {
  return nodes.map((node) => {
    const data = { ...(node.data as Record<string, unknown>) };

    if (data.adminUserIdSource === "reply_to_message") {
      data.adminUserIdSource = "last_message";
    }

    if (data.adminChatIdSource === "reply_to_message") {
      data.adminChatIdSource = "current_chat";
    }

    return {
      ...node,
      data,
    };
  });
}

/**
 * Прогоняет один лист через цепочку миграций редактора.
 *
 * @param {{ nodes: Node[]; connections?: TemplateConnection[] }} sheet Исходный лист
 * @returns {{ nodes: Node[]; connections: TemplateConnection[] }} Мигрированный лист
 */
function migrateSheet(sheet: { nodes: Node[]; connections?: TemplateConnection[] }) {
  const nodesAfterSynonyms = migrateSynonymsToTextTriggers(sheet.nodes);
  const nodesAfterCommands = migrateCommandsToCommandTriggers(nodesAfterSynonyms);
  const nodesAfterLegacyTypes = migrateLegacyNodeTypes(nodesAfterCommands);
  const nodesAfterForwardLinks = migrateForwardMessageSourceLinks(nodesAfterLegacyTypes);
  const nodesAfterConditions = migrateConditionalMessagesToConditionNodes(nodesAfterForwardLinks);
  const nodesAfterKeyboardNodes = migrateMessageKeyboardsToNodes(nodesAfterConditions);
  const nodesAfterLinkedInputs = migrateLegacyMessageInputToLinkedInputs(nodesAfterKeyboardNodes);
  const nodesAfterInputTargets = migrateInputNodeTarget(nodesAfterLinkedInputs);
  const nodesAfterEnumNormalization = normalizeLegacyEnumValues(nodesAfterInputTargets);

  const validatedNodes = nodeSchema.extend({
    data: nodeSchema.shape.data.passthrough(),
  }).passthrough().array().parse(nodesAfterEnumNormalization);
  const connections = collectTemplateConnections(validatedNodes);

  return {
    nodes: validatedNodes,
    connections,
  };
}

/**
 * Обновляет один файл шаблона на диске.
 *
 * @param {string} relativePath Путь к JSON-файлу шаблона
 */
function migrateTemplateFile(relativePath: string) {
  const filePath = resolve(process.cwd(), relativePath);
  const raw = readFileSync(filePath, "utf8");
  const template = JSON.parse(raw);

  insertBotTemplateSchema.parse(template);

  if (!template?.data?.sheets || !Array.isArray(template.data.sheets)) {
    throw new Error(`Шаблон ${relativePath} не содержит sheets`);
  }

  template.data.sheets = template.data.sheets.map((sheet: { nodes: Node[]; connections?: TemplateConnection[] }) => {
    const migrated = migrateSheet(sheet);
    return {
      ...sheet,
      nodes: migrated.nodes,
      connections: migrated.connections,
    };
  });

  const output = JSON.stringify(template, null, 2);
  writeFileSync(filePath, `${output}\n`, "utf8");
  console.log(`✅ Мигрирован шаблон: ${relativePath}`);
}

for (const templateFile of TEMPLATE_FILES) {
  migrateTemplateFile(templateFile);
}
