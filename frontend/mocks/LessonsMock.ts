import { Lesson } from '@/types/lesson';

export const lessonsData: Lesson[] = [
  // Module 1: SQL
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    moduleId: 1,
    number: 1,
    title: 'Введение в SQL',
    type: 'theory',
    slug: 'theory',
    published: true,
    content: `
# Введение в SQL

**SQL (Structured Query Language)**  это стандартный язык программирования, используемый для управления реляционными базами данных и выполнения различных операций с данными в них.

## Основные понятия

*   **База данных (Database)**: Организованная коллекция данных, хранящихся и доступных в электронном виде.
*   **Таблица (Table)**: Набор данных, организованных в строки и столбцы.
*   **Запрос (Query)**: Команда, используемая для извлечения или манипулирования данными.

## Основные команды SQL (CRUD)

1.  **SELECT**: Извлечение данных из базы данных.
2.  **INSERT**: Вставка новых данных в таблицу.
3.  **UPDATE**: Обновление существующих данных.
4.  **DELETE**: Удаление данных.

## Пример запроса SELECT

Самый простой запрос для выборки всех данных из таблицы:

\`\`\`sql
SELECT * FROM users;
\`\`\`

Этот запрос вернет все строки и все столбцы из таблицы \`users\`.
    `
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    moduleId: 1,
    number: 2,
    title: 'Практическое задание SQL',
    type: 'practice',
    slug: 'sql',
    published: true,
    content: 'В нашей базе данных есть таблица `users` с полями `id`, `username`, `email` и `role`. \n\n**Задание:** Напишите SQL запрос, который выбирает все поля из таблицы `users`, где `id` равен 1.',
    initialCode: 'SELECT * FROM users;',
    correctAnswer: 'SELECT * FROM users WHERE id = 1',
    hint: 'Используйте оператор WHERE для фильтрации по id.'
  },
  // Module 2: ERD
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    moduleId: 2,
    number: 1,
    title: 'Введение в ERD',
    type: 'theory',
    slug: 'theory',
    published: true,
    content: `
# ER-диаграммы (Entity-Relationship Diagram)

ER-диаграмма  это модель данных, описывающая сущности и связи между ними.

## Основные компоненты

1.  **Сущность (Entity)**: Объект реального мира (например, Клиент, Заказ). В базе данных соответствует таблице.
2.  **Атрибут (Attribute)**: Свойство сущности (например, Имя, Цена). Соответствует колонке в таблице.
3.  **Связь (Relationship)**: Отношение между сущностями (например, Клиент *делает* Заказ).

## DBML (Database Markup Language)

Мы будем использовать DBML для описания ER-диаграмм.

\`\`\`
Table users {
  id integer [primary key]
  username varchar
}

Table posts {
  id integer [primary key]
  user_id integer
}

Ref: posts.user_id > users.id
\`\`\`
    `
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    moduleId: 2,
    number: 2,
    title: 'Практика ERD',
    type: 'practice',
    slug: 'er',
    published: true,
    content: 'Спроектируйте простую схему базы данных для блога. Создайте таблицу `users` с полями `id` (integer) и `username` (varchar).',
    initialCode: '// Use DBML syntax\n',
    correctAnswer: '{"mode":"manual","checks":[{"type":"table_exists","value":"users"},{"type":"column_exists","value":"users.username"}]}',
    hint: 'Используйте синтаксис: Table users { ... }'
  },
  // Module 3: BPMN
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    moduleId: 3,
    number: 1,
    title: 'Основы BPMN',
    type: 'theory',
    slug: 'theory',
    published: true,
    content: `
# Основы BPMN

**BPMN (Business Process Model and Notation)**  это графическая нотация для моделирования бизнес-процессов. Она обеспечивает стандартный способ визуализации бизнес-процессов, понятный всем участникам бизнеса.

## Основные элементы BPMN

### 1. События (Events)
События  это то, что происходит в ходе процесса. Они изображаются в виде кругов.
*   **Начальное событие (Start Event)**: Тонкий круг. Обозначает начало процесса.
*   **Конечное событие (End Event)**: Жирный круг. Обозначает завершение процесса.

### 2. Действия (Activities)
Действия  это работа, выполняемая в рамках бизнес-процесса. Изображаются в виде прямоугольников с закругленными углами.
*   **Задача (Task)**: Элементарное действие.

### 3. Шлюзы (Gateways)
Шлюзы используются для управления разветвлением и слиянием потоков процесса. Изображаются в виде ромбов.

### 4. Потоки (Flows)
Соединительные линии, показывающие порядок выполнения действий.
    `
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    moduleId: 3,
    number: 2,
    title: 'Практика BPMN',
    type: 'practice',
    slug: 'bpmn',
    published: true,
    content: 'Создайте простую BPMN диаграмму процесса, который начинается со стартового события, затем выполняет одну задачу "Обработка заказа" и завершается.',
    initialCode: '',
    correctAnswer: '{"mode":"manual","checks":[{"type":"element_count","element":"startEvent","value":"1"},{"type":"element_count","element":"task","value":"1"}]}',
    hint: 'Вам понадобится Start Event и Task. Соедините их потоком управления.'
  },
  // Module 4: PlantUML
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    moduleId: 4,
    number: 1,
    title: 'Диаграммы последовательности',
    type: 'theory',
    slug: 'theory',
    published: true,
    content: `
# PlantUML: Диаграммы последовательности

**PlantUML**  это инструмент, позволяющий создавать UML диаграммы из простого текстового описания.

## Диаграмма последовательности (Sequence Diagram)

Диаграмма последовательности показывает взаимодействие объектов во времени.

### Синтаксис

\`\`\`plantuml
@startuml
Alice -> Bob: Привет, Боб!
Bob --> Alice: Привет, Алиса!
@enduml
\`\`\`

*   \`->\` : Синхронное сообщение (сплошная стрелка)
*   \`-->\` : Ответное сообщение (пунктирная стрелка)
*   \`participant\` : Явное объявление участника
    `
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    moduleId: 4,
    number: 2,
    title: 'Практика PlantUML',
    type: 'practice',
    slug: 'plantuml',
    published: true,
    content: 'Нарисуйте диаграмму последовательности для процесса аутентификации. Участник `User` отправляет `Login Request` участнику `System`. `System` отвечает `Login Response`.',
    initialCode: '@startuml\n\n@enduml',
    correctAnswer: '{"mode":"manual","checks":[{"type":"participant_count","value":"2"},{"type":"message_count","value":"2"}]}',
    hint: 'Используйте -> для запроса и --> для ответа.'
  },
  // Module 5: Swagger
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    moduleId: 5,
    number: 1,
    title: 'Введение в OpenAPI',
    type: 'theory',
    slug: 'theory',
    published: true,
    content: `
# OpenAPI (Swagger)

**OpenAPI Specification (OAS)**  это стандарт для описания RESTful API. Он позволяет описывать доступные эндпоинты, форматы запросов и ответов, методы аутентификации и многое другое.

## Структура документа

Документ OpenAPI обычно пишется в формате YAML или JSON.

\`\`\`yaml
openapi: 3.0.0
info:
  title: Sample API
  version: 0.1.9
paths:
  /users:
    get:
      summary: Получить список пользователей
      responses:
        '200':
          description: Успешный ответ
\`\`\`
    `
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    moduleId: 5,
    number: 2,
    title: 'Практика Swagger',
    type: 'practice',
    slug: 'swagger',
    published: true,
    content: 'Опишите один GET эндпоинт `/hello` в спецификации OpenAPI. Он должен возвращать 200 OK.',
    initialCode: 'openapi: 3.0.0\ninfo:\n  title: Test API\n  version: 1.0.0\npaths:',
    correctAnswer: '{"mode":"manual","checks":[{"type":"path_exists","value":"/hello"},{"type":"method_exists","value":"/hello.get"}]}',
    hint: 'В секции paths добавьте /hello, а под ним get.'
  }
];
