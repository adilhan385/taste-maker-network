

# План: Сброс пароля админом + временный пароль

## Что будет сделано

Админ сможет сбросить пароль любому пользователю, задав временный пароль. При входе с временным паролем пользователь будет обязан сменить его.

## Изменения

### 1. Edge Function `admin-reset-password`
**Файл:** `supabase/functions/admin-reset-password/index.ts`

- Принимает `{ userId, tempPassword }` в body
- Проверяет что вызывающий — админ (через JWT + проверка роли)
- Использует `supabase.auth.admin.updateUserById(userId, { password: tempPassword })` с service role key
- Записывает флаг `force_password_change = true` в `profiles` для этого пользователя

### 2. Миграция БД
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false;
```

### 3. UI: Кнопка в AdminUsersTab
**Файл:** `src/components/admin/AdminUsersTab.tsx`
- Кнопка `Key` ("Сбросить пароль") рядом с остальными действиями
- Диалог с полем ввода временного пароля (минимум 6 символов)
- Вызов edge function `admin-reset-password`
- Показ временного пароля админу для передачи пользователю

### 4. Принудительная смена пароля при входе
**Файл:** `src/hooks/useAuth.ts`
- После успешного `signIn` — проверять `profiles.force_password_change`
- Если `true` — показывать диалог смены пароля вместо обычного входа

### 5. Компонент смены пароля
**Файл:** `src/components/auth/ForcePasswordChange.tsx`
- Форма: новый пароль + подтверждение
- Вызывает `supabase.auth.updateUser({ password })` 
- Обновляет `profiles.force_password_change = false`
- После успеха — обычный вход

### 6. i18n ключи
`admin.resetPassword`, `admin.tempPassword`, `admin.passwordReset`, `auth.mustChangePassword`, `auth.newPassword`, `auth.confirmPassword`, `auth.changePassword`

## Файлы

| Файл | Действие |
|------|----------|
| Миграция БД | `force_password_change` в profiles |
| `supabase/functions/admin-reset-password/index.ts` | Создать edge function |
| `src/components/admin/AdminUsersTab.tsx` | Кнопка + диалог сброса |
| `src/hooks/useAuth.ts` | Проверка force_password_change |
| `src/components/auth/ForcePasswordChange.tsx` | Создать — форма смены пароля |
| `src/App.tsx` | Обёртка для принудительной смены |
| `src/lib/i18n.ts` | Новые ключи |

