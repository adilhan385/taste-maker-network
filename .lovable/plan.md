

# План: Расширенные возможности администратора

## Что будет сделано

1. **Блокировка пользователей** (навсегда или временно)
2. **Управление продуктами** (просмотр, удаление любых блюд)
3. **Просмотр документов** через signed URLs (исправление проблемы с фотками)
4. **Управление пользователями** (список всех пользователей с поиском)

## Изменения в базе данных

### Миграция: таблица `user_bans`
```sql
CREATE TABLE public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  banned_by uuid NOT NULL,
  reason text,
  banned_until timestamptz, -- NULL = навсегда
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bans" ON public.user_bans
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own bans" ON public.user_bans
  FOR SELECT USING (auth.uid() = user_id);
```

## Новые компоненты

### `src/components/admin/AdminUsersTab.tsx`
- Загрузка всех профилей из `profiles` + `user_roles`
- Поиск по имени/email
- Кнопки: заблокировать на время (выбор срока) / навсегда / разблокировать
- Показ текущего статуса бана
- Роль пользователя (buyer/cook/admin)

### `src/components/admin/AdminProductsTab.tsx`
- Загрузка всех продуктов с именем повара
- Поиск по названию/повару
- Кнопка удаления продукта
- Превью фото блюда

## Обновления существующих файлов

### `src/components/admin/ChefApplicationsTab.tsx`
- Документы (паспорт, мед.книжка, фото) загружать через **signed URLs** вместо прямых ссылок
- Использовать `supabase.storage.from('chef-documents').createSignedUrl(path, 3600)` для генерации временных ссылок
- Показывать превью фото прямо в диалоге

### `src/pages/AdminPanel.tsx`
- Подключить `AdminUsersTab` и `AdminProductsTab` к соответствующим вкладкам
- Вкладка Users и Products станут рабочими

### Проверка бана при входе
- В `src/contexts/AuthContext.tsx` — при авторизации проверять таблицу `user_bans` (активный бан = `banned_until IS NULL` или `banned_until > now()`). Если забанен — показывать сообщение и выходить.

## Файлы

| Файл | Действие |
|------|----------|
| Миграция БД | Создать таблицу `user_bans` |
| `src/components/admin/AdminUsersTab.tsx` | Создать |
| `src/components/admin/AdminProductsTab.tsx` | Создать |
| `src/components/admin/ChefApplicationsTab.tsx` | Исправить просмотр документов через signed URLs |
| `src/pages/AdminPanel.tsx` | Подключить новые вкладки |
| `src/contexts/AuthContext.tsx` | Проверка бана при входе |

