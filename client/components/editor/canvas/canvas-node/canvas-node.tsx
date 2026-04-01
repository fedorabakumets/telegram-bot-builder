/**
 * @fileoverview Рендер узлов холста редактора и их портов связи.
 */

import { Node } from '@/types/bot';
import { cn } from '@/utils/utils';
import { useState, useRef, useEffect } from 'react';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';
import { getCanvasViewportMetrics, screenPointToCanvasPoint } from '../canvas/utils/canvas-coordinate-utils';
import { NodeContextMenu } from './context-menu/node-context-menu';
import { useNodeContextMenu } from './context-menu/use-node-context-menu';
import { DicePreview } from './dice-preview';
import { StickerPreview } from './sticker-preview';
import { VoicePreview } from './voice-preview';
import { ContactPreview } from './contact-preview';
import { PollPreview } from './poll-preview';
import { LocationPreview } from './location-preview';import { MediaAttachmentIndicator } from './media-attachment-indicator';
import { TextInputIndicator } from './text-input-indicator';
import { SaveAnswerIndicator } from './save-answer-indicator';
import { MessageLinkedInputIndicator } from './message-linked-input-indicator';
import { MessagePreview } from './message-preview';
import { ImageAttachment } from './image-attachment';
import { MediaAttachmentsPreview } from './media-attachments-preview';
import { NodeActions } from './node-actions';
import { AdminRightsPreview } from './admin-rights-preview';
import { NodeHeader } from './node-header';
import { ButtonsPreview } from './buttons-preview';
import { ClientAuthCard } from './client-auth-card';
import { CommandTriggerPreview } from './command-trigger-preview';
import { TextTriggerPreview } from './text-trigger-preview';
import { ConditionNodePreview } from './condition-node-preview';
import { MediaNodePreview } from './media-node-preview';

/**
 * РРЅС‚РµСЂС„РµР№СЃ СЃРІРѕР№СЃС‚РІ РєРѕРјРїРѕРЅРµРЅС‚Р° CanvasNode
 *
 * @interface CanvasNodeProps
 * @property {Node} node - РЈР·РµР», РєРѕС‚РѕСЂС‹Р№ Р±СѓРґРµС‚ РѕС‚РѕР±СЂР°Р¶РµРЅ
 * @property {Node[]} [allNodes] - Р’СЃРµ СѓР·Р»С‹ РЅР° С…РѕР»СЃС‚Рµ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
 * @property {boolean} [isSelected] - Р’С‹РґРµР»РµРЅ Р»Рё СѓР·РµР» (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
 * @property {Function} [onClick] - РћР±СЂР°Р±РѕС‚С‡РёРє РєР»РёРєР° РїРѕ СѓР·Р»Сѓ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
 * @property {Function} [onDelete] - РћР±СЂР°Р±РѕС‚С‡РёРє СѓРґР°Р»РµРЅРёСЏ СѓР·Р»Р° (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
 * @property {Function} [onDuplicate] - РћР±СЂР°Р±РѕС‚С‡РёРє РґСѓР±Р»РёСЂРѕРІР°РЅРёСЏ СѓР·Р»Р° (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
 * @property {Function} [onMove] - РћР±СЂР°Р±РѕС‚С‡РёРє РїРµСЂРµРјРµС‰РµРЅРёСЏ СѓР·Р»Р° (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
 * @property {Function} [onMoveEnd] - РћР±СЂР°Р±РѕС‚С‡РёРє Р·Р°РІРµСЂС€РµРЅРёСЏ РїРµСЂРµРјРµС‰РµРЅРёСЏ СѓР·Р»Р° (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
 * @property {number} [zoom] - РЈСЂРѕРІРµРЅСЊ РјР°СЃС€С‚Р°Р±РёСЂРѕРІР°РЅРёСЏ (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ 100)
 * @property {{x: number, y: number}} [pan] - РџРѕР·РёС†РёСЏ РїР°РЅРѕСЂР°РјРёСЂРѕРІР°РЅРёСЏ (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ {x: 0, y: 0})
 * @property {Function} [setIsNodeBeingDragged] - РћР±СЂР°Р±РѕС‚С‡РёРє СѓСЃС‚Р°РЅРѕРІРєРё СЃРѕСЃС‚РѕСЏРЅРёСЏ РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёСЏ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
 * @property {Function} [onSizeChange] - РћР±СЂР°Р±РѕС‚С‡РёРє РёР·РјРµРЅРµРЅРёСЏ СЂР°Р·РјРµСЂР° СѓР·Р»Р° (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
 */
interface CanvasNodeProps {
  node: Node;
  allNodes?: Node[];
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  /** РћР±СЂР°Р±РѕС‚С‡РёРє РґСѓР±Р»РёСЂРѕРІР°РЅРёСЏ СѓР·Р»Р° СЃ РѕРїС†РёРѕРЅР°Р»СЊРЅРѕР№ С†РµР»РµРІРѕР№ РїРѕР·РёС†РёРµР№ */
  onDuplicate?: ((targetPosition?: { x: number; y: number }) => void) | undefined;
  /**
   * РћР±СЂР°Р±РѕС‚С‡РёРє РґСѓР±Р»РёСЂРѕРІР°РЅРёСЏ СѓР·Р»Р° С‡РµСЂРµР· РєРѕРЅС‚РµРєСЃС‚РЅРѕРµ РјРµРЅСЋ.
   * РџРѕР·РёС†РёСЏ РІС‹С‡РёСЃР»СЏРµС‚СЃСЏ РІ canvas.tsx С‡РµСЂРµР· getPastePosition() вЂ” С‚Сѓ Р¶Рµ С„СѓРЅРєС†РёСЋ,
   * С‡С‚Рѕ РёСЃРїРѕР»СЊР·СѓРµС‚ Ctrl+V вЂ” РїРѕСЌС‚РѕРјСѓ РґСѓР±Р»СЊ РІСЃРµРіРґР° РїРѕРїР°РґР°РµС‚ РІ С‚РѕС‡РєСѓ РїРѕСЃР»РµРґРЅРµРіРѕ РєР»РёРєР°.
   * Р•СЃР»Рё РїРµСЂРµРґР°РЅ СЌС‚РѕС‚ РїСЂРѕРї, РєРѕРЅС‚РµРєСЃС‚РЅРѕРµ РјРµРЅСЋ РёСЃРїРѕР»СЊР·СѓРµС‚ РµРіРѕ РІРјРµСЃС‚Рѕ СЃРѕР±СЃС‚РІРµРЅРЅРѕР№
   * С„РѕСЂРјСѓР»С‹ РєРѕРЅРІРµСЂС‚Р°С†РёРё РєРѕРѕСЂРґРёРЅР°С‚.
   */
  onDuplicateAtPosition?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
  zoom?: number;
  pan?: { x: number; y: number };
  setIsNodeBeingDragged?: ((isDragging: boolean) => void) | undefined;
  onSizeChange?: (nodeId: string, size: { width: number; height: number }) => void;
  /** РћР±СЂР°Р±РѕС‚С‡РёРє РЅР°С‡Р°Р»Р° РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёСЏ РѕС‚ РїРѕСЂС‚Р° РІС‹С…РѕРґР° */
  onPortMouseDown?: (
    e: React.MouseEvent,
    nodeId: string,
    portType: PortType,
    buttonId?: string,
    portCenter?: { x: number; y: number }
  ) => void;
  /** РЈР·РµР» СЏРІР»СЏРµС‚СЃСЏ РёСЃС‚РѕС‡РЅРёРєРѕРј Р°РєС‚РёРІРЅРѕРіРѕ drag-СЃРѕРµРґРёРЅРµРЅРёСЏ (РґРµСЂР¶РёС‚ РїРѕСЂС‚С‹ РІРёРґРёРјС‹РјРё) */
  isConnectionSource?: boolean;
  /** Подсветка узла как допустимой цели при drag-to-connect */
  isConnectionTarget?: boolean;
  /** Узел связан с перетаскиваемым узлом */
  isConnectedToDragging?: boolean;
  /**
   * РљРѕР»Р±СЌРє, РІС‹Р·С‹РІР°РµРјС‹Р№ РїСЂРё РјРѕРЅС‚РёСЂРѕРІР°РЅРёРё РїРѕСЂС‚Р° РєРЅРѕРїРєРё.
   * РџРµСЂРµРґР°С‘С‚ buttonId Рё РїРѕР·РёС†РёСЋ С†РµРЅС‚СЂР° РїРѕСЂС‚Р° РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅРѕ wrapper-div СѓР·Р»Р°.
   */
  onButtonPortMount?: (buttonId: string, offset: { x: number; y: number }) => void;
}

/**
 * РљРѕРјРїРѕРЅРµРЅС‚ СѓР·Р»Р° РЅР° С…РѕР»СЃС‚Рµ
 *
 * @component
 * @description РћС‚РѕР±СЂР°Р¶Р°РµС‚ СѓР·РµР» РЅР° С…РѕР»СЃС‚Рµ СЃ РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊСЋ РїРµСЂРµРјРµС‰РµРЅРёСЏ, РІС‹РґРµР»РµРЅРёСЏ Рё РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёСЏ.
 *
 * РЎС‚СЂСѓРєС‚СѓСЂР° СЂРµРЅРґРµСЂР°:
 * - Р’РЅРµС€РЅРёР№ wrapper-div: С‚РѕР»СЊРєРѕ position/left/top/zIndex вЂ” Р±РµР· overflow, Р±РµР· backdrop-filter.
 *   Р­С‚Рѕ РіР°СЂР°РЅС‚РёСЂСѓРµС‚, С‡С‚Рѕ Р°Р±СЃРѕР»СЋС‚РЅРѕ РїРѕР·РёС†РёРѕРЅРёСЂРѕРІР°РЅРЅС‹Рµ РґРѕС‡РµСЂРЅРёРµ СЌР»РµРјРµРЅС‚С‹ СЃ РѕС‚СЂРёС†Р°С‚РµР»СЊРЅС‹РјРё
 *   РѕС‚СЃС‚СѓРїР°РјРё (РєРЅРѕРїРєРё, РїРѕСЂС‚С‹) РЅРµ РѕР±СЂРµР·Р°СЋС‚СЃСЏ РїСЂРё РґРѕР±Р°РІР»РµРЅРёРё ring/box-shadow РЅР° РІРЅСѓС‚СЂРµРЅРЅРёР№ div.
 * - NodeActions Рё OutputPort СЂРµРЅРґРµСЂСЏС‚СЃСЏ РІРЅСѓС‚СЂРё wrapper, РЅРѕ СЃРЅР°СЂСѓР¶Рё РѕСЃРЅРѕРІРЅРѕРіРѕ div СѓР·Р»Р°.
 * - РћСЃРЅРѕРІРЅРѕР№ div СѓР·Р»Р°: С‚РѕР»СЊРєРѕ РІРёР·СѓР°Р»СЊРЅРѕРµ СЃРѕРґРµСЂР¶РёРјРѕРµ + ring/shadow РїСЂРё РІС‹РґРµР»РµРЅРёРё.
 *
 * @param {CanvasNodeProps} props - РЎРІРѕР№СЃС‚РІР° РєРѕРјРїРѕРЅРµРЅС‚Р°
 * @returns {JSX.Element} РљРѕРјРїРѕРЅРµРЅС‚ СѓР·Р»Р° РЅР° С…РѕР»СЃС‚Рµ
 */
export function CanvasNode({ node, allNodes, isSelected, onClick, onDelete, onDuplicate, onDuplicateAtPosition, onMove, onMoveStart, onMoveEnd, zoom = 100, pan = { x: 0, y: 0 }, setIsNodeBeingDragged, onSizeChange, onPortMouseDown, isConnectionTarget, isConnectionSource, isConnectedToDragging, onButtonPortMount }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Ref РґР»СЏ dragOffset вЂ” РїРѕР·РІРѕР»СЏРµС‚ С‡РёС‚Р°С‚СЊ Р°РєС‚СѓР°Р»СЊРЅРѕРµ Р·РЅР°С‡РµРЅРёРµ РІ handleMouseMove
  // Р±РµР· РґРѕР±Р°РІР»РµРЅРёСЏ dragOffset РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё useEffect (РёРЅР°С‡Рµ РѕР±СЂР°Р±РѕС‚С‡РёРєРё
  // РїРµСЂРµСЃРѕР·РґР°РІР°Р»РёСЃСЊ Р±С‹ РїСЂРё РєР°Р¶РґРѕРј mousemove, РІС‹Р·С‹РІР°СЏ РїСЂРѕРїСѓСЃРє СЃРѕР±С‹С‚РёР№).
  const dragOffsetRef = useRef(dragOffset);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { menu, open: openContextMenu, close: closeContextMenu } = useNodeContextMenu();

  /**
   * РџРµСЂРµРІРѕРґРёС‚ СЌРєСЂР°РЅРЅСѓСЋ С‚РѕС‡РєСѓ РІ РєРѕРѕСЂРґРёРЅР°С‚С‹ canvas СЃ СѓС‡РµС‚РѕРј scroll РєРѕРЅС‚РµР№РЅРµСЂР°.
   *
   * @param screenX - X РІ СЌРєСЂР°РЅРЅС‹С… РєРѕРѕСЂРґРёРЅР°С‚Р°С…
   * @param screenY - Y РІ СЌРєСЂР°РЅРЅС‹С… РєРѕРѕСЂРґРёРЅР°С‚Р°С…
   * @returns РўРѕС‡РєР° РІ РєРѕРѕСЂРґРёРЅР°С‚Р°С… canvas
   */
  const getCanvasPoint = (screenX: number, screenY: number) => {
    const wrapperDiv = nodeRef.current?.parentElement;
    const transformedContainer = wrapperDiv?.parentElement;
    const canvas = transformedContainer?.parentElement;
    const viewport = getCanvasViewportMetrics(canvas);
    if (!viewport) return { x: screenX, y: screenY };
    return screenPointToCanvasPoint(screenX, screenY, viewport, pan, zoom);
  };
  void getCanvasPoint;

  /**
   * РћР±СЂР°Р±РѕС‚С‡РёРє РЅР°С‡Р°Р»Р° РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёСЏ РѕС‚ РїРѕСЂС‚Р° РІС‹С…РѕРґР°.
   * РџСЂРѕР±СЂР°СЃС‹РІР°РµС‚ nodeId РІ РєРѕР»Р±СЌРє СЂРѕРґРёС‚РµР»СЏ.
   */
  const handlePortMouseDown = (e: React.MouseEvent, portType: PortType, buttonId?: string, portCenter?: { x: number; y: number }) => {
    onPortMouseDown?.(e, node.id, portType, buttonId, portCenter);
  };

  // Touch СЃРѕСЃС‚РѕСЏРЅРёРµ РґР»СЏ РјРѕР±РёР»СЊРЅРѕРіРѕ РїРµСЂРµРјРµС‰РµРЅРёСЏ СЌР»РµРјРµРЅС‚РѕРІ
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [touchMoved, setTouchMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onMove) return;

    // РќРµ Р·Р°РїСѓСЃРєР°С‚СЊ РґСЂР°Рі РµСЃР»Рё РєР»РёРєРЅСѓР»Рё РїРѕ РєРЅРѕРїРєРµ СѓРґР°Р»РµРЅРёСЏ
    if ((e.target as HTMLElement).closest('button')) return;

    // РќР°С…РѕРґРёРј РєР°РЅРІР°СЃ (СЂРѕРґРёС‚РµР»СЊСЃРєРёР№ СЌР»РµРјРµРЅС‚ С‚СЂР°РЅСЃС„РѕСЂРјРёСЂСѓРµРјРѕРіРѕ РєРѕРЅС‚РµР№РЅРµСЂР°)
    // nodeRef СѓРєР°Р·С‹РІР°РµС‚ РЅР° РІРЅСѓС‚СЂРµРЅРЅРёР№ div: innerDiv -> wrapper -> transformedContainer -> canvas
    const wrapperDiv = nodeRef.current?.parentElement;
    const transformedContainer = wrapperDiv?.parentElement;
    const canvas = transformedContainer?.parentElement;

    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const zoomFactor = zoom / 100;

      // Р Р°СЃСЃС‡РёС‚С‹РІР°РµРј СЃРјРµС‰РµРЅРёРµ РІ РєР°РЅРІР°СЃРЅС‹С… РєРѕРѕСЂРґРёРЅР°С‚Р°С…
      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;

      const canvasX = (screenX - pan.x) / zoomFactor;
      const canvasY = (screenY - pan.y) / zoomFactor;

      setDragOffset({
        x: canvasX - node.position.x,
        y: canvasY - node.position.y
      });
      dragOffsetRef.current = {
        x: canvasX - node.position.x,
        y: canvasY - node.position.y
      };
      setIsDragging(true);
      // РЎРѕС…СЂР°РЅСЏРµРј СЃРѕСЃС‚РѕСЏРЅРёРµ Р”Рћ РЅР°С‡Р°Р»Р° РїРµСЂРµРјРµС‰РµРЅРёСЏ
      onMoveStart?.();
      // РЈРІРµРґРѕРјР»СЏРµРј РіР»РѕР±Р°Р»СЊРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ Рѕ РЅР°С‡Р°Р»Рµ РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёСЏ
      if (setIsNodeBeingDragged) {
        setIsNodeBeingDragged(true);
      }
    }

    // РџСЂРµРґРѕС‚РІСЂР°С‰Р°РµРј РІС‹РґРµР»РµРЅРёРµ С‚РµРєСЃС‚Р° РїСЂРё РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёРё
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !onMove) return;

    // РќР°С…РѕРґРёРј РєР°РЅРІР°СЃ (СЂРѕРґРёС‚РµР»СЊСЃРєРёР№ СЌР»РµРјРµРЅС‚ С‚СЂР°РЅСЃС„РѕСЂРјРёСЂСѓРµРјРѕРіРѕ РєРѕРЅС‚РµР№РЅРµСЂР°)
    const wrapperDiv = nodeRef.current?.parentElement;
    const transformedContainer = wrapperDiv?.parentElement;
    const canvas = transformedContainer?.parentElement;

    if (canvas && transformedContainer) {
      const canvasRect = canvas.getBoundingClientRect();

      // РџРѕР»СѓС‡Р°РµРј СЌРєСЂР°РЅРЅС‹Рµ РєРѕРѕСЂРґРёРЅР°С‚С‹ РјС‹С€Рё РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅРѕ РєР°РЅРІР°СЃР°
      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;

      // РџСЂРµРѕР±СЂР°Р·СѓРµРј СЌРєСЂР°РЅРЅС‹Рµ РєРѕРѕСЂРґРёРЅР°С‚С‹ РІ РєРѕРѕСЂРґРёРЅР°С‚С‹ РєР°РЅРІР°СЃР° СЃ СѓС‡РµС‚РѕРј Р·СѓРјР° Рё РїР°РЅРѕСЂР°РјРёСЂРѕРІР°РЅРёСЏ
      const zoomFactor = zoom / 100;
      const canvasX = (screenX - pan.x) / zoomFactor - dragOffsetRef.current.x;
      const canvasY = (screenY - pan.y) / zoomFactor - dragOffsetRef.current.y;

      // РџСЂРёРІСЏР·РєР° Рє СЃРµС‚РєРµ (20px grid РІ РєР°РЅРІР°СЃРЅС‹С… РєРѕРѕСЂРґРёРЅР°С‚Р°С…)
      const gridSize = 20;
      const snappedX = Math.round(canvasX / gridSize) * gridSize;
      const snappedY = Math.round(canvasY / gridSize) * gridSize;

      onMove({ x: snappedX, y: snappedY });
    }
  };

  const handleMouseUp = () => {
    // Р›РѕРіРёСЂСѓРµРј РїРµСЂРµРјРµС‰РµРЅРёРµ С‚РѕР»СЊРєРѕ РµСЃР»Рё СѓР·РµР» СЂРµР°Р»СЊРЅРѕ РїРµСЂРµРјРµС‰Р°Р»СЃСЏ
    if (isDragging && onMoveEnd) {
      onMoveEnd();
    }
    setIsDragging(false);
    // РЈРІРµРґРѕРјР»СЏРµРј РіР»РѕР±Р°Р»СЊРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ РѕР± РѕРєРѕРЅС‡Р°РЅРёРё РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёСЏ
    if (setIsNodeBeingDragged) {
      setIsNodeBeingDragged(false);
    }
  };

  // Touch РѕР±СЂР°Р±РѕС‚С‡РёРєРё РґР»СЏ РјРѕР±РёР»СЊРЅРѕРіРѕ РїРµСЂРµРјРµС‰РµРЅРёСЏ СЌР»РµРјРµРЅС‚РѕРІ
  const handleTouchStart = (e: React.TouchEvent) => {
    // РќРµ Р·Р°РїСѓСЃРєР°С‚СЊ СЃРѕР±С‹С‚РёСЏ РµСЃР»Рё РєР»РёРєРЅСѓР»Рё РїРѕ РєРЅРѕРїРєРµ
    if ((e.target as HTMLElement).closest('button')) return;

    // РџСЂРµРґРѕС‚РІСЂР°С‰Р°РµРј СЃС‚Р°РЅРґР°СЂС‚РЅРѕРµ РїРѕРІРµРґРµРЅРёРµ Р±СЂР°СѓР·РµСЂР°
    e.preventDefault();
    e.stopPropagation(); // РћСЃС‚Р°РЅР°РІР»РёРІР°РµРј РІСЃРїР»С‹С‚РёРµ, С‡С‚РѕР±С‹ РЅРµ РєРѕРЅС„Р»РёРєС‚РѕРІР°С‚СЊ СЃ РїР°РЅРѕСЂР°РјРёСЂРѕРІР°РЅРёРµРј С…РѕР»СЃС‚Р°

    const touch = e.touches[0];
    if (!touch) return;

    // Р—Р°РїРёСЃС‹РІР°РµРј РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ РЅР°С‡Р°Р»Рµ РєР°СЃР°РЅРёСЏ
    setTouchStartTime(Date.now());
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setTouchMoved(false);

    // РџРѕРґРіРѕС‚Р°РІР»РёРІР°РµРј РґР»СЏ РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕРіРѕ РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёСЏ С‚РѕР»СЊРєРѕ РµСЃР»Рё onMove РґРѕСЃС‚СѓРїРµРЅ
    if (onMove) {
      // РќР°С…РѕРґРёРј РєР°РЅРІР°СЃ (СЂРѕРґРёС‚РµР»СЊСЃРєРёР№ СЌР»РµРјРµРЅС‚ С‚СЂР°РЅСЃС„РѕСЂРјРёСЂСѓРµРјРѕРіРѕ РєРѕРЅС‚РµР№РЅРµСЂР°)
      const wrapperDiv = nodeRef.current?.parentElement;
      const transformedContainer = wrapperDiv?.parentElement;
      const canvas = transformedContainer?.parentElement;

      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const zoomFactor = zoom / 100;

        // Р Р°СЃСЃС‡РёС‚С‹РІР°РµРј СЃРјРµС‰РµРЅРёРµ РІ РєР°РЅРІР°СЃРЅС‹С… РєРѕРѕСЂРґРёРЅР°С‚Р°С…
        const screenX = touch.clientX - canvasRect.left;
        const screenY = touch.clientY - canvasRect.top;

        const canvasX = (screenX - pan.x) / zoomFactor;
        const canvasY = (screenY - pan.y) / zoomFactor;

        setTouchOffset({
          x: canvasX - node.position.x,
          y: canvasY - node.position.y
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !onMove) return;

    e.preventDefault();
    e.stopPropagation();

    // Р’С‹С‡РёСЃР»СЏРµРј СЂР°СЃСЃС‚РѕСЏРЅРёРµ РѕС‚ РЅР°С‡Р°Р»СЊРЅРѕР№ С‚РѕС‡РєРё РєР°СЃР°РЅРёСЏ
    const deltaX = touch.clientX - touchStartPos.x;
    const deltaY = touch.clientY - touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // РќР°С‡РёРЅР°РµРј РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёРµ С‚РѕР»СЊРєРѕ РµСЃР»Рё РґРІРёР¶РµРЅРёРµ Р±РѕР»СЊС€Рµ 10 РїРёРєСЃРµР»РµР№
    if (distance > 10 && !isTouchDragging) {
      setIsTouchDragging(true);
      setTouchMoved(true);
      onMoveStart?.();
      if (setIsNodeBeingDragged) {
        setIsNodeBeingDragged(true);
      }
    }

    if (!isTouchDragging) return;

    // Р‘С‹СЃС‚СЂР°СЏ РїРµСЂРµСЂРёСЃРѕРІРєР° С‚РѕР»СЊРєРѕ РїРѕР·РёС†РёРё - Р±РµР· РѕР±РЅРѕРІР»РµРЅРёСЏ РґСЂСѓРіРёС… СЃС‚РёР»РµР№
    const wrapperDiv = nodeRef.current?.parentElement;
    const transformedContainer = wrapperDiv?.parentElement;
    const canvas = transformedContainer?.parentElement;

    if (!canvas || !transformedContainer) return;

    const canvasRect = canvas.getBoundingClientRect();
    const screenX = touch.clientX - canvasRect.left;
    const screenY = touch.clientY - canvasRect.top;

    const zoomFactor = zoom / 100;
    const canvasX = (screenX - pan.x) / zoomFactor - touchOffset.x;
    const canvasY = (screenY - pan.y) / zoomFactor - touchOffset.y;

    const gridSize = 20;
    const snappedX = Math.round(canvasX / gridSize) * gridSize;
    const snappedY = Math.round(canvasY / gridSize) * gridSize;

    onMove({ x: snappedX, y: snappedY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    if (touchDuration < 300 && !touchMoved && onClick) {
      onClick();
    }

    if (isTouchDragging && touchMoved && onMoveEnd) {
      onMoveEnd();
    }

    setIsTouchDragging(false);
    setTouchMoved(false);
    if (setIsNodeBeingDragged) {
      setIsNodeBeingDragged(false);
    }
  };

  // Р”РѕР±Р°РІР»СЏРµРј Рё СѓРґР°Р»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРєРё СЃРѕР±С‹С‚РёР№ РґР»СЏ mouse
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
    return () => {};
  }, [isDragging, onMove]);

  // Touch СЃРѕР±С‹С‚РёСЏ СѓР¶Рµ РѕР±СЂР°Р±Р°С‚С‹РІР°СЋС‚СЃСЏ РІ handleTouchMove, РЅРµ РЅСѓР¶РЅРѕ РґРѕР±Р°РІР»СЏС‚СЊ РіР»РѕР±Р°Р»СЊРЅС‹Рµ СЃР»СѓС€Р°С‚РµР»Рё
  useEffect(() => {
    if (isTouchDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none'; // РџСЂРµРґРѕС‚РІСЂР°С‰Р°РµРј РїСЂРѕРєСЂСѓС‚РєСѓ РїСЂРё РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёРё

      return () => {
        document.body.style.userSelect = '';
        document.body.style.touchAction = '';
      };
    }
    return () => {};
  }, [isTouchDragging]);

  /**
   * ResizeObserver РґР»СЏ РёР·РјРµСЂРµРЅРёСЏ border-box СЂР°Р·РјРµСЂРѕРІ wrapper-div СѓР·Р»Р°.
   *
   * РќР°Р±Р»СЋРґР°РµРј Р·Р° wrapper-div (СЂРѕРґРёС‚РµР»СЊ nodeRef), Р° РЅРµ Р·Р° РІРЅСѓС‚СЂРµРЅРЅРёРј div,
   * С‡С‚РѕР±С‹ РїРѕР»СѓС‡РёС‚СЊ РїРѕР»РЅСѓСЋ border-box РІС‹СЃРѕС‚Сѓ РІРєР»СЋС‡Р°СЏ padding Рё border.
   * Р­С‚Рѕ РїРѕР·РІРѕР»СЏРµС‚ РІС‹С‡РёСЃР»СЏС‚СЊ С†РµРЅС‚СЂ OutputPort РєР°Рє node.position.y + height / 2
   * Р±РµР· РєР°РєРёС…-Р»РёР±Рѕ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹С… СЃРјРµС‰РµРЅРёР№.
   */
  useEffect(() => {
    if (!onSizeChange || !nodeRef.current) return;

    // wrapper-div вЂ” СЂРѕРґРёС‚РµР»СЊ РІРЅСѓС‚СЂРµРЅРЅРµРіРѕ div (nodeRef)
    const wrapperEl = nodeRef.current.parentElement;
    if (!wrapperEl) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        let width: number;
        let height: number;
        // РСЃРїРѕР»СЊР·СѓРµРј borderBoxSize РµСЃР»Рё РґРѕСЃС‚СѓРїРµРЅ (СЃРѕРІСЂРµРјРµРЅРЅС‹Рµ Р±СЂР°СѓР·РµСЂС‹)
        if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
          width = entry.borderBoxSize[0].inlineSize;
          height = entry.borderBoxSize[0].blockSize;
        } else {
          // Р¤РѕР»Р±СЌРє С‡РµСЂРµР· getBoundingClientRect РґР»СЏ СЃС‚Р°СЂС‹С… Р±СЂР°СѓР·РµСЂРѕРІ
          const rect = (entry.target as HTMLElement).getBoundingClientRect();
          width = rect.width;
          height = rect.height;
        }
        onSizeChange(node.id, { width, height });
      }
    });

    resizeObserver.observe(wrapperEl);

    return () => {
      resizeObserver.disconnect();
    };
  }, [node.id, onSizeChange]);

  const isDragActive = isDragging || isTouchDragging;

  return (
    /**
     * Р’РЅРµС€РЅРёР№ wrapper-div: С‚РѕР»СЊРєРѕ РїРѕР·РёС†РёРѕРЅРёСЂРѕРІР°РЅРёРµ.
     * РќРµ СЃРѕРґРµСЂР¶РёС‚ overflow, backdrop-filter РёР»Рё transform СЃ perspective вЂ”
     * СЌС‚Рѕ РїСЂРµРґРѕС‚РІСЂР°С‰Р°РµС‚ СЃРѕР·РґР°РЅРёРµ РЅРѕРІРѕРіРѕ stacking context, РєРѕС‚РѕСЂС‹Р№ РѕР±СЂРµР·Р°Р» Р±С‹
     * Р°Р±СЃРѕР»СЋС‚РЅРѕ РїРѕР·РёС†РёРѕРЅРёСЂРѕРІР°РЅРЅС‹Рµ РґРѕС‡РµСЂРЅРёРµ СЌР»РµРјРµРЅС‚С‹ СЃ РѕС‚СЂРёС†Р°С‚РµР»СЊРЅС‹РјРё РѕС‚СЃС‚СѓРїР°РјРё
     * (РєРЅРѕРїРєРё NodeActions Рё РєСЂСѓР¶РѕРє OutputPort).
     */
    <div
      className="group"
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        zIndex: isDragActive ? 1000 : isSelected ? 100 : 10,
        overflow: 'visible',
      }}
    >
      {/* РљРЅРѕРїРєРё РґРµР№СЃС‚РІРёР№ вЂ” СЃРЅР°СЂСѓР¶Рё РѕСЃРЅРѕРІРЅРѕРіРѕ div, РїРѕР·РёС†РёРѕРЅРёСЂСѓСЋС‚СЃСЏ РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅРѕ wrapper */}
      <NodeActions onDuplicate={onDuplicateAtPosition ?? onDuplicate} onDelete={onDelete} isSelected={isSelected} />

      {/* РџРѕСЂС‚ РІС‹С…РѕРґР° вЂ” СЃРЅР°СЂСѓР¶Рё РѕСЃРЅРѕРІРЅРѕРіРѕ div, РїРѕР·РёС†РёРѕРЅРёСЂСѓРµС‚СЃСЏ РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅРѕ wrapper */}
      {/* РЈР·РµР» condition РёРјРµРµС‚ РїРѕСЂС‚С‹ РЅР° РєР°Р¶РґРѕР№ РІРµС‚РєРµ вЂ” РѕР±С‰РёР№ РїРѕСЂС‚ РЅРµ РЅСѓР¶РµРЅ */}
      {(node.type === 'command_trigger' || node.type === 'text_trigger') ? (
        <OutputPort portType="trigger-next" onPortMouseDown={handlePortMouseDown} isActive={isConnectionSource} />
      ) : node.type !== 'condition' && node.type !== 'keyboard' ? (
        <OutputPort portType="auto-transition" onPortMouseDown={handlePortMouseDown} isActive={isConnectionSource} />
      ) : null}

      {/* РћСЃРЅРѕРІРЅРѕР№ div СѓР·Р»Р° вЂ” С‚РѕР»СЊРєРѕ РІРёР·СѓР°Р»СЊРЅРѕРµ СЃРѕРґРµСЂР¶РёРјРѕРµ */}
      <div
        ref={nodeRef}
        data-canvas-node="true"
        className={cn(
          "bg-white/90 dark:bg-slate-900/90 rounded-2xl border-2 relative select-none",
          // РљРѕРјРїР°РєС‚РЅС‹Р№ СЂР°Р·РјРµСЂ РґР»СЏ С‚СЂРёРіРіРµСЂРѕРІ
          node.type === 'command_trigger' || node.type === 'text_trigger'
            ? "p-3 w-52"
            : node.type === 'condition'
            ? "p-4 w-64"
            : node.type === 'message'
            ? "p-4 pb-16 w-80"
            : node.type === 'keyboard'
            ? "p-4 w-80"
            : node.type === 'input'
            ? "p-6 pb-16 w-80"
            : "p-6 pb-10 w-80",
          isDragActive ? "shadow-lg cursor-grabbing z-50 border-blue-500" : "shadow-xl hover:shadow-2xl border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200",
          isSelected && !isDragActive ? "ring-4 ring-blue-500/20 shadow-2xl shadow-blue-500/10 border-blue-500" : "",
          isConnectionTarget ? "ring-4 ring-green-400/60 border-green-400 shadow-green-400/20" : "",
          isConnectedToDragging && !isDragActive ? "ring-2 ring-violet-400/60 border-violet-400 shadow-violet-500/30 shadow-xl scale-[1.02]" : "",
          onMove ? "cursor-grab" : "cursor-pointer"
        )}
        onClick={!isDragging ? onClick : undefined}
        onMouseDown={handleMouseDown}
        onContextMenu={openContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          overflow: 'visible',
          transform: isDragActive ? 'translate3d(0, 0, 0)' : undefined,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden' as any,
        }}
      >
        {/* Р—Р°РіРѕР»РѕРІРѕРє СѓР·Р»Р° вЂ” СЃРєСЂС‹С‚ РґР»СЏ С‚СЂРёРіРіРµСЂРѕРІ, СѓР·Р»Р° СЃРѕРѕР±С‰РµРЅРёСЏ Рё СѓР·Р»Р° СѓСЃР»РѕРІРёСЏ */}
        {node.type !== 'command_trigger' && node.type !== 'text_trigger' && node.type !== 'message' && node.type !== 'condition' && node.type !== 'keyboard' && node.type !== 'input' && (
          <NodeHeader node={node} onMove={!!onMove} />
        )}

        {/* Image attachment (СЃС‚Р°СЂС‹Р№ С„РѕСЂРјР°С‚ - РѕРґРёРЅРѕС‡РЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ) */}
        <ImageAttachment node={node} />

        {/* Media attachments (РЅРѕРІС‹Р№ С„РѕСЂРјР°С‚ - РЅРµСЃРєРѕР»СЊРєРѕ С„Р°Р№Р»РѕРІ) */}
        <MediaAttachmentsPreview node={node} />

        {/* Message preview */}
        <MessagePreview node={node} />

        {/* Media attachment indicator for non-image files */}
        {node.type === 'message' && !node.data.imageUrl && !node.data.attachedMedia?.length && (node.data.videoUrl || node.data.audioUrl || node.data.documentUrl) && (
          <MediaAttachmentIndicator node={node} />
        )}

        {/* Sticker preview */}
        {node.type === 'sticker' && <StickerPreview node={node} />}

        {/* Voice message preview */}
        {node.type === 'voice' && <VoicePreview node={node} />}

        {/* Media node preview */}
        {node.type === 'media' && <MediaNodePreview attachedMedia={node.data.attachedMedia || []} />}

        {/* Location preview */}
        {node.type === 'location' && <LocationPreview node={node} />}

        {/* Contact preview */}
        {node.type === 'contact' && <ContactPreview node={node} />}

        {/* Admin Rights preview */}
        {node.type === 'admin_rights' && <AdminRightsPreview />}

        {/* Client Auth Card */}
        {node.type === 'client_auth' && <ClientAuthCard node={node} />}

        {/* Command Trigger Preview */}
        {node.type === 'command_trigger' && <CommandTriggerPreview node={node} />}

        {/* Text Trigger Preview */}
        {node.type === 'text_trigger' && <TextTriggerPreview node={node} />}

        {/* Condition Node Preview */}
        {node.type === 'condition' && (
          <ConditionNodePreview
            node={node}
            onPortMouseDown={handlePortMouseDown}
            isConnectionSource={isConnectionSource}
            onButtonPortMount={onButtonPortMount}
          />
        )}

        {/* Poll preview */}
        {(node.type as any) === 'poll' && <PollPreview node={node} />}

        {/* Dice preview */}
        {(node.type as any) === 'dice' && <DicePreview node={node} />}

        {/* Text Input Indicator вЂ” РїРѕРєР°Р·С‹РІР°РµРј РµСЃР»Рё РІРєР»СЋС‡С‘РЅ С‚РµРєСЃС‚РѕРІС‹Р№ РІРІРѕРґ, РЅРµР·Р°РІРёСЃРёРјРѕ РѕС‚ РєР»Р°РІРёР°С‚СѓСЂС‹ */}
        {(node.data as any).enableTextInput && (
          <TextInputIndicator node={node} />
        )}

        {/* Save Answer Indicator вЂ” РѕС‚РґРµР»СЊРЅС‹Р№ preview РґР»СЏ РЅРѕРІРѕР№ input-РЅРѕРґС‹ */}
        {/**
         * РРЅРґРёРєР°С‚РѕСЂ СЃРІСЏР·Р°РЅРЅРѕРіРѕ СѓР·Р»Р° СЃРѕС…СЂР°РЅРµРЅРёСЏ РѕС‚РІРµС‚Р° РґР»СЏ СЃРѕРѕР±С‰РµРЅРёСЏ.
         * РќСѓР¶РµРЅ С‚РѕР»СЊРєРѕ РєР°Рє РєРѕРјРїР°РєС‚РЅР°СЏ РїРѕРґСЃРєР°Р·РєР°, РёСЃС‚РѕС‡РЅРёРє РёСЃС‚РёРЅС‹ РѕСЃС‚Р°С‘С‚СЃСЏ РІ `input`.
         */}
        {node.type === 'message' && (
          <MessageLinkedInputIndicator node={node} allNodes={allNodes} />
        )}

        {node.type === 'input' && (
          <SaveAnswerIndicator node={node} />
        )}

        {/* Buttons preview */}
        {node.type !== 'input' && (
          <ButtonsPreview node={node} allNodes={allNodes} onPortMouseDown={handlePortMouseDown} isConnectionSource={isConnectionSource} onButtonPortMount={onButtonPortMount} />
        )}

        {/* Р¤СѓС‚РµСЂ СЃ РїРѕР»РЅС‹Рј ID СѓР·Р»Р° вЂ” СЃРєСЂС‹С‚ РґР»СЏ С‚СЂРёРіРіРµСЂРѕРІ, condition Рё keyboard */}
        {node.type !== 'command_trigger' && node.type !== 'text_trigger' && node.type !== 'condition' && node.type !== 'keyboard' && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 rounded-b-2xl bg-slate-700/60 dark:bg-slate-800/90 border-t border-slate-600/40 dark:border-slate-600/60">
            <span
              className="font-mono text-[10px] text-slate-300 dark:text-slate-300 select-all tracking-tight"
              title="ID узла"
            >
              #{node.id}
            </span>
          </div>
        )}

        {/* РљРѕРЅС‚РµРєСЃС‚РЅРѕРµ РјРµРЅСЋ РїРѕ РїСЂР°РІРѕРјСѓ РєР»РёРєСѓ */}
        {menu.visible && (
          <NodeContextMenu
            position={menu.position}
            onClose={closeContextMenu}
            items={[
              {
                id: 'duplicate',
                label: 'Дублировать',
                icon: 'fas fa-copy',
                onClick: () => {
                  /**
                   * РСЃРїРѕР»СЊР·СѓРµРј onDuplicateAtPosition РµСЃР»Рё РѕРЅ РїРµСЂРµРґР°РЅ вЂ” РїРѕР·РёС†РёСЏ
                   * РІС‹С‡РёСЃР»СЏРµС‚СЃСЏ РІ canvas.tsx С‡РµСЂРµР· getPastePosition(), С‚Сѓ Р¶Рµ С„СѓРЅРєС†РёСЋ
                   * С‡С‚Рѕ РёСЃРїРѕР»СЊР·СѓРµС‚ Ctrl+V. Р­С‚Рѕ РіР°СЂР°РЅС‚РёСЂСѓРµС‚ РёРґРµРЅС‚РёС‡РЅРѕРµ РїРѕРІРµРґРµРЅРёРµ.
                   * Fallback РЅР° onDuplicate Р±РµР· РїРѕР·РёС†РёРё (РґСѓР±Р»СЊ РїРѕСЏРІРёС‚СЃСЏ РЅР° РјРµСЃС‚Рµ РѕСЂРёРіРёРЅР°Р»Р°).
                   */
                  if (onDuplicateAtPosition) {
                    onDuplicateAtPosition();
                  } else {
                    onDuplicate?.();
                  }
                }
              }
            ]}
          />
        )}
      </div>
    </div>
  );
}

