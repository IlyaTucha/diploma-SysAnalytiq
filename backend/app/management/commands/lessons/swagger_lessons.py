SWAGGER_LESSONS = [
    {
        "number": 1,
        "title": "Введение в OpenAPI/Swagger",
        "slug": "swagger-intro",
        "type": "theory",
        "content": """# Введение в OpenAPI (Swagger)

**OpenAPI Specification** (ранее Swagger) — стандарт описания REST API в формате YAML/JSON.

## Зачем нужна спецификация API?

- **Документация** — автоматическая генерация из спецификации
- **Контракт** — соглашение между frontend и backend
- **Кодогенерация** — автоматическое создание клиентских библиотек
- **Тестирование** — валидация запросов и ответов

## Структура файла OpenAPI 3.0

```yaml
openapi: "3.0.0"
info:
  title: My API
  version: "1.0"

paths:
  /users:
    get:
      summary: Список пользователей
      responses:
        "200":
          description: Успех
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/User"

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
```

## Ключевые секции

| Секция | Описание |
|--------|----------|
| `info` | Метаданные API (название, версия) |
| `paths` | Эндпоинты и их операции |
| `components` | Переиспользуемые схемы данных |
| `security` | Настройки аутентификации |

## HTTP методы

| Метод | CRUD операция | Пример |
|-------|---------------|--------|
| `GET` | Read | Получить список |
| `POST` | Create | Создать запись |
| `PUT` | Update | Обновить полностью |
| `PATCH` | Partial Update | Обновить частично |
| `DELETE` | Delete | Удалить |

> **Совет:** Всегда определяйте `components/schemas` для переиспользования типов данных.
""",
    },
    {
        "number": 2,
        "title": "Описание CRUD API",
        "slug": "swagger-crud",
        "type": "practice",
        "content": """# Практика: CRUD API

## Задание

Опишите OpenAPI спецификацию для API управления **книгами** (`/books`):

### Требования:
1. Минимум **2 пути** (paths): `/books` и `/books/{id}`
2. Минимум **3 эндпоинта** (метода): `GET /books`, `POST /books`, `GET /books/{id}`
3. Минимум **1 схема** в `components/schemas` (Book)

Структура `Book`:
- `id` (integer)
- `title` (string)
- `author` (string)
""",
        "initial_code": 'openapi: "3.0.0"\ninfo:\n  title: Books API\n  version: "1.0"\npaths:\n  /books:\n    get:\n      summary: Список книг\n      responses:\n        "200":\n          description: OK\n',
        "correct_answer": '{"mode":"manual","checks":[{"id":"swag1-1","type":"path_count","value":"2","operator":">="},{"id":"swag1-2","type":"endpoint_count","value":"3","operator":">="},{"id":"swag1-3","type":"schema_count","value":"1","operator":">="},{"id":"swag1-4","type":"path_exists","target":"/books"},{"id":"swag1-5","type":"path_exists","target":"/books/{id}"}]}',
        "hint": "Добавьте путь /books/{id} с методом get. В /books добавьте метод post. В components/schemas определите схему Book.",
    },
    {
        "number": 3,
        "title": "Параметры и тело запроса",
        "slug": "swagger-params",
        "type": "theory",
        "content": """# Параметры и тело запроса в OpenAPI

## Параметры запроса (Parameters)

### Path-параметры

```yaml
/users/{id}:
  get:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
```

### Query-параметры

```yaml
/users:
  get:
    parameters:
      - name: limit
        in: query
        schema:
          type: integer
          default: 10
      - name: offset
        in: query
        schema:
          type: integer
          default: 0
```

## Тело запроса (Request Body)

```yaml
/users:
  post:
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/UserCreate"
    responses:
      "201":
        description: Создан
```

## Коды ответов

| Код | Описание |
|-----|----------|
| `200` | Успешный запрос |
| `201` | Ресурс создан |
| `400` | Ошибка клиента |
| `401` | Не авторизован |
| `404` | Не найден |
| `500` | Ошибка сервера |

## $ref — ссылки на схемы

Используйте `$ref` для переиспользования:

```yaml
schema:
  $ref: "#/components/schemas/User"
```

> **Best Practice:** Разделяйте схемы для создания (`UserCreate`) и чтения (`User`), чтобы `id` был только в ответах.
""",
    },
    {
        "number": 4,
        "title": "API интернет-магазина",
        "slug": "swagger-shop",
        "type": "practice",
        "content": """# Практика: API интернет-магазина

## Задание

Опишите OpenAPI спецификацию для API интернет-магазина:

### Требования:
1. Минимум **3 пути**: `/products`, `/products/{id}`, `/orders`
2. Минимум **4 эндпоинта**:
   - `GET /products` — список товаров
   - `GET /products/{id}` — товар по ID
   - `POST /orders` — создать заказ
   - `GET /orders` — список заказов
3. Минимум **2 схемы** в `components/schemas` (Product, Order)
""",
        "initial_code": 'openapi: "3.0.0"\ninfo:\n  title: Shop API\n  version: "1.0"\npaths: {}\ncomponents:\n  schemas: {}\n',
        "correct_answer": '{"mode":"manual","checks":[{"id":"swag2-1","type":"path_count","value":"3","operator":">="},{"id":"swag2-2","type":"endpoint_count","value":"4","operator":">="},{"id":"swag2-3","type":"schema_count","value":"2","operator":">="},{"id":"swag2-4","type":"path_exists","target":"/products"},{"id":"swag2-5","type":"path_exists","target":"/orders"}]}',
        "hint": "Заполните paths: /products (get), /products/{id} (get), /orders (get, post). В components/schemas добавьте Product и Order.",
    },
    {
        "number": 5,
        "title": "API задач (код)",
        "slug": "swagger-code-test",
        "type": "practice",
        "content": """# Практика: API задач (режим сравнения с эталоном)

В этом задании ваш ответ проверяется **сравнением с эталонным кодом** — количество путей, эндпоинтов и схем.

## Задание

Опишите OpenAPI спецификацию для API задач (`/tasks`):

1. **2 пути**: `/tasks`, `/tasks/{id}`
2. **3 эндпоинта**: `GET /tasks`, `POST /tasks`, `GET /tasks/{id}`
3. **1 схема**: `Task` (id, title, done)
""",
        "initial_code": 'openapi: "3.0.0"\ninfo:\n  title: Tasks API\n  version: "1.0"\npaths:\n  /tasks:\n    get:\n      summary: Список задач\n      responses:\n        "200":\n          description: OK\n',
        "correct_answer": '{"mode":"code","code":"openapi: \\"3.0.0\\"\\ninfo:\\n  title: Tasks API\\n  version: \\"1.0\\"\\npaths:\\n  /tasks:\\n    get:\\n      summary: Список задач\\n      responses:\\n        \\"200\\":\\n          description: OK\\n    post:\\n      summary: Создать задачу\\n      responses:\\n        \\"201\\":\\n          description: Создано\\n  /tasks/{id}:\\n    get:\\n      summary: Задача по ID\\n      responses:\\n        \\"200\\":\\n          description: OK\\ncomponents:\\n  schemas:\\n    Task:\\n      type: object\\n      properties:\\n        id:\\n          type: integer\\n        title:\\n          type: string\\n        done:\\n          type: boolean","checkPathCount":true,"checkEndpointCount":true,"checkSchemaCount":true,"checkPathNames":true}',
        "hint": "Добавьте в /tasks метод post. Создайте путь /tasks/{id} с методом get. В components/schemas опишите Task.",
    },
    {
        "number": 6,
        "title": "Схемы данных и $ref",
        "slug": "swagger-schemas",
        "type": "practice",
        "content": """# Переиспользование схем с $ref

## Задание

Создайте OpenAPI спецификацию для **блога** с правильными ссылками на схемы:

### Требования:
1. **3 пути**: `/posts`, `/posts/{id}`, `/posts/{id}/comments`
2. **5 эндпоинтов**:
   - `GET /posts` - список постов
   - `POST /posts` - создать пост
   - `GET /posts/{id}` - пост по ID
   - `GET /posts/{id}/comments` - комментарии к посту
   - `POST /posts/{id}/comments` - добавить комментарий
3. **3 схемы**:
   - `Post` (id, title, content, author)
   - `PostCreate` (title, content) — без id
   - `Comment` (id, text, author)

### Важно:
- Используйте `$ref: "#/components/schemas/Post"` для ссылок
- Разделяйте схемы для чтения (Post) и создания (PostCreate)
""",
        "initial_code": 'openapi: "3.0.0"\ninfo:\n  title: Blog API\n  version: "1.0"\npaths:\n  /posts:\n    get:\n      summary: Список постов\n      responses:\n        "200":\n          description: OK\n',
        "correct_answer": '{"mode":"manual","checks":[{"id":"swag3-1","type":"path_count","value":"3","operator":">="},{"id":"swag3-2","type":"endpoint_count","value":"5","operator":">="},{"id":"swag3-3","type":"schema_count","value":"3","operator":">="},{"id":"swag3-4","type":"path_exists","target":"/posts"},{"id":"swag3-5","type":"path_exists","target":"/posts/{id}"},{"id":"swag3-6","type":"path_exists","target":"/posts/{id}/comments"}]}',
        "hint": "Добавьте paths для /posts/{id} и /posts/{id}/comments. В components/schemas создайте Post, PostCreate и Comment.",
    },
    {
        "number": 7,
        "title": "Аутентификация и Security",
        "slug": "swagger-security",
        "type": "practice",
        "content": """# Безопасность в OpenAPI

## Определение Security Schemes

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
```

## Применение авторизации

```yaml
# Глобально для всего API:
security:
  - bearerAuth: []

# Или для конкретного эндпоинта:
paths:
  /users:
    get:
      security:
        - bearerAuth: []
```

## Задание

Создайте OpenAPI спецификацию для **API с авторизацией**:

### Требования:
1. **3 пути**: `/auth/login`, `/users`, `/users/{id}`
2. **4 эндпоинта**:
   - `POST /auth/login` - авторизация (без security)
   - `GET /users` - список (с JWT)
   - `GET /users/{id}` - пользователь по ID (с JWT)
   - `DELETE /users/{id}` - удалить (с JWT)
3. **2 схемы**: `User`, `LoginRequest`
4. **1 securityScheme**: `bearerAuth` (JWT)
""",
        "initial_code": 'openapi: "3.0.0"\ninfo:\n  title: Auth API\n  version: "1.0"\npaths: {}\ncomponents:\n  securitySchemes:\n    bearerAuth:\n      type: http\n      scheme: bearer\n',
        "correct_answer": '{"mode":"manual","checks":[{"id":"swag4-1","type":"path_count","value":"3","operator":">="},{"id":"swag4-2","type":"endpoint_count","value":"4","operator":">="},{"id":"swag4-3","type":"schema_count","value":"2","operator":">="},{"id":"swag4-4","type":"has_security_scheme","value":"true"},{"id":"swag4-5","type":"path_exists","target":"/auth/login"}]}',
        "hint": "Создайте /auth/login с POST (без security). /users с GET, /users/{id} с GET и DELETE. Добавьте security: - bearerAuth: [] к защищённым эндпоинтам.",
    },
    {
        "number": 8,
        "title": "Пагинация и фильтрация (код)",
        "slug": "swagger-pagination",
        "type": "practice",
        "content": """# Query-параметры для пагинации и фильтрации

## Пример

```yaml
/products:
  get:
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: limit
        in: query
        schema:
          type: integer
          default: 20
      - name: category
        in: query
        schema:
          type: string
      - name: min_price
        in: query
        schema:
          type: number
```

## Задание

Создайте OpenAPI спецификацию для **каталога товаров с фильтрацией**:

### Требования:
1. **2 пути**: `/products`, `/products/{id}`
2. **3 эндпоинта**: GET /products, GET /products/{id}, POST /products
3. **1 схема**: `Product` (id, name, price, category)

### Query-параметры для GET /products:
- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `category` (string, optional)
- `min_price` (number, optional)

> **Режим проверки:** Ваш ответ сравнивается с эталонным кодом.
""",
        "initial_code": 'openapi: "3.0.0"\ninfo:\n  title: Catalog API\n  version: "1.0"\npaths:\n  /products:\n    get:\n      summary: Список товаров\n      parameters: []\n',
        "correct_answer": '{"mode":"code","code":"openapi: \\"3.0.0\\"\\ninfo:\\n  title: Catalog API\\n  version: \\"1.0\\"\\npaths:\\n  /products:\\n    get:\\n      summary: Список товаров\\n      parameters:\\n        - name: page\\n          in: query\\n          schema:\\n            type: integer\\n            default: 1\\n        - name: limit\\n          in: query\\n          schema:\\n            type: integer\\n            default: 20\\n        - name: category\\n          in: query\\n          schema:\\n            type: string\\n        - name: min_price\\n          in: query\\n          schema:\\n            type: number\\n      responses:\\n        \\"200\\":\\n          description: OK\\n    post:\\n      summary: Создать товар\\n      responses:\\n        \\"201\\":\\n          description: Создано\\n  /products/{id}:\\n    get:\\n      summary: Товар по ID\\n      responses:\\n        \\"200\\":\\n          description: OK\\ncomponents:\\n  schemas:\\n    Product:\\n      type: object\\n      properties:\\n        id:\\n          type: integer\\n        name:\\n          type: string\\n        price:\\n          type: number\\n        category:\\n          type: string","checkPathCount":true,"checkEndpointCount":true,"checkSchemaCount":true,"checkParameterCount":true}',
        "hint": "Добавьте в parameters массив объектов с name/in/schema для page, limit, category, min_price.",
    },
    {
        "number": 9,
        "title": "Webhook и Callbacks",
        "slug": "swagger-webhooks",
        "type": "practice",
        "content": """# Webhooks в OpenAPI 3.0

Webhooks позволяют описать API, который **вызывает внешние системы**.

## Пример

```yaml
webhooks:
  orderCreated:
    post:
      summary: Новый заказ создан
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Order"
      responses:
        "200":
          description: Webhook обработан
```

## Callbacks

Callbacks описывают асинхронные ответы:

```yaml
/subscribe:
  post:
    callbacks:
      onEvent:
        "{$request.body#/callbackUrl}":
          post:
            requestBody:
              content:
                application/json:
                  schema:
                    type: object
```

## Задание

Создайте OpenAPI спецификацию для **платёжной системы с webhooks**:

### Требования:
1. **2 пути**: `/payments`, `/payments/{id}`
2. **3 эндпоинта**: POST /payments (создать), GET /payments/{id}, POST /payments/{id}/refund
3. **2 webhooks**: `paymentSuccess`, `paymentFailed`
4. **3 схемы**: `Payment`, `PaymentCreate`, `WebhookPayload`
""",
        "initial_code": 'openapi: "3.0.0"\ninfo:\n  title: Payments API\n  version: "1.0"\npaths: {}\nwebhooks: {}\n',
        "correct_answer": '{"mode":"manual","checks":[{"id":"swag6-1","type":"path_count","value":"2","operator":">="},{"id":"swag6-2","type":"endpoint_count","value":"3","operator":">="},{"id":"swag6-3","type":"schema_count","value":"2","operator":">="},{"id":"swag6-4","type":"has_webhooks","value":"true"}]}',
        "hint": "В paths создайте /payments (POST) и /payments/{id} (GET, POST для refund). В webhooks добавьте paymentSuccess и paymentFailed с post методами.",
    },
    {
        "number": 10,
        "title": "Полный REST API (код)",
        "slug": "swagger-full-api",
        "type": "practice",
        "content": """# Полная спецификация REST API

В этом задании ответ проверяется **сравнением с эталоном**.

## Задание

Создайте полную OpenAPI спецификацию для **API управления пользователями**:

### Требования:

**Пути и эндпоинты:**
1. `/users` - GET (список), POST (создать)
2. `/users/{id}` - GET (получить), PUT (обновить), DELETE (удалить)

**Схемы:**
1. `User` - полный объект (id, name, email, role, created_at)
2. `UserCreate` - для создания (name, email, role)
3. `UserUpdate` - для обновления (name, email)

**Ответы:**
- 200 для успешных GET/PUT
- 201 для POST
- 204 для DELETE
- 400, 404 для ошибок

**Итого:** 2 path, 5 endpoints, 3 schemas
""",
        "initial_code": 'openapi: "3.0.0"\ninfo:\n  title: Users API\n  version: "1.0"\npaths:\n  /users:\n    get:\n      summary: Список пользователей\n',
        "correct_answer": '{"mode":"code","code":"openapi: \\"3.0.0\\"\\ninfo:\\n  title: Users API\\n  version: \\"1.0\\"\\npaths:\\n  /users:\\n    get:\\n      summary: Список пользователей\\n      responses:\\n        \\"200\\":\\n          description: OK\\n    post:\\n      summary: Создать пользователя\\n      responses:\\n        \\"201\\":\\n          description: Создано\\n  /users/{id}:\\n    get:\\n      summary: Пользователь по ID\\n      responses:\\n        \\"200\\":\\n          description: OK\\n    put:\\n      summary: Обновить пользователя\\n      responses:\\n        \\"200\\":\\n          description: OK\\n    delete:\\n      summary: Удалить пользователя\\n      responses:\\n        \\"204\\":\\n          description: No Content\\ncomponents:\\n  schemas:\\n    User:\\n      type: object\\n      properties:\\n        id:\\n          type: integer\\n        name:\\n          type: string\\n        email:\\n          type: string\\n        role:\\n          type: string\\n        created_at:\\n          type: string\\n    UserCreate:\\n      type: object\\n      properties:\\n        name:\\n          type: string\\n        email:\\n          type: string\\n        role:\\n          type: string\\n    UserUpdate:\\n      type: object\\n      properties:\\n        name:\\n          type: string\\n        email:\\n          type: string","checkPathCount":true,"checkEndpointCount":true,"checkSchemaCount":true,"checkPathNames":true}',
        "hint": "Добавьте POST в /users. Создайте /users/{id} с GET, PUT, DELETE. В components/schemas создайте User, UserCreate, UserUpdate.",
    },
]
