

# План: Убрать фейковые данные

## Что будет сделано

Удалить все захардкоженные mock/sample блюда. Когда в базе нет реальных блюд — показывать пустое состояние ("Пока нет блюд") вместо фейковых данных.

## Изменения

### 1. `src/pages/Catalog.tsx`
- Удалить весь массив `mockDishes` (~100 строк)
- В `fetchDishes`: если данных нет — ставить пустой массив `[]` вместо `mockDishes`
- В catch-блоке: тоже `[]` вместо `mockDishes`
- Добавить empty state: "Пока нет доступных блюд" когда `dishes.length === 0`

### 2. `src/components/home/FeaturedDishes.tsx`
- Удалить массив `sampleDishes`
- Загружать реальные блюда из БД (запрос к `products` с лимитом 4, `is_available = true`, `available_portions > 0`)
- Если блюд нет — скрывать секцию целиком

### Файлы

| Файл | Действие |
|------|----------|
| `src/pages/Catalog.tsx` | Удалить mockDishes, показать empty state |
| `src/components/home/FeaturedDishes.tsx` | Загружать реальные блюда из БД |

