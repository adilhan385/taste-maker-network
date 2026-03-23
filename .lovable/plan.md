

# План: Кошелёк только для возвратов + Kaspi-оплата с чеком + Kaspi-номер повара

## Что будет сделано

1. **Кошелёк остаётся, но пополнение убирается** — кнопка "Пополнить" и диалог top-up удаляются. Баланс растёт только от возвратов/отмен.
2. **Повар при входе в дашборд указывает свой Kaspi-номер** — поле в профиле повара
3. **При покупке через Kaspi — покупатель загружает чек (скриншот)** как подтверждение
4. **Повар и админ видят чек** в своих заказах

## Миграция БД

```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_receipt_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kaspi_phone text;
```

Также нужно создать storage bucket `payment-receipts` (public) для хранения чеков.

## Изменения по файлам

| Файл | Что делать |
|------|-----------|
| `src/pages/Wallet.tsx` | Убрать кнопку "Пополнить", диалог top-up, preset amounts, CardPaymentForm. Оставить баланс + историю транзакций (только refund/payment) |
| `src/components/chef/ChefProfileTab.tsx` | Добавить поле `kaspiPhone` в форму, загружать из `profiles.kaspi_phone`, сохранять при save |
| `src/pages/Cart.tsx` | При Kaspi — добавить input для загрузки чека (файл). Загружать в storage `payment-receipts`. Сохранять URL в `orders.payment_receipt_url`. Блокировать оформление без чека при выборе Kaspi |
| `src/components/chef/ChefOrdersTab.tsx` | Показывать кнопку "Посмотреть чек" если `payment_receipt_url` есть |
| `src/components/admin/AdminOrdersTab.tsx` | Показывать кнопку "Посмотреть чек" |
| `src/pages/Orders.tsx` | Показывать кнопку "Посмотреть чек" покупателю |
| `src/lib/i18n.ts` | Ключи: `chef.kaspiPhone`, `cart.uploadReceipt`, `cart.receiptRequired`, `orders.viewReceipt`, `wallet.refundOnly` |

