"""@fileoverview Адресные проверки доставки и изоляции Redis-пробы на локальном сервере."""
import asyncio
import json
import os
import unittest

from runtime_stress_redis import RedisProbe


@unittest.skipUnless(os.environ.get('TBB_STRESS_REDIS_URL'), 'Нужен изолированный локальный Redis')
class RedisDeliveryTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет реальные публикации без изменения ключей Redis."""

    async def test_concurrent_deliveries_are_counted_per_bot(self):
        """Обнаруживает повтор sequence и смешивание каналов при параллельных логах."""
        probe = RedisProbe(os.environ['TBB_STRESS_REDIS_URL'], [100001, 100002])
        await probe.start()
        clients = [probe.client(token_id) for token_id in (100001, 100002)]
        try:
            await asyncio.gather(*[
                clients[index].publish(f'bot:logs:1:{token_id}',
                                       json.dumps({'tokenId': token_id, 'message': str(sequence)}))
                for index, token_id in enumerate((100001, 100002)) for sequence in range(5)
            ])
        finally:
            for client in clients:
                await client.aclose()
            report = await probe.finish()
        self.assertTrue(report['ok'], report)
        self.assertEqual(report['receivedPerBot'], {100001: 5, 100002: 5})
        self.assertEqual(report['publishedPerBot'], report['receivedPerBot'])
        self.assertEqual(report['clientsOpened'], 2)
        self.assertEqual(report['clientsClosed'], 2)

    async def test_wrong_owner_marks_report_failed(self):
        """Не позволяет проглотить ошибку publish и выдать нулевую доставку за успех."""
        probe = RedisProbe(os.environ['TBB_STRESS_REDIS_URL'], [100001])
        await probe.start()
        client = probe.client(100001)
        try:
            with self.assertRaises(ValueError):
                await client.publish('bot:logs:1:100002', json.dumps({'tokenId': 100002}))
        finally:
            await client.aclose()
            report = await probe.finish()
        self.assertFalse(report['ok'], report)
        self.assertTrue(report['deliveryErrors'])


if __name__ == '__main__':
    unittest.main()
