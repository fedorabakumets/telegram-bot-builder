"""Проверяем почему ferma не подставилась — смотрим ответ API."""
import asyncio
import aiohttp
import json


async def main():
    async with aiohttp.ClientSession() as session:
        # Проверяем ferma.cc
        async with session.get("https://ferma.cc/valuta.json", timeout=aiohttp.ClientTimeout(total=15)) as resp:
            data = await resp.json(content_type=None)
            
            # Проверяем путь exchange.48.to.55 (ЮMoney → USDT)
            exchange = data.get("exchange", {})
            from_48 = exchange.get("48", {})
            print(f"ferma.cc exchange.48 exists: {bool(from_48)}")
            if from_48:
                to_data = from_48.get("to", {})
                val_55 = to_data.get("55")
                print(f"ferma.cc exchange.48.to.55 = {val_55}")
            else:
                # Может быть строковый ключ
                from_48_str = exchange.get(48, {})
                print(f"ferma.cc exchange[48] (int key): {bool(from_48_str)}")
                # Покажем какие ключи есть
                keys = list(exchange.keys())[:10]
                print(f"ferma.cc exchange keys (first 10): {keys}")


asyncio.run(main())
