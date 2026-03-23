

# План: Большое обновление — 10 исправлений

## Список задач

### 1. Перевести интерфейс повара на все языки
**Файлы:** `src/pages/ChefDashboard.tsx`, `src/components/chef/ChefProfileTab.tsx`, `src/components/chef/ChefEarningsTab.tsx`, `src/components/chef/ChefAnalyticsTab.tsx`, `src/components/chef/ChefDishesTab.tsx`, `src/lib/i18n.ts`

Все хардкод-строки на английском ("Chef Dashboard", "My Dishes", "Orders", "Customers", "Analytics", "Availability", "Profile", "Earnings", "Total Earnings", "This Month", "Avg per Order", "Monthly Earnings", "Payout Settings", "Contact Information", "Location", "About You", "Full Name", "Phone", "City", "Address", "Verified Chef", "Save Profile", etc.) заменить на вызовы `t(key, language)` и добавить ключи в i18n (RU/EN/KZ).

### 2. Валюта ₸ вместо $ в аналитике и доходах повара
**Файлы:** `src/components/chef/ChefEarningsTab.tsx`, `src/components/chef/ChefAnalyticsTab.tsx`

Заменить все `$${value.toFixed(2)}` на `formatPrice(value)` (уже возвращает ₸). Убрать `DollarSign` иконки → заменить на текст "₸" или иконку `Wallet`.

### 3. Показать ранг повара в его профиле
**Файл:** `src/components/chef/ChefProfileTab.tsx`

Загрузить ранг из `chef_ranks` по `user.id`. Показать бейдж ранга (🥉/🥈/🥇/💎) рядом с "Verified Chef".

### 4. Порции после покупки через кошелёк — исправить
**Файл:** `src/pages/Cart.tsx`

Проблема: после покупки через wallet порции не обновляются — код уже есть (строки 213-246), но продукт может не обновиться если RLS не даёт buyer'у UPDATE products. 

Решение: обновление порций делать через edge function с service role key, либо — добавить RLS policy "Buyers can update portions on purchase". Более безопасно: добавить RLS policy на `products` для `UPDATE` с ограничением на `available_portions` и `is_available` only.

**Миграция:** Добавить policy: "Authenticated users can decrement portions" — `FOR UPDATE USING (true) WITH CHECK (true)` ограниченная на `available_portions` и `is_available`.

### 5. Покупатель видит ранг повара
Уже реализовано в `DishCard.tsx` (строки 232-236), но только для рангов != bronze. Это правильно — bronze не показывается чтобы не засорять UI. Если нужно показывать bronze тоже — уберу условие `!== 'bronze'`.

### 6. Оплата — Kaspi перевод вместо привязки карты
**Файлы:** `src/pages/Cart.tsx`, `src/components/checkout/CardPaymentForm.tsx`, `src/lib/i18n.ts`

- Убрать опцию "card" (привязка карты) из методов оплаты
- Вместо неё: "Kaspi перевод" — при выборе показывать номер Kaspi повара
- При регистрации повара добавить поле "Kaspi номер"
- **Миграция:** `ALTER TABLE chef_applications ADD COLUMN kaspi_phone text;`
- `CardPaymentForm.tsx` → переименовать/адаптировать или заменить на `KaspiPaymentInfo` — показывает номер Kaspi повара
- В корзине при выборе "Kaspi" показывать: "Переведите {сумма} на номер {kaspi_phone повара}"

### 7. Убрать выбор кухни (страны) из формы повара и каталога
**Файлы:** `src/components/chef/ChefDishesTab.tsx`, `src/pages/Catalog.tsx`, `src/pages/BecomeChef.tsx`

- Убрать `cuisineOptions` и фильтр по кухне из каталога
- Убрать `cuisine` из формы создания блюда
- Убрать `cuisineSpecialization` из формы заявки на повара

### 8. Уведомления — при заказе и в чат
**Файл:** `src/pages/Cart.tsx`

При оформлении заказа отправлять уведомление повару:
```sql
INSERT INTO notifications (user_id, type, title, message, related_id)
VALUES (chef_id, 'new_order', 'Новый заказ!', 'У вас новый заказ на {сумма}', order_id)
```

Уже частично есть (sold out notification), добавить для каждого заказа.

### 9. Аналитика администратора — доходы за день
**Файл:** `src/pages/AdminPanel.tsx`

Добавить вкладку analytics с реальными данными:
- Создать `src/components/admin/AdminAnalyticsTab.tsx`
- Загружать все заказы за сегодня/неделю/месяц
- Показывать: общая выручка за день, количество заказов, топ поваров

### 10. Админ может выдавать права администратора
**Файл:** `src/components/admin/AdminUsersTab.tsx`

Добавить кнопку "Make Admin" / "Remove Admin" для пользователей. При нажатии — `INSERT INTO user_roles (user_id, role) VALUES (x, 'admin')` или `DELETE FROM user_roles WHERE user_id = x AND role = 'admin'`.

## Миграция БД
```sql
ALTER TABLE public.chef_applications ADD COLUMN IF NOT EXISTS kaspi_phone text;

-- Allow authenticated users to update product portions (for purchase flow)
CREATE POLICY "Authenticated can update product portions"
ON public.products FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);
```

Примечание: policy на products уже есть для chefs и admins. Нужна более узкая policy или использовать edge function. Безопаснее — edge function для обновления порций.

## Файлы (сводка)

| Файл | Действие |
|------|----------|
| Миграция БД | `kaspi_phone` в chef_applications |
| `src/pages/ChefDashboard.tsx` | i18n все строки |
| `src/components/chef/ChefProfileTab.tsx` | i18n + показать ранг |
| `src/components/chef/ChefEarningsTab.tsx` | i18n + ₸ вместо $ |
| `src/components/chef/ChefAnalyticsTab.tsx` | i18n + ₸ вместо $ |
| `src/components/chef/ChefDishesTab.tsx` | Убрать cuisine |
| `src/pages/Cart.tsx` | Kaspi вместо карты, уведомление повару, fix portions |
| `src/components/checkout/CardPaymentForm.tsx` | Заменить на Kaspi info |
| `src/pages/Catalog.tsx` | Убрать фильтр по кухне |
| `src/pages/BecomeChef.tsx` | Добавить kaspi_phone, убрать cuisine |
| `src/components/admin/AdminUsersTab.tsx` | Кнопка выдачи прав админа |
| `src/components/admin/AdminAnalyticsTab.tsx` | Создать — аналитика для админа |
| `src/pages/AdminPanel.tsx` | Подключить AdminAnalyticsTab |
| `src/lib/i18n.ts` | Все новые ключи переводов |

