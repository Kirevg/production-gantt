# Настройки кодировки Git и VS Code/Cursor

## 📊 ТЕКУЩИЕ НАСТРОЙКИ (Рабочий компьютер)

### Проверим текущие настройки:
```bash
# Выполнить эти команды для проверки:
git config --global --list | findstr -i "autocrlf\|quotepath\|encoding"
git config --list | findstr -i "autocrlf\|quotepath\|encoding"
```

### Текущие настройки PowerShell:
```powershell
# Проверить кодировку:
[Console]::OutputEncoding
chcp
```

### Текущие настройки VS Code/Cursor:
- Проверить файл `.vscode/settings.json`
- Проверить глобальные настройки редактора

### 📝 РЕЗУЛЬТАТЫ ПРОВЕРКИ (Рабочий компьютер):
```
# Вставить сюда результаты команд:
# git config --global --list | findstr -i "autocrlf\|quotepath\|encoding"
# git config --list | findstr -i "autocrlf\|quotepath\|encoding"
# [Console]::OutputEncoding
# chcp
```

---

## 🔧 РЕКОМЕНДУЕМЫЕ НАСТРОЙКИ (для Домашнего компьютера)

### 1. Глобальные настройки Git:
```bash
git config --global core.autocrlf false
git config --global core.quotepath false
git config --global i18n.filesencoding utf-8
git config --global i18n.commitencoding utf-8
```

### 2. Локальные настройки проекта:
```bash
git config core.autocrlf false
git config core.quotepath false
git config i18n.filesencoding utf-8
git config i18n.commitencoding utf-8
```

## 🔧 Настройки VS Code/Cursor

### 1. Создать файл `.vscode/settings.json`:
```json
{
    "files.encoding": "utf8",
    "git.terminalEncoding": "utf8",
    "terminal.integrated.encoding": "utf8",
    "files.autoGuessEncoding": true
}
```

### 2. Настройки PowerShell:
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```

## 🔍 Проверка текущих настроек

### Проверить настройки Git:
```bash
git config --global --list | findstr -i "autocrlf\|quotepath\|encoding"
git config --list | findstr -i "autocrlf\|quotepath\|encoding"
```

### Проверить кодировку файлов:
```bash
file -i restart-servers.ps1
```

## 🎯 Ожидаемый результат

После применения настроек:
- ✅ Русские символы в коммитах отображаются правильно
- ✅ Файлы сохраняются в UTF-8
- ✅ PowerShell корректно отображает русский текст
- ✅ VS Code/Cursor правильно интерпретирует кодировку

## 📊 СРАВНЕНИЕ НАСТРОЕК

### Рабочий компьютер (текущий):
- ❓ Файл `restart-servers.ps1` отображается с кракозябрами
- ❓ Коммиты с русским текстом показывают кракозябры
- ❓ PowerShell неправильно интерпретирует UTF-8

### Домашний компьютер (другой):
- ❓ Файл `restart-servers.ps1` отображается правильно
- ❓ Коммиты с русским текстом работают корректно
- ❓ PowerShell правильно работает с UTF-8

### 🔍 ПЛАН СРАВНЕНИЯ:
1. **Собрать данные** с обоих компьютеров
2. **Сравнить результаты** команд проверки
3. **Найти различия** в настройках Git
4. **Проверить настройки** VS Code/Cursor
5. **Сравнить версии** Git и PowerShell
6. **Определить**, где правильные настройки
7. **Применить** правильные настройки на проблемном компьютере

## 📝 Примечания

- Настройки `core.autocrlf=false` предотвращают автоматическое преобразование окончаний строк
- Настройки `core.quotepath=false` предотвращают экранирование русских символов
- Настройки `i18n.filesencoding=utf-8` устанавливают UTF-8 как кодировку по умолчанию

## ✅ Тестовое изменение для создания снапшота
## 🎯 Проверка работы UTF-8 кодировки в PowerShell
