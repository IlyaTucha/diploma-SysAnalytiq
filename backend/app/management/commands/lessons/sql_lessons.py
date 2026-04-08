SQL_LESSONS = [
    {
        "number": 1,
        "title": "Введение в SQL",
        "slug": "sql-intro",
        "type": "theory",
        "content": """# Введение в SQL

**SQL** (Structured Query Language) — язык структурированных запросов, предназначенный для управления данными в реляционных базах данных.

## Зачем нужен SQL?

SQL позволяет:

- **Создавать** таблицы и базы данных
- **Читать** данные с помощью запросов `SELECT`
- **Обновлять** существующие записи (`UPDATE`)
- **Удалять** данные (`DELETE`)

## Основные понятия

| Понятие | Описание |
|---------|----------|
| **Таблица** | Набор данных, организованных в строки и столбцы |
| **Строка (запись)** | Один элемент данных в таблице |
| **Столбец (поле)** | Атрибут данных (например, `name`, `email`) |
| **Первичный ключ (PK)** | Уникальный идентификатор каждой строки |
| **Внешний ключ (FK)** | Ссылка на первичный ключ другой таблицы |

## Пример базы данных

В нашей песочнице доступны таблицы:

- `users` — пользователи (id, name, email, age, city)
- `products` — товары (id, name, category, price, stock)
- `orders` — заказы (id, user_id, product_id, quantity, total, status, order_date)
- `departments` — отделы (id, name, manager_id, budget)
- `employees` — сотрудники (id, name, department_id, salary, hire_date)
- `reviews` — отзывы (id, user_id, product_id, rating, comment)

> **Совет:** Изучите схему БД в левой панели редактора SQL, чтобы ознакомиться со структурой таблиц.
""",
    },
    {
        "number": 2,
        "title": "SELECT запросы",
        "slug": "sql-select",
        "type": "practice",
        "content": """# SELECT запросы

Оператор `SELECT` — основной инструмент для чтения данных из таблиц.

## Синтаксис

```sql
SELECT столбец1, столбец2 FROM таблица;
```

Для выбора всех столбцов используется `*`:

```sql
SELECT * FROM users;
```

## Задание

Напишите запрос, который выводит контактную информацию всех пользователей: их имена и электронную почту.
""",
        "initial_code": "SELECT ",
        "correct_answer": "SELECT name, email FROM users;",
        "hint": "Какие столбцы в таблице users содержат имя и email?",
    },
    {
        "number": 3,
        "title": "Фильтрация с WHERE",
        "slug": "sql-where",
        "type": "practice",
        "content": """# Фильтрация данных с WHERE

Оператор `WHERE` позволяет фильтровать данные по условию.

## Синтаксис

```sql
SELECT * FROM таблица WHERE условие;
```

## Операторы сравнения

| Оператор | Описание |
|----------|----------|
| `=` | Равно |
| `>` | Больше |
| `<` | Меньше |
| `>=` | Больше или равно |
| `<=` | Меньше или равно |
| `<>` или `!=` | Не равно |

## Задание

Выведите всех пользователей, которые живут в Москве.
""",
        "initial_code": "SELECT * FROM users WHERE ",
        "correct_answer": "SELECT * FROM users WHERE city = 'Москва';",
        "hint": "Строковые значения в SQL оборачиваются в одинарные кавычки.",
    },
    {
        "number": 4,
        "title": "JOIN — объединение таблиц",
        "slug": "sql-join",
        "type": "practice",
        "content": """# JOIN — объединение таблиц

`JOIN` позволяет объединять данные из нескольких таблиц по связанным полям.

## Виды JOIN

| Вид | Описание |
|-----|----------|
| `INNER JOIN` | Только совпадающие записи |
| `LEFT JOIN` | Все из левой + совпадения из правой |
| `RIGHT JOIN` | Все из правой + совпадения из левой |

## Пример

```sql
SELECT orders.id, users.name
FROM orders
JOIN users ON orders.user_id = users.id;
```

## Задание

Сформируйте отчёт, показывающий каждого сотрудника и название его отдела.

### Требования к результату:
- Колонка с именем сотрудника: `Имя сотрудника`
- Колонка с названием отдела: `Название отдела`
- Используйте алиасы `e` и `d` для таблиц
""",
        "initial_code": "SELECT \nFROM employees e\n",
        "correct_answer": "SELECT e.name as 'Имя сотрудника', d.name as 'Название отдела' FROM employees e JOIN departments d ON e.department_id = d.id;",
        "hint": "Сотрудники связаны с отделами через поле department_id.",
    },
    {
        "number": 5,
        "title": "GROUP BY и HAVING",
        "slug": "sql-group-having",
        "type": "practice",
        "content": """# Группировка и фильтрация агрегатов

## GROUP BY

Оператор `GROUP BY` группирует строки по значениям указанных столбцов:

```sql
SELECT city, COUNT(*) as user_count
FROM users
GROUP BY city;
```

## HAVING

`HAVING` фильтрует группы (в отличие от `WHERE`, который фильтрует строки):

```sql
SELECT category, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 5000;
```

## Задание

Найдите города с высокой концентрацией пользователей — те, где зарегистрировано **более 3 человек**.

### Требования:
- Выведите название города и количество пользователей
- Отсортируйте по количеству пользователей (от большего к меньшему)
""",
        "initial_code": "SELECT city, COUNT(*) as user_count\nFROM users\n",
        "correct_answer": "SELECT city, COUNT(*) as user_count FROM users GROUP BY city HAVING COUNT(*) > 3 ORDER BY user_count DESC;",
        "hint": "HAVING фильтрует группы после GROUP BY, а WHERE — строки до группировки.",
    },
    {
        "number": 6,
        "title": "Множественные JOIN",
        "slug": "sql-multiple-joins",
        "type": "practice",
        "content": """# Объединение нескольких таблиц

Часто требуется объединить данные из 3 и более таблиц.

## Пример

```sql
SELECT u.name, p.name as product, o.total
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id;
```

## Задание

Сформируйте детальный отчёт о доставленных заказах.

### Что нужно вывести:
- Имя покупателя
- Название товара
- Категорию товара
- Сумму заказа
- Статус заказа

### Требования:
- Только заказы со статусом `'Доставлен'`
- Сортировка по сумме (сначала самые крупные)
""",
        "initial_code": "SELECT \n    u.name as user_name,\n    p.name as product_name\nFROM orders o\n",
        "correct_answer": "SELECT u.name as user_name, p.name as product_name, p.category, o.total, o.status FROM orders o JOIN users u ON o.user_id = u.id JOIN products p ON o.product_id = p.id WHERE o.status = 'Доставлен' ORDER BY o.total DESC;",
        "hint": "Для объединения трёх таблиц нужно два JOIN. Фильтрация — через WHERE.",
    },
    {
        "number": 7,
        "title": "Подзапросы (Subqueries)",
        "slug": "sql-subqueries",
        "type": "practice",
        "content": """# Вложенные запросы

Подзапрос — это запрос внутри другого запроса.

## Подзапрос в WHERE

```sql
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

## Подзапрос с IN

```sql
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE status = 'Доставлен');
```

## Задание

Напишите запрос, который выводит **сотрудников**, чья зарплата **выше средней зарплаты по их отделу**.

### Требования:
- Выведите `name`, `salary`, `department_id`
- Используйте коррелированный подзапрос для сравнения с AVG по отделу
- Отсортируйте по зарплате по убыванию
""",
        "initial_code": "SELECT e.name, e.salary, e.department_id\nFROM employees e\nWHERE e.salary > (\n    -- подзапрос здесь\n)\n",
        "correct_answer": "SELECT e.name, e.salary, e.department_id FROM employees e WHERE e.salary > (SELECT AVG(e2.salary) FROM employees e2 WHERE e2.department_id = e.department_id) ORDER BY e.salary DESC;",
        "hint": "В подзапросе используйте SELECT AVG(e2.salary) FROM employees e2 WHERE e2.department_id = e.department_id",
    },
    {
        "number": 8,
        "title": "Агрегация с JOIN",
        "slug": "sql-aggregate-join",
        "type": "practice",
        "content": """# Комплексная агрегация

Объединение JOIN, GROUP BY и агрегатных функций позволяет создавать аналитические отчёты.

## Пример: Статистика по отделам

```sql
SELECT d.name, COUNT(e.id) as emp_count, AVG(e.salary) as avg_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name;
```

## Задание

Создайте отчёт о **продажах по категориям товаров**:

1. Категория товара (`category`)
2. Количество заказов (`order_count`)
3. Общая сумма продаж (`total_sales`)
4. Средняя сумма заказа (`avg_order`)

### Требования:
- Объедините `products` и `orders`
- Используйте `GROUP BY` по категории
- Включите только категории с суммой продаж более 10000
- Отсортируйте по общей сумме по убыванию

> **Режим проверки:** Ваш ответ сравнивается с эталонным кодом.
""",
        "initial_code": "SELECT \n    p.category,\n    COUNT(o.id) as order_count\nFROM products p\nJOIN orders o ON p.id = o.product_id\n",
        "correct_answer": "SELECT p.category, COUNT(o.id) as order_count, SUM(o.total) as total_sales, AVG(o.total) as avg_order FROM products p JOIN orders o ON p.id = o.product_id GROUP BY p.category HAVING SUM(o.total) > 10000 ORDER BY total_sales DESC;",
        "hint": "Добавьте SUM(o.total) as total_sales, AVG(o.total) as avg_order. Используйте GROUP BY p.category HAVING SUM(o.total) > 10000 ORDER BY total_sales DESC.",
    },
    {
        "number": 9,
        "title": "Комплексный аналитический запрос",
        "slug": "sql-complex-analytics",
        "type": "practice",
        "content": """# Комплексная аналитика

Продвинутые запросы объединяют несколько таблиц, подзапросы и агрегатные функции.

## CASE WHEN

```sql
SELECT name,
    CASE
        WHEN salary > 100000 THEN 'Высокая'
        WHEN salary > 70000 THEN 'Средняя'
        ELSE 'Низкая'
    END as salary_level
FROM employees;
```

## Задание

Создайте отчёт **«Лучшие покупатели»**:

1. Имя пользователя (`user_name`)
2. Город (`city`)
3. Количество заказов (`order_count`)
4. Общая сумма покупок (`total_spent`)
5. Средний рейтинг оставленных отзывов (`avg_rating`)

### Требования:
- Объедините `users`, `orders`, `reviews`
- Используйте LEFT JOIN для отзывов (не у всех есть отзывы)
- Покажите только покупателей с 2+ заказами
- Отсортируйте по общей сумме покупок по убыванию
- LIMIT 10
""",
        "initial_code": "SELECT \n    u.name as user_name,\n    u.city\nFROM users u\nJOIN orders o ON u.id = o.user_id\n",
        "correct_answer": "SELECT u.name as user_name, u.city, COUNT(DISTINCT o.id) as order_count, SUM(o.total) as total_spent, AVG(r.rating) as avg_rating FROM users u JOIN orders o ON u.id = o.user_id LEFT JOIN reviews r ON u.id = r.user_id GROUP BY u.id, u.name, u.city HAVING COUNT(DISTINCT o.id) >= 2 ORDER BY total_spent DESC LIMIT 10;",
        "hint": "Добавьте LEFT JOIN reviews r ON u.id = r.user_id. Используйте COUNT(DISTINCT o.id) для подсчёта заказов, SUM(o.total), AVG(r.rating). GROUP BY u.id, u.name, u.city HAVING COUNT(DISTINCT o.id) >= 2.",
    },
]
