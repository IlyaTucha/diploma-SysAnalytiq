from ninja import Router
from typing import List
from ninja.errors import HttpError
import json
from ..domain.entities import (
    ModuleSchema, ModuledDetailSchema, LessonSchema,
    LessonCreateSchema, LessonUpdateSchema, ModuleUpdateSchema, LessonReorderSchema,
    LessonValidateRequest
)
from ..domain.services import EducationService
from ninja_jwt.authentication import JWTAuth

router = Router()

def _is_admin(request):
    try:
        authenticator = JWTAuth()
        user = authenticator(request)
        return user and getattr(user, 'is_staff', False)
    except Exception:
        return False

@router.get("/modules", response=List[ModuleSchema])
def list_modules(request):
    return EducationService.get_all_modules()

@router.get("/modules/{slug}", response=ModuledDetailSchema)
def get_module(request, slug: str):
    module = EducationService.get_module_by_slug(slug)
    if not _is_admin(request):
        for lesson in module.lessons.all():
            lesson.correct_answer = None
    return module

@router.put("/modules/{slug}", response=ModuleSchema, auth=JWTAuth())
def update_module(request, slug: str, data: ModuleUpdateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Требуются права администратора")
    return EducationService.update_module(slug, data)


@router.get("/modules/{slug}/lessons", response=List[LessonSchema])
def get_module_lessons(request, slug: str):
    lessons = list(EducationService.get_lessons_by_module(slug))
    if not _is_admin(request):
        for lesson in lessons:
            lesson.correct_answer = None
    return lessons

@router.get("/lessons/{slug}", response=LessonSchema)
def get_lesson(request, slug: str):
    lesson = EducationService.get_lesson(slug)
    if not _is_admin(request):
        lesson.correct_answer = None
    return lesson

@router.post("/lessons", response=LessonSchema, auth=JWTAuth())
def create_lesson(request, data: LessonCreateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Требуются права администратора")
    return EducationService.create_lesson(data)


@router.put("/lessons/{slug}", response=LessonSchema, auth=JWTAuth())
def update_lesson(request, slug: str, data: LessonUpdateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Требуются права администратора")
    return EducationService.update_lesson(slug, data)


@router.delete("/lessons/{slug}", auth=JWTAuth())
def delete_lesson(request, slug: str):
    if not request.user.is_staff:
        raise HttpError(403, "Требуются права администратора")
    return EducationService.delete_lesson(slug)


@router.post("/modules/{slug}/reorder", response=List[LessonSchema], auth=JWTAuth())
def reorder_lessons(request, slug: str, data: LessonReorderSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Требуются права администратора")
    return EducationService.reorder_lessons(slug, data.lesson_ids)


@router.post("/lessons/{slug}/validate")
def validate_lesson_solution(request, slug: str, data: LessonValidateRequest):
    lesson = EducationService.get_lesson(slug)
    if not lesson:
        raise HttpError(404, "Урок не найден")
    
    config = {"mode": "code", "code": ""}
    try:
        if lesson.correct_answer and lesson.correct_answer.strip().startswith('{'):
            config = json.loads(lesson.correct_answer)
        else:
            config = {"mode": "code", "code": lesson.correct_answer or ""}
    except json.JSONDecodeError:
        config = {"mode": "code", "code": lesson.correct_answer or ""}

    module_slug = lesson.module.slug if lesson.module else ''

    if module_slug == 'bpmn':
        return _validate_bpmn_solution(data.code, config)
    elif module_slug == 'sql':
        return _validate_sql_solution(data.code, config)
    elif module_slug == 'erd':
        return _validate_erd_solution(data.code, config)
    elif module_slug == 'plantuml':
        return _validate_plantuml_solution(data.code, config)
    elif module_slug == 'swagger':
        return _validate_swagger_solution(data.code, config)
    
    return {"valid": True}


def _validate_erd_solution(student_code: str, config: dict) -> dict:
    """Полная валидация ERD (DBML) на бэкенде"""
    if not student_code.strip():
        return {"valid": False, "error": "Код схемы пустой"}

    open_braces = student_code.count('{')
    close_braces = student_code.count('}')
    if open_braces != close_braces:
        return {"valid": False, "error": f"Несоответствие фигурных скобок: открывающих {open_braces}, закрывающих {close_braces}"}

    def parse_dbml(dbml: str):
        tables: dict = {}
        current_table = ''
        inline_ref_count = 0
        for line in dbml.split('\n'):
            trimmed = line.strip()
            if trimmed.startswith('Table'):
                m = re.match(r'Table\s+(\w+)', trimmed)
                if m:
                    current_table = m.group(1)
                    tables[current_table] = {'columns': {}}
            elif trimmed.startswith('}'):
                current_table = ''
            elif current_table and trimmed and not trimmed.startswith('//') and not trimmed.startswith('Note') and not trimmed.startswith('Ref:'):
                parts = trimmed.split()
                if len(parts) >= 2:
                    tables[current_table]['columns'][parts[0]] = parts[1]
                if re.search(r'\[.*ref\s*:', trimmed, re.IGNORECASE):
                    inline_ref_count += 1
        standalone_refs = len(re.findall(r'^Ref\s*:', dbml, re.MULTILINE))
        return {'tables': tables, 'relationships': standalone_refs + inline_ref_count}

    student_schema = parse_dbml(student_code)

    def check_val(actual, expected, operator):
        if operator == '>': return actual > expected
        if operator == '<': return actual < expected
        if operator == '>=': return actual >= expected
        if operator == '<=': return actual <= expected
        if operator == '!=': return actual != expected
        return actual == expected

    def op_text(op):
        return {'>': '>', '<': '<', '>=': '>=', '<=': '<=', '!=': '!=', '=': '='}.get(op, '')

    mode = config.get('mode')
    if mode == 'manual':
        for check in config.get('checks', []):
            try:
                expected = int(check.get('value', 0))
            except (ValueError, TypeError):
                expected = 0
            operator = check.get('operator', '=')
            suffix = f" ({op_text(operator)})" if op_text(operator) else ""
            c_type = check.get('type', '')
            if c_type == 'table_count':
                actual = len(student_schema['tables'])
                if not check_val(actual, expected, operator):
                    return {"valid": False, "error": f"Ожидалось таблиц: {expected}{suffix}, найдено: {actual}"}
            elif c_type == 'relationship_count':
                if not check_val(student_schema['relationships'], expected, operator):
                    return {"valid": False, "error": f"Ожидалось связей: {expected}{suffix}, найдено: {student_schema['relationships']}"}
            elif c_type == 'table_exists':
                target = check.get('target', '')
                if target not in student_schema['tables']:
                    return {"valid": False, "error": f'Таблица "{target}" не найдена'}
            elif c_type == 'column_exists':
                col_ref = check.get('target', '')
                if '.' in col_ref:
                    tbl, col = col_ref.split('.', 1)
                    if tbl not in student_schema['tables']:
                        return {"valid": False, "error": f'Таблица "{tbl}" не найдена'}
                    if col not in student_schema['tables'][tbl]['columns']:
                        return {"valid": False, "error": f'Колонка "{col}" в таблице "{tbl}" не найдена'}
    elif config.get('code'):
        ref_schema = parse_dbml(config['code'])
        if config.get('checkTableCount'):
            exp = len(ref_schema['tables'])
            act = len(student_schema['tables'])
            if act != exp:
                return {"valid": False, "error": f"Ожидалось таблиц: {exp}, найдено: {act}"}
        if config.get('checkRelationshipCount'):
            if student_schema['relationships'] != ref_schema['relationships']:
                return {"valid": False, "error": f"Ожидалось связей: {ref_schema['relationships']}, найдено: {student_schema['relationships']}"}
        if config.get('checkTableNames'):
            ref_names = sorted(n.lower() for n in ref_schema['tables'])
            stu_names = sorted(n.lower() for n in student_schema['tables'])
            missing = [n for n in ref_names if n not in stu_names]
            if missing:
                return {"valid": False, "error": f"Не найдены таблицы: {', '.join(missing)}"}
        if config.get('checkColumnNames'):
            for tbl_name, tbl_data in ref_schema['tables'].items():
                stu_tbl = next((v for k, v in student_schema['tables'].items() if k.lower() == tbl_name.lower()), None)
                if not stu_tbl:
                    return {"valid": False, "error": f'Таблица "{tbl_name}" не найдена'}
                ref_cols = [c.lower() for c in tbl_data['columns']]
                stu_cols = [c.lower() for c in stu_tbl['columns']]
                missing_cols = [c for c in ref_cols if c not in stu_cols]
                if missing_cols:
                    return {"valid": False, "error": f'В таблице "{tbl_name}" не найдены колонки: {", ".join(missing_cols)}'}

    return {"valid": True, "message": "Все проверки пройдены. Схема корректна!"}




def _get_sql_mock_db():
    """Создание in-memory SQLite БД с тестовыми данными (зеркало frontend SqlMock.ts)."""
    import sqlite3
    conn = sqlite3.connect(':memory:')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('CREATE TABLE users (id int, name char, email char, age int, city char)')
    c.execute('CREATE TABLE departments (id int, name char, manager_id int, budget int)')
    c.execute('CREATE TABLE employees (id int, name char, department_id int, salary int, hire_date char)')
    c.execute('CREATE TABLE products (id int, name char, category char, price int, stock int)')
    c.execute('CREATE TABLE orders (id int, user_id int, product_id int, quantity int, total int, status char, order_date char)')
    c.execute('CREATE TABLE reviews (id int, user_id int, product_id int, rating int, comment char)')
    _USERS = [(1,'Иван Петров','ivan@example.com',25,'Москва'),(2,'Мария Сидорова','maria@example.com',30,'Санкт-Петербург'),(3,'Петр Иванов','petr@example.com',22,'Казань'),(4,'Анна Смирнова','anna@example.com',17,'Москва'),(5,'Дмитрий Козлов','dmitry@example.com',35,'Екатеринбург'),(6,'Алексей Морозов','alex@example.com',16,'Новосибирск'),(7,'Елена Волкова','elena@example.com',28,'Москва'),(8,'Сергей Новиков','sergey@example.com',42,'Казань'),(9,'Ольга Федорова','olga@example.com',31,'Москва'),(10,'Николай Зайцев','nikolay@example.com',27,'Санкт-Петербург'),(11,'Татьяна Кузнецова','tatyana@example.com',24,'Екатеринбург'),(12,'Андрей Соколов','andrey@example.com',39,'Москва'),(13,'Наталья Попова','natalya@example.com',21,'Нижний Новгород'),(14,'Виктор Лебедев','viktor@example.com',45,'Казань'),(15,'Юлия Козлова','yuliya@example.com',29,'Москва'),(16,'Максим Орлов','maksim@example.com',33,'Самара'),(17,'Екатерина Миронова','ekaterina@example.com',26,'Санкт-Петербург'),(18,'Роман Белов','roman@example.com',38,'Москва'),(19,'Светлана Тихонова','svetlana@example.com',20,'Воронеж'),(20,'Артём Григорьев','artem@example.com',34,'Екатеринбург'),(21,'Вера Комарова','vera@example.com',23,'Москва'),(22,'Михаил Егоров','mikhail@example.com',41,'Новосибирск'),(23,'Полина Баранова','polina@example.com',19,'Казань'),(24,'Павел Князев','pavel@example.com',36,'Санкт-Петербург'),(25,'Дарья Филатова','darya@example.com',32,'Самара'),(26,'Кирилл Власов','kirill@example.com',18,'Москва'),(27,'Людмила Жукова','lyudmila@example.com',44,'Нижний Новгород'),(28,'Илья Медведев','ilya@example.com',29,'Екатеринбург'),(29,'Оксана Шевцова','oksana@example.com',37,'Воронеж'),(30,'Георгий Антонов','georgiy@example.com',40,'Москва')]
    c.executemany('INSERT INTO users VALUES (?,?,?,?,?)', _USERS)
    _DEPS = [(1,'Разработка',1,5000000),(2,'Маркетинг',2,2000000),(3,'Продажи',5,3000000),(4,'HR',7,1500000),(5,'Бухгалтерия',9,1800000),(6,'Аналитика',12,2500000),(7,'QA',14,2200000),(8,'DevOps',18,3500000)]
    c.executemany('INSERT INTO departments VALUES (?,?,?,?)', _DEPS)
    _EMPS = [(1,'Иван Петров',1,120000,'2021-03-15'),(2,'Мария Сидорова',2,95000,'2020-07-01'),(3,'Петр Иванов',1,85000,'2022-01-10'),(4,'Анна Смирнова',3,78000,'2023-06-20'),(5,'Дмитрий Козлов',3,110000,'2019-11-05'),(6,'Алексей Морозов',1,70000,'2023-09-01'),(7,'Елена Волкова',4,100000,'2020-02-14'),(8,'Сергей Новиков',2,88000,'2021-08-30'),(9,'Ольга Федорова',5,92000,'2020-04-12'),(10,'Николай Зайцев',6,105000,'2021-01-20'),(11,'Татьяна Кузнецова',1,98000,'2021-06-01'),(12,'Андрей Соколов',6,130000,'2018-09-15'),(13,'Наталья Попова',4,72000,'2023-02-01'),(14,'Виктор Лебедев',7,115000,'2019-05-20'),(15,'Юлия Козлова',2,82000,'2022-11-10'),(16,'Максим Орлов',3,90000,'2021-10-05'),(17,'Екатерина Миронова',5,75000,'2023-04-18'),(18,'Роман Белов',8,140000,'2018-03-01'),(19,'Светлана Тихонова',7,68000,'2024-01-15'),(20,'Артём Григорьев',1,125000,'2019-08-22'),(21,'Вера Комарова',6,95000,'2022-03-30'),(22,'Михаил Егоров',8,110000,'2020-12-01'),(23,'Полина Баранова',7,76000,'2023-07-10'),(24,'Павел Князев',1,135000,'2017-11-20'),(25,'Дарья Филатова',3,83000,'2022-05-14'),(26,'Кирилл Власов',8,65000,'2024-02-01'),(27,'Людмила Жукова',5,88000,'2021-09-25'),(28,'Илья Медведев',6,100000,'2020-06-08'),(29,'Оксана Шевцова',4,80000,'2022-08-19'),(30,'Георгий Антонов',2,97000,'2021-04-03'),(31,'Алина Романова',1,78000,'2023-10-01'),(32,'Денис Воронов',7,90000,'2021-12-15'),(33,'Ирина Савельева',3,86000,'2022-02-28'),(34,'Владислав Крылов',8,118000,'2019-07-14'),(35,'Марина Фомина',5,74000,'2023-11-20')]
    c.executemany('INSERT INTO employees VALUES (?,?,?,?,?)', _EMPS)
    _PRODS = [(1,'Ноутбук','Электроника',75000,15),(2,'Смартфон','Электроника',35000,30),(3,'Книга SQL для начинающих','Книги',890,50),(4,'Наушники','Электроника',5500,25),(5,'Клавиатура','Электроника',3200,20),(6,'Монитор','Электроника',28000,10),(7,'Книга Базы данных','Книги',1200,35),(8,'Мышь','Электроника',1800,40),(9,'Планшет','Электроника',42000,12),(10,'Книга Python','Книги',950,45),(11,'Веб-камера','Электроника',4500,18),(12,'Микрофон','Электроника',7800,14),(13,'Книга JavaScript','Книги',1100,30),(14,'Внешний SSD','Электроника',8500,22),(15,'Роутер','Электроника',6200,16),(16,'Книга Алгоритмы','Книги',1500,28),(17,'Колонки','Электроника',3800,20),(18,'USB-хаб','Аксессуары',1200,55),(19,'Подставка для ноутбука','Аксессуары',2800,25),(20,'Книга Linux','Книги',1050,32),(21,'Коврик для мыши','Аксессуары',900,60),(22,'Кресло офисное','Мебель',18000,8),(23,'Стол компьютерный','Мебель',15000,6),(24,'Книга UML','Книги',1300,20),(25,'Принтер','Электроника',12000,11),(26,'Лампа настольная','Аксессуары',3500,30),(27,'Блок питания','Электроника',5000,19),(28,'Книга DevOps','Книги',1400,22),(29,'Графический планшет','Электроника',22000,7),(30,'Сетевой фильтр','Аксессуары',1600,35)]
    c.executemany('INSERT INTO products VALUES (?,?,?,?,?)', _PRODS)
    _ORDERS = [(1,1,1,1,75000,'Доставлен','2024-01-15'),(2,2,2,2,70000,'В обработке','2024-02-20'),(3,3,3,1,890,'Доставлен','2024-01-10'),(4,1,4,1,5500,'Отправлен','2024-03-05'),(5,4,5,1,3200,'Доставлен','2024-02-28'),(6,5,6,1,28000,'Доставлен','2024-01-22'),(7,7,7,3,3600,'В обработке','2024-03-10'),(8,8,8,2,3600,'Отменён','2024-03-12'),(9,1,2,1,35000,'Доставлен','2024-02-01'),(10,3,6,1,28000,'Отправлен','2024-03-15'),(11,9,9,1,42000,'Доставлен','2024-01-18'),(12,10,10,2,1900,'Доставлен','2024-02-05'),(13,11,11,1,4500,'Отправлен','2024-03-20'),(14,12,1,1,75000,'Доставлен','2024-01-25'),(15,13,12,1,7800,'В обработке','2024-04-01'),(16,14,14,2,17000,'Доставлен','2024-02-12'),(17,15,22,1,18000,'Доставлен','2024-03-08'),(18,16,15,1,6200,'Отправлен','2024-04-05'),(19,17,13,1,1100,'Доставлен','2024-01-30'),(20,18,25,1,12000,'В обработке','2024-04-10'),(21,19,16,1,1500,'Доставлен','2024-02-18'),(22,20,17,2,7600,'Доставлен','2024-03-22'),(23,21,18,1,1200,'Отправлен','2024-04-15'),(24,22,23,1,15000,'Доставлен','2024-01-08'),(25,23,3,2,1780,'Доставлен','2024-02-25'),(26,24,29,1,22000,'В обработке','2024-04-18'),(27,25,19,1,2800,'Доставлен','2024-03-01'),(28,26,21,1,900,'Доставлен','2024-04-20'),(29,27,24,1,1300,'Отправлен','2024-03-28'),(30,28,27,1,5000,'Доставлен','2024-02-08'),(31,29,26,2,7000,'Доставлен','2024-04-22'),(32,30,30,3,4800,'В обработке','2024-04-25'),(33,1,14,1,8500,'Доставлен','2024-05-01'),(34,5,9,1,42000,'Отправлен','2024-05-03'),(35,7,20,1,1050,'Доставлен','2024-05-05'),(36,12,28,1,1400,'Доставлен','2024-05-08'),(37,15,5,2,6400,'Отменён','2024-05-10'),(38,20,8,3,5400,'Доставлен','2024-05-12'),(39,3,11,1,4500,'В обработке','2024-05-15'),(40,9,22,1,18000,'Отправлен','2024-05-18')]
    c.executemany('INSERT INTO orders VALUES (?,?,?,?,?,?,?)', _ORDERS)
    _REVIEWS = [(1,1,1,5,'Отличный ноутбук!'),(2,2,2,4,'Хороший смартфон за свои деньги'),(3,3,3,5,'Понятная книга для начинающих'),(4,4,5,3,'Средняя клавиатура'),(5,5,6,5,'Великолепный монитор'),(6,1,4,4,'Хорошее звучание'),(7,7,7,5,'Отличная книга по БД'),(8,9,9,4,'Удобный планшет для работы'),(9,10,10,5,'Лучшая книга по Python'),(10,11,11,3,'Качество среднее'),(11,12,1,5,'Быстрый и надёжный'),(12,13,12,4,'Хороший звук для стримов'),(13,14,14,5,'Быстрый SSD, рекомендую'),(14,15,22,4,'Удобное кресло'),(15,16,15,4,'Стабильный сигнал WiFi'),(16,17,13,5,'Хороший учебник по JS'),(17,18,25,3,'Печатает медленно'),(18,19,16,5,'Классическая книга по алгоритмам'),(19,20,17,4,'Чистый звук'),(20,21,18,4,'Компактный и удобный хаб'),(21,22,23,5,'Прочный и просторный стол'),(22,23,3,4,'Хорошо объясняет основы SQL'),(23,24,29,5,'Отличный планшет для рисования'),(24,25,19,4,'Ноутбук не перегревается'),(25,26,21,3,'Обычный коврик'),(26,27,24,5,'Отличная книга по UML'),(27,28,27,4,'Качественный блок питания'),(28,29,26,5,'Яркая и стильная лампа'),(29,30,30,4,'Надёжная защита от скачков'),(30,8,8,4,'Удобная мышь для работы')]
    c.executemany('INSERT INTO reviews VALUES (?,?,?,?,?)', _REVIEWS)
    conn.commit()
    return conn


def _run_sql_query(conn, sql: str):
    """Выполнить SQL-запрос и вернуть список словарей."""
    cur = conn.cursor()
    cur.execute(sql)
    cols = [d[0] for d in cur.description] if cur.description else []
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def _translate_sqlite_error(msg: str) -> str:
    """Перевод типичных ошибок SQLite на русский."""
    if re.search(r'incomplete input', msg, re.IGNORECASE):
        return 'Неполный SQL-запрос. Проверьте синтаксис.'
    m = re.search(r'near "(.+?)": syntax error', msg, re.IGNORECASE)
    if m:
        return f'Синтаксическая ошибка рядом с «{m.group(1)}».'
    m = re.search(r'no such table: (\S+)', msg, re.IGNORECASE)
    if m:
        return f'Таблица «{m.group(1)}» не найдена.'
    m = re.search(r'no such column: (\S+)', msg, re.IGNORECASE)
    if m:
        return f'Колонка «{m.group(1)}» не найдена.'
    m = re.search(r'ambiguous column name: (\S+)', msg, re.IGNORECASE)
    if m:
        return f'Неоднозначное имя колонки «{m.group(1)}». Укажите таблицу.'
    if re.search(r'UNIQUE constraint failed', msg, re.IGNORECASE):
        return 'Нарушено ограничение уникальности.'
    if re.search(r'NOT NULL constraint failed', msg, re.IGNORECASE):
        return 'Нарушено ограничение NOT NULL.'
    if re.search(r'FOREIGN KEY constraint failed', msg, re.IGNORECASE):
        return 'Нарушено ограничение внешнего ключа.'
    if re.search(r'datatype mismatch', msg, re.IGNORECASE):
        return 'Несоответствие типов данных.'
    if re.search(r'misuse of aggregate', msg, re.IGNORECASE):
        return 'Неправильное использование агрегатной функции.'
    if re.search(r'SELECTs to the left and right of UNION do not have the same number of result columns', msg, re.IGNORECASE):
        return 'Запросы в UNION имеют разное количество колонок.'
    if re.search(r'no tables specified', msg, re.IGNORECASE):
        return 'Не указаны таблицы. Добавьте FROM в запрос.'
    m = re.search(r'no such function: (\S+)', msg, re.IGNORECASE)
    if m:
        return f'Функция «{m.group(1)}» не найдена.'
    m = re.search(r'table (\S+) has no column named (\S+)', msg, re.IGNORECASE)
    if m:
        return f'В таблице «{m.group(1)}» нет колонки «{m.group(2)}».'
    if re.search(r'ORDER BY term out of range', msg, re.IGNORECASE):
        return 'Номер колонки в ORDER BY выходит за диапазон.'
    if re.search(r'too many terms in compound SELECT', msg, re.IGNORECASE):
        return 'Слишком много выражений в составном запросе.'
    if re.search(r'RIGHT and FULL OUTER JOIN', msg, re.IGNORECASE):
        return 'RIGHT и FULL OUTER JOIN не поддерживаются в SQLite.'
    if re.search(r'cannot use window functions in', msg, re.IGNORECASE):
        return 'Нельзя использовать оконные функции в данном контексте.'
    return msg


def _validate_sql_solution(student_code: str, config: dict) -> dict:
    """Полная SQL валидация: выполнение запросов студента и преподавателя, сравнение результатов."""
    import sqlite3
    if not student_code.strip():
        return {"valid": False, "error": "SQL код пустой"}

    conn = _get_sql_mock_db()
    try:
        try:
            student_result = _run_sql_query(conn, student_code)
        except sqlite3.Error as e:
            return {"valid": False, "error": _translate_sqlite_error(str(e))}

        teacher_code = config.get('code', '')
        if not teacher_code:
            return {"valid": True, "message": "Запрос выполнен успешно."}

        try:
            teacher_result = _run_sql_query(conn, teacher_code)
        except sqlite3.Error:
            return {"valid": False, "error": "Ошибка проверки: эталонное решение неверно."}

        if not student_result and teacher_result:
            return {"valid": False, "error": "Ваш запрос не вернул данных, хотя должен был."}

        if student_result and teacher_result:
            s_cols = set(student_result[0].keys())
            t_cols = set(teacher_result[0].keys())
            missing = t_cols - s_cols
            if missing:
                return {"valid": False, "error": f"В результате отсутствуют необходимые колонки: {', '.join(missing)}"}

        if len(student_result) > len(teacher_result):
            return {"valid": False, "error": f"Результат содержит слишком много строк ({len(student_result)} вместо {len(teacher_result)}). Возможно, условия фильтрации слишком мягкие."}
        if len(student_result) < len(teacher_result):
            return {"valid": False, "error": f"Результат содержит недостаточно строк ({len(student_result)} вместо {len(teacher_result)}). Возможно, условия фильтрации слишком жесткие."}

        import json as _json
        if _json.dumps(student_result, ensure_ascii=False, default=str) != _json.dumps(teacher_result, ensure_ascii=False, default=str):
            return {"valid": False, "error": "Количество строк совпадает, но данные внутри отличаются. Проверьте порядок выборки или сортировку."}

        return {"valid": True, "message": "Отлично! Ваше решение верно."}
    finally:
        conn.close()


import xml.etree.ElementTree as ET
import re

def _validate_bpmn_solution(student_code: str, config: dict) -> dict:
    """Детальная BPMN валидация на бэкенде"""
    if not student_code.strip():
        return {"valid": False, "error": "BPMN код пуст"}
        
    try:
        root = ET.fromstring(student_code)
    except ET.ParseError:
        return {"valid": False, "error": "Некорректный формат BPMN диаграммы"}

    def get_elements_by_tag(doc, tag_name):
        return [el for el in doc.iter() if el.tag.endswith("}" + tag_name) or el.tag == tag_name]

    tasks = (len(get_elements_by_tag(root, "task")) + 
             len(get_elements_by_tag(root, "userTask")) +
             len(get_elements_by_tag(root, "serviceTask")) +
             len(get_elements_by_tag(root, "sendTask")) +
             len(get_elements_by_tag(root, "receiveTask")))
             
    startEvents = len(get_elements_by_tag(root, "startEvent"))
    endEvents = len(get_elements_by_tag(root, "endEvent"))
    
    gateways = (len(get_elements_by_tag(root, "exclusiveGateway")) +
                len(get_elements_by_tag(root, "inclusiveGateway")) +
                len(get_elements_by_tag(root, "parallelGateway")))
                
    flows = len(get_elements_by_tag(root, "sequenceFlow"))
    lanes = len(get_elements_by_tag(root, "lane"))
    participants = len(get_elements_by_tag(root, "participant"))

    if startEvents == 0:
        return {"valid": False, "error": "Диаграмма должна содержать начальное событие (Start Event)"}
    if endEvents == 0:
        return {"valid": False, "error": "Диаграмма должна содержать конечное событие (End Event)"}
    if lanes == 0 and participants == 0:
        return {"valid": False, "error": "Диаграмма должна содержать хотя бы один пул или дорожку (Pool/Lane)"}
    if flows == 0 and (tasks + gateways + startEvents + endEvents) > 1:
        return {"valid": False, "error": "Элементы диаграммы должны быть соединены потоками управления (Sequence Flow)"}

    sequence_flows = get_elements_by_tag(root, "sequenceFlow")
    source_refs = set(f.attrib.get("sourceRef") for f in sequence_flows if f.attrib.get("sourceRef"))
    target_refs = set(f.attrib.get("targetRef") for f in sequence_flows if f.attrib.get("targetRef"))
    
    for el in get_elements_by_tag(root, "startEvent"):
        if el.attrib.get("id", "") not in source_refs:
            return {"valid": False, "error": "Начальное событие должно иметь исходящий поток управления"}
            
    for el in get_elements_by_tag(root, "endEvent"):
        if el.attrib.get("id", "") not in target_refs:
            return {"valid": False, "error": "Конечное событие должно иметь входящий поток управления"}

    flow_elements = []
    for tag in ["task", "userTask", "serviceTask", "sendTask", "receiveTask", "exclusiveGateway", "inclusiveGateway", "parallelGateway"]:
        flow_elements.extend(get_elements_by_tag(root, tag))
        
    for el in flow_elements:
        el_id = el.attrib.get("id", "")
        if el_id not in source_refs and el_id not in target_refs:
            name = el.attrib.get("name") or el_id
            return {"valid": False, "error": f"Элемент «{name}» не соединён ни одним потоком управления"}

    def check_value(val: float, expected: float, operator: str) -> bool:
        if operator == '>': return val > expected
        if operator == '<': return val < expected
        if operator == '>=': return val >= expected
        if operator == '<=': return val <= expected
        if operator == '!=': return val != expected
        return val == expected
        
    def get_op_text(op):
        mapping = {'>': '>', '<': '<', '>=': '>=', '<=': '<=', '!=': '!=', '=': '='}
        return mapping.get(op, '')

    mode = config.get("mode")
    if mode == "manual":
        for check in config.get("checks", []):
            try:
                expected = float(check.get("value", 0))
            except ValueError:
                expected = 0
            operator = check.get("operator", "=")
            op_text = get_op_text(operator)
            suffix = f" ({op_text})" if op_text else ""
            c_type = check.get("type", "")
            if c_type == "element_count":
                element = check.get("element", "")
                count = 0
                if element == "startEvent": count = startEvents
                elif element == "endEvent": count = endEvents
                elif element == "task": count = tasks
                elif element == "gateway": count = gateways
                elif element == "lane": count = lanes
                elif element == "participant": count = participants
                else:
                    count = len(re.findall(f"<bpmn:{element}", student_code))
                if not check_value(count, expected, operator):
                    return {"valid": False, "error": f"Ожидалось элементов {element}: {check.get('value')}{suffix}, найдено: {count}"}
            elif c_type in ["connection_count", "edge_count"]:
                if not check_value(flows, expected, operator):
                    return {"valid": False, "error": f"Ожидалось связей: {check.get('value')}{suffix}, найдено: {flows}"}
            elif c_type == "node_count":
                nc = tasks + startEvents + endEvents + gateways
                if not check_value(nc, expected, operator):
                    return {"valid": False, "error": f"Ожидалось узлов: {check.get('value')}{suffix}, найдено: {nc}"}
            elif c_type in ["node_exists", "contains_text"]:
                target = check.get("target", "")
                if target not in student_code:
                    return {"valid": False, "error": f"Диаграмма должна содержать элемент: \"{target}\""}
            elif c_type == "lane_count":
                lc = lanes if lanes > 0 else participants
                if not check_value(lc, expected, operator):
                    return {"valid": False, "error": f"Ожидалось дорожек: {check.get('value')}{suffix}, найдено: {lc}"}
            elif c_type == "gateway_count":
                if not check_value(gateways, expected, operator):
                    return {"valid": False, "error": f"Ожидалось шлюзов: {check.get('value')}{suffix}, найдено: {gateways}"}

    elif config.get("code"):
        bpmn_labels = {
            'participant': 'пул', 'lane': 'дорожка', 'task': 'задача', 'userTask': 'задача',
            'serviceTask': 'задача', 'sendTask': 'задача', 'receiveTask': 'задача',
            'startEvent': 'начальное событие', 'endEvent': 'конечное событие',
            'exclusiveGateway': 'шлюз', 'inclusiveGateway': 'шлюз', 'parallelGateway': 'шлюз'
        }
        
        try:
            ref_root = ET.fromstring(config.get("code", ""))
            
            def parse_bpmn_stats(r):
                t = (len(get_elements_by_tag(r, "task")) + 
                     len(get_elements_by_tag(r, "userTask")) +
                     len(get_elements_by_tag(r, "serviceTask")) +
                     len(get_elements_by_tag(r, "sendTask")) +
                     len(get_elements_by_tag(r, "receiveTask")))
                se = len(get_elements_by_tag(r, "startEvent"))
                ee = len(get_elements_by_tag(r, "endEvent"))
                g = (len(get_elements_by_tag(r, "exclusiveGateway")) +
                     len(get_elements_by_tag(r, "inclusiveGateway")) +
                     len(get_elements_by_tag(r, "parallelGateway")))
                f = len(get_elements_by_tag(r, "sequenceFlow"))
                la = len(get_elements_by_tag(r, "lane"))
                pa = len(get_elements_by_tag(r, "participant"))
                
                named = []
                for el in r.iter():
                    if el.attrib.get('name'):
                        local_name = el.tag.split("}")[-1] if "}" in el.tag else el.tag
                        named.append({"name": el.attrib['name'], "type": local_name})
                        
                return {"nodeCount": t+se+ee+g, "edgeCount": f, "laneCount": la if la>0 else pa, "gatewayCount": g, "namedElements": named}
            
            ref_stats = parse_bpmn_stats(ref_root)
            
            if config.get("checkNodeCount"):
                s_nc = tasks + startEvents + endEvents + gateways
                if s_nc != ref_stats["nodeCount"]:
                    return {"valid": False, "error": f"Ожидалось узлов: {ref_stats['nodeCount']}, найдено: {s_nc}"}
            if config.get("checkEdgeCount"):
                if flows != ref_stats["edgeCount"]:
                    return {"valid": False, "error": f"Ожидалось связей: {ref_stats['edgeCount']}, найдено: {flows}"}
            if config.get("checkLaneCount"):
                s_lc = lanes if lanes > 0 else participants
                if s_lc != ref_stats["laneCount"]:
                    return {"valid": False, "error": f"Ожидалось дорожек: {ref_stats['laneCount']}, найдено: {s_lc}"}
            if config.get("checkGatewayCount"):
                if gateways != ref_stats["gatewayCount"]:
                    return {"valid": False, "error": f"Ожидалось шлюзов: {ref_stats['gatewayCount']}, найдено: {gateways}"}
            if config.get("checkNodeNames"):
                student_names_lower = []
                for el in root.iter():
                    name = el.attrib.get("name")
                    if name:
                        student_names_lower.append(name.lower())
                
                missing = [el for el in ref_stats["namedElements"] if el["name"].lower() not in student_names_lower]
                if missing:
                    items = []
                    for el in missing[:3]:
                        label = bpmn_labels.get(el["type"], "элемент")
                        items.append(f"{label} «{el['name']}»")
                    suffix = "..." if len(missing) > 3 else ""
                    return {"valid": False, "error": f"Отсутствуют: {', '.join(items)}{suffix}"}
        except ET.ParseError:
            pass  # Некорректный эталонный код

    return {"valid": True, "message": "Все проверки пройдены. Диаграмма корректна!"}


def _validate_plantuml_solution(student_code: str, config: dict) -> dict:
    """Полная PlantUML валидация на бэкенде"""
    if not student_code.strip():
        return {"valid": False, "error": "PlantUML код пуст"}
    if '@startuml' not in student_code:
        return {"valid": False, "error": "PlantUML диаграмма должна начинаться с @startuml"}
    if '@enduml' not in student_code:
        return {"valid": False, "error": "PlantUML диаграмма должна заканчиваться @enduml"}

    diagram_types = ['class', 'interface', 'enum', 'component', 'actor', 'usecase']
    if not any(t in student_code.lower() for t in diagram_types):
        return {"valid": False, "error": "PlantUML диаграмма должна содержать хотя бы один элемент диаграммы"}

    def parse_plantuml(puml: str):
        lines = [l.strip() for l in puml.split('\n') if l.strip() and not l.strip().startswith("'") and not l.strip().startswith('@')]
        participant_re = re.compile(r'^(participant|actor|database|queue|entity|boundary|control|collections)\s+', re.IGNORECASE)
        relation_re = re.compile(r'-+>|<-+|\.+>|<\.+')
        skip_re = re.compile(r'^(participant|actor|database|queue|entity|boundary|control|collections|note|end|group|loop|alt|else|ref|title|header|footer)\s', re.IGNORECASE)
        participant_count = sum(1 for l in lines if participant_re.match(l))
        relationship_count = sum(1 for l in lines if relation_re.search(l) and not skip_re.match(l))
        class_count = sum(1 for l in lines if re.match(r'^(class|abstract\s+class)\s+', l, re.IGNORECASE))
        interface_count = sum(1 for l in lines if re.match(r'^interface\s+', l, re.IGNORECASE))
        loop_count = sum(1 for l in lines if re.match(r'^loop\b', l, re.IGNORECASE))
        alt_count = sum(1 for l in lines if re.match(r'^alt\b', l, re.IGNORECASE))
        return {'participantCount': participant_count, 'relationshipCount': relationship_count, 'classCount': class_count, 'interfaceCount': interface_count, 'loopCount': loop_count, 'altCount': alt_count}

    student_stats = parse_plantuml(student_code)

    def check_val(actual, expected, operator):
        if operator == '>': return actual > expected
        if operator == '<': return actual < expected
        if operator == '>=': return actual >= expected
        if operator == '<=': return actual <= expected
        if operator == '!=': return actual != expected
        return actual == expected

    def op_text(op):
        return {'>': '>', '<': '<', '>=': '>=', '<=': '<=', '!=': '!=', '=': '='}.get(op, '')

    STAT_MAPPING = {
        'participant_count': ('participantCount', 'участников'),
        'message_count': ('relationshipCount', 'связей'),
        'relationship_count': ('relationshipCount', 'связей'),
        'class_count': ('classCount', 'классов'),
        'interface_count': ('interfaceCount', 'интерфейсов'),
        'loop_count': ('loopCount', 'циклов'),
        'alt_count': ('altCount', 'условий'),
    }

    mode = config.get('mode')
    if mode == 'manual':
        for check in config.get('checks', []):
            try:
                expected = int(check.get('value', 0))
            except (ValueError, TypeError):
                expected = 0
            operator = check.get('operator', '=')
            suffix = f" ({op_text(operator)})" if op_text(operator) else ""
            c_type = check.get('type', '')
            if c_type in STAT_MAPPING:
                key, label = STAT_MAPPING[c_type]
                actual = student_stats[key]
                if not check_val(actual, expected, operator):
                    return {"valid": False, "error": f"Ожидалось {label}: {expected}{suffix}, найдено: {actual}"}
            elif c_type in ('element_exists', 'contains_text'):
                target = check.get('target', '')
                if target not in student_code:
                    return {"valid": False, "error": f'Код должен содержать: "{target}"'}
    elif config.get('code'):
        ref_match = re.search(r'@startuml[\s\S]*?@enduml', config['code'])
        if not ref_match:
            return {"valid": False, "error": "Ошибка в эталонном решении"}
        ref_stats = parse_plantuml(ref_match.group(0))
        CHECK_FLAGS = {
            'checkParticipantCount': ('participantCount', 'участников'),
            'checkRelationshipCount': ('relationshipCount', 'связей'),
            'checkClassCount': ('classCount', 'классов'),
            'checkInterfaceCount': ('interfaceCount', 'интерфейсов'),
            'checkLoopCount': ('loopCount', 'циклов'),
            'checkAltCount': ('altCount', 'условий'),
        }
        for flag, (key, label) in CHECK_FLAGS.items():
            if config.get(flag) and student_stats[key] != ref_stats[key]:
                return {"valid": False, "error": f"Ожидалось {label}: {ref_stats[key]}, найдено: {student_stats[key]}"}

    return {"valid": True, "message": "Все проверки пройдены. Диаграмма корректна!"}


def _validate_swagger_solution(student_code: str, config: dict) -> dict:
    """Полная Swagger/OpenAPI валидация на бэкенде"""
    import yaml as _yaml
    if not student_code.strip():
        return {"valid": False, "error": "Swagger/OpenAPI код пуст"}
    low = student_code.lower()
    if 'openapi:' not in low and 'swagger:' not in low:
        return {"valid": False, "error": "Должен содержать версию OpenAPI или Swagger"}
    for elem in ('info', 'paths'):
        if f'{elem}:' not in low:
            return {"valid": False, "error": f"Отсутствует обязательный элемент OpenAPI: {elem}"}
    lines = student_code.strip().split('\n')
    if len(lines) < 5:
        return {"valid": False, "error": "Спецификация OpenAPI слишком короткая"}

    try:
        if ':' in student_code and not student_code.strip().startswith('{'):
            spec = _yaml.safe_load(student_code)
        else:
            spec = json.loads(student_code)
    except Exception as e:
        return {"valid": False, "error": f"Ошибка синтаксиса YAML/JSON: {e}"}

    if not isinstance(spec, dict):
        return {"valid": False, "error": "Некорректная структура спецификации"}

    HTTP_METHODS = ('get', 'post', 'put', 'patch', 'delete', 'options', 'head')
    paths = list((spec.get('paths') or {}).keys())
    path_count = len(paths)
    schema_count = len((spec.get('components', {}).get('schemas') or {}).keys())
    endpoint_count = 0
    for p in paths:
        methods = [m for m in (spec['paths'].get(p) or {}).keys() if m in HTTP_METHODS]
        endpoint_count += len(methods)

    def check_val(actual, expected, operator):
        if operator == '>': return actual > expected
        if operator == '<': return actual < expected
        if operator == '>=': return actual >= expected
        if operator == '<=': return actual <= expected
        if operator == '!=': return actual != expected
        return actual == expected

    def op_text(op):
        return {'>': '>', '<': '<', '>=': '>=', '<=': '<=', '!=': '!=', '=': '='}.get(op, '')

    mode = config.get('mode')
    if mode == 'manual':
        for check in config.get('checks', []):
            try:
                expected = int(check.get('value', 0))
            except (ValueError, TypeError):
                expected = 0
            operator = check.get('operator', '=')
            suffix = f" ({op_text(operator)})" if op_text(operator) else ""
            c_type = check.get('type', '')
            if c_type == 'path_count':
                if not check_val(path_count, expected, operator):
                    return {"valid": False, "error": f"Ожидалось путей: {expected}{suffix}, найдено: {path_count}"}
            elif c_type == 'schema_count':
                if not check_val(schema_count, expected, operator):
                    return {"valid": False, "error": f"Ожидалось схем: {expected}{suffix}, найдено: {schema_count}"}
            elif c_type == 'endpoint_count':
                if not check_val(endpoint_count, expected, operator):
                    return {"valid": False, "error": f"Ожидалось эндпоинтов: {expected}{suffix}, найдено: {endpoint_count}"}
            elif c_type == 'path_exists':
                target = check.get('target', '')
                if target not in (spec.get('paths') or {}):
                    return {"valid": False, "error": f'Путь "{target}" не найден'}
            elif c_type in ('operation_exists', 'method_exists'):
                op_val = check.get('target', '')
                dot_idx = op_val.rfind('.')
                path = op_val[:dot_idx]
                method = op_val[dot_idx+1:]
                if not (spec.get('paths') or {}).get(path, {}).get(method):
                    return {"valid": False, "error": f'Метод "{method}" для пути "{path}" не найден'}
    elif config.get('code'):
        try:
            ref_spec = _yaml.safe_load(config['code'])
        except Exception:
            return {"valid": False, "error": "Ошибка парсинга эталонного решения"}
        ref_paths = list((ref_spec.get('paths') or {}).keys())
        ref_path_count = len(ref_paths)
        ref_schema_count = len((ref_spec.get('components', {}).get('schemas') or {}).keys())
        ref_endpoint_count = 0
        for p in ref_paths:
            methods = [m for m in (ref_spec['paths'].get(p) or {}).keys() if m in HTTP_METHODS]
            ref_endpoint_count += len(methods)
        if config.get('checkPathCount') and path_count != ref_path_count:
            return {"valid": False, "error": f"Ожидалось путей: {ref_path_count}, найдено: {path_count}"}
        if config.get('checkSchemaCount') and schema_count != ref_schema_count:
            return {"valid": False, "error": f"Ожидалось схем: {ref_schema_count}, найдено: {schema_count}"}
        if config.get('checkEndpointCount') and endpoint_count != ref_endpoint_count:
            return {"valid": False, "error": f"Ожидалось эндпоинтов: {ref_endpoint_count}, найдено: {endpoint_count}"}

    return {"valid": True, "message": "Все проверки пройдены. Спецификация корректна!"}
