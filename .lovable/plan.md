

# План: 5 исправлений

## 1. Чат покупателя с поваром — уже работает, но кнопка скрыта для hover

**Проблема:** Кнопка "Написать повару" в `DishCard.tsx` видна только при hover на десктопе. На мобильных она невидима.

**Исправление:** `src/components/catalog/DishCard.tsx` — вынести кнопку MessageCircle из hover-overlay, показывать её всегда в нижней части карточки (рядом с ценой).

## 2. Повар не видит свои отзывы

**Проблема:** В `ChefProfileTab.tsx` нет секции отзывов. Повар не может посмотреть что о нём написали.

**Исправление:** `src/components/chef/ChefProfileTab.tsx` — добавить секцию "Мои отзывы" с использованием компонента `ChefReviewsDialog` (кнопка "Посмотреть отзывы") или встроенный список отзывов. Загружать из `reviews` по `product_id` блюд этого повара.

## 3. Админ может писать кому угодно в чате

**Проблема:** В `Chat.tsx` строка 248: `if (isAdmin) return;` — блокирует отправку сообщений для админа.

**Исправление:** `src/pages/Chat.tsx` — убрать `if (isAdmin) return;` из `handleSend`, убрать `{!isAdmin && ...}` обёртку вокруг поля ввода. Админ должен и видеть все чаты, и писать.

## 4. Защита владельца от снятия прав админа

**Проблема:** Любой админ может снять права у `adilhananuar426@gmail.com`.

**Исправление:** `src/components/admin/AdminUsersTab.tsx` — в `handleToggleAdmin` и в UI: если `user_id` принадлежит владельцу (проверять email через profiles), запретить снятие прав. Добавить проверку email из profiles при загрузке пользователей. Хардкод email `adilhananuar426@gmail.com` как OWNER_EMAIL.

## 5. Кнопка Instagram в футере

**Исправление:** `src/components/layout/Footer.tsx` — добавить иконку Instagram со ссылкой на `https://www.instagram.com/chefcook.kz?igsh=MXc3a2U2cGV5OW52MQ==`.

## Файлы

| Файл | Действие |
|------|----------|
| `src/components/catalog/DishCard.tsx` | Кнопка чата всегда видна |
| `src/components/chef/ChefProfileTab.tsx` | Секция отзывов повара |
| `src/pages/Chat.tsx` | Админ может писать |
| `src/components/admin/AdminUsersTab.tsx` | Защита владельца |
| `src/components/layout/Footer.tsx` | Instagram ссылка |
| `src/lib/i18n.ts` | Ключи для новых строк |

