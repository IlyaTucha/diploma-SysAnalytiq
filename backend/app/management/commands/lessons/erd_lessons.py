ERD_LESSONS = [
    {
        "number": 1,
        "title": "Основы ER-диаграмм",
        "slug": "erd-basics",
        "type": "theory",
        "content": """# Основы ER-диаграмм

**ER-диаграмма** (Entity-Relationship diagram) — визуальная модель данных, описывающая сущности предметной области и связи между ними.

## Основные компоненты

### 1. Сущность (Entity)
Объект реального мира, информацию о котором нужно хранить.

**Примеры:** Пользователь, Заказ, Товар

### 2. Атрибуты
Свойства сущности:
- **Первичный ключ (PK)** — уникальный идентификатор
- **Обычные атрибуты** — свойства сущности (name, email и т.д.)
- **Внешний ключ (FK)** — ссылка на другую сущность

### 3. Связи (Relationships)

| Тип связи | Обозначение | Пример |
|-----------|-------------|--------|
| Один-к-одному | `1:1` | Пользователь — Паспорт |
| Один-ко-многим | `1:N` | Отдел — Сотрудники |
| Многие-ко-многим | `N:M` | Студенты — Курсы |

## Нотация DBML

В нашем редакторе используется нотация **DBML** (Database Markup Language):

```
Table users {
    id int [pk]
    name varchar
    email varchar
}

Table orders {
    id int [pk]
    user_id int [ref: > users.id]
    total int
}
```

> Символ `>` означает связь «многие к одному» (FK → PK).

### Альтернативный синтаксис связей

Связи можно также описывать **отдельно** от таблиц с помощью `Ref:`:

```
Ref: orders.user_id > users.id
```

Оба варианта эквивалентны — и в таблице через `[ref: > ...]`, и через отдельный `Ref:`.
""",
    },
    {
        "number": 2,
        "title": "Сущности и атрибуты",
        "slug": "erd-entities",
        "type": "practice",
        "content": """# Практика: Сущности и атрибуты

## Задание

Спроектируйте ER-диаграмму для **системы управления библиотекой**.

Система должна хранить информацию о книгах, читателях и фактах выдачи книг читателям.

### Требования:
- Книги имеют название и автора
- Читатели идентифицируются по имени
- Необходимо отслеживать, какие книги выданы каким читателям
- Одна книга может быть выдана нескольким читателям (в разное время)
- Один читатель может брать несколько книг
""",
        "initial_code": "Table books {\n    id int [pk]\n}\n",
        "correct_answer": '{"mode":"manual","checks":[{"id":"erd1-1","type":"table_count","value":"3","operator":"="},{"id":"erd1-2","type":"table_exists","target":"books"},{"id":"erd1-3","type":"table_exists","target":"readers"},{"id":"erd1-4","type":"table_exists","target":"loans"},{"id":"erd1-5","type":"relationship_count","value":"2","operator":">="}]}',
        "hint": "Подумайте, какая таблица нужна для связи «многие-ко-многим» между книгами и читателями.",
    },
    {
        "number": 3,
        "title": "Связи между таблицами",
        "slug": "erd-relations",
        "type": "theory",
        "content": """# Связи между таблицами

## Типы связей в DBML

### Один-ко-многим (1:N)

Самый распространённый тип связи. Например, один отдел содержит много сотрудников:

```
Table departments {
    id int [pk]
    name varchar
}

Table employees {
    id int [pk]
    name varchar
    department_id int [ref: > departments.id]
}
```

### Один-к-одному (1:1)

```
Table users {
    id int [pk]
    name varchar
}

Table profiles {
    id int [pk]
    user_id int [ref: - users.id]
    bio text
}
```

Символ `-` означает связь «один к одному».

### Многие-ко-многим (N:M)

Реализуется через промежуточную таблицу:

```
Table students {
    id int [pk]
    name varchar
}

Table courses {
    id int [pk]
    title varchar
}

Table enrollments {
    id int [pk]
    student_id int [ref: > students.id]
    course_id int [ref: > courses.id]
}
```

## Кардинальность

| Символ | Значение |
|--------|----------|
| `>` | Многие к одному |
| `<` | Один ко многим |
| `-` | Один к одному |
| `<>` | Многие ко многим |

> **Ключевое правило:** Связь «многие-ко-многим» всегда декомпозируется через промежуточную таблицу.
""",
    },
    {
        "number": 4,
        "title": "Проектирование БД магазина",
        "slug": "erd-shop",
        "type": "practice",
        "content": """# Проектирование базы данных интернет-магазина

## Задание

Спроектируйте ER-диаграмму для интернет-магазина.

### Бизнес-требования:
- Магазин продаёт товары покупателям
- Покупатели могут оформлять заказы
- В одном заказе может быть несколько разных товаров
- Для каждого товара в заказе нужно хранить количество

### Технические требования:
- Минимум **4 таблицы**
- Минимум **3 связи** между таблицами

> Подумайте, как правильно моделировать связь «заказ содержит товары».
""",
        "initial_code": "Table customers {\n    id int [pk]\n}\n",
        "correct_answer": '{"mode":"manual","checks":[{"id":"erd2-1","type":"table_count","value":"4","operator":">="},{"id":"erd2-2","type":"table_exists","target":"customers"},{"id":"erd2-3","type":"table_exists","target":"products"},{"id":"erd2-4","type":"table_exists","target":"orders"},{"id":"erd2-5","type":"table_exists","target":"order_items"},{"id":"erd2-6","type":"relationship_count","value":"3","operator":">="}]}',
        "hint": "Связь «заказ-товары» — это многие-ко-многим. Вспомните, как декомпозировать такую связь.",
    },
    {
        "number": 5,
        "title": "Моделирование школы (код)",
        "slug": "erd-code-test",
        "type": "practice",
        "content": """# Практика: Моделирование базы данных школы (режим сравнения с эталоном)

В этом задании ваш ответ будет проверяться путём **сравнения с эталонным решением**.

## Задание

Создайте ER-диаграмму для школьной системы:

1. **teachers** — учителя (`id`, `name`)
2. **subjects** — предметы (`id`, `title`)
3. **classes** — классы/занятия (`id`, `teacher_id`, `subject_id`)

Требования:
- Ровно **3 таблицы**
- Ровно **2 связи** (FK)
- Таблица `classes` связана с `teachers` и `subjects`
""",
        "initial_code": "Table teachers {\n    id int [pk]\n    name varchar\n}\n",
        "correct_answer": '{"mode":"code","code":"Table teachers {\\n    id int [pk]\\n    name varchar\\n}\\n\\nTable subjects {\\n    id int [pk]\\n    title varchar\\n}\\n\\nTable classes {\\n    id int [pk]\\n    teacher_id int [ref: > teachers.id]\\n    subject_id int [ref: > subjects.id]\\n}","checkTableCount":true,"checkRelationshipCount":true,"checkTableNames":true}',
        "hint": "Создайте 3 таблицы: teachers, subjects, classes. В classes добавьте teacher_id и subject_id с ref.",
    },
    {
        "number": 6,
        "title": "Система бронирования отелей",
        "slug": "erd-hotel-booking",
        "type": "practice",
        "content": """# Проектирование системы бронирования отелей

## Задание

Спроектируйте ER-диаграмму для системы бронирования отелей:

1. **hotels** — отели (`id`, `name`, `city`, `rating`)
2. **rooms** — номера (`id`, `hotel_id`, `room_type`, `price_per_night`)
3. **guests** — гости (`id`, `name`, `email`, `phone`)
4. **bookings** — бронирования (`id`, `room_id`, `guest_id`, `check_in`, `check_out`, `status`)

### Требования:
- Минимум **4 таблицы**
- Минимум **3 связи** (FK)
- Номер принадлежит отелю
- Бронирование связывает номер и гостя
""",
        "initial_code": "Table hotels {\n    id int [pk]\n    name varchar\n    city varchar\n}\n",
        "correct_answer": '{"mode":"manual","checks":[{"id":"erd3-1","type":"table_count","value":"4","operator":">="},{"id":"erd3-2","type":"table_exists","target":"hotels"},{"id":"erd3-3","type":"table_exists","target":"rooms"},{"id":"erd3-4","type":"table_exists","target":"guests"},{"id":"erd3-5","type":"table_exists","target":"bookings"},{"id":"erd3-6","type":"relationship_count","value":"3","operator":">="}]}',
        "hint": "Создайте 4 таблицы. В rooms добавьте hotel_id [ref: > hotels.id], в bookings — room_id и guest_id с ref.",
    },
    {
        "number": 7,
        "title": "Социальная сеть (код)",
        "slug": "erd-social-network",
        "type": "practice",
        "content": """# Проектирование социальной сети

## Задание

Спроектируйте ER-диаграмму для социальной сети:

1. **users** — пользователи (`id`, `username`, `email`, `created_at`)
2. **posts** — посты (`id`, `user_id`, `content`, `created_at`)
3. **comments** — комментарии (`id`, `post_id`, `user_id`, `text`, `created_at`)
4. **likes** — лайки (`id`, `post_id`, `user_id`)
5. **friendships** — дружба (`id`, `user_id`, `friend_id`, `status`)

### Требования:
- Ровно **5 таблиц**
- Минимум **6 связей** (FK)
- Посты, комментарии, лайки — принадлежат пользователям
- Friendships — связь между двумя пользователями

> **Режим проверки:** Ваш ответ сравнивается с эталонным кодом.
""",
        "initial_code": "Table users {\n    id int [pk]\n    username varchar\n    email varchar\n}\n",
        "correct_answer": '{"mode":"code","code":"Table users {\\n    id int [pk]\\n    username varchar\\n    email varchar\\n    created_at timestamp\\n}\\n\\nTable posts {\\n    id int [pk]\\n    user_id int [ref: > users.id]\\n    content text\\n    created_at timestamp\\n}\\n\\nTable comments {\\n    id int [pk]\\n    post_id int [ref: > posts.id]\\n    user_id int [ref: > users.id]\\n    text text\\n    created_at timestamp\\n}\\n\\nTable likes {\\n    id int [pk]\\n    post_id int [ref: > posts.id]\\n    user_id int [ref: > users.id]\\n}\\n\\nTable friendships {\\n    id int [pk]\\n    user_id int [ref: > users.id]\\n    friend_id int [ref: > users.id]\\n    status varchar\\n}","checkTableCount":true,"checkRelationshipCount":true,"checkTableNames":true}',
        "hint": "Создайте 5 таблиц. posts имеет user_id, comments — post_id и user_id, likes — post_id и user_id, friendships — user_id и friend_id (оба ссылаются на users).",
    },
    {
        "number": 8,
        "title": "Система управления проектами",
        "slug": "erd-project-management",
        "type": "practice",
        "content": """# Проектирование системы управления проектами

## Задание

Спроектируйте ER-диаграмму для системы управления проектами (типа Jira):

1. **teams** — команды (`id`, `name`)
2. **users** — пользователи (`id`, `name`, `email`, `team_id`)
3. **projects** — проекты (`id`, `name`, `description`, `team_id`)
4. **tasks** — задачи (`id`, `project_id`, `assignee_id`, `title`, `status`, `priority`)
5. **task_comments** — комментарии к задачам (`id`, `task_id`, `user_id`, `text`)

### Требования:
- Минимум **5 таблиц**
- Минимум **5 связей**
- Пользователи принадлежат командам
- Проекты принадлежат командам
- Задачи имеют исполнителя (assignee) и проект
""",
        "initial_code": "Table teams {\n    id int [pk]\n    name varchar\n}\n",
        "correct_answer": '{"mode":"manual","checks":[{"id":"erd5-1","type":"table_count","value":"5","operator":">="},{"id":"erd5-2","type":"table_exists","target":"teams"},{"id":"erd5-3","type":"table_exists","target":"users"},{"id":"erd5-4","type":"table_exists","target":"projects"},{"id":"erd5-5","type":"table_exists","target":"tasks"},{"id":"erd5-6","type":"table_exists","target":"task_comments"},{"id":"erd5-7","type":"relationship_count","value":"5","operator":">="}]}',
        "hint": "users.team_id -> teams, projects.team_id -> teams, tasks.project_id -> projects, tasks.assignee_id -> users, task_comments.task_id -> tasks, task_comments.user_id -> users.",
    },
    {
        "number": 9,
        "title": "Интернет-магазин с отзывами",
        "slug": "erd-ecommerce-reviews",
        "type": "practice",
        "content": """# Расширенная модель интернет-магазина

## Задание

Расширьте модель интернет-магазина, добавив систему категорий и отзывов:

1. **categories** — категории (`id`, `name`, `parent_id` — для вложенных категорий)
2. **products** — товары (`id`, `name`, `price`, `category_id`, `stock`)
3. **customers** — покупатели (`id`, `name`, `email`)
4. **orders** — заказы (`id`, `customer_id`, `order_date`, `total`, `status`)
5. **order_items** — элементы заказа (`id`, `order_id`, `product_id`, `quantity`, `price`)
6. **reviews** — отзывы (`id`, `product_id`, `customer_id`, `rating`, `comment`)

### Требования:
- **6 таблиц**
- Минимум **7 связей**
- Категории могут быть вложенными (parent_id -> categories.id)
""",
        "initial_code": "Table categories {\n    id int [pk]\n    name varchar\n    parent_id int [ref: > categories.id]\n}\n",
        "correct_answer": '{"mode":"manual","checks":[{"id":"erd6-1","type":"table_count","value":"6","operator":"="},{"id":"erd6-2","type":"table_exists","target":"categories"},{"id":"erd6-3","type":"table_exists","target":"products"},{"id":"erd6-4","type":"table_exists","target":"customers"},{"id":"erd6-5","type":"table_exists","target":"orders"},{"id":"erd6-6","type":"table_exists","target":"order_items"},{"id":"erd6-7","type":"table_exists","target":"reviews"},{"id":"erd6-8","type":"relationship_count","value":"7","operator":">="}]}',
        "hint": "Создайте 6 таблиц с соответствующими связями: categories (self-ref), products->categories, orders->customers, order_items->orders и products, reviews->products и customers.",
    },
    {
        "number": 10,
        "title": "LMS система (код)",
        "slug": "erd-lms-code",
        "type": "practice",
        "content": """# Система управления обучением (LMS)

В этом задании ответ проверяется **сравнением с эталоном**.

## Задание

Спроектируйте ER-диаграмму для системы онлайн-обучения:

1. **instructors** — преподаватели (`id`, `name`, `email`)
2. **students** — студенты (`id`, `name`, `email`)
3. **courses** — курсы (`id`, `title`, `instructor_id`)
4. **enrollments** — записи на курсы (`id`, `student_id`, `course_id`, `enrolled_at`)
5. **lessons** — уроки (`id`, `course_id`, `title`, `content`)

### Требования:
- Ровно **5 таблиц**
- Ровно **4 связи**
- Курс принадлежит преподавателю
- Enrollment связывает студента и курс
- Урок принадлежит курсу
""",
        "initial_code": "Table instructors {\n    id int [pk]\n    name varchar\n}\n",
        "correct_answer": '{"mode":"code","code":"Table instructors {\\n    id int [pk]\\n    name varchar\\n    email varchar\\n}\\n\\nTable students {\\n    id int [pk]\\n    name varchar\\n    email varchar\\n}\\n\\nTable courses {\\n    id int [pk]\\n    title varchar\\n    instructor_id int [ref: > instructors.id]\\n}\\n\\nTable enrollments {\\n    id int [pk]\\n    student_id int [ref: > students.id]\\n    course_id int [ref: > courses.id]\\n    enrolled_at date\\n}\\n\\nTable lessons {\\n    id int [pk]\\n    course_id int [ref: > courses.id]\\n    title varchar\\n    content text\\n}","checkTableCount":true,"checkRelationshipCount":true,"checkTableNames":true}',
        "hint": "Создайте 5 таблиц: instructors, students, courses (с instructor_id), enrollments (со student_id и course_id), lessons (с course_id).",
    },
]
