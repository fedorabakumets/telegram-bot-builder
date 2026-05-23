"""
@fileoverview Нажимает BTC → Купить BTC в CryptoFlow
"""
import asyncio
from telethon import TelegramClient
from telethon.tl.types import ReplyInlineMarkup
from telethon.tl.functions.messages import GetBotCallbackAnswerRequest

API_ID = 19827705
API_HASH = "52359acb7208f952fb68fd5c2c32cbec"
SESSION = r"c:\Users\1\Desktop\telegram-bot-builder\bots\клон\scrape_session"

async def click_btn(client, bot, msg_id, text_match, wait=4):
    msg = await client.get_messages(bot, ids=msg_id)
    if not msg or not msg.reply_markup or not isinstance(msg.reply_markup, ReplyInlineMarkup):
        print(f"  No inline KB on msg {msg_id}")
        return None
    for row in msg.reply_markup.rows:
        for b in row.buttons:
            if text_match in b.text and hasattr(b, "data") and b.data:
                print(f"  Clicking: [{b.text}]")
                try:
                    await client(GetBotCallbackAnswerRequest(peer=bot, msg_id=msg_id, data=b.data))
                except Exception as e:
                    print(f"  err: {e}")
                await asyncio.sleep(wait)
                updated = await client.get_messages(bot, ids=msg_id)
                return updated
    print(f"  Button '{text_match}' not found")
    return None

async def main():
    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.start()
    bot = await client.get_entity("@Crypto_Flow_exchange_bot")

    # /start
    print(">>> /start")
    await client.send_message(bot, "/start")
    await asyncio.sleep(4)
    msgs = await client.get_messages(bot, limit=1)
    msg = msgs[0]
    msg_id = msg.id
    print(f"  [{msg_id}] {(msg.text or '')[:100]}")

    # Click BTC
    print("\n>>> Click BTC")
    updated = await click_btn(client, bot, msg_id, "BTC", wait=4)
    if updated:
        print(f"  [{updated.id}] {(updated.text or '')[:200]}")

    # Click Купить BTC
    print("\n>>> Click Купить BTC")
    updated = await click_btn(client, bot, msg_id, "Купить BTC", wait=4)
    if updated:
        print(f"  [{updated.id}] {(updated.text or '')[:300]}")
        if updated.reply_markup and isinstance(updated.reply_markup, ReplyInlineMarkup):
            btns = [[bb.text for bb in r.buttons] for r in updated.reply_markup.rows]
            print(f"  Buttons: {btns}")

    await client.disconnect()

asyncio.run(main())
