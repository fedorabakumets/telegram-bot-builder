# mute_user — Ограничить участника

Новый блок по умолчанию запрещает все права ниже.

```json
{
  "id": "mute-1",
  "type": "mute_user",
  "position": { "x": 400, "y": 300 },
  "data": {
    "duration": 3600,
    "reason": "Нарушение правил группы",
    "canSendMessages": false,
    "canSendAudios": false,
    "canSendDocuments": false,
    "canSendPhotos": false,
    "canSendVideos": false,
    "canSendVideoNotes": false,
    "canSendVoiceNotes": false,
    "canSendPolls": false,
    "canSendOtherMessages": false,
    "canAddWebPagePreviews": false,
    "canReactToMessages": false,
    "canChangeGroupInfo": false,
    "canInviteUsers2": false,
    "canPinMessages2": false
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `duration` | number | Длительность в секундах |
| `canSendMessages` | boolean | Текст |
| `canSendAudios` | boolean | Аудио |
| `canSendDocuments` | boolean | Документы |
| `canSendPhotos` | boolean | Фото |
| `canSendVideos` | boolean | Видео |
| `canSendVideoNotes` | boolean | Кружки |
| `canSendVoiceNotes` | boolean | Голосовые |
| `canSendPolls` | boolean | Опросы |
| `canSendOtherMessages` | boolean | Стикеры и GIF |
| `canAddWebPagePreviews` | boolean | Предпросмотр ссылок |
| `canReactToMessages` | boolean | Реакции |
| `canChangeGroupInfo` | boolean | Описание группы |
| `canInviteUsers2` | boolean | Приглашения |
| `canPinMessages2` | boolean | Закрепление |
