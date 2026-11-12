"""@fileoverview Проверки общего пространства имён ленивых моделей aiogram."""
from __future__ import annotations

import sys
import unittest


class SharedNamespacesTest(unittest.TestCase):
    """Проверяет экономию словарей без изменения разрешения ссылок моделей."""

    def test_shared_namespaces_survive_all_model_rebuilds(self):
        """Собирает все модели и проверяет сохранность общих имён и их объектов."""
        import lazy_aiogram

        self.assertTrue(lazy_aiogram.enable())
        import aiogram.methods as methods
        import aiogram.types as types
        from pydantic import BaseModel

        models = [
            getattr(module, name)
            for module in (types, methods)
            for name in module.__all__
            if isinstance(getattr(module, name), type)
            and issubclass(getattr(module, name), BaseModel)
        ]
        namespaces = [model.__pydantic_parent_namespace__ for model in models]
        unique = {id(namespace): namespace for namespace in namespaces}
        snapshots = {
            identity: {name: id(value) for name, value in namespace.items()}
            for identity, namespace in unique.items()
        }
        duplicated_bytes = sum(sys.getsizeof(namespace) for namespace in namespaces)
        shared_bytes = sum(sys.getsizeof(namespace) for namespace in unique.values())
        self.assertLess(len(unique), len(models) // 2)
        self.assertGreater(duplicated_bytes - shared_bytes, 4 * 1024 * 1024)
        for model in models:
            with self.subTest(model=model.__name__):
                model.model_rebuild(raise_errors=True)
                self.assertTrue(model.__pydantic_complete__)
        for identity, namespace in unique.items():
            self.assertEqual(
                snapshots[identity], {name: id(value) for name, value in namespace.items()}
            )


if __name__ == "__main__":
    unittest.main()
