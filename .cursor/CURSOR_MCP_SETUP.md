# Настройка MCP в Cursor

## Шаг 1: Откройте настройки Cursor
1. Нажмите `Ctrl + ,` (или `Cmd + ,` на Mac)
2. Или через меню: File → Preferences → Settings

## Шаг 2: Найдите настройки MCP
1. В поиске настроек введите: `mcp`
2. Или найдите раздел "MCP" в настройках

## Шаг 3: Добавьте конфигурацию MCP
Скопируйте содержимое файла `.cursor/mcp-config.json` в настройки MCP:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "C:\\Projects\\production-gantt"],
      "env": {
        "ALLOWED_DIRECTORIES": "C:\\Projects\\production-gantt"
      }
    },
    "browser": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-browser"],
      "env": {
        "HEADLESS": "false",
        "BROWSER_TIMEOUT": "30000"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_DIR": "C:\\Projects\\production-gantt\\.cursor\\memory"
      }
    },
    "git": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-git", "--repository", "C:\\Projects\\production-gantt"],
      "env": {
        "GIT_REPOSITORY": "C:\\Projects\\production-gantt"
      }
    }
  }
}
```

## Шаг 4: Перезапустите Cursor
1. Закройте Cursor полностью
2. Запустите Cursor снова
3. Откройте проект `C:\Projects\production-gantt`

## Шаг 5: Проверьте работу MCP
1. Откройте чат с AI агентом
2. Попросите агента создать файл в новой папке
3. Агент должен автоматически создать папку если её нет

## Если не работает:
1. Убедитесь что MCP серверы установлены: `npm list -g | grep modelcontextprotocol`
2. Проверьте что пути в конфигурации правильные
3. Перезапустите Cursor еще раз
