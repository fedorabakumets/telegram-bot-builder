# Keyboard-нода

Keyboard хранит кнопки и их действия. `goto` ведёт на `target`, `url` открывает ссылку, а `callback`-ввод можно направить на `input` с `inputType: "callback"`.

Текст кнопки и callback_data — разные значения. Если значение нужно сохранить, укажи это через схему callback/input, а не через выдуманное поле. После изменений используй `db_report_button_navigation`.
