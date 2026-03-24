

# План: Верификация Email + SMS при регистрации

## Что будет сделано

1. **Email подтверждение** — после регистрации пользователь получит письмо со ссылкой. Пока не подтвердит — не сможет войти.
2. **SMS подтверждение телефона** — после регистрации отправляется код на телефон, пользователь вводит его для подтверждения.

## Важно

- SMS-верификация требует подключение **Twilio** (платный сервис для отправки SMS). Нужен будет номер телефона Twilio и аккаунт.
- Email-верификация — бесплатная, встроена в систему.

## Изменения

### 1. Отключить авто-подтверждение email
- Использовать `configure_auth` чтобы выключить `autoconfirm` — пользователь должен нажать ссылку в письме

### 2. Подключить Twilio коннектор
- Через `standard_connectors--connect` подключить Twilio для отправки SMS

### 3. Создать Edge Function `send-sms-otp`
**Файл:** `supabase/functions/send-sms-otp/index.ts`
- Генерирует 6-значный код
- Сохраняет код в таблицу `phone_verifications` (с TTL 5 минут)
- Отправляет SMS через Twilio gateway

### 4. Миграция БД
```sql
CREATE TABLE public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code text NOT NULL,
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
-- RLS: пользователь видит только свои записи
```

### 5. Обновить `AuthModal.tsx`
- После успешной регистрации — показать экран "Проверьте почту для подтверждения email"
- Если указан телефон — показать поле ввода SMS-кода
- Вызов edge function для отправки и проверки кода

### 6. Обновить `useAuth.ts` (signUp)
- После `signUp` показать сообщение "Проверьте email" вместо автоматического входа

### 7. i18n ключи
`auth.checkEmail`, `auth.smsCode`, `auth.sendCode`, `auth.verifyPhone`, `auth.codeExpired`, `auth.codeSent`

## Файлы

| Файл | Действие |
|------|----------|
| Миграция БД | Таблица `phone_verifications` |
| `configure_auth` | Отключить auto-confirm |
| Twilio коннектор | Подключить для SMS |
| `supabase/functions/send-sms-otp/index.ts` | Создать — отправка и проверка SMS |
| `src/components/auth/AuthModal.tsx` | Экран подтверждения email + ввод SMS-кода |
| `src/hooks/useAuth.ts` | Обновить сообщение после регистрации |
| `src/lib/i18n.ts` | Новые ключи |

