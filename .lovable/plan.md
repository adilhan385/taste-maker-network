

# План: Апелляция на отзывы + Баг языка в мобильном меню

## 1. Баг: Язык не меняется в мобильном меню
В `Navbar.tsx` клик на LanguageSelector закрывает всё меню из-за `onClick={() => setMobileMenuOpen(false)}` на родителе. Добавим `e.stopPropagation()` на контейнер LanguageSelector.

## 2. Система апелляций на отзывы

### Миграция БД — таблица `review_appeals`
```sql
CREATE TABLE public.review_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  chef_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: повар видит/создаёт свои, админ видит/обновляет все
```

### `src/components/chef/ChefProfileTab.tsx`
- Кнопка "Подать апелляцию" у каждого отзыва
- Диалог с полем причины → запись в `review_appeals`
- Показ статуса если апелляция уже подана

### `src/components/admin/AdminReviewAppealsTab.tsx` (новый)
- Список pending апелляций с деталями отзыва
- Кнопки: "Удалить отзыв" (удаляет review + approved) и "Отклонить" (rejected)

### `src/pages/AdminPanel.tsx`
- Новая вкладка "Апелляции"

### `src/lib/i18n.ts`
- Ключи для апелляций на 3 языках

## Файлы

| Файл | Действие |
|------|----------|
| Миграция БД | Таблица `review_appeals` + RLS |
| `src/components/layout/Navbar.tsx` | Фикс языка в мобильном меню |
| `src/components/chef/ChefProfileTab.tsx` | Кнопка апелляции |
| `src/components/admin/AdminReviewAppealsTab.tsx` | Новый компонент |
| `src/pages/AdminPanel.tsx` | Вкладка "Апелляции" |
| `src/lib/i18n.ts` | Новые ключи |

