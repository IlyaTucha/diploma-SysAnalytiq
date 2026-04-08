PLANTUML_LESSONS = [
    {
        "number": 1,
        "title": "Введение в PlantUML",
        "slug": "plantuml-intro",
        "type": "theory",
        "content": """# Введение в PlantUML

**PlantUML** — инструмент для создания UML-диаграмм из текстового описания.

## Преимущества текстовых диаграмм

- **Версионируемость** — код диаграмм хранится в Git
- **Автоматизация** — диаграммы генерируются автоматически
- **Скорость** — текст набирается быстрее, чем рисуется
- **Единообразие** — одинаковый стиль для всей команды

## Типы диаграмм

| Диаграмма | Описание |
|-----------|----------|
| Sequence | Последовательность взаимодействий |
| Class | Структура классов |
| Use Case | Варианты использования |
| Activity | Активности/алгоритмы |
| Component | Компоненты системы |

## Синтаксис

Каждая диаграмма начинается с `@startuml` и заканчивается `@enduml`:

```plantuml
@startuml
Alice -> Bob: Привет!
Bob -> Alice: Привет!
@enduml
```

## Диаграмма последовательности (Sequence)

Показывает обмен сообщениями между участниками во времени:

```plantuml
@startuml
actor User
participant "Web App" as app
database "DB" as db

User -> app: Запрос данных
app -> db: SQL запрос
db --> app: Результат
app --> User: Ответ
@enduml
```

### Элементы

| Синтаксис | Описание |
|-----------|----------|
| `actor` | Внешний пользователь |
| `participant` | Участник взаимодействия |
| `database` | База данных |
| `->` | Синхронное сообщение |
| `-->` | Ответное/асинхронное сообщение |
| `loop`, `alt`, `opt` | Блоки управления |

> **Совет:** Используйте `as` для создания коротких алиасов длинных имён.
""",
    },
    {
        "number": 2,
        "title": "Диаграмма последовательности",
        "slug": "plantuml-sequence",
        "type": "practice",
        "content": """# Практика: Диаграмма последовательности

## Задание

Создайте диаграмму последовательности для процесса **авторизации пользователя**:

### Требования:
1. Минимум **3 участника**: `actor User`, `participant "Auth Service"`, `database "DB"`
2. Минимум **4 сообщения** (стрелки `->` и `-->`)
3. Поток: User → Auth Service → DB → Auth Service → User

Примерный сценарий:
1. Пользователь вводит логин/пароль
2. Сервис проверяет данные в БД
3. БД возвращает результат
4. Сервис отвечает пользователю
""",
        "initial_code": "@startuml\nactor User\n\n@enduml",
        "correct_answer": '{"mode":"manual","checks":[{"id":"puml1-1","type":"participant_count","value":"3","operator":">="},{"id":"puml1-2","type":"relationship_count","value":"4","operator":">="}]}',
        "hint": "Добавьте participant \"Auth Service\" as auth и database \"DB\" as db. Затем: User -> auth, auth -> db, db --> auth, auth --> User.",
    },
    {
        "number": 3,
        "title": "Диаграмма классов",
        "slug": "plantuml-class",
        "type": "theory",
        "content": """# Диаграмма классов в PlantUML

Диаграмма классов отображает структуру системы: классы, их атрибуты, методы и связи.

## Синтаксис

```plantuml
@startuml
class User {
    +id: int
    +name: String
    +email: String
    +login(): void
    +logout(): void
}

class Order {
    +id: int
    +total: float
    +status: String
    +calculate(): float
}

User "1" --> "*" Order : создаёт
@enduml
```

## Модификаторы доступа

| Символ | Модификатор |
|--------|-------------|
| `+` | public |
| `-` | private |
| `#` | protected |
| `~` | package |

## Типы связей

| Синтаксис | Связь |
|-----------|-------|
| `-->` | Зависимость |
| `--|>` | Наследование |
| `..|>` | Реализация интерфейса |
| `o--` | Агрегация |
| `*--` | Композиция |

## Интерфейсы и абстрактные классы

```plantuml
@startuml
interface Serializable {
    +serialize(): String
}

abstract class BaseModel {
    +id: int
    +save(): void
}

class User extends BaseModel implements Serializable {
    +name: String
    +serialize(): String
}
@enduml
```

> **Ключевое:** Стрелка `--|>` — наследование, `..|>` — реализация интерфейса.
""",
    },
    {
        "number": 4,
        "title": "Диаграмма классов: система задач",
        "slug": "plantuml-class-practice",
        "type": "practice",
        "content": """# Практика: Диаграмма классов

## Задание

Создайте диаграмму классов для **системы управления задачами** (Task Manager):

### Требования:
1. Минимум **3 класса**: `User`, `Task`, `Project`
2. Минимум **3 связи** (стрелки) между классами
3. У каждого класса должны быть атрибуты и методы

Пример структуры:
- `User` имеет список задач
- `Task` принадлежит проекту
- `Project` содержит участников
""",
        "initial_code": "@startuml\nclass User {\n    +id: int\n    +name: String\n}\n\n@enduml",
        "correct_answer": '{"mode":"manual","checks":[{"id":"puml2-1","type":"class_count","value":"3","operator":">="},{"id":"puml2-2","type":"relationship_count","value":"3","operator":">="}]}',
        "hint": "Добавьте класс Task (id, title, status) и Project (id, name). Свяжите: User --> Task, Task --> Project, Project --> User.",
    },
    {
        "number": 5,
        "title": "Sequence: Оплата (код)",
        "slug": "plantuml-code-test",
        "type": "practice",
        "content": """# Практика: Диаграмма оплаты (режим сравнения с эталоном)

В этом задании ваш ответ проверяется **сравнением с эталонным кодом** — количество участников и сообщений.

## Задание

Создайте sequence-диаграмму процесса оплаты:

1. Участники: `actor User`, `participant "Payment Service" as ps`, `database "DB" as db`
2. Сообщения:
   - User -> ps: Оплатить
   - ps -> db: Сохранить транзакцию
   - db --> ps: OK
   - ps --> User: Успех

Итого: **3 участника**, **4 сообщения**.
""",
        "initial_code": "@startuml\nactor User\n\n@enduml",
        "correct_answer": '{"mode":"code","code":"@startuml\\nactor User\\nparticipant \\"Payment Service\\" as ps\\ndatabase \\"DB\\" as db\\n\\nUser -> ps: Оплатить\\nps -> db: Сохранить транзакцию\\ndb --> ps: OK\\nps --> User: Успех\\n@enduml","checkParticipantCount":true,"checkRelationshipCount":true}',
        "hint": "Добавьте participant и database, затем 4 стрелки: User->ps, ps->db, db-->ps, ps-->User.",
    },
    {
        "number": 6,
        "title": "Use Case диаграмма",
        "slug": "plantuml-usecase",
        "type": "practice",
        "content": """# Use Case диаграмма

Use Case диаграммы показывают **функциональные требования** системы — что система делает для пользователей.

## Синтаксис PlantUML

```
@startuml
left to right direction

actor "Покупатель" as buyer
actor "Продавец" as seller

rectangle "Магазин" {
    usecase "Просмотреть товары" as UC1
    usecase "Оформить заказ" as UC2
    usecase "Управлять товарами" as UC3
}

buyer --> UC1
buyer --> UC2
seller --> UC3
@enduml
```

## Задание

Создайте Use Case диаграмму для **системы онлайн-обучения**:

### Требования:
1. Минимум **2 актора**: `Студент`, `Преподаватель`
2. Минимум **4 usecase** внутри rectangle
3. Минимум **4 связи** между акторами и use case

### Примеры Use Case:
- Студент: Просмотреть курсы, Пройти тест, Задать вопрос
- Преподаватель: Создать курс, Проверить работы
""",
        "initial_code": "@startuml\nleft to right direction\n\nactor Студент as student\n\n@enduml",
        "correct_answer": '{"mode":"manual","checks":[{"id":"puml3-1","type":"participant_count","value":"2","operator":">="},{"id":"puml3-2","type":"usecase_count","value":"4","operator":">="},{"id":"puml3-3","type":"relationship_count","value":"4","operator":">="}]}',
        "hint": "Добавьте actor Преподаватель. Создайте rectangle с 4+ usecase. Соедините акторов с use case стрелками -->.",
    },
    {
        "number": 7,
        "title": "Activity диаграмма",
        "slug": "plantuml-activity",
        "type": "practice",
        "content": """# Activity диаграмма

Activity диаграммы описывают **потоки работ** и **бизнес-процессы**.

## Синтаксис PlantUML

```
@startuml
start
:Получить заказ;
if (Товар в наличии?) then (да)
    :Собрать заказ;
    :Отправить;
else (нет)
    :Уведомить клиента;
endif
stop
@enduml
```

## Элементы

| Элемент | Синтаксис |
|---------|-----------|
| Старт | `start` |
| Стоп | `stop` |
| Действие | `:Текст;` |
| Условие | `if (...) then (да) ... else (нет) ... endif` |
| Fork/Join | `fork`, `fork again`, `end fork` |

## Задание

Создайте Activity диаграмму для процесса **регистрации пользователя**:

### Этапы:
1. Начало (`start`)
2. Ввести email и пароль
3. Проверка: email уже существует?
   - Да: Показать ошибку → конец
   - Нет: Создать аккаунт → Отправить письмо подтверждения → конец
""",
        "initial_code": "@startuml\nstart\n:Ввести email и пароль;\n\n@enduml",
        "correct_answer": '{"mode":"manual","checks":[{"id":"puml4-1","type":"has_start","value":"true"},{"id":"puml4-2","type":"has_stop","value":"true"},{"id":"puml4-3","type":"has_if","value":"true"},{"id":"puml4-4","type":"activity_count","value":"3","operator":">="}]}',
        "hint": "После ввода используйте if (email существует?) then (да) :Показать ошибку; stop; else (нет) :Создать аккаунт; :Отправить письмо; stop; endif",
    },
    {
        "number": 8,
        "title": "State диаграмма (код)",
        "slug": "plantuml-state",
        "type": "practice",
        "content": """# State диаграмма (Диаграмма состояний)

State диаграммы показывают **жизненный цикл** объекта — его состояния и переходы между ними.

## Синтаксис PlantUML

```
@startuml
[*] --> Создан
Создан --> В_работе : Взять в работу
В_работе --> На_проверке : Завершить
На_проверке --> Закрыт : Принять
На_проверке --> В_работе : Отклонить
Закрыт --> [*]
@enduml
```

## Элементы

| Элемент | Описание |
|---------|----------|
| `[*]` | Начальное/конечное состояние |
| `State1 --> State2` | Переход |
| `: описание` | Действие/событие перехода |

## Задание

Создайте State диаграмму для **жизненного цикла заказа**:

### Состояния:
- Создан
- Оплачен
- В_сборке
- Отправлен
- Доставлен
- Отменён

### Требования:
- Начальное состояние `[*]` → Создан
- Ровно **6 состояний**
- Минимум **7 переходов**
- Конечные состояния: Доставлен → `[*]`, Отменён → `[*]`

> **Режим проверки:** Ваш ответ сравнивается с эталонным кодом.
""",
        "initial_code": "@startuml\n[*] --> Создан\n\n@enduml",
        "correct_answer": '{"mode":"code","code":"@startuml\\n[*] --> Создан\\nСоздан --> Оплачен : Оплатить\\nСоздан --> Отменён : Отменить\\nОплачен --> В_сборке : Начать сборку\\nВ_сборке --> Отправлен : Отправить\\nОтправлен --> Доставлен : Доставить\\nДоставлен --> [*]\\nОтменён --> [*]\\n@enduml","checkStateCount":true,"checkTransitionCount":true}',
        "hint": "Создайте цепочку: [*]-->Создан-->Оплачен-->В_сборке-->Отправлен-->Доставлен-->[*]. Добавьте Создан-->Отменён-->[*].",
    },
    {
        "number": 9,
        "title": "Component диаграмма",
        "slug": "plantuml-component",
        "type": "practice",
        "content": """# Component диаграмма

Component диаграммы показывают **архитектуру системы** — компоненты и их зависимости.

## Синтаксис PlantUML

```
@startuml
package "Frontend" {
    [React App] as react
    [Redux Store] as redux
}

package "Backend" {
    [API Server] as api
    [Auth Service] as auth
}

database "PostgreSQL" as db

react --> api : REST
api --> auth
api --> db
@enduml
```

## Элементы

| Элемент | Синтаксис |
|---------|-----------|
| Компонент | `[Name]` или `component Name` |
| Пакет | `package "Name" { }` |
| База данных | `database "Name"` |
| Интерфейс | `interface Name` |

## Задание

Создайте Component диаграмму для **микросервисной архитектуры**:

### Требования:
1. Минимум **2 пакета** (Frontend, Backend)
2. Минимум **4 компонента**
3. **1 база данных**
4. Минимум **4 связи** между компонентами

### Примерная структура:
- Frontend: Web App, Mobile App
- Backend: API Gateway, User Service, Order Service
- Database: PostgreSQL
""",
        "initial_code": "@startuml\npackage \"Frontend\" {\n    [Web App] as web\n}\n\n@enduml",
        "correct_answer": '{"mode":"manual","checks":[{"id":"puml6-1","type":"package_count","value":"2","operator":">="},{"id":"puml6-2","type":"component_count","value":"4","operator":">="},{"id":"puml6-3","type":"database_count","value":"1","operator":">="},{"id":"puml6-4","type":"relationship_count","value":"4","operator":">="}]}',
        "hint": "Добавьте package Backend с компонентами API Gateway, User Service. Добавьте database PostgreSQL. Соедините: web-->api, api-->user_service, api-->db.",
    },
    {
        "number": 10,
        "title": "Sequence: Авторизация OAuth (код)",
        "slug": "plantuml-oauth-sequence",
        "type": "practice",
        "content": """# Sequence диаграмма: OAuth 2.0

В этом задании ответ проверяется **сравнением с эталоном**.

## Задание

Создайте sequence-диаграмму процесса OAuth 2.0 авторизации:

### Участники:
1. `actor User`
2. `participant "Client App" as client`
3. `participant "Auth Server" as auth`
4. `participant "Resource Server" as resource`

### Сообщения:
1. User -> client: Войти через OAuth
2. client -> auth: Запрос авторизации
3. auth -> User: Форма логина
4. User -> auth: Логин и пароль
5. auth -> client: Authorization Code
6. client -> auth: Обмен code на token
7. auth -> client: Access Token
8. client -> resource: Запрос с токеном
9. resource -> client: Данные

Итого: **4 участника**, **9 сообщений**.
""",
        "initial_code": "@startuml\nactor User\nparticipant \"Client App\" as client\n\n@enduml",
        "correct_answer": '{"mode":"code","code":"@startuml\\nactor User\\nparticipant \\"Client App\\" as client\\nparticipant \\"Auth Server\\" as auth\\nparticipant \\"Resource Server\\" as resource\\n\\nUser -> client: Войти через OAuth\\nclient -> auth: Запрос авторизации\\nauth -> User: Форма логина\\nUser -> auth: Логин и пароль\\nauth -> client: Authorization Code\\nclient -> auth: Обмен code на token\\nauth -> client: Access Token\\nclient -> resource: Запрос с токеном\\nresource -> client: Данные\\n@enduml","checkParticipantCount":true,"checkRelationshipCount":true}',
        "hint": "Добавьте participant Auth Server и Resource Server. Затем 9 стрелок согласно описанию.",
    },
]
