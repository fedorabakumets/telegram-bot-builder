<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `update_node`

Обновить ноду в project.json по id. Без sheet_id ищет ноду по всем листам; если не найдена — ошибка (не silent ok)

Раздел: scenario. Транспорт: http, stdio.

## Параметры

```json
{
  "type": "object",
  "properties": {
    "project_json": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "object",
          "additionalProperties": {}
        }
      ]
    },
    "node_id": {
      "type": "string"
    },
    "patch": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "start",
            "message",
            "command",
            "command_trigger",
            "text_trigger",
            "incoming_message_trigger",
            "incoming_callback_trigger",
            "outgoing_message_trigger",
            "group_message_trigger",
            "member_trigger",
            "callback_trigger",
            "managed_bot_updated_trigger",
            "schedule_trigger",
            "api_trigger",
            "sticker",
            "voice",
            "animation",
            "location",
            "contact",
            "pin_message",
            "unpin_message",
            "delete_message",
            "forward_message",
            "ban_user",
            "unban_user",
            "mute_user",
            "unmute_user",
            "kick_user",
            "promote_user",
            "demote_user",
            "admin_rights",
            "photo",
            "video",
            "audio",
            "document",
            "keyboard",
            "input",
            "condition",
            "broadcast",
            "client_auth",
            "media",
            "create_forum_topic",
            "http_request",
            "get_managed_bot_token",
            "answer_callback_query",
            "edit_message",
            "set_variable",
            "psql_query",
            "convert_file",
            "loop",
            "bot_table",
            "delay",
            "api_response",
            "userbot_message",
            "userbot_click_button",
            "userbot_inline_query",
            "userbot_edit_trigger",
            "parallel_split",
            "stop_processing",
            "rate_counter",
            "code",
            "comment",
            "send_invoice",
            "create_invoice_link",
            "refund_stars",
            "edit_star_subscription",
            "get_star_balance",
            "successful_payment_trigger"
          ]
        },
        "position": {
          "type": "object",
          "properties": {
            "x": {
              "type": "number"
            },
            "y": {
              "type": "number"
            }
          },
          "required": [
            "x",
            "y"
          ],
          "additionalProperties": false
        },
        "data": {
          "type": "object",
          "properties": {
            "userbotEntity": {
              "type": "string"
            },
            "userbotEntitySource": {
              "type": "string"
            },
            "userbotEntityVariable": {
              "type": "string"
            },
            "userbotRecipients": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "messageId": {
              "type": "string"
            },
            "clickMode": {
              "type": "string",
              "enum": [
                "text",
                "data",
                "index"
              ]
            },
            "clickDelivery": {
              "type": "string",
              "enum": [
                "fire_and_forget",
                "await"
              ]
            },
            "clickValue": {
              "type": "string"
            },
            "responseStrategy": {
              "type": "string",
              "enum": [
                "first",
                "longest",
                "regex_match",
                "last",
                "edit",
                "new_message"
              ]
            },
            "responseWaitSeconds": {
              "type": "number"
            },
            "responseFilterRegex": {
              "type": "string"
            },
            "responseFloorMessageIdVar": {
              "type": "string"
            },
            "saveAlertTo": {
              "type": "string"
            },
            "saveButtonsTo": {
              "type": "string"
            },
            "saveHasMediaTo": {
              "type": "string"
            },
            "saveMediaTo": {
              "type": "string"
            },
            "saveResponseIdTo": {
              "type": "string"
            },
            "saveResponseTextTo": {
              "type": "string"
            },
            "botUsername": {
              "type": "string"
            },
            "targetChat": {
              "type": "string"
            },
            "sendToSameChat": {
              "type": "boolean"
            },
            "resultIndex": {
              "type": "string"
            },
            "saveResultTitleTo": {
              "type": "string"
            },
            "saveResultDescTo": {
              "type": "string"
            },
            "filterType": {
              "type": "string",
              "enum": [
                "any",
                "contains",
                "regex"
              ]
            },
            "filterValue": {
              "type": "string"
            },
            "saveTextTo": {
              "type": "string"
            },
            "saveChatIdTo": {
              "type": "string"
            },
            "saveSenderIdTo": {
              "type": "string"
            },
            "command": {
              "type": "string"
            },
            "deepLinkParam": {
              "type": "string"
            },
            "deepLinkMatchMode": {
              "type": "string",
              "enum": [
                "exact",
                "startsWith"
              ]
            },
            "deepLinkSaveToVar": {
              "type": "boolean"
            },
            "deepLinkVarName": {
              "type": "string"
            },
            "commentColor": {
              "type": "string",
              "enum": [
                "yellow",
                "blue",
                "green",
                "pink",
                "gray"
              ]
            },
            "rules": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "mode": {
                    "type": "string",
                    "enum": [
                      "interval",
                      "weekday",
                      "monthday",
                      "cron"
                    ]
                  },
                  "intervalMinutes": {
                    "type": "number"
                  },
                  "days": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "hour": {
                    "type": "number"
                  },
                  "minute": {
                    "type": "number"
                  },
                  "monthDays": {
                    "type": "array",
                    "items": {
                      "type": "number"
                    }
                  },
                  "cronExpression": {
                    "type": "string"
                  }
                },
                "required": [
                  "mode"
                ],
                "additionalProperties": true
              }
            },
            "timezone": {
              "type": "string"
            },
            "runOnStart": {
              "type": "boolean"
            },
            "enabled": {
              "type": "boolean"
            },
            "description": {
              "type": "string"
            },
            "messageText": {
              "type": "string"
            },
            "imageUrl": {
              "type": "string"
            },
            "videoUrl": {
              "type": "string"
            },
            "audioUrl": {
              "type": "string"
            },
            "documentUrl": {
              "type": "string"
            },
            "documentName": {
              "type": "string"
            },
            "mediaCaption": {
              "type": "string"
            },
            "keyboardType": {
              "type": "string",
              "enum": [
                "reply",
                "inline",
                "none"
              ],
              "default": "none"
            },
            "keyboardNodeId": {
              "type": "string"
            },
            "seconds": {
              "type": "string"
            },
            "unit": {
              "type": "string",
              "enum": [
                "seconds",
                "minutes",
                "hours",
                "days",
                "weeks"
              ]
            },
            "mode": {
              "type": "string",
              "enum": [
                "blocking",
                "background"
              ]
            },
            "buttons": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "text": {
                    "type": "string"
                  },
                  "action": {
                    "type": "string",
                    "enum": [
                      "goto",
                      "command",
                      "url",
                      "contact",
                      "location",
                      "selection",
                      "complete",
                      "default",
                      "copy_text",
                      "web_app",
                      "request_managed_bot",
                      "pay"
                    ],
                    "default": "goto"
                  },
                  "copyText": {
                    "type": "string"
                  },
                  "webAppUrl": {
                    "type": "string"
                  },
                  "target": {
                    "type": "string"
                  },
                  "url": {
                    "type": "string"
                  },
                  "requestContact": {
                    "type": "boolean"
                  },
                  "requestLocation": {
                    "type": "boolean"
                  },
                  "buttonType": {
                    "type": "string",
                    "enum": [
                      "normal",
                      "option",
                      "complete"
                    ],
                    "default": "normal"
                  },
                  "skipDataCollection": {
                    "type": "boolean",
                    "default": false
                  },
                  "hideAfterClick": {
                    "type": "boolean",
                    "default": false
                  },
                  "customCallbackData": {
                    "type": "string"
                  },
                  "style": {
                    "type": "string",
                    "enum": [
                      "primary",
                      "success",
                      "danger"
                    ]
                  },
                  "suggestedBotName": {
                    "type": "string"
                  },
                  "suggestedBotUsername": {
                    "type": "string"
                  },
                  "selectionGroup": {
                    "type": "string"
                  }
                },
                "required": [
                  "id",
                  "text"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "shuffleButtons": {
              "type": "boolean",
              "default": false
            },
            "enableDynamicButtons": {
              "type": "boolean",
              "default": false
            },
            "dynamicButtons": {
              "type": "object",
              "properties": {
                "sourceVariable": {
                  "type": "string",
                  "default": ""
                },
                "arrayPath": {
                  "type": "string",
                  "default": ""
                },
                "textTemplate": {
                  "type": "string",
                  "default": ""
                },
                "callbackTemplate": {
                  "type": "string",
                  "default": ""
                },
                "styleMode": {
                  "type": "string",
                  "enum": [
                    "field",
                    "template",
                    "none"
                  ],
                  "default": "none"
                },
                "styleField": {
                  "type": "string",
                  "default": ""
                },
                "styleTemplate": {
                  "type": "string",
                  "default": ""
                },
                "columns": {
                  "type": "number",
                  "minimum": 1,
                  "maximum": 6,
                  "default": 2
                }
              },
              "additionalProperties": true
            },
            "keyboardLayout": {
              "type": "object",
              "properties": {
                "rows": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "buttonIds": {
                        "type": "array",
                        "items": {
                          "type": "string"
                        }
                      }
                    },
                    "required": [
                      "buttonIds"
                    ],
                    "additionalProperties": false
                  },
                  "default": []
                },
                "columns": {
                  "type": "number",
                  "minimum": 1,
                  "maximum": 6,
                  "default": 2
                },
                "autoLayout": {
                  "type": "boolean",
                  "default": true
                }
              },
              "additionalProperties": false
            },
            "oneTimeKeyboard": {
              "type": "boolean",
              "default": false
            },
            "resizeKeyboard": {
              "type": "boolean",
              "default": true
            },
            "markdown": {
              "type": "boolean",
              "default": false
            },
            "formatMode": {
              "type": "string",
              "enum": [
                "html",
                "markdown",
                "none"
              ],
              "default": "none"
            },
            "disableLinkPreview": {
              "type": "boolean",
              "default": false
            },
            "synonyms": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "default": []
            },
            "matchMode": {
              "type": "string",
              "enum": [
                "exact",
                "contains",
                "fuzzy"
              ],
              "default": "exact"
            },
            "adminOnly": {
              "type": "boolean",
              "default": false
            },
            "requiresAuth": {
              "type": "boolean",
              "default": false
            },
            "showInMenu": {
              "type": "boolean",
              "default": true
            },
            "saveCommandArgsTo": {
              "type": "string",
              "default": ""
            },
            "commandTimeout": {
              "type": "number"
            },
            "cooldownTime": {
              "type": "number"
            },
            "maxUsagesPerDay": {
              "type": "number"
            },
            "customParameters": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "default": []
            },
            "targetMessageId": {
              "type": "string"
            },
            "sourceMessageId": {
              "type": "string"
            },
            "messageIdSource": {
              "type": "string",
              "enum": [
                "manual",
                "variable",
                "last_message",
                "current_message",
                "last_bot_message",
                "reply_message",
                "range_from_reply",
                "last_n",
                "custom",
                "last"
              ],
              "default": "last_message"
            },
            "messageIdManual": {
              "type": "string"
            },
            "lastNCount": {
              "type": "string"
            },
            "chatIdSource": {
              "type": "string",
              "enum": [
                "current_chat",
                "custom"
              ],
              "default": "current_chat"
            },
            "chatIdManual": {
              "type": "string"
            },
            "ignoreErrors": {
              "type": "boolean"
            },
            "bulkDelete": {
              "type": "boolean",
              "default": false
            },
            "bulkMessageIdsVariable": {
              "type": "string"
            },
            "sourceMessageIdSource": {
              "type": "string",
              "enum": [
                "current_message",
                "last_message",
                "manual",
                "variable"
              ],
              "default": "current_message"
            },
            "sourceMessageNodeId": {
              "type": "string"
            },
            "sourceMessageVariableName": {
              "type": "string"
            },
            "variableName": {
              "type": "string"
            },
            "disableNotification": {
              "type": "boolean",
              "default": false
            },
            "hideAuthor": {
              "type": "boolean",
              "default": false
            },
            "targetChatId": {
              "type": "string"
            },
            "targetChatIdSource": {
              "type": "string",
              "enum": [
                "manual",
                "variable",
                "admin_ids"
              ],
              "default": "manual"
            },
            "targetChatVariableName": {
              "type": "string"
            },
            "targetChatTargets": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "targetChatIdSource": {
                    "type": "string",
                    "enum": [
                      "manual",
                      "variable",
                      "admin_ids"
                    ],
                    "default": "manual"
                  },
                  "targetChatId": {
                    "type": "string"
                  },
                  "targetChatVariableName": {
                    "type": "string"
                  },
                  "targetChatType": {
                    "type": "string",
                    "enum": [
                      "user",
                      "group"
                    ]
                  },
                  "targetThreadId": {
                    "type": "string"
                  }
                },
                "required": [
                  "id"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "targetThreadId": {
              "type": "string"
            },
            "targetThreadIdSource": {
              "type": "string",
              "enum": [
                "manual",
                "variable"
              ]
            },
            "targetThreadIdVariable": {
              "type": "string"
            },
            "targetUserId": {
              "type": "string"
            },
            "userIdSource": {
              "type": "string",
              "enum": [
                "manual",
                "variable",
                "last_message",
                "current_user",
                "reply_user",
                "custom"
              ],
              "default": "last_message"
            },
            "userIdManual": {
              "type": "string"
            },
            "userVariableName": {
              "type": "string"
            },
            "targetGroupId": {
              "type": "string"
            },
            "stickerUrl": {
              "type": "string"
            },
            "stickerFileId": {
              "type": "string"
            },
            "voiceUrl": {
              "type": "string"
            },
            "animationUrl": {
              "type": "string"
            },
            "latitude": {
              "type": "number"
            },
            "longitude": {
              "type": "number"
            },
            "title": {
              "type": "string"
            },
            "address": {
              "type": "string"
            },
            "foursquareId": {
              "type": "string"
            },
            "foursquareType": {
              "type": "string"
            },
            "mapService": {
              "type": "string",
              "enum": [
                "yandex",
                "google",
                "2gis",
                "custom"
              ],
              "default": "custom"
            },
            "yandexMapUrl": {
              "type": "string"
            },
            "googleMapUrl": {
              "type": "string"
            },
            "gisMapUrl": {
              "type": "string"
            },
            "mapZoom": {
              "type": "number",
              "minimum": 1,
              "maximum": 20,
              "default": 15
            },
            "showDirections": {
              "type": "boolean",
              "default": false
            },
            "generateMapPreview": {
              "type": "boolean",
              "default": true
            },
            "phoneNumber": {
              "type": "string"
            },
            "firstName": {
              "type": "string"
            },
            "lastName": {
              "type": "string"
            },
            "userId": {
              "type": "number"
            },
            "vcard": {
              "type": "string"
            },
            "question": {
              "type": "string"
            },
            "options": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "default": []
            },
            "allowsMultipleAnswers": {
              "type": "boolean",
              "default": false
            },
            "anonymousVoting": {
              "type": "boolean",
              "default": true
            },
            "emoji": {
              "type": "string"
            },
            "mediaDuration": {
              "type": "number"
            },
            "width": {
              "type": "number"
            },
            "height": {
              "type": "number"
            },
            "performer": {
              "type": "string"
            },
            "fileSize": {
              "type": "number"
            },
            "filename": {
              "type": "string"
            },
            "inputType": {
              "type": "string",
              "enum": [
                "text",
                "number",
                "email",
                "phone",
                "photo",
                "video",
                "audio",
                "document",
                "location",
                "contact",
                "any"
              ],
              "default": "text"
            },
            "responseType": {
              "type": "string",
              "enum": [
                "text",
                "buttons"
              ],
              "default": "text"
            },
            "responseOptions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "text": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  },
                  "action": {
                    "type": "string",
                    "enum": [
                      "goto",
                      "command",
                      "url"
                    ],
                    "default": "goto"
                  },
                  "target": {
                    "type": "string"
                  },
                  "url": {
                    "type": "string"
                  }
                },
                "required": [
                  "id",
                  "text"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "allowMultipleSelection": {
              "type": "boolean",
              "default": false
            },
            "multiSelectVariable": {
              "type": "string"
            },
            "continueButtonText": {
              "type": "string"
            },
            "continueButtonTarget": {
              "type": "string"
            },
            "inputVariable": {
              "type": "string"
            },
            "inputPrompt": {
              "type": "string"
            },
            "inputValidation": {
              "type": "string"
            },
            "inputRequired": {
              "type": "boolean",
              "default": true
            },
            "inputTimeout": {
              "type": "number"
            },
            "inputTimeoutMessage": {
              "type": "string"
            },
            "inputRetryMessage": {
              "type": "string"
            },
            "inputSuccessMessage": {
              "type": "string"
            },
            "enableConditionalMessages": {
              "type": "boolean",
              "default": false
            },
            "conditionalMessages": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "condition": {
                    "type": "string",
                    "enum": [
                      "user_data_exists",
                      "user_data_equals",
                      "user_data_not_exists",
                      "user_data_contains",
                      "first_time",
                      "returning_user"
                    ],
                    "default": "user_data_exists"
                  },
                  "variableName": {
                    "type": "string"
                  },
                  "variableNames": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "default": []
                  },
                  "logicOperator": {
                    "type": "string",
                    "enum": [
                      "AND",
                      "OR"
                    ],
                    "default": "AND"
                  },
                  "expectedValue": {
                    "type": "string"
                  },
                  "messageText": {
                    "type": "string"
                  },
                  "formatMode": {
                    "type": "string",
                    "enum": [
                      "text",
                      "markdown",
                      "html"
                    ],
                    "default": "text"
                  },
                  "keyboardType": {
                    "type": "string",
                    "enum": [
                      "reply",
                      "inline",
                      "none"
                    ],
                    "default": "none"
                  },
                  "buttons": {
                    "type": "array",
                    "items": {
                      "$ref": "#/properties/patch/properties/data/properties/buttons/items"
                    },
                    "default": []
                  },
                  "resizeKeyboard": {
                    "type": "boolean",
                    "default": true
                  },
                  "oneTimeKeyboard": {
                    "type": "boolean",
                    "default": false
                  },
                  "collectUserInput": {
                    "type": "boolean",
                    "default": false
                  },
                  "enableTextInput": {
                    "type": "boolean",
                    "default": false
                  },
                  "enablePhotoInput": {
                    "type": "boolean",
                    "default": false
                  },
                  "enableVideoInput": {
                    "type": "boolean",
                    "default": false
                  },
                  "enableAudioInput": {
                    "type": "boolean",
                    "default": false
                  },
                  "enableDocumentInput": {
                    "type": "boolean",
                    "default": false
                  },
                  "inputVariable": {
                    "type": "string"
                  },
                  "photoInputVariable": {
                    "type": "string"
                  },
                  "videoInputVariable": {
                    "type": "string"
                  },
                  "audioInputVariable": {
                    "type": "string"
                  },
                  "documentInputVariable": {
                    "type": "string"
                  },
                  "waitForTextInput": {
                    "type": "boolean",
                    "default": false
                  },
                  "textInputVariable": {
                    "type": "string"
                  },
                  "nextNodeAfterInput": {
                    "type": "string"
                  },
                  "priority": {
                    "type": "number",
                    "default": 0
                  }
                },
                "required": [
                  "id",
                  "messageText"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "fallbackMessage": {
              "type": "string"
            },
            "saveToDatabase": {
              "type": "boolean",
              "default": false
            },
            "allowSkip": {
              "type": "boolean",
              "default": false
            },
            "collectUserInput": {
              "type": "boolean",
              "default": false
            },
            "inputTargetNodeId": {
              "type": "string"
            },
            "inputButtonType": {
              "type": "string",
              "enum": [
                "inline",
                "reply"
              ],
              "default": "inline"
            },
            "enableAutoTransition": {
              "type": "boolean",
              "default": false
            },
            "autoTransitionTo": {
              "type": "string"
            },
            "sourceNodeId": {
              "type": "string"
            },
            "minLength": {
              "type": "number"
            },
            "maxLength": {
              "type": "number"
            },
            "placeholder": {
              "type": "string"
            },
            "defaultValue": {
              "type": "string"
            },
            "appendVariable": {
              "type": "boolean",
              "default": false
            },
            "saveMediaMetadata": {
              "type": "boolean",
              "default": false
            },
            "mediaMetadataSuffixes": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "default": []
            },
            "mediaMetadataCustomNames": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              },
              "default": {}
            },
            "variableFilters": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              },
              "default": {}
            },
            "enableUserActions": {
              "type": "boolean",
              "default": false
            },
            "actionTrigger": {
              "type": "string",
              "enum": [
                "join",
                "leave",
                "message",
                "button_click",
                "custom"
              ]
            },
            "triggerText": {
              "type": "string"
            },
            "userActionType": {
              "type": "string",
              "enum": [
                "message",
                "command",
                "button",
                "media"
              ]
            },
            "actionTag": {
              "type": "string"
            },
            "actionMessage": {
              "type": "string"
            },
            "silentAction": {
              "type": "boolean",
              "default": false
            },
            "mimeType": {
              "type": "string"
            },
            "stickerSetName": {
              "type": "string"
            },
            "fileName": {
              "type": "string"
            },
            "city": {
              "type": "string"
            },
            "country": {
              "type": "string"
            },
            "enableTextInput": {
              "type": "boolean"
            },
            "enablePhotoInput": {
              "type": "boolean"
            },
            "enableVideoInput": {
              "type": "boolean"
            },
            "enableAudioInput": {
              "type": "boolean"
            },
            "enableDocumentInput": {
              "type": "boolean"
            },
            "photoInputVariable": {
              "type": "string"
            },
            "videoInputVariable": {
              "type": "string"
            },
            "audioInputVariable": {
              "type": "string"
            },
            "documentInputVariable": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "label": {
              "type": "string"
            },
            "checkmarkSymbol": {
              "type": "string"
            },
            "multiSelectCheckmark": {
              "type": "string"
            },
            "radioSelectedSymbol": {
              "type": "string"
            },
            "radioUnselectedSymbol": {
              "type": "string"
            },
            "duration": {
              "type": "number"
            },
            "muteDuration": {
              "type": "number"
            },
            "reason": {
              "type": "string"
            },
            "canChangeInfo": {
              "type": "boolean",
              "default": false
            },
            "canDeleteMessages": {
              "type": "boolean",
              "default": false
            },
            "canBanUsers": {
              "type": "boolean",
              "default": false
            },
            "canInviteUsers": {
              "type": "boolean",
              "default": false
            },
            "canPinMessages": {
              "type": "boolean",
              "default": false
            },
            "canAddAdmins": {
              "type": "boolean",
              "default": false
            },
            "canRestrictMembers": {
              "type": "boolean",
              "default": false
            },
            "canPromoteMembers": {
              "type": "boolean",
              "default": false
            },
            "canManageVideoChats": {
              "type": "boolean",
              "default": false
            },
            "canManageTopics": {
              "type": "boolean",
              "default": false
            },
            "isAnonymous": {
              "type": "boolean",
              "default": false
            },
            "canManageChat": {
              "type": "boolean"
            },
            "canPostMessages": {
              "type": "boolean"
            },
            "canEditMessages": {
              "type": "boolean"
            },
            "canManageDirectMessages": {
              "type": "boolean"
            },
            "canManageTags": {
              "type": "boolean"
            },
            "canSendWelcomeMessages": {
              "type": "boolean"
            },
            "canSendMessages": {
              "type": "boolean",
              "default": true
            },
            "canSendAudios": {
              "type": "boolean"
            },
            "canSendDocuments": {
              "type": "boolean"
            },
            "canSendPhotos": {
              "type": "boolean"
            },
            "canSendVideos": {
              "type": "boolean"
            },
            "canSendVideoNotes": {
              "type": "boolean"
            },
            "canSendVoiceNotes": {
              "type": "boolean"
            },
            "canReactToMessages": {
              "type": "boolean"
            },
            "canSendPolls": {
              "type": "boolean",
              "default": true
            },
            "canSendOtherMessages": {
              "type": "boolean",
              "default": true
            },
            "canAddWebPagePreviews": {
              "type": "boolean",
              "default": true
            },
            "canChangeGroupInfo": {
              "type": "boolean",
              "default": true
            },
            "canInviteUsers2": {
              "type": "boolean",
              "default": true
            },
            "canPinMessages2": {
              "type": "boolean",
              "default": true
            },
            "untilDate": {
              "type": "number"
            },
            "adminTargetUserId": {
              "type": "string"
            },
            "adminUserIdSource": {
              "type": "string",
              "enum": [
                "manual",
                "variable",
                "last_message"
              ],
              "default": "last_message"
            },
            "adminUserVariableName": {
              "type": "string"
            },
            "can_manage_chat": {
              "type": "boolean",
              "default": false
            },
            "can_post_messages": {
              "type": "boolean",
              "default": false
            },
            "can_edit_messages": {
              "type": "boolean",
              "default": false
            },
            "can_delete_messages": {
              "type": "boolean",
              "default": false
            },
            "can_post_stories": {
              "type": "boolean",
              "default": false
            },
            "can_edit_stories": {
              "type": "boolean",
              "default": false
            },
            "can_delete_stories": {
              "type": "boolean",
              "default": false
            },
            "can_manage_video_chats": {
              "type": "boolean",
              "default": false
            },
            "can_restrict_members": {
              "type": "boolean",
              "default": false
            },
            "can_promote_members": {
              "type": "boolean",
              "default": false
            },
            "can_change_info": {
              "type": "boolean",
              "default": false
            },
            "can_invite_users": {
              "type": "boolean",
              "default": false
            },
            "can_pin_messages": {
              "type": "boolean",
              "default": false
            },
            "can_manage_topics": {
              "type": "boolean",
              "default": false
            },
            "is_anonymous": {
              "type": "boolean",
              "default": false
            },
            "can_manage_direct_messages": {
              "type": "boolean"
            },
            "can_manage_tags": {
              "type": "boolean"
            },
            "can_send_welcome_messages": {
              "type": "boolean"
            },
            "adminChatId": {
              "type": "string"
            },
            "adminChatIdSource": {
              "type": "string",
              "enum": [
                "manual",
                "variable",
                "current_chat"
              ],
              "default": "current_chat"
            },
            "adminChatVariableName": {
              "type": "string"
            },
            "attachedMedia": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "default": []
            },
            "sendAsGifUrls": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "text": {
              "type": "string"
            },
            "action": {
              "type": "string"
            },
            "waitForTextInput": {
              "type": "boolean"
            },
            "broadcastApiType": {
              "type": "string",
              "enum": [
                "bot",
                "client"
              ],
              "default": "bot"
            },
            "broadcastTargetNode": {
              "type": "string"
            },
            "enableBroadcast": {
              "type": "boolean",
              "default": false
            },
            "enableConfirmation": {
              "type": "boolean",
              "default": false
            },
            "confirmationText": {
              "type": "string"
            },
            "successMessage": {
              "type": "string"
            },
            "errorMessage": {
              "type": "string"
            },
            "sessionName": {
              "type": "string",
              "default": "user_session"
            },
            "sessionCreated": {
              "type": "boolean",
              "default": false
            },
            "textSynonyms": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "default": []
            },
            "textMatchType": {
              "type": "string",
              "enum": [
                "exact",
                "contains"
              ],
              "default": "exact"
            },
            "variable": {
              "type": "string"
            },
            "forumChatId": {
              "type": "string"
            },
            "forumChatIdSource": {
              "type": "string",
              "enum": [
                "manual",
                "variable"
              ],
              "default": "manual"
            },
            "forumChatVariableName": {
              "type": "string"
            },
            "topicName": {
              "type": "string"
            },
            "topicIconColor": {
              "type": "string"
            },
            "saveThreadIdTo": {
              "type": "string"
            },
            "saveMessageIdTo": {
              "type": "string"
            },
            "saveBotIdTo": {
              "type": "string"
            },
            "saveBotUsernameTo": {
              "type": "string"
            },
            "saveBotNameTo": {
              "type": "string"
            },
            "saveCreatorIdTo": {
              "type": "string"
            },
            "saveCreatorUsernameTo": {
              "type": "string"
            },
            "filterByUserId": {
              "type": "string"
            },
            "skipIfExists": {
              "type": "boolean",
              "default": false
            },
            "imtChatTypeFilter": {
              "type": "string",
              "enum": [
                "any",
                "private",
                "group"
              ],
              "default": "any"
            },
            "imtGroupChatId": {
              "type": "string"
            },
            "imtGroupChatIdSource": {
              "type": "string",
              "enum": [
                "manual",
                "variable"
              ]
            },
            "imtStopOnFlag": {
              "type": "boolean",
              "default": true
            },
            "groupChatId": {
              "type": "string"
            },
            "groupChatIdSource": {
              "type": "string",
              "enum": [
                "manual",
                "variable"
              ]
            },
            "groupChatVariableName": {
              "type": "string"
            },
            "threadIdVariable": {
              "type": "string"
            },
            "resolvedUserIdVariable": {
              "type": "string"
            },
            "memberEventType": {
              "type": "string",
              "enum": [
                "join",
                "leave",
                "both"
              ],
              "default": "join"
            },
            "saveJoinedUserIdTo": {
              "type": "string"
            },
            "saveJoinedUsernameTo": {
              "type": "string"
            },
            "saveLeftUserIdTo": {
              "type": "string"
            },
            "saveLeftUsernameTo": {
              "type": "string"
            },
            "branches": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "label": {
                    "type": "string",
                    "default": ""
                  },
                  "operator": {
                    "type": "string",
                    "enum": [
                      "filled",
                      "empty",
                      "equals",
                      "not_equals",
                      "contains",
                      "not_contains",
                      "starts_with",
                      "ends_with",
                      "matches_regex",
                      "greater_than",
                      "less_than",
                      "between",
                      "is_even",
                      "is_odd",
                      "divisible_by",
                      "else",
                      "is_private",
                      "is_group",
                      "is_channel",
                      "is_admin",
                      "is_premium",
                      "is_bot",
                      "is_subscribed",
                      "is_not_subscribed"
                    ]
                  },
                  "value": {
                    "type": "string"
                  },
                  "value2": {
                    "type": "string"
                  },
                  "valueRegex": {
                    "type": "string"
                  },
                  "target": {
                    "type": "string"
                  },
                  "subscriptionMode": {
                    "type": "string",
                    "enum": [
                      "all",
                      "any"
                    ]
                  }
                },
                "required": [
                  "id",
                  "operator",
                  "value"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "parallelBranches": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "label": {
                    "type": "string",
                    "default": ""
                  },
                  "target": {
                    "type": "string"
                  },
                  "onErrorTarget": {
                    "type": "string"
                  }
                },
                "required": [
                  "id"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "maxConcurrent": {
              "type": "number",
              "default": 5
            },
            "awaitAll": {
              "type": "boolean",
              "default": false
            },
            "skipIfRunning": {
              "type": "boolean",
              "default": true
            },
            "counterKey": {
              "type": "string"
            },
            "windowSeconds": {
              "type": "string"
            },
            "messageSendRecipients": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "user",
                      "chat_id",
                      "admin_ids"
                    ],
                    "default": "user"
                  },
                  "chatId": {
                    "type": "string"
                  },
                  "threadId": {
                    "type": "string"
                  },
                  "isGroup": {
                    "type": "boolean",
                    "default": false
                  },
                  "botToken": {
                    "type": "string"
                  }
                },
                "required": [
                  "id"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "messageSendTarget": {
              "type": "string"
            },
            "messageSendChatId": {
              "type": "string"
            },
            "messageSendThreadId": {
              "type": "string"
            },
            "httpRequestUrl": {
              "type": "string"
            },
            "httpRequestMethod": {
              "type": "string",
              "enum": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE"
              ],
              "default": "GET"
            },
            "httpRequestHeaders": {
              "type": "string"
            },
            "httpRequestBody": {
              "type": "string"
            },
            "httpRequestTimeout": {
              "type": "number",
              "default": 30
            },
            "httpRequestResponseVariable": {
              "type": "string"
            },
            "httpRequestResponseJsonPath": {
              "type": "string"
            },
            "httpRequestResponseExtractTo": {
              "type": "string"
            },
            "httpRequestStatusVariable": {
              "type": "string"
            },
            "botIdSource": {
              "type": "string"
            },
            "botIdVariable": {
              "type": "string"
            },
            "botIdManual": {
              "type": "string"
            },
            "saveTokenTo": {
              "type": "string"
            },
            "saveErrorTo": {
              "type": "string"
            },
            "httpRequestQueryParams": {
              "type": "string"
            },
            "httpRequestBodyFormat": {
              "type": "string",
              "enum": [
                "json",
                "form-urlencoded",
                "raw"
              ],
              "default": "json"
            },
            "httpRequestAuthType": {
              "type": "string",
              "enum": [
                "none",
                "basic",
                "bearer",
                "header",
                "query"
              ],
              "default": "none"
            },
            "httpRequestAuthBearerToken": {
              "type": "string"
            },
            "httpRequestAuthBasicUsername": {
              "type": "string"
            },
            "httpRequestAuthBasicPassword": {
              "type": "string"
            },
            "httpRequestAuthHeaderName": {
              "type": "string"
            },
            "httpRequestAuthHeaderValue": {
              "type": "string"
            },
            "httpRequestAuthQueryName": {
              "type": "string"
            },
            "httpRequestAuthQueryValue": {
              "type": "string"
            },
            "httpRequestResponseFormat": {
              "type": "string",
              "enum": [
                "autodetect",
                "json",
                "text",
                "file"
              ],
              "default": "autodetect"
            },
            "httpRequestIgnoreHttpErrors": {
              "type": "boolean",
              "default": false
            },
            "httpRequestIgnoreSsl": {
              "type": "boolean",
              "default": false
            },
            "httpRequestFollowRedirects": {
              "type": "boolean",
              "default": true
            },
            "httpRequestEnablePagination": {
              "type": "boolean",
              "default": false
            },
            "httpRequestPaginationMode": {
              "type": "string",
              "enum": [
                "interactive",
                "fetch_all"
              ],
              "default": "interactive"
            },
            "httpRequestPaginationOffsetVar": {
              "type": "string"
            },
            "httpRequestPaginationTotalField": {
              "type": "string",
              "default": "count"
            },
            "httpRequestPaginationItemsField": {
              "type": "string",
              "default": "items"
            },
            "httpRequestPaginationLimit": {
              "type": "number",
              "default": 10
            },
            "httpRequestPaginationMaxPages": {
              "type": "number",
              "default": 20
            },
            "httpRequestBatchEnabled": {
              "type": "boolean",
              "default": false
            },
            "httpRequestBatchSource": {
              "type": "string"
            },
            "httpRequestBatchItemVar": {
              "type": "string",
              "default": "item"
            },
            "httpRequestBatchResultVariable": {
              "type": "string"
            },
            "httpRequestBatchResultFields": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "key": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  }
                },
                "required": [
                  "key",
                  "value"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "attachedMediaThumbnails": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              },
              "default": {}
            },
            "query": {
              "type": "string",
              "default": ""
            },
            "connectionSource": {
              "type": "string",
              "enum": [
                "builtin",
                "env",
                "custom"
              ]
            },
            "connectionEnvVar": {
              "type": "string"
            },
            "connectionString": {
              "type": "string"
            },
            "saveResultTo": {
              "type": "string",
              "default": ""
            },
            "resultFormat": {
              "type": "string",
              "enum": [
                "json",
                "text",
                "first_row",
                "affected",
                "all_rows",
                "scalar",
                "count",
                "random_row"
              ],
              "default": "first_row"
            },
            "textTemplate": {
              "type": "string",
              "default": ""
            },
            "assignments": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "variable": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  },
                  "mode": {
                    "type": "string",
                    "enum": [
                      "text",
                      "expression",
                      "lookup",
                      "str_replace",
                      "json_push",
                      "json_format",
                      "random",
                      "random_item",
                      "array_item",
                      "timestamp",
                      "format_duration",
                      "format_number",
                      "regex_extract",
                      "extract_number",
                      "split_get",
                      "json_get",
                      "substring",
                      "conditional",
                      "lowercase",
                      "uppercase",
                      "trim",
                      "length",
                      "array_concat"
                    ],
                    "default": "text"
                  },
                  "lookupTable": {
                    "type": "string",
                    "default": ""
                  },
                  "lookupField": {
                    "type": "string",
                    "default": ""
                  },
                  "lookupWhere": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "field": {
                          "type": "string"
                        },
                        "value": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "field",
                        "value"
                      ],
                      "additionalProperties": false
                    },
                    "default": []
                  },
                  "replaceWith": {
                    "type": "string",
                    "default": ""
                  },
                  "pattern": {
                    "type": "string",
                    "default": ""
                  },
                  "regexGroup": {
                    "type": "string",
                    "default": "0"
                  },
                  "maxValue": {
                    "type": "string",
                    "default": ""
                  },
                  "separator": {
                    "type": "string",
                    "default": ""
                  },
                  "jsonPath": {
                    "type": "string",
                    "default": ""
                  },
                  "startIndex": {
                    "type": "string",
                    "default": "0"
                  },
                  "endIndex": {
                    "type": "string",
                    "default": ""
                  },
                  "conditionVariable": {
                    "type": "string",
                    "default": ""
                  },
                  "conditionOperator": {
                    "type": "string",
                    "default": "equals"
                  },
                  "conditionValue": {
                    "type": "string",
                    "default": ""
                  },
                  "trueValue": {
                    "type": "string",
                    "default": ""
                  },
                  "falseValue": {
                    "type": "string",
                    "default": ""
                  },
                  "concatWith": {
                    "type": "string",
                    "default": ""
                  },
                  "skipIfEmpty": {
                    "type": "string",
                    "default": ""
                  },
                  "persistToDb": {
                    "type": "boolean",
                    "default": true
                  }
                },
                "required": [
                  "id",
                  "variable",
                  "value"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "convertFileMode": {
              "type": "string",
              "enum": [
                "toFile"
              ],
              "default": "toFile"
            },
            "convertFileInputVariable": {
              "type": "string",
              "default": ""
            },
            "convertFileFormat": {
              "type": "string",
              "enum": [
                "csv",
                "json"
              ],
              "default": "csv"
            },
            "convertFileFileName": {
              "type": "string",
              "default": "export_{date}.csv"
            },
            "convertFileCsvDelimiter": {
              "type": "string",
              "default": ","
            },
            "convertFileIncludeHeaderRow": {
              "type": "boolean",
              "default": true
            },
            "convertFileOutputVariable": {
              "type": "string",
              "default": ""
            },
            "code": {
              "type": "string",
              "default": ""
            },
            "apiMethod": {
              "type": "string",
              "enum": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE"
              ],
              "default": "POST"
            },
            "apiPath": {
              "type": "string",
              "default": ""
            },
            "apiSecretToken": {
              "type": "string",
              "default": ""
            },
            "apiSaveBodyTo": {
              "type": "string",
              "default": ""
            },
            "apiSaveQueryTo": {
              "type": "string",
              "default": ""
            },
            "apiSaveHeadersTo": {
              "type": "string",
              "default": ""
            },
            "apiParseJson": {
              "type": "boolean",
              "default": true
            },
            "apiResponseStatusCode": {
              "type": "number",
              "default": 200
            },
            "apiResponseBody": {
              "type": "string",
              "default": "{\"ok\":true}"
            },
            "apiResponseContentType": {
              "type": "string",
              "enum": [
                "application/json",
                "text/plain",
                "text/html"
              ],
              "default": "application/json"
            },
            "apiResponseHeaders": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "key": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  }
                },
                "required": [
                  "key",
                  "value"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "invoiceTitle": {
              "type": "string",
              "default": ""
            },
            "invoiceDescription": {
              "type": "string",
              "default": ""
            },
            "invoiceAmount": {
              "type": "string",
              "default": "1"
            },
            "invoicePrices": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "label": {
                    "type": "string"
                  },
                  "amount": {
                    "type": "string"
                  }
                },
                "required": [
                  "id",
                  "label",
                  "amount"
                ],
                "additionalProperties": false
              },
              "default": []
            },
            "invoiceCurrency": {
              "type": "string",
              "default": "XTR"
            },
            "invoiceProviderSource": {
              "type": "string",
              "default": "inline"
            },
            "invoiceProviderToken": {
              "type": "string",
              "default": ""
            },
            "invoiceProviderTokenEnv": {
              "type": "string",
              "default": "PAYMENT_PROVIDER_TOKEN"
            },
            "invoiceNeedName": {
              "type": "boolean",
              "default": false
            },
            "invoiceNeedEmail": {
              "type": "boolean",
              "default": false
            },
            "invoiceNeedPhone": {
              "type": "boolean",
              "default": false
            },
            "invoiceNeedShipping": {
              "type": "boolean",
              "default": false
            },
            "invoiceIsFlexible": {
              "type": "boolean",
              "default": false
            },
            "invoiceSendPhoneToProvider": {
              "type": "boolean",
              "default": false
            },
            "invoiceSendEmailToProvider": {
              "type": "boolean",
              "default": false
            },
            "invoiceProtectContent": {
              "type": "boolean",
              "default": false
            },
            "invoiceMaxTipAmount": {
              "type": "string",
              "default": ""
            },
            "invoiceSuggestedTipAmounts": {
              "type": "string",
              "default": ""
            },
            "invoiceProviderData": {
              "type": "string",
              "default": ""
            },
            "invoiceStartParameter": {
              "type": "string",
              "default": ""
            },
            "invoiceSubscription": {
              "type": "boolean",
              "default": false
            },
            "invoicePhotoUrl": {
              "type": "string",
              "default": ""
            },
            "invoicePhotoSize": {
              "type": "string",
              "default": ""
            },
            "invoicePhotoWidth": {
              "type": "string",
              "default": ""
            },
            "invoicePhotoHeight": {
              "type": "string",
              "default": ""
            },
            "invoiceMessageThreadId": {
              "type": "string",
              "default": ""
            },
            "invoiceDirectMessagesTopicId": {
              "type": "string",
              "default": ""
            },
            "invoiceDisableNotification": {
              "type": "boolean",
              "default": false
            },
            "invoiceReplyToMessageId": {
              "type": "string",
              "default": ""
            },
            "invoiceMessageEffectId": {
              "type": "string",
              "default": ""
            },
            "invoiceAllowPaidBroadcast": {
              "type": "boolean",
              "default": false
            },
            "invoiceSuggestedPostParams": {
              "type": "string",
              "default": ""
            },
            "invoicePayload": {
              "type": "string",
              "default": ""
            },
            "savePaymentAmountTo": {
              "type": "string",
              "default": ""
            },
            "savePaymentChargeIdTo": {
              "type": "string",
              "default": ""
            },
            "saveOrderNameTo": {
              "type": "string",
              "default": ""
            },
            "saveOrderEmailTo": {
              "type": "string",
              "default": ""
            },
            "saveOrderPhoneTo": {
              "type": "string",
              "default": ""
            },
            "saveInvoiceLinkTo": {
              "type": "string",
              "default": ""
            },
            "afterPaymentTo": {
              "type": "string",
              "default": ""
            },
            "preCheckoutMode": {
              "type": "string",
              "default": "always"
            },
            "preCheckoutVariable": {
              "type": "string",
              "default": ""
            },
            "preCheckoutOperator": {
              "type": "string",
              "default": "filled"
            },
            "preCheckoutValue": {
              "type": "string",
              "default": ""
            },
            "preCheckoutValue2": {
              "type": "string",
              "default": ""
            },
            "preCheckoutErrorMessage": {
              "type": "string",
              "default": ""
            },
            "refundUserSource": {
              "type": "string",
              "default": "current_user"
            },
            "refundUserId": {
              "type": "string",
              "default": ""
            },
            "refundChargeId": {
              "type": "string",
              "default": ""
            },
            "refundMsgEmpty": {
              "type": "string",
              "default": "Пожалуйста, укажите код покупки: /back КОД"
            },
            "refundMsgNotFound": {
              "type": "string",
              "default": "Такой код покупки не найден. Проверьте данные и попробуйте снова."
            },
            "refundMsgAlreadyRefunded": {
              "type": "string",
              "default": "За эту покупку уже ранее был произведён возврат."
            },
            "refundEmptyTarget": {
              "type": "string",
              "default": ""
            },
            "refundNotFoundTarget": {
              "type": "string",
              "default": ""
            },
            "refundAlreadyRefundedTarget": {
              "type": "string",
              "default": ""
            },
            "subscriptionUserSource": {
              "type": "string",
              "default": "current_user"
            },
            "subscriptionUserId": {
              "type": "string",
              "default": ""
            },
            "subscriptionChargeId": {
              "type": "string",
              "default": ""
            },
            "subscriptionAction": {
              "type": "string",
              "default": "cancel"
            },
            "subscriptionMsgEmpty": {
              "type": "string",
              "default": "Укажите код покупки подписки"
            },
            "subscriptionMsgError": {
              "type": "string",
              "default": "Не удалось изменить автопродление. Проверьте код покупки."
            },
            "subscriptionEmptyTarget": {
              "type": "string",
              "default": ""
            },
            "subscriptionErrorTarget": {
              "type": "string",
              "default": ""
            },
            "saveStarBalanceTo": {
              "type": "string",
              "default": "star_balance"
            },
            "balanceMsgError": {
              "type": "string",
              "default": "Не удалось получить баланс звёзд"
            },
            "balanceErrorTarget": {
              "type": "string",
              "default": ""
            }
          },
          "additionalProperties": true
        }
      },
      "additionalProperties": false,
      "description": "Только изменяемые поля: position, data, type"
    },
    "sheet_id": {
      "type": "string",
      "description": "ID листа (иначе автопоиск по всем листам)"
    }
  },
  "required": [
    "project_json",
    "node_id",
    "patch"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Эффект

```json
{
  "section": "scenario",
  "effect": "prepare",
  "completionMode": "immediate",
  "destructive": false,
  "runtimeApply": "not_applicable"
}
```

## Пример вызова

Безопасный универсальный пример не сгенерирован. Используйте точную схему и данные пользователя; секреты в документацию не подставляются.

## Ответ и ошибки

Прежний text content сохранён. Метаданные `_meta.botcraft` различают prepared/read/saved/pending/partial/unknown/error/unverified. Только `persistence.confirmed=true` подтверждает сохранение. Неизвестный исход требует чтения состояния до повтора; live-доставка и применение ботом проверяются отдельно.

### Схема результата

```json
{
  "type": "object",
  "properties": {
    "data": {
      "anyOf": [
        {},
        {
          "type": "null"
        }
      ]
    },
    "execution": {
      "type": "object",
      "properties": {
        "section": {
          "type": "string"
        },
        "effect": {
          "type": "string",
          "enum": [
            "read",
            "prepare",
            "write",
            "file",
            "external",
            "unknown"
          ]
        },
        "destructive": {
          "type": "boolean"
        },
        "runtimeApply": {
          "type": "string",
          "enum": [
            "not_applicable",
            "separate"
          ]
        },
        "completionMode": {
          "type": "string",
          "enum": [
            "immediate",
            "job"
          ]
        },
        "pollAction": {
          "type": "string"
        },
        "outcome": {
          "type": "string",
          "enum": [
            "prepared",
            "read",
            "saved",
            "pending",
            "partial",
            "unknown",
            "error",
            "unverified",
            "file_result"
          ]
        },
        "persistence": {
          "type": "object",
          "properties": {
            "confirmed": {
              "type": "boolean"
            },
            "projectId": {
              "type": "integer",
              "exclusiveMinimum": 0
            },
            "revision": {
              "type": "integer",
              "minimum": 0
            }
          },
          "required": [
            "confirmed"
          ],
          "additionalProperties": false
        },
        "sideEffects": {
          "type": "object",
          "additionalProperties": {}
        }
      },
      "required": [
        "section",
        "effect",
        "destructive",
        "runtimeApply",
        "completionMode",
        "outcome",
        "persistence"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "execution"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Ограничения и безопасность

Изучите describe_actions, проверьте реальные ID и права проекта. Для разрушительных и внешних действий требуется явное намерение пользователя. Для повторов сохраняйте requestId, если он объявлен. Отсутствие ошибки транспорта не доказывает сохранение.
