# Подключение к новой базе данных `gantt_db`

1. **После синхронизации репозитория** выполните `git pull` в рабочей копии.
2. **Отредактируйте локальный файл `.env`** (расположен в корне проекта). Убедитесь, что строка выглядит так:
   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_bz4pEY7oJCaw@91.184.246.137:5432/gantt_db
   ```
   Если используется переменная `SHADOW_DATABASE_URL`, укажите `gantt_db_shadow`.
3. **Перезапустите сервисы** командой `C:\Projects\production-gantt\restart-servers.ps1`.
4. **Проверка через DBeaver (при необходимости):**
   - Host: `91.184.246.137`
   - Port: `5432`
   - Database: `gantt_db`
   - User: `neondb_owner`
   - Password: `npg_bz4pEY7oJCaw`

После выполнения шагов приложение будет работать с новой базой данных на VDSina.
