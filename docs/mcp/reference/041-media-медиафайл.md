# media — медиафайл

```json
{
  "type": "media",
  "data": {
    "attachedMedia": [
      "https://example.com/clip.mp4",
      "https://example.com/anim.gif"
    ],
    "sendAsGifUrls": ["https://example.com/clip.mp4"],
    "enableAutoTransition": true,
    "autoTransitionTo": "next_node_id"
  }
}
```

У блока нет текста. `sendAsGifUrls` — только видео, которые нужно послать как GIF. `.gif` в список не клади. Подпись `mediaCaption` у нового медиафайла не задаётся; она остаётся только если проект перенёс старый узел `animation`.
