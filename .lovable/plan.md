

# План: Убрать Halal-фильтр, показать отзывы повара, удалять блюда без порций

## 1. Убрать категорию Halal из фильтров

**Файл:** `src/pages/Catalog.tsx`
- Удалить `'Halal'` из массива `dietaryOptions`
- Также убрать `'Halal'` из `dietary` в mock-данных

**Файл:** `src/components/catalog/DishCard.tsx`
- Убрать отображение бейджа "Halal" — фильтровать `dish.dietary` чтобы не показывать "Halal"

## 2. Показать отзывы других покупателей о повара

**Файл:** `src/components/catalog/DishCard.tsx` (или новый компонент)
- При клике на имя повара или на рейтинг — открывать диалог с отзывами
- Создать компонент `src/components/catalog/ChefReviewsDialog.tsx`:
  - Загружает все отзывы (`reviews`) по `product_id` блюд данного повара
  - Показывает имя пользователя (из `profiles`), рейтинг (звёзды), комментарий, дату
  - Средний рейтинг повара сверху

## 3. Удалять блюда без порций из каталога

Уже реализовано частично — в `filteredDishes` есть проверка `dish.availablePortions <= 0`. Но нужно также:

**Файл:** `src/pages/Catalog.tsx`
- При загрузке из БД фильтровать `available_portions > 0` в запросе к `products`
- Добавить `.gt('available_portions', 0)` в Supabase-запрос

## Файлы

| Файл | Действие |
|------|----------|
| `src/pages/Catalog.tsx` | Убрать Halal из фильтров, добавить фильтр `available_portions > 0` |
| `src/components/catalog/DishCard.tsx` | Убрать Halal-бейдж, добавить клик на повара для отзывов |
| `src/components/catalog/ChefReviewsDialog.tsx` | Создать — диалог с отзывами повара |
| `src/lib/i18n.ts` | Добавить ключи для отзывов повара |

