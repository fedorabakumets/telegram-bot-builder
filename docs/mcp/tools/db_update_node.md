<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_update_node`

Обновить ноду по id в БД (live). Без sheet_id ищет по всем листам; если ноды нет — ошибка, не silent ok. Адресация по projectId из URL

Раздел: scenario. Транспорт: http, stdio.

## Параметры

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "Числовой ID проекта из URL редактора"
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
          ]
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
                "additionalProperties": {}
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
              "default": "none",
              "type": "string",
              "enum": [
                "reply",
                "inline",
                "none"
              ]
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
                    "default": "goto",
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
                    ]
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
                    "default": "normal",
                    "type": "string",
                    "enum": [
                      "normal",
                      "option",
                      "complete"
                    ]
                  },
                  "skipDataCollection": {
                    "default": false,
                    "type": "boolean"
                  },
                  "hideAfterClick": {
                    "default": false,
                    "type": "boolean"
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
                ]
              }
            },
            "shuffleButtons": {
              "default": false,
              "type": "boolean"
            },
            "enableDynamicButtons": {
              "default": false,
              "type": "boolean"
            },
            "dynamicButtons": {
              "type": "object",
              "properties": {
                "sourceVariable": {
                  "default": "",
                  "type": "string"
                },
                "arrayPath": {
                  "default": "",
                  "type": "string"
                },
                "textTemplate": {
                  "default": "",
                  "type": "string"
                },
                "callbackTemplate": {
                  "default": "",
                  "type": "string"
                },
                "styleMode": {
                  "default": "none",
                  "type": "string",
                  "enum": [
                    "field",
                    "template",
                    "none"
                  ]
                },
                "styleField": {
                  "default": "",
                  "type": "string"
                },
                "styleTemplate": {
                  "default": "",
                  "type": "string"
                },
                "columns": {
                  "default": 2,
                  "type": "number",
                  "minimum": 1,
                  "maximum": 6
                }
              },
              "additionalProperties": {}
            },
            "keyboardLayout": {
              "type": "object",
              "properties": {
                "rows": {
                  "default": [],
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
                    ]
                  }
                },
                "columns": {
                  "default": 2,
                  "type": "number",
                  "minimum": 1,
                  "maximum": 6
                },
                "autoLayout": {
                  "default": true,
                  "type": "boolean"
                }
              }
            },
            "oneTimeKeyboard": {
              "default": false,
              "type": "boolean"
            },
            "resizeKeyboard": {
              "default": true,
              "type": "boolean"
            },
            "markdown": {
              "default": false,
              "type": "boolean"
            },
            "formatMode": {
              "default": "none",
              "type": "string",
              "enum": [
                "html",
                "markdown",
                "none"
              ]
            },
            "disableLinkPreview": {
              "default": false,
              "type": "boolean"
            },
            "synonyms": {
              "default": [],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "matchMode": {
              "default": "exact",
              "type": "string",
              "enum": [
                "exact",
                "contains",
                "fuzzy"
              ]
            },
            "adminOnly": {
              "default": false,
              "type": "boolean"
            },
            "requiresAuth": {
              "default": false,
              "type": "boolean"
            },
            "showInMenu": {
              "default": true,
              "type": "boolean"
            },
            "saveCommandArgsTo": {
              "default": "",
              "type": "string"
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
              "default": [],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "targetMessageId": {
              "type": "string"
            },
            "sourceMessageId": {
              "type": "string"
            },
            "messageIdSource": {
              "default": "last_message",
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
              ]
            },
            "messageIdManual": {
              "type": "string"
            },
            "lastNCount": {
              "type": "string"
            },
            "chatIdSource": {
              "default": "current_chat",
              "type": "string",
              "enum": [
                "current_chat",
                "custom"
              ]
            },
            "chatIdManual": {
              "type": "string"
            },
            "ignoreErrors": {
              "type": "boolean"
            },
            "bulkDelete": {
              "default": false,
              "type": "boolean"
            },
            "bulkMessageIdsVariable": {
              "type": "string"
            },
            "sourceMessageIdSource": {
              "default": "current_message",
              "type": "string",
              "enum": [
                "current_message",
                "last_message",
                "manual",
                "variable"
              ]
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
              "default": false,
              "type": "boolean"
            },
            "hideAuthor": {
              "default": false,
              "type": "boolean"
            },
            "targetChatId": {
              "type": "string"
            },
            "targetChatIdSource": {
              "default": "manual",
              "type": "string",
              "enum": [
                "manual",
                "variable",
                "admin_ids"
              ]
            },
            "targetChatVariableName": {
              "type": "string"
            },
            "targetChatTargets": {
              "default": [],
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "targetChatIdSource": {
                    "default": "manual",
                    "type": "string",
                    "enum": [
                      "manual",
                      "variable",
                      "admin_ids"
                    ]
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
                ]
              }
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
              "default": "last_message",
              "type": "string",
              "enum": [
                "manual",
                "variable",
                "last_message",
                "current_user",
                "reply_user",
                "custom"
              ]
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
              "default": "custom",
              "type": "string",
              "enum": [
                "yandex",
                "google",
                "2gis",
                "custom"
              ]
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
              "default": 15,
              "type": "number",
              "minimum": 1,
              "maximum": 20
            },
            "showDirections": {
              "default": false,
              "type": "boolean"
            },
            "generateMapPreview": {
              "default": true,
              "type": "boolean"
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
              "default": [],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "allowsMultipleAnswers": {
              "default": false,
              "type": "boolean"
            },
            "anonymousVoting": {
              "default": true,
              "type": "boolean"
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
              "default": "text",
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
              ]
            },
            "responseType": {
              "default": "text",
              "type": "string",
              "enum": [
                "text",
                "buttons"
              ]
            },
            "responseOptions": {
              "default": [],
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
                    "default": "goto",
                    "type": "string",
                    "enum": [
                      "goto",
                      "command",
                      "url"
                    ]
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
                ]
              }
            },
            "allowMultipleSelection": {
              "default": false,
              "type": "boolean"
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
              "default": true,
              "type": "boolean"
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
              "default": false,
              "type": "boolean"
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
                    "default": "user_data_exists",
                    "type": "string",
                    "enum": [
                      "user_data_exists",
                      "user_data_equals",
                      "user_data_not_exists",
                      "user_data_contains",
                      "first_time",
                      "returning_user"
                    ]
                  },
                  "variableName": {
                    "type": "string"
                  },
                  "variableNames": {
                    "default": [],
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "logicOperator": {
                    "default": "AND",
                    "type": "string",
                    "enum": [
                      "AND",
                      "OR"
                    ]
                  },
                  "expectedValue": {
                    "type": "string"
                  },
                  "messageText": {
                    "type": "string"
                  },
                  "formatMode": {
                    "default": "text",
                    "type": "string",
                    "enum": [
                      "text",
                      "markdown",
                      "html"
                    ]
                  },
                  "keyboardType": {
                    "default": "none",
                    "type": "string",
                    "enum": [
                      "reply",
                      "inline",
                      "none"
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
                          "default": "goto",
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
                          ]
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
                          "default": "normal",
                          "type": "string",
                          "enum": [
                            "normal",
                            "option",
                            "complete"
                          ]
                        },
                        "skipDataCollection": {
                          "default": false,
                          "type": "boolean"
                        },
                        "hideAfterClick": {
                          "default": false,
                          "type": "boolean"
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
                      ]
                    }
                  },
                  "resizeKeyboard": {
                    "default": true,
                    "type": "boolean"
                  },
                  "oneTimeKeyboard": {
                    "default": false,
                    "type": "boolean"
                  },
                  "collectUserInput": {
                    "default": false,
                    "type": "boolean"
                  },
                  "enableTextInput": {
                    "default": false,
                    "type": "boolean"
                  },
                  "enablePhotoInput": {
                    "default": false,
                    "type": "boolean"
                  },
                  "enableVideoInput": {
                    "default": false,
                    "type": "boolean"
                  },
                  "enableAudioInput": {
                    "default": false,
                    "type": "boolean"
                  },
                  "enableDocumentInput": {
                    "default": false,
                    "type": "boolean"
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
                    "default": false,
                    "type": "boolean"
                  },
                  "textInputVariable": {
                    "type": "string"
                  },
                  "nextNodeAfterInput": {
                    "type": "string"
                  },
                  "priority": {
                    "default": 0,
                    "type": "number"
                  }
                },
                "required": [
                  "id",
                  "messageText"
                ]
              }
            },
            "fallbackMessage": {
              "type": "string"
            },
            "saveToDatabase": {
              "default": false,
              "type": "boolean"
            },
            "allowSkip": {
              "default": false,
              "type": "boolean"
            },
            "collectUserInput": {
              "default": false,
              "type": "boolean"
            },
            "inputTargetNodeId": {
              "type": "string"
            },
            "inputButtonType": {
              "default": "inline",
              "type": "string",
              "enum": [
                "inline",
                "reply"
              ]
            },
            "enableAutoTransition": {
              "default": false,
              "type": "boolean"
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
              "default": false,
              "type": "boolean"
            },
            "saveMediaMetadata": {
              "default": false,
              "type": "boolean"
            },
            "mediaMetadataSuffixes": {
              "default": [],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "mediaMetadataCustomNames": {
              "default": {},
              "type": "object",
              "propertyNames": {
                "type": "string"
              },
              "additionalProperties": {
                "type": "string"
              }
            },
            "variableFilters": {
              "default": {},
              "type": "object",
              "propertyNames": {
                "type": "string"
              },
              "additionalProperties": {
                "type": "string"
              }
            },
            "enableUserActions": {
              "default": false,
              "type": "boolean"
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
              "default": false,
              "type": "boolean"
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
              "default": false,
              "type": "boolean"
            },
            "canDeleteMessages": {
              "default": false,
              "type": "boolean"
            },
            "canBanUsers": {
              "default": false,
              "type": "boolean"
            },
            "canInviteUsers": {
              "default": false,
              "type": "boolean"
            },
            "canPinMessages": {
              "default": false,
              "type": "boolean"
            },
            "canAddAdmins": {
              "default": false,
              "type": "boolean"
            },
            "canRestrictMembers": {
              "default": false,
              "type": "boolean"
            },
            "canPromoteMembers": {
              "default": false,
              "type": "boolean"
            },
            "canManageVideoChats": {
              "default": false,
              "type": "boolean"
            },
            "canManageTopics": {
              "default": false,
              "type": "boolean"
            },
            "isAnonymous": {
              "default": false,
              "type": "boolean"
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
              "default": true,
              "type": "boolean"
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
              "default": true,
              "type": "boolean"
            },
            "canSendOtherMessages": {
              "default": true,
              "type": "boolean"
            },
            "canAddWebPagePreviews": {
              "default": true,
              "type": "boolean"
            },
            "canChangeGroupInfo": {
              "default": true,
              "type": "boolean"
            },
            "canInviteUsers2": {
              "default": true,
              "type": "boolean"
            },
            "canPinMessages2": {
              "default": true,
              "type": "boolean"
            },
            "untilDate": {
              "type": "number"
            },
            "adminTargetUserId": {
              "type": "string"
            },
            "adminUserIdSource": {
              "default": "last_message",
              "type": "string",
              "enum": [
                "manual",
                "variable",
                "last_message"
              ]
            },
            "adminUserVariableName": {
              "type": "string"
            },
            "can_manage_chat": {
              "default": false,
              "type": "boolean"
            },
            "can_post_messages": {
              "default": false,
              "type": "boolean"
            },
            "can_edit_messages": {
              "default": false,
              "type": "boolean"
            },
            "can_delete_messages": {
              "default": false,
              "type": "boolean"
            },
            "can_post_stories": {
              "default": false,
              "type": "boolean"
            },
            "can_edit_stories": {
              "default": false,
              "type": "boolean"
            },
            "can_delete_stories": {
              "default": false,
              "type": "boolean"
            },
            "can_manage_video_chats": {
              "default": false,
              "type": "boolean"
            },
            "can_restrict_members": {
              "default": false,
              "type": "boolean"
            },
            "can_promote_members": {
              "default": false,
              "type": "boolean"
            },
            "can_change_info": {
              "default": false,
              "type": "boolean"
            },
            "can_invite_users": {
              "default": false,
              "type": "boolean"
            },
            "can_pin_messages": {
              "default": false,
              "type": "boolean"
            },
            "can_manage_topics": {
              "default": false,
              "type": "boolean"
            },
            "is_anonymous": {
              "default": false,
              "type": "boolean"
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
              "default": "current_chat",
              "type": "string",
              "enum": [
                "manual",
                "variable",
                "current_chat"
              ]
            },
            "adminChatVariableName": {
              "type": "string"
            },
            "attachedMedia": {
              "default": [],
              "type": "array",
              "items": {
                "type": "string"
              }
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
              "default": "bot",
              "type": "string",
              "enum": [
                "bot",
                "client"
              ]
            },
            "broadcastTargetNode": {
              "type": "string"
            },
            "enableBroadcast": {
              "default": false,
              "type": "boolean"
            },
            "enableConfirmation": {
              "default": false,
              "type": "boolean"
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
              "default": "user_session",
              "type": "string"
            },
            "sessionCreated": {
              "default": false,
              "type": "boolean"
            },
            "textSynonyms": {
              "default": [],
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "textMatchType": {
              "default": "exact",
              "type": "string",
              "enum": [
                "exact",
                "contains"
              ]
            },
            "variable": {
              "type": "string"
            },
            "forumChatId": {
              "type": "string"
            },
            "forumChatIdSource": {
              "default": "manual",
              "type": "string",
              "enum": [
                "manual",
                "variable"
              ]
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
              "default": false,
              "type": "boolean"
            },
            "imtChatTypeFilter": {
              "default": "any",
              "type": "string",
              "enum": [
                "any",
                "private",
                "group"
              ]
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
              "default": true,
              "type": "boolean"
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
              "default": "join",
              "type": "string",
              "enum": [
                "join",
                "leave",
                "both"
              ]
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
              "default": [],
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "label": {
                    "default": "",
                    "type": "string"
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
                ]
              }
            },
            "parallelBranches": {
              "default": [],
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "label": {
                    "default": "",
                    "type": "string"
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
                ]
              }
            },
            "maxConcurrent": {
              "default": 5,
              "type": "number"
            },
            "awaitAll": {
              "default": false,
              "type": "boolean"
            },
            "skipIfRunning": {
              "default": true,
              "type": "boolean"
            },
            "counterKey": {
              "type": "string"
            },
            "windowSeconds": {
              "type": "string"
            },
            "messageSendRecipients": {
              "default": [],
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "type": {
                    "default": "user",
                    "type": "string",
                    "enum": [
                      "user",
                      "chat_id",
                      "admin_ids"
                    ]
                  },
                  "chatId": {
                    "type": "string"
                  },
                  "threadId": {
                    "type": "string"
                  },
                  "isGroup": {
                    "default": false,
                    "type": "boolean"
                  },
                  "botToken": {
                    "type": "string"
                  }
                },
                "required": [
                  "id"
                ]
              }
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
              "default": "GET",
              "type": "string",
              "enum": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE"
              ]
            },
            "httpRequestHeaders": {
              "type": "string"
            },
            "httpRequestBody": {
              "type": "string"
            },
            "httpRequestTimeout": {
              "default": 30,
              "type": "number"
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
              "default": "json",
              "type": "string",
              "enum": [
                "json",
                "form-urlencoded",
                "raw"
              ]
            },
            "httpRequestAuthType": {
              "default": "none",
              "type": "string",
              "enum": [
                "none",
                "basic",
                "bearer",
                "header",
                "query"
              ]
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
              "default": "autodetect",
              "type": "string",
              "enum": [
                "autodetect",
                "json",
                "text",
                "file"
              ]
            },
            "httpRequestIgnoreHttpErrors": {
              "default": false,
              "type": "boolean"
            },
            "httpRequestIgnoreSsl": {
              "default": false,
              "type": "boolean"
            },
            "httpRequestFollowRedirects": {
              "default": true,
              "type": "boolean"
            },
            "httpRequestEnablePagination": {
              "default": false,
              "type": "boolean"
            },
            "httpRequestPaginationMode": {
              "default": "interactive",
              "type": "string",
              "enum": [
                "interactive",
                "fetch_all"
              ]
            },
            "httpRequestPaginationOffsetVar": {
              "type": "string"
            },
            "httpRequestPaginationTotalField": {
              "default": "count",
              "type": "string"
            },
            "httpRequestPaginationItemsField": {
              "default": "items",
              "type": "string"
            },
            "httpRequestPaginationLimit": {
              "default": 10,
              "type": "number"
            },
            "httpRequestPaginationMaxPages": {
              "default": 20,
              "type": "number"
            },
            "httpRequestBatchEnabled": {
              "default": false,
              "type": "boolean"
            },
            "httpRequestBatchSource": {
              "type": "string"
            },
            "httpRequestBatchItemVar": {
              "default": "item",
              "type": "string"
            },
            "httpRequestBatchResultVariable": {
              "type": "string"
            },
            "httpRequestBatchResultFields": {
              "default": [],
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
                ]
              }
            },
            "attachedMediaThumbnails": {
              "default": {},
              "type": "object",
              "propertyNames": {
                "type": "string"
              },
              "additionalProperties": {
                "type": "string"
              }
            },
            "query": {
              "default": "",
              "type": "string"
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
              "default": "",
              "type": "string"
            },
            "resultFormat": {
              "default": "first_row",
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
              ]
            },
            "textTemplate": {
              "default": "",
              "type": "string"
            },
            "assignments": {
              "default": [],
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
                    "default": "text",
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
                    ]
                  },
                  "lookupTable": {
                    "default": "",
                    "type": "string"
                  },
                  "lookupField": {
                    "default": "",
                    "type": "string"
                  },
                  "lookupWhere": {
                    "default": [],
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
                      ]
                    }
                  },
                  "replaceWith": {
                    "default": "",
                    "type": "string"
                  },
                  "pattern": {
                    "default": "",
                    "type": "string"
                  },
                  "regexGroup": {
                    "default": "0",
                    "type": "string"
                  },
                  "maxValue": {
                    "default": "",
                    "type": "string"
                  },
                  "separator": {
                    "default": "",
                    "type": "string"
                  },
                  "jsonPath": {
                    "default": "",
                    "type": "string"
                  },
                  "startIndex": {
                    "default": "0",
                    "type": "string"
                  },
                  "endIndex": {
                    "default": "",
                    "type": "string"
                  },
                  "conditionVariable": {
                    "default": "",
                    "type": "string"
                  },
                  "conditionOperator": {
                    "default": "equals",
                    "type": "string"
                  },
                  "conditionValue": {
                    "default": "",
                    "type": "string"
                  },
                  "trueValue": {
                    "default": "",
                    "type": "string"
                  },
                  "falseValue": {
                    "default": "",
                    "type": "string"
                  },
                  "concatWith": {
                    "default": "",
                    "type": "string"
                  },
                  "skipIfEmpty": {
                    "default": "",
                    "type": "string"
                  },
                  "persistToDb": {
                    "default": true,
                    "type": "boolean"
                  }
                },
                "required": [
                  "id",
                  "variable",
                  "value"
                ]
              }
            },
            "convertFileMode": {
              "default": "toFile",
              "type": "string",
              "enum": [
                "toFile"
              ]
            },
            "convertFileInputVariable": {
              "default": "",
              "type": "string"
            },
            "convertFileFormat": {
              "default": "csv",
              "type": "string",
              "enum": [
                "csv",
                "json"
              ]
            },
            "convertFileFileName": {
              "default": "export_{date}.csv",
              "type": "string"
            },
            "convertFileCsvDelimiter": {
              "default": ",",
              "type": "string"
            },
            "convertFileIncludeHeaderRow": {
              "default": true,
              "type": "boolean"
            },
            "convertFileOutputVariable": {
              "default": "",
              "type": "string"
            },
            "code": {
              "default": "",
              "type": "string"
            },
            "apiMethod": {
              "default": "POST",
              "type": "string",
              "enum": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE"
              ]
            },
            "apiPath": {
              "default": "",
              "type": "string"
            },
            "apiSecretToken": {
              "default": "",
              "type": "string"
            },
            "apiSaveBodyTo": {
              "default": "",
              "type": "string"
            },
            "apiSaveQueryTo": {
              "default": "",
              "type": "string"
            },
            "apiSaveHeadersTo": {
              "default": "",
              "type": "string"
            },
            "apiParseJson": {
              "default": true,
              "type": "boolean"
            },
            "apiResponseStatusCode": {
              "default": 200,
              "type": "number"
            },
            "apiResponseBody": {
              "default": "{\"ok\":true}",
              "type": "string"
            },
            "apiResponseContentType": {
              "default": "application/json",
              "type": "string",
              "enum": [
                "application/json",
                "text/plain",
                "text/html"
              ]
            },
            "apiResponseHeaders": {
              "default": [],
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
                ]
              }
            },
            "invoiceTitle": {
              "default": "",
              "type": "string"
            },
            "invoiceDescription": {
              "default": "",
              "type": "string"
            },
            "invoiceAmount": {
              "default": "1",
              "type": "string"
            },
            "invoicePrices": {
              "default": [],
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
                ]
              }
            },
            "invoiceCurrency": {
              "default": "XTR",
              "type": "string"
            },
            "invoiceProviderSource": {
              "default": "inline",
              "type": "string"
            },
            "invoiceProviderToken": {
              "default": "",
              "type": "string"
            },
            "invoiceProviderTokenEnv": {
              "default": "PAYMENT_PROVIDER_TOKEN",
              "type": "string"
            },
            "invoiceNeedName": {
              "default": false,
              "type": "boolean"
            },
            "invoiceNeedEmail": {
              "default": false,
              "type": "boolean"
            },
            "invoiceNeedPhone": {
              "default": false,
              "type": "boolean"
            },
            "invoiceNeedShipping": {
              "default": false,
              "type": "boolean"
            },
            "invoiceIsFlexible": {
              "default": false,
              "type": "boolean"
            },
            "invoiceSendPhoneToProvider": {
              "default": false,
              "type": "boolean"
            },
            "invoiceSendEmailToProvider": {
              "default": false,
              "type": "boolean"
            },
            "invoiceProtectContent": {
              "default": false,
              "type": "boolean"
            },
            "invoiceMaxTipAmount": {
              "default": "",
              "type": "string"
            },
            "invoiceSuggestedTipAmounts": {
              "default": "",
              "type": "string"
            },
            "invoiceProviderData": {
              "default": "",
              "type": "string"
            },
            "invoiceStartParameter": {
              "default": "",
              "type": "string"
            },
            "invoiceSubscription": {
              "default": false,
              "type": "boolean"
            },
            "invoicePhotoUrl": {
              "default": "",
              "type": "string"
            },
            "invoicePhotoSize": {
              "default": "",
              "type": "string"
            },
            "invoicePhotoWidth": {
              "default": "",
              "type": "string"
            },
            "invoicePhotoHeight": {
              "default": "",
              "type": "string"
            },
            "invoiceMessageThreadId": {
              "default": "",
              "type": "string"
            },
            "invoiceDirectMessagesTopicId": {
              "default": "",
              "type": "string"
            },
            "invoiceDisableNotification": {
              "default": false,
              "type": "boolean"
            },
            "invoiceReplyToMessageId": {
              "default": "",
              "type": "string"
            },
            "invoiceMessageEffectId": {
              "default": "",
              "type": "string"
            },
            "invoiceAllowPaidBroadcast": {
              "default": false,
              "type": "boolean"
            },
            "invoiceSuggestedPostParams": {
              "default": "",
              "type": "string"
            },
            "invoicePayload": {
              "default": "",
              "type": "string"
            },
            "savePaymentAmountTo": {
              "default": "",
              "type": "string"
            },
            "savePaymentChargeIdTo": {
              "default": "",
              "type": "string"
            },
            "saveOrderNameTo": {
              "default": "",
              "type": "string"
            },
            "saveOrderEmailTo": {
              "default": "",
              "type": "string"
            },
            "saveOrderPhoneTo": {
              "default": "",
              "type": "string"
            },
            "saveInvoiceLinkTo": {
              "default": "",
              "type": "string"
            },
            "afterPaymentTo": {
              "default": "",
              "type": "string"
            },
            "preCheckoutMode": {
              "default": "always",
              "type": "string"
            },
            "preCheckoutVariable": {
              "default": "",
              "type": "string"
            },
            "preCheckoutOperator": {
              "default": "filled",
              "type": "string"
            },
            "preCheckoutValue": {
              "default": "",
              "type": "string"
            },
            "preCheckoutValue2": {
              "default": "",
              "type": "string"
            },
            "preCheckoutErrorMessage": {
              "default": "",
              "type": "string"
            },
            "refundUserSource": {
              "default": "current_user",
              "type": "string"
            },
            "refundUserId": {
              "default": "",
              "type": "string"
            },
            "refundChargeId": {
              "default": "",
              "type": "string"
            },
            "refundMsgEmpty": {
              "default": "Пожалуйста, укажите код покупки: /back КОД",
              "type": "string"
            },
            "refundMsgNotFound": {
              "default": "Такой код покупки не найден. Проверьте данные и попробуйте снова.",
              "type": "string"
            },
            "refundMsgAlreadyRefunded": {
              "default": "За эту покупку уже ранее был произведён возврат.",
              "type": "string"
            },
            "refundEmptyTarget": {
              "default": "",
              "type": "string"
            },
            "refundNotFoundTarget": {
              "default": "",
              "type": "string"
            },
            "refundAlreadyRefundedTarget": {
              "default": "",
              "type": "string"
            },
            "subscriptionUserSource": {
              "default": "current_user",
              "type": "string"
            },
            "subscriptionUserId": {
              "default": "",
              "type": "string"
            },
            "subscriptionChargeId": {
              "default": "",
              "type": "string"
            },
            "subscriptionAction": {
              "default": "cancel",
              "type": "string"
            },
            "subscriptionMsgEmpty": {
              "default": "Укажите код покупки подписки",
              "type": "string"
            },
            "subscriptionMsgError": {
              "default": "Не удалось изменить автопродление. Проверьте код покупки.",
              "type": "string"
            },
            "subscriptionEmptyTarget": {
              "default": "",
              "type": "string"
            },
            "subscriptionErrorTarget": {
              "default": "",
              "type": "string"
            },
            "saveStarBalanceTo": {
              "default": "star_balance",
              "type": "string"
            },
            "balanceMsgError": {
              "default": "Не удалось получить баланс звёзд",
              "type": "string"
            },
            "balanceErrorTarget": {
              "default": "",
              "type": "string"
            }
          },
          "additionalProperties": {}
        }
      },
      "additionalProperties": false,
      "description": "Только изменяемые поля: position, data, type"
    },
    "sheet_id": {
      "description": "ID листа (иначе автопоиск по всем листам)",
      "type": "string"
    },
    "commit_message": {
      "description": "Заметка к версии (ручной чекпоинт)",
      "type": "string"
    }
  },
  "required": [
    "project_id",
    "node_id",
    "patch"
  ]
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
  "$schema": "http://json-schema.org/draft-07/schema#",
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
              "exclusiveMinimum": 0,
              "maximum": 9007199254740991
            },
            "revision": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            }
          },
          "required": [
            "confirmed"
          ],
          "additionalProperties": false
        },
        "sideEffects": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
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
    "data",
    "execution"
  ],
  "additionalProperties": false
}
```

## Ограничения и безопасность

Изучите describe_actions, проверьте реальные ID и права проекта. Для разрушительных и внешних действий требуется явное намерение пользователя. Для повторов сохраняйте requestId, если он объявлен. Отсутствие ошибки транспорта не доказывает сохранение.
