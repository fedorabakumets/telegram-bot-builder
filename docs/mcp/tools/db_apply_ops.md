<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_apply_ops`

Пакет операций: чтение проекта с ревизией, изменения в памяти и одна защищённая запись. Это не транзакция всего GET→PUT. Ошибка операции не записывает пакет, конфликт ревизии требует перечитать проект. Версия и live-рассылка имеют отдельные статусы.

Раздел: scenario. Транспорт: http, stdio.

## Параметры

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "Числовой ID проекта из URL редактора"
    },
    "ops": {
      "type": "array",
      "items": {
        "anyOf": [
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "add_node"
              },
              "node": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
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
                                "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/buttons/items"
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
                "required": [
                  "id",
                  "type",
                  "position",
                  "data"
                ],
                "additionalProperties": true
              },
              "sheet_id": {
                "type": "string",
                "minLength": 1
              }
            },
            "required": [
              "op",
              "node"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "update_node"
              },
              "node_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "patch": {
                "type": "object",
                "properties": {
                  "type": {
                    "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/type"
                  },
                  "position": {
                    "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/position"
                  },
                  "data": {
                    "type": "object",
                    "properties": {
                      "userbotEntity": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/userbotEntity"
                      },
                      "userbotEntitySource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/userbotEntitySource"
                      },
                      "userbotEntityVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/userbotEntityVariable"
                      },
                      "userbotRecipients": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/userbotRecipients"
                      },
                      "messageId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/messageId"
                      },
                      "clickMode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/clickMode"
                      },
                      "clickDelivery": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/clickDelivery"
                      },
                      "clickValue": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/clickValue"
                      },
                      "responseStrategy": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/responseStrategy"
                      },
                      "responseWaitSeconds": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/responseWaitSeconds"
                      },
                      "responseFilterRegex": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/responseFilterRegex"
                      },
                      "responseFloorMessageIdVar": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/responseFloorMessageIdVar"
                      },
                      "saveAlertTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveAlertTo"
                      },
                      "saveButtonsTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveButtonsTo"
                      },
                      "saveHasMediaTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveHasMediaTo"
                      },
                      "saveMediaTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveMediaTo"
                      },
                      "saveResponseIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveResponseIdTo"
                      },
                      "saveResponseTextTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveResponseTextTo"
                      },
                      "botUsername": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/botUsername"
                      },
                      "targetChat": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetChat"
                      },
                      "sendToSameChat": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/sendToSameChat"
                      },
                      "resultIndex": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/resultIndex"
                      },
                      "saveResultTitleTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveResultTitleTo"
                      },
                      "saveResultDescTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveResultDescTo"
                      },
                      "filterType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/filterType"
                      },
                      "filterValue": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/filterValue"
                      },
                      "saveTextTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveTextTo"
                      },
                      "saveChatIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveChatIdTo"
                      },
                      "saveSenderIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveSenderIdTo"
                      },
                      "command": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/command"
                      },
                      "deepLinkParam": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/deepLinkParam"
                      },
                      "deepLinkMatchMode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/deepLinkMatchMode"
                      },
                      "deepLinkSaveToVar": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/deepLinkSaveToVar"
                      },
                      "deepLinkVarName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/deepLinkVarName"
                      },
                      "commentColor": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/commentColor"
                      },
                      "rules": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/rules"
                      },
                      "timezone": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/timezone"
                      },
                      "runOnStart": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/runOnStart"
                      },
                      "enabled": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enabled"
                      },
                      "description": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/description"
                      },
                      "messageText": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/messageText"
                      },
                      "imageUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/imageUrl"
                      },
                      "videoUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/videoUrl"
                      },
                      "audioUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/audioUrl"
                      },
                      "documentUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/documentUrl"
                      },
                      "documentName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/documentName"
                      },
                      "mediaCaption": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/mediaCaption"
                      },
                      "keyboardType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/keyboardType"
                      },
                      "keyboardNodeId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/keyboardNodeId"
                      },
                      "seconds": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/seconds"
                      },
                      "unit": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/unit"
                      },
                      "mode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/mode"
                      },
                      "buttons": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/buttons"
                      },
                      "shuffleButtons": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/shuffleButtons"
                      },
                      "enableDynamicButtons": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableDynamicButtons"
                      },
                      "dynamicButtons": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/dynamicButtons"
                      },
                      "keyboardLayout": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/keyboardLayout"
                      },
                      "oneTimeKeyboard": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/oneTimeKeyboard"
                      },
                      "resizeKeyboard": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/resizeKeyboard"
                      },
                      "markdown": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/markdown"
                      },
                      "formatMode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/formatMode"
                      },
                      "disableLinkPreview": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/disableLinkPreview"
                      },
                      "synonyms": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/synonyms"
                      },
                      "matchMode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/matchMode"
                      },
                      "adminOnly": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/adminOnly"
                      },
                      "requiresAuth": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/requiresAuth"
                      },
                      "showInMenu": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/showInMenu"
                      },
                      "saveCommandArgsTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveCommandArgsTo"
                      },
                      "commandTimeout": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/commandTimeout"
                      },
                      "cooldownTime": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/cooldownTime"
                      },
                      "maxUsagesPerDay": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/maxUsagesPerDay"
                      },
                      "customParameters": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/customParameters"
                      },
                      "targetMessageId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetMessageId"
                      },
                      "sourceMessageId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/sourceMessageId"
                      },
                      "messageIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/messageIdSource"
                      },
                      "messageIdManual": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/messageIdManual"
                      },
                      "lastNCount": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/lastNCount"
                      },
                      "chatIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/chatIdSource"
                      },
                      "chatIdManual": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/chatIdManual"
                      },
                      "ignoreErrors": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/ignoreErrors"
                      },
                      "bulkDelete": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/bulkDelete"
                      },
                      "bulkMessageIdsVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/bulkMessageIdsVariable"
                      },
                      "sourceMessageIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/sourceMessageIdSource"
                      },
                      "sourceMessageNodeId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/sourceMessageNodeId"
                      },
                      "sourceMessageVariableName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/sourceMessageVariableName"
                      },
                      "variableName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/variableName"
                      },
                      "disableNotification": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/disableNotification"
                      },
                      "hideAuthor": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/hideAuthor"
                      },
                      "targetChatId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetChatId"
                      },
                      "targetChatIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetChatIdSource"
                      },
                      "targetChatVariableName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetChatVariableName"
                      },
                      "targetChatTargets": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetChatTargets"
                      },
                      "targetThreadId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetThreadId"
                      },
                      "targetThreadIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetThreadIdSource"
                      },
                      "targetThreadIdVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetThreadIdVariable"
                      },
                      "targetUserId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetUserId"
                      },
                      "userIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/userIdSource"
                      },
                      "userIdManual": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/userIdManual"
                      },
                      "userVariableName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/userVariableName"
                      },
                      "targetGroupId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/targetGroupId"
                      },
                      "stickerUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/stickerUrl"
                      },
                      "stickerFileId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/stickerFileId"
                      },
                      "voiceUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/voiceUrl"
                      },
                      "animationUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/animationUrl"
                      },
                      "latitude": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/latitude"
                      },
                      "longitude": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/longitude"
                      },
                      "title": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/title"
                      },
                      "address": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/address"
                      },
                      "foursquareId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/foursquareId"
                      },
                      "foursquareType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/foursquareType"
                      },
                      "mapService": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/mapService"
                      },
                      "yandexMapUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/yandexMapUrl"
                      },
                      "googleMapUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/googleMapUrl"
                      },
                      "gisMapUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/gisMapUrl"
                      },
                      "mapZoom": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/mapZoom"
                      },
                      "showDirections": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/showDirections"
                      },
                      "generateMapPreview": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/generateMapPreview"
                      },
                      "phoneNumber": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/phoneNumber"
                      },
                      "firstName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/firstName"
                      },
                      "lastName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/lastName"
                      },
                      "userId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/userId"
                      },
                      "vcard": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/vcard"
                      },
                      "question": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/question"
                      },
                      "options": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/options"
                      },
                      "allowsMultipleAnswers": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/allowsMultipleAnswers"
                      },
                      "anonymousVoting": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/anonymousVoting"
                      },
                      "emoji": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/emoji"
                      },
                      "mediaDuration": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/mediaDuration"
                      },
                      "width": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/width"
                      },
                      "height": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/height"
                      },
                      "performer": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/performer"
                      },
                      "fileSize": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/fileSize"
                      },
                      "filename": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/filename"
                      },
                      "inputType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputType"
                      },
                      "responseType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/responseType"
                      },
                      "responseOptions": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/responseOptions"
                      },
                      "allowMultipleSelection": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/allowMultipleSelection"
                      },
                      "multiSelectVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/multiSelectVariable"
                      },
                      "continueButtonText": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/continueButtonText"
                      },
                      "continueButtonTarget": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/continueButtonTarget"
                      },
                      "inputVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputVariable"
                      },
                      "inputPrompt": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputPrompt"
                      },
                      "inputValidation": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputValidation"
                      },
                      "inputRequired": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputRequired"
                      },
                      "inputTimeout": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputTimeout"
                      },
                      "inputTimeoutMessage": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputTimeoutMessage"
                      },
                      "inputRetryMessage": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputRetryMessage"
                      },
                      "inputSuccessMessage": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputSuccessMessage"
                      },
                      "enableConditionalMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableConditionalMessages"
                      },
                      "conditionalMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/conditionalMessages"
                      },
                      "fallbackMessage": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/fallbackMessage"
                      },
                      "saveToDatabase": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveToDatabase"
                      },
                      "allowSkip": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/allowSkip"
                      },
                      "collectUserInput": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/collectUserInput"
                      },
                      "inputTargetNodeId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputTargetNodeId"
                      },
                      "inputButtonType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/inputButtonType"
                      },
                      "enableAutoTransition": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableAutoTransition"
                      },
                      "autoTransitionTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/autoTransitionTo"
                      },
                      "sourceNodeId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/sourceNodeId"
                      },
                      "minLength": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/minLength"
                      },
                      "maxLength": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/maxLength"
                      },
                      "placeholder": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/placeholder"
                      },
                      "defaultValue": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/defaultValue"
                      },
                      "appendVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/appendVariable"
                      },
                      "saveMediaMetadata": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveMediaMetadata"
                      },
                      "mediaMetadataSuffixes": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/mediaMetadataSuffixes"
                      },
                      "mediaMetadataCustomNames": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/mediaMetadataCustomNames"
                      },
                      "variableFilters": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/variableFilters"
                      },
                      "enableUserActions": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableUserActions"
                      },
                      "actionTrigger": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/actionTrigger"
                      },
                      "triggerText": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/triggerText"
                      },
                      "userActionType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/userActionType"
                      },
                      "actionTag": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/actionTag"
                      },
                      "actionMessage": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/actionMessage"
                      },
                      "silentAction": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/silentAction"
                      },
                      "mimeType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/mimeType"
                      },
                      "stickerSetName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/stickerSetName"
                      },
                      "fileName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/fileName"
                      },
                      "city": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/city"
                      },
                      "country": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/country"
                      },
                      "enableTextInput": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableTextInput"
                      },
                      "enablePhotoInput": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enablePhotoInput"
                      },
                      "enableVideoInput": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableVideoInput"
                      },
                      "enableAudioInput": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableAudioInput"
                      },
                      "enableDocumentInput": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableDocumentInput"
                      },
                      "photoInputVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/photoInputVariable"
                      },
                      "videoInputVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/videoInputVariable"
                      },
                      "audioInputVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/audioInputVariable"
                      },
                      "documentInputVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/documentInputVariable"
                      },
                      "name": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/name"
                      },
                      "label": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/label"
                      },
                      "checkmarkSymbol": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/checkmarkSymbol"
                      },
                      "multiSelectCheckmark": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/multiSelectCheckmark"
                      },
                      "radioSelectedSymbol": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/radioSelectedSymbol"
                      },
                      "radioUnselectedSymbol": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/radioUnselectedSymbol"
                      },
                      "duration": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/duration"
                      },
                      "muteDuration": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/muteDuration"
                      },
                      "reason": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/reason"
                      },
                      "canChangeInfo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canChangeInfo"
                      },
                      "canDeleteMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canDeleteMessages"
                      },
                      "canBanUsers": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canBanUsers"
                      },
                      "canInviteUsers": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canInviteUsers"
                      },
                      "canPinMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canPinMessages"
                      },
                      "canAddAdmins": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canAddAdmins"
                      },
                      "canRestrictMembers": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canRestrictMembers"
                      },
                      "canPromoteMembers": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canPromoteMembers"
                      },
                      "canManageVideoChats": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canManageVideoChats"
                      },
                      "canManageTopics": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canManageTopics"
                      },
                      "isAnonymous": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/isAnonymous"
                      },
                      "canManageChat": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canManageChat"
                      },
                      "canPostMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canPostMessages"
                      },
                      "canEditMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canEditMessages"
                      },
                      "canManageDirectMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canManageDirectMessages"
                      },
                      "canManageTags": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canManageTags"
                      },
                      "canSendWelcomeMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendWelcomeMessages"
                      },
                      "canSendMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendMessages"
                      },
                      "canSendAudios": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendAudios"
                      },
                      "canSendDocuments": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendDocuments"
                      },
                      "canSendPhotos": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendPhotos"
                      },
                      "canSendVideos": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendVideos"
                      },
                      "canSendVideoNotes": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendVideoNotes"
                      },
                      "canSendVoiceNotes": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendVoiceNotes"
                      },
                      "canReactToMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canReactToMessages"
                      },
                      "canSendPolls": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendPolls"
                      },
                      "canSendOtherMessages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canSendOtherMessages"
                      },
                      "canAddWebPagePreviews": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canAddWebPagePreviews"
                      },
                      "canChangeGroupInfo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canChangeGroupInfo"
                      },
                      "canInviteUsers2": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canInviteUsers2"
                      },
                      "canPinMessages2": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/canPinMessages2"
                      },
                      "untilDate": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/untilDate"
                      },
                      "adminTargetUserId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/adminTargetUserId"
                      },
                      "adminUserIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/adminUserIdSource"
                      },
                      "adminUserVariableName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/adminUserVariableName"
                      },
                      "can_manage_chat": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_manage_chat"
                      },
                      "can_post_messages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_post_messages"
                      },
                      "can_edit_messages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_edit_messages"
                      },
                      "can_delete_messages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_delete_messages"
                      },
                      "can_post_stories": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_post_stories"
                      },
                      "can_edit_stories": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_edit_stories"
                      },
                      "can_delete_stories": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_delete_stories"
                      },
                      "can_manage_video_chats": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_manage_video_chats"
                      },
                      "can_restrict_members": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_restrict_members"
                      },
                      "can_promote_members": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_promote_members"
                      },
                      "can_change_info": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_change_info"
                      },
                      "can_invite_users": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_invite_users"
                      },
                      "can_pin_messages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_pin_messages"
                      },
                      "can_manage_topics": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_manage_topics"
                      },
                      "is_anonymous": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/is_anonymous"
                      },
                      "can_manage_direct_messages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_manage_direct_messages"
                      },
                      "can_manage_tags": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_manage_tags"
                      },
                      "can_send_welcome_messages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/can_send_welcome_messages"
                      },
                      "adminChatId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/adminChatId"
                      },
                      "adminChatIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/adminChatIdSource"
                      },
                      "adminChatVariableName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/adminChatVariableName"
                      },
                      "attachedMedia": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/attachedMedia"
                      },
                      "sendAsGifUrls": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/sendAsGifUrls"
                      },
                      "text": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/text"
                      },
                      "action": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/action"
                      },
                      "waitForTextInput": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/waitForTextInput"
                      },
                      "broadcastApiType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/broadcastApiType"
                      },
                      "broadcastTargetNode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/broadcastTargetNode"
                      },
                      "enableBroadcast": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableBroadcast"
                      },
                      "enableConfirmation": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/enableConfirmation"
                      },
                      "confirmationText": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/confirmationText"
                      },
                      "successMessage": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/successMessage"
                      },
                      "errorMessage": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/errorMessage"
                      },
                      "sessionName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/sessionName"
                      },
                      "sessionCreated": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/sessionCreated"
                      },
                      "textSynonyms": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/textSynonyms"
                      },
                      "textMatchType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/textMatchType"
                      },
                      "variable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/variable"
                      },
                      "forumChatId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/forumChatId"
                      },
                      "forumChatIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/forumChatIdSource"
                      },
                      "forumChatVariableName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/forumChatVariableName"
                      },
                      "topicName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/topicName"
                      },
                      "topicIconColor": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/topicIconColor"
                      },
                      "saveThreadIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveThreadIdTo"
                      },
                      "saveMessageIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveMessageIdTo"
                      },
                      "saveBotIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveBotIdTo"
                      },
                      "saveBotUsernameTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveBotUsernameTo"
                      },
                      "saveBotNameTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveBotNameTo"
                      },
                      "saveCreatorIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveCreatorIdTo"
                      },
                      "saveCreatorUsernameTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveCreatorUsernameTo"
                      },
                      "filterByUserId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/filterByUserId"
                      },
                      "skipIfExists": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/skipIfExists"
                      },
                      "imtChatTypeFilter": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/imtChatTypeFilter"
                      },
                      "imtGroupChatId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/imtGroupChatId"
                      },
                      "imtGroupChatIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/imtGroupChatIdSource"
                      },
                      "imtStopOnFlag": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/imtStopOnFlag"
                      },
                      "groupChatId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/groupChatId"
                      },
                      "groupChatIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/groupChatIdSource"
                      },
                      "groupChatVariableName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/groupChatVariableName"
                      },
                      "threadIdVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/threadIdVariable"
                      },
                      "resolvedUserIdVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/resolvedUserIdVariable"
                      },
                      "memberEventType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/memberEventType"
                      },
                      "saveJoinedUserIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveJoinedUserIdTo"
                      },
                      "saveJoinedUsernameTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveJoinedUsernameTo"
                      },
                      "saveLeftUserIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveLeftUserIdTo"
                      },
                      "saveLeftUsernameTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveLeftUsernameTo"
                      },
                      "branches": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/branches"
                      },
                      "parallelBranches": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/parallelBranches"
                      },
                      "maxConcurrent": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/maxConcurrent"
                      },
                      "awaitAll": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/awaitAll"
                      },
                      "skipIfRunning": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/skipIfRunning"
                      },
                      "counterKey": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/counterKey"
                      },
                      "windowSeconds": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/windowSeconds"
                      },
                      "messageSendRecipients": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/messageSendRecipients"
                      },
                      "messageSendTarget": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/messageSendTarget"
                      },
                      "messageSendChatId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/messageSendChatId"
                      },
                      "messageSendThreadId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/messageSendThreadId"
                      },
                      "httpRequestUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestUrl"
                      },
                      "httpRequestMethod": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestMethod"
                      },
                      "httpRequestHeaders": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestHeaders"
                      },
                      "httpRequestBody": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestBody"
                      },
                      "httpRequestTimeout": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestTimeout"
                      },
                      "httpRequestResponseVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestResponseVariable"
                      },
                      "httpRequestResponseJsonPath": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestResponseJsonPath"
                      },
                      "httpRequestResponseExtractTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestResponseExtractTo"
                      },
                      "httpRequestStatusVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestStatusVariable"
                      },
                      "botIdSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/botIdSource"
                      },
                      "botIdVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/botIdVariable"
                      },
                      "botIdManual": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/botIdManual"
                      },
                      "saveTokenTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveTokenTo"
                      },
                      "saveErrorTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveErrorTo"
                      },
                      "httpRequestQueryParams": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestQueryParams"
                      },
                      "httpRequestBodyFormat": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestBodyFormat"
                      },
                      "httpRequestAuthType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestAuthType"
                      },
                      "httpRequestAuthBearerToken": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestAuthBearerToken"
                      },
                      "httpRequestAuthBasicUsername": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestAuthBasicUsername"
                      },
                      "httpRequestAuthBasicPassword": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestAuthBasicPassword"
                      },
                      "httpRequestAuthHeaderName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestAuthHeaderName"
                      },
                      "httpRequestAuthHeaderValue": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestAuthHeaderValue"
                      },
                      "httpRequestAuthQueryName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestAuthQueryName"
                      },
                      "httpRequestAuthQueryValue": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestAuthQueryValue"
                      },
                      "httpRequestResponseFormat": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestResponseFormat"
                      },
                      "httpRequestIgnoreHttpErrors": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestIgnoreHttpErrors"
                      },
                      "httpRequestIgnoreSsl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestIgnoreSsl"
                      },
                      "httpRequestFollowRedirects": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestFollowRedirects"
                      },
                      "httpRequestEnablePagination": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestEnablePagination"
                      },
                      "httpRequestPaginationMode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestPaginationMode"
                      },
                      "httpRequestPaginationOffsetVar": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestPaginationOffsetVar"
                      },
                      "httpRequestPaginationTotalField": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestPaginationTotalField"
                      },
                      "httpRequestPaginationItemsField": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestPaginationItemsField"
                      },
                      "httpRequestPaginationLimit": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestPaginationLimit"
                      },
                      "httpRequestPaginationMaxPages": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestPaginationMaxPages"
                      },
                      "httpRequestBatchEnabled": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestBatchEnabled"
                      },
                      "httpRequestBatchSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestBatchSource"
                      },
                      "httpRequestBatchItemVar": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestBatchItemVar"
                      },
                      "httpRequestBatchResultVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestBatchResultVariable"
                      },
                      "httpRequestBatchResultFields": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/httpRequestBatchResultFields"
                      },
                      "attachedMediaThumbnails": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/attachedMediaThumbnails"
                      },
                      "query": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/query"
                      },
                      "connectionSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/connectionSource"
                      },
                      "connectionEnvVar": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/connectionEnvVar"
                      },
                      "connectionString": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/connectionString"
                      },
                      "saveResultTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveResultTo"
                      },
                      "resultFormat": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/resultFormat"
                      },
                      "textTemplate": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/textTemplate"
                      },
                      "assignments": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/assignments"
                      },
                      "convertFileMode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/convertFileMode"
                      },
                      "convertFileInputVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/convertFileInputVariable"
                      },
                      "convertFileFormat": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/convertFileFormat"
                      },
                      "convertFileFileName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/convertFileFileName"
                      },
                      "convertFileCsvDelimiter": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/convertFileCsvDelimiter"
                      },
                      "convertFileIncludeHeaderRow": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/convertFileIncludeHeaderRow"
                      },
                      "convertFileOutputVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/convertFileOutputVariable"
                      },
                      "code": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/code"
                      },
                      "apiMethod": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiMethod"
                      },
                      "apiPath": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiPath"
                      },
                      "apiSecretToken": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiSecretToken"
                      },
                      "apiSaveBodyTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiSaveBodyTo"
                      },
                      "apiSaveQueryTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiSaveQueryTo"
                      },
                      "apiSaveHeadersTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiSaveHeadersTo"
                      },
                      "apiParseJson": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiParseJson"
                      },
                      "apiResponseStatusCode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiResponseStatusCode"
                      },
                      "apiResponseBody": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiResponseBody"
                      },
                      "apiResponseContentType": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiResponseContentType"
                      },
                      "apiResponseHeaders": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/apiResponseHeaders"
                      },
                      "invoiceTitle": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceTitle"
                      },
                      "invoiceDescription": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceDescription"
                      },
                      "invoiceAmount": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceAmount"
                      },
                      "invoicePrices": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoicePrices"
                      },
                      "invoiceCurrency": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceCurrency"
                      },
                      "invoiceProviderSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceProviderSource"
                      },
                      "invoiceProviderToken": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceProviderToken"
                      },
                      "invoiceProviderTokenEnv": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceProviderTokenEnv"
                      },
                      "invoiceNeedName": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceNeedName"
                      },
                      "invoiceNeedEmail": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceNeedEmail"
                      },
                      "invoiceNeedPhone": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceNeedPhone"
                      },
                      "invoiceNeedShipping": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceNeedShipping"
                      },
                      "invoiceIsFlexible": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceIsFlexible"
                      },
                      "invoiceSendPhoneToProvider": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceSendPhoneToProvider"
                      },
                      "invoiceSendEmailToProvider": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceSendEmailToProvider"
                      },
                      "invoiceProtectContent": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceProtectContent"
                      },
                      "invoiceMaxTipAmount": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceMaxTipAmount"
                      },
                      "invoiceSuggestedTipAmounts": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceSuggestedTipAmounts"
                      },
                      "invoiceProviderData": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceProviderData"
                      },
                      "invoiceStartParameter": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceStartParameter"
                      },
                      "invoiceSubscription": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceSubscription"
                      },
                      "invoicePhotoUrl": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoicePhotoUrl"
                      },
                      "invoicePhotoSize": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoicePhotoSize"
                      },
                      "invoicePhotoWidth": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoicePhotoWidth"
                      },
                      "invoicePhotoHeight": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoicePhotoHeight"
                      },
                      "invoiceMessageThreadId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceMessageThreadId"
                      },
                      "invoiceDirectMessagesTopicId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceDirectMessagesTopicId"
                      },
                      "invoiceDisableNotification": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceDisableNotification"
                      },
                      "invoiceReplyToMessageId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceReplyToMessageId"
                      },
                      "invoiceMessageEffectId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceMessageEffectId"
                      },
                      "invoiceAllowPaidBroadcast": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceAllowPaidBroadcast"
                      },
                      "invoiceSuggestedPostParams": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoiceSuggestedPostParams"
                      },
                      "invoicePayload": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/invoicePayload"
                      },
                      "savePaymentAmountTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/savePaymentAmountTo"
                      },
                      "savePaymentChargeIdTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/savePaymentChargeIdTo"
                      },
                      "saveOrderNameTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveOrderNameTo"
                      },
                      "saveOrderEmailTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveOrderEmailTo"
                      },
                      "saveOrderPhoneTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveOrderPhoneTo"
                      },
                      "saveInvoiceLinkTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveInvoiceLinkTo"
                      },
                      "afterPaymentTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/afterPaymentTo"
                      },
                      "preCheckoutMode": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/preCheckoutMode"
                      },
                      "preCheckoutVariable": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/preCheckoutVariable"
                      },
                      "preCheckoutOperator": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/preCheckoutOperator"
                      },
                      "preCheckoutValue": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/preCheckoutValue"
                      },
                      "preCheckoutValue2": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/preCheckoutValue2"
                      },
                      "preCheckoutErrorMessage": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/preCheckoutErrorMessage"
                      },
                      "refundUserSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/refundUserSource"
                      },
                      "refundUserId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/refundUserId"
                      },
                      "refundChargeId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/refundChargeId"
                      },
                      "refundMsgEmpty": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/refundMsgEmpty"
                      },
                      "refundMsgNotFound": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/refundMsgNotFound"
                      },
                      "refundMsgAlreadyRefunded": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/refundMsgAlreadyRefunded"
                      },
                      "refundEmptyTarget": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/refundEmptyTarget"
                      },
                      "refundNotFoundTarget": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/refundNotFoundTarget"
                      },
                      "refundAlreadyRefundedTarget": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/refundAlreadyRefundedTarget"
                      },
                      "subscriptionUserSource": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/subscriptionUserSource"
                      },
                      "subscriptionUserId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/subscriptionUserId"
                      },
                      "subscriptionChargeId": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/subscriptionChargeId"
                      },
                      "subscriptionAction": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/subscriptionAction"
                      },
                      "subscriptionMsgEmpty": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/subscriptionMsgEmpty"
                      },
                      "subscriptionMsgError": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/subscriptionMsgError"
                      },
                      "subscriptionEmptyTarget": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/subscriptionEmptyTarget"
                      },
                      "subscriptionErrorTarget": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/subscriptionErrorTarget"
                      },
                      "saveStarBalanceTo": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/saveStarBalanceTo"
                      },
                      "balanceMsgError": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/balanceMsgError"
                      },
                      "balanceErrorTarget": {
                        "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/data/properties/balanceErrorTarget"
                      }
                    },
                    "additionalProperties": true
                  }
                },
                "additionalProperties": false
              },
              "sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              }
            },
            "required": [
              "op",
              "node_id",
              "patch"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "remove_node"
              },
              "node_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              }
            },
            "required": [
              "op",
              "node_id"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "connect_nodes"
              },
              "from_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "to_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "branch": {
                "type": "string"
              },
              "port_type": {
                "type": "string",
                "enum": [
                  "auto-transition",
                  "trigger-next",
                  "button-goto",
                  "input-target"
                ]
              }
            },
            "required": [
              "op",
              "from_id",
              "to_id"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "disconnect_nodes"
              },
              "from_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "to_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "branch": {
                "$ref": "#/properties/ops/items/anyOf/3/properties/branch"
              },
              "port_type": {
                "$ref": "#/properties/ops/items/anyOf/3/properties/port_type"
              }
            },
            "required": [
              "op",
              "from_id",
              "to_id"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "move_node"
              },
              "node_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "to_sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "from_sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "position": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/position"
              }
            },
            "required": [
              "op",
              "node_id",
              "to_sheet_id"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "duplicate_node"
              },
              "node_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "position": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/node/properties/position"
              }
            },
            "required": [
              "op",
              "node_id"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "add_sheet"
              },
              "name": {
                "type": "string"
              },
              "id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              }
            },
            "required": [
              "op"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "rename_sheet"
              },
              "sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              },
              "name": {
                "type": "string"
              }
            },
            "required": [
              "op",
              "sheet_id",
              "name"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "remove_sheet"
              },
              "sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              }
            },
            "required": [
              "op",
              "sheet_id"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "duplicate_sheet"
              },
              "sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              }
            },
            "required": [
              "op",
              "sheet_id"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "set_active_sheet"
              },
              "sheet_id": {
                "$ref": "#/properties/ops/items/anyOf/0/properties/sheet_id"
              }
            },
            "required": [
              "op",
              "sheet_id"
            ],
            "additionalProperties": false
          }
        ]
      },
      "minItems": 1,
      "description": "Проверяемый пакет операций; update/remove без sheet_id ищут узел по листам"
    },
    "commit_message": {
      "type": "string",
      "description": "Заметка к версии (ручной чекпоинт)"
    },
    "skip_validation": {
      "type": "boolean",
      "description": "Пропустить валидацию перед записью (для легаси с битыми ссылками; style:default уже принимается)"
    }
  },
  "required": [
    "project_id",
    "ops"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Эффект

```json
{
  "section": "scenario",
  "effect": "write",
  "completionMode": "immediate",
  "destructive": false,
  "runtimeApply": "separate"
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
