import re

files = {
    'lib/bot-generator/user-input/navigateaftersave.ts': [
        (
            "code += '                    import types as aiogram_types\\n';\n    code += '                    fake_callback = aiogram_types.SimpleNamespace(\\n';",
            "code += '                    fake_callback = SimpleNamespace(\\n';"
        ),
    ],
    'lib/bot-generator/user-input/skipDataCollection.ts': [
        (
            "code += '                import types as aiogram_types\\n';\n            code += '                fake_callback = aiogram_types.SimpleNamespace(\\n';",
            "code += '                fake_callback = SimpleNamespace(\\n';"
        ),
    ],
    'lib/bot-generator/user-input/multiselect-check.ts': [
        (
            "code += '                import types as aiogram_types\\n';\n                            code += '                fake_callback = aiogram_types.SimpleNamespace(\\n';",
            "code += '                fake_callback = SimpleNamespace(\\n';"
        ),
    ],
    'lib/bot-generator/user-input/generate-skip-navigation.ts': [
        (
            "import types as aiogram_types\\n`;\n  code += `${indent}        fake_callback = aiogram_types.SimpleNamespace(",
            "fake_callback = SimpleNamespace("
        ),
    ],
    'lib/bot-generator/user-input/generate-skip-buttons-check.ts': [
        (
            "import types as aiogram_types\\n`;\n  code += `${indent}        fake_callback = aiogram_types.SimpleNamespace(",
            "fake_callback = SimpleNamespace("
        ),
    ],
    'lib/bot-generator/transitions/navigation/generate-navigation-to-node.ts': [
        (
            "from types import SimpleNamespace\\n`;\n    code += `${indent}fake_message = SimpleNamespace()",
            "fake_message = SimpleNamespace()"
        ),
    ],
    'lib/bot-generator/transitions/generate-command-navigation.ts': [
        (
            "from types import SimpleNamespace\\n`;\n  code += `${indent}fake_message = SimpleNamespace()",
            "fake_message = SimpleNamespace()"
        ),
    ],
    'lib/bot-generator/node-navigation/handle-command-node.ts': [
        (
            "from types import SimpleNamespace\\n`;\n  code += `${bodyIndent}fake_message = SimpleNamespace()",
            "fake_message = SimpleNamespace()"
        ),
    ],
    'lib/bot-generator/node-navigation/handle-auto-transition.ts': [
        (
            "import types as aiogram_types\\n`;\n  code += `${bodyIndent}async def noop",
            "async def noop"
        ),
    ],
    'lib/generate/generateNodeNavigation.ts': [
        (
            "import types as aiogram_types\\n`;\n          code += `${baseIndent}    fake_callback = aiogram_types.SimpleNamespace(",
            "fake_callback = SimpleNamespace("
        ),
    ],
}

for filepath, replacements in files.items():
    try:
        with open(filepath, encoding='utf-8') as f:
            content = f.read()
        original = content
        for old, new in replacements:
            content = content.replace(old, new)
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'FIXED: {filepath}')
        else:
            print(f'NO MATCH: {filepath}')
    except Exception as e:
        print(f'ERROR {filepath}: {e}')
