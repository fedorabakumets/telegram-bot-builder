"""Проверяет атомарные операции блокировки шаблона на настоящем Redis."""

import os
from pathlib import Path
import re
import unittest
import uuid

import redis.asyncio as redis


@unittest.skipUnless(os.environ.get('TEST_REDIS_URL'), 'Не задан адрес тестового Redis')
class RedisLockIntegrationTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет продление и удаление блокировки её владельцем."""

    async def test_ownership(self):
        """Старый владелец не может продлить или удалить чужую блокировку."""
        source = Path('lib/templates/main/main.py.jinja2').read_text(encoding='utf-8')
        scripts = re.findall(r'"(if redis\.call\(\'get\'.*?end)"', source)
        renew = next(script for script in scripts if "'expire'" in script)
        release = next(script for script in scripts if "'del'" in script)
        client = redis.from_url(os.environ['TEST_REDIS_URL'])
        key = f'botcraft:test:lock:{uuid.uuid4().hex}'
        try:
            self.assertTrue(await client.set(key, 'new-owner', nx=True, ex=60))
            self.assertEqual(await client.eval(renew, 1, key, 'old-owner'), 0)
            self.assertEqual(await client.eval(release, 1, key, 'old-owner'), 0)
            self.assertEqual(await client.get(key), b'new-owner')
            self.assertEqual(await client.eval(renew, 1, key, 'new-owner'), 1)
            self.assertEqual(await client.eval(release, 1, key, 'new-owner'), 1)
            self.assertIsNone(await client.get(key))
        finally:
            await client.delete(key)
            await client.aclose()


if __name__ == '__main__':
    unittest.main()
