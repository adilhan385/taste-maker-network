

# План: Забыл пароль + Чеки Kaspi для поваров

## 1. Функция "Забыл пароль"

### `src/components/auth/AuthModal.tsx`
- Добавить новый view `forgotPassword` в `ModalView` type
- Кнопка "Забыли пароль?" (строка 402) получает `onClick` → переключает view на `forgotPassword`
- View `forgotPassword`: поле email + кнопка "Отправить ссылку"
- Вызывает `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
- После отправки показывает сообщение "Проверьте почту"

### `src/pages/ResetPassword.tsx` (создать)
- Страница `/reset-password` — форма нового пароля + подтверждение
- Проверяет наличие `type=recovery` в URL hash
- Вызывает `supabase.auth.updateUser({ password })` для смены пароля
- После успеха — редирект на главную

### `src/App.tsx`
- Добавить Route: `<Route path="/reset-password" element={<ResetPassword />} />`

### `src/lib/i18n.ts`
- Ключи: `auth.forgotPasswordTitle`, `auth.sendResetLink`, `auth.resetLinkSent`, `auth.newPasswordTitle`, `auth.resetSuccess`

## 2. Повара видят чеки Kaspi в заказах

### `src/components/chef/ChefOrdersTab.tsx`
Кнопка "View Receipt" уже есть (строка 260), но:
- Проверить что `payment_receipt_url` включён в запрос (уже `select *`)
- Сделать кнопку более заметной — добавить `variant="secondary"` и текст на русском
- Добавить превью чека прямо в развёрнутом заказе (изображение чека внутри карточки), а не только кнопку открытия в новом окне
- Показывать способ оплаты "Kaspi" с пометкой если есть чек

## Файлы

| Файл | Действие |
|------|----------|
| `src/components/auth/AuthModal.tsx` | Добавить view "Забыл пароль" |
| `src/pages/ResetPassword.tsx` | Создать — страница смены пароля |
| `src/App.tsx` | Добавить route `/reset-password` |
| `src/components/chef/ChefOrdersTab.tsx` | Показать превью чека в заказе |
| `src/lib/i18n.ts` | Новые ключи |

