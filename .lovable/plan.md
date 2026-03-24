

# План: Показать онлайн-пользователей админу

## Подход

Использовать **Supabase Realtime Presence** — каждый авторизованный пользователь при загрузке сайта подключается к общему каналу `online-users` и отслеживает presence. Админ в аналитике видит количество онлайн в реальном времени.

## Изменения

### 1. Таблица `user_presence` (миграция)
```sql
CREATE TABLE public.user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
-- Все авторизованные могут upsert свою запись
-- Админы видят все записи
```
Пользователь обновляет `last_seen_at` каждые 60 секунд. "Онлайн" = `last_seen_at` в последние 2 минуты.

### 2. `src/hooks/usePresence.ts` (создать)
- При авторизации: `upsert` в `user_presence` каждые 60 сек
- При выходе/закрытии: cleanup через `beforeunload`
- Использовать в `Layout.tsx` чтобы работало на всех страницах

### 3. `src/components/layout/Layout.tsx`
- Подключить `usePresence()` для всех авторизованных пользователей

### 4. `src/components/admin/AdminAnalyticsTab.tsx`
- Добавить карточку "Онлайн сейчас" — запрос `user_presence` где `last_seen_at > now() - 2 минуты`
- Зелёная точка + число онлайн пользователей
- Автообновление каждые 30 секунд

### 5. `src/lib/i18n.ts`
- Ключи: `admin.onlineNow`, `admin.usersOnline`

## Файлы

| Файл | Действие |
|------|----------|
| Миграция БД | Таблица `user_presence` |
| `src/hooks/usePresence.ts` | Создать — heartbeat presence |
| `src/components/layout/Layout.tsx` | Подключить usePresence |
| `src/components/admin/AdminAnalyticsTab.tsx` | Карточка "Онлайн" |
| `src/lib/i18n.ts` | Новые ключи |

