

# План: Большое обновление (6 задач)

Запрос включает много изменений. Разобьём на части:

## 1. Убрать ВСЕ dietary-категории (Vegetarian, Vegan, Gluten-free)

**Файлы:**
- `src/pages/Catalog.tsx` — удалить `dietaryOptions`, убрать фильтр dietary из UI и из `filteredDishes`, убрать `selectedDietary` state
- `src/components/catalog/DishCard.tsx` — убрать блок с dietary badges
- `src/components/chef/ChefDishesTab.tsx` — убрать `dietaryOptions` из формы создания блюда
- Mock-данные: убрать `dietary` из mock dishes

## 2. Исправить непереведённые места

Нужно проверить и исправить хардкод-строки на английском в:
- `src/components/admin/ChefApplicationsTab.tsx` — "Pending", "Approved", "Rejected", "Phone", "Address", etc.
- `src/components/admin/AdminUsersTab.tsx` — хардкод-строки
- `src/components/admin/AdminProductsTab.tsx` — хардкод-строки на русском ("блюд", "Повар:")
- `src/pages/Chat.tsx` — "Please log in to access your messages", "No conversations yet"
- `src/pages/AdminPanel.tsx` — "Access Denied", "Manage your platform"
- Добавить недостающие ключи в `src/lib/i18n.ts`

## 3. Админ: отмена заказов и возврат денег

**Миграция БД:** не нужна — админ уже может UPDATE orders (RLS policy есть)

**Файл:** `src/pages/AdminPanel.tsx` — активировать вкладку "Orders"

**Новый файл:** `src/components/admin/AdminOrdersTab.tsx`
- Список всех заказов с фильтрами по статусу
- Кнопка "Отменить заказ" — меняет статус на `cancelled`
- Кнопка "Возврат" — возвращает деньги в кошелёк покупателя (update wallet balance + wallet_transaction)

## 4. Система рангов поваров (Bronze/Silver/Gold/Diamond)

**Миграция БД:**
```sql
-- Add rank column to profiles or create chef_ranks table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS chef_rank text DEFAULT 'bronze';
-- Better: add to a separate mapping or to profiles
CREATE TABLE public.chef_ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id uuid NOT NULL UNIQUE,
  rank text NOT NULL DEFAULT 'bronze' CHECK (rank IN ('bronze','silver','gold','diamond')),
  assigned_by uuid,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.chef_ranks ENABLE ROW LEVEL SECURITY;
-- Everyone can read ranks, admins manage
CREATE POLICY "Anyone can view ranks" ON public.chef_ranks FOR SELECT USING (true);
CREATE POLICY "Admins manage ranks" ON public.chef_ranks FOR ALL USING (has_role(auth.uid(), 'admin'));
```

**Файлы:**
- `src/components/admin/AdminUsersTab.tsx` — добавить кнопку назначения ранга (dropdown: bronze/silver/gold/diamond) для поваров
- `src/pages/Catalog.tsx` — загружать ранги поваров, сортировать блюда: diamond > gold > silver > bronze
- `src/components/catalog/DishCard.tsx` — показывать бейдж ранга рядом с именем повара

## 5. Рабочий чат (покупатель ↔ повар, админ видит все)

**Миграция БД:**
```sql
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own received" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Admins can view all messages" ON public.chat_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
```

**Файлы:**
- `src/pages/Chat.tsx` — полностью переписать:
  - Левая панель: список собеседников (из chat_messages)
  - Правая панель: история сообщений + поле ввода
  - Realtime подписка на новые сообщения
  - Покупатель может начать чат с повара из каталога (кнопка на DishCard)
- `src/components/catalog/DishCard.tsx` — добавить кнопку "Написать повару"
- `src/pages/AdminPanel.tsx` — вкладка "Chats" показывает все чаты (read-only)

## 6. Фото в заявках повара — исправить

Сейчас `ProfilePhoto` компонент использует signed URLs, но фото в списке заявок обрезается (16x16 контейнер с 24x24 фото). Нужно:
- `src/components/admin/ChefApplicationsTab.tsx` — исправить размер контейнера в списке (w-16 h-16 → совпадает с ProfilePhoto w-24 h-24), либо сделать ProfilePhoto адаптивным
- Добавить превью для документов (passport, medical cert) в диалоге — показывать как картинки, не только кнопки

## Файлы (сводка)

| Файл | Действие |
|------|----------|
| Миграция: `chef_ranks` + `chat_messages` | Создать |
| `src/pages/Catalog.tsx` | Убрать dietary, добавить ранги, сортировку |
| `src/components/catalog/DishCard.tsx` | Убрать dietary, добавить ранг, кнопка чата |
| `src/components/chef/ChefDishesTab.tsx` | Убрать dietary |
| `src/pages/Chat.tsx` | Полная реализация чата |
| `src/components/admin/AdminOrdersTab.tsx` | Создать — управление заказами |
| `src/components/admin/AdminUsersTab.tsx` | Добавить назначение рангов |
| `src/components/admin/ChefApplicationsTab.tsx` | Исправить фото |
| `src/pages/AdminPanel.tsx` | Подключить OrdersTab, чаты |
| `src/lib/i18n.ts` | Все недостающие переводы |

