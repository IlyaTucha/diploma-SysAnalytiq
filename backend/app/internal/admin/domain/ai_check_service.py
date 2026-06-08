import json
import logging
import re
import time

import requests
from django.conf import settings

from app.internal.submissions.db.models import Submission

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class AiCheckService:
    @staticmethod
    def _strip_bpmn_layout(text: str) -> str:
        # Секция BPMNDiagram описывает координаты фигур и не нужна для семантической проверки
        text = re.sub(r'<bpmndi:BPMNDiagram\b[\s\S]*?</bpmndi:BPMNDiagram>', '', text)
        text = re.sub(r'<!--[\s\S]*?-->', '', text)
        text = re.sub(r'\n[ \t]*\n+', '\n', text)
        return text.strip()

    @staticmethod
    def check_submission(submission_id: int) -> dict:
        submission = Submission.objects.select_related('lesson', 'lesson__module', 'student').get(id=submission_id)

        task_description = submission.lesson.content or ''
        correct_answer = submission.lesson.correct_answer or ''
        student_solution = submission.student_solution or ''
        lesson_title = submission.lesson.title or ''

        is_bpmn = submission.lesson.module.slug == 'bpmn'
        if is_bpmn:
            student_solution = AiCheckService._strip_bpmn_layout(student_solution)

        other_solutions = list(
            Submission.objects.filter(lesson=submission.lesson, status='approved')
            .exclude(id=submission_id)
            .exclude(student=submission.student)
            .values_list('student_solution', flat=True)[:10]
        )
        if is_bpmn:
            other_solutions = [AiCheckService._strip_bpmn_layout(s or '') for s in other_solutions]

        prompt = AiCheckService._build_prompt(
            lesson_title, task_description, correct_answer,
            student_solution, other_solutions,
        )

        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            return {"error": "OpenRouter API key не настроен"}

        return AiCheckService._call_llm(api_key, prompt)

    @staticmethod
    def _build_prompt(
        lesson_title: str,
        task_description: str,
        correct_answer: str,
        student_solution: str,
        other_solutions: list[str],
    ) -> str:
        other_block = ""
        if other_solutions:
            parts = []
            for i, sol in enumerate(other_solutions, 1):
                truncated = sol[:6000] if len(sol) > 6000 else sol
                parts.append(f"--- Решение {i} ---\n{truncated}")
            other_block = (
                "\n\nДругие принятые решения этого задания (для сравнения на плагиат):\n"
                + "\n".join(parts)
            )

        lines = student_solution[:100000].splitlines()
        numbered_solution = "\n".join(f"{i+1}: {line}" for i, line in enumerate(lines))

        return f"""Ты — преподаватель системной аналитики. Пишешь короткий понятный отзыв СТУДЕНТУ на его работу (обращайся на "ты" или безлично).

ЯЗЫК: отвечай строго на русском. Все поля JSON (problem, fix, verdict, missingRequirements) — на русском. Английский допустим только для технических терминов из самого кода (имена тегов, элементов, ключевые слова языка).

ПИШИ ПРОСТО: каждое замечание — короткая понятная фраза, как от живого преподавателя. Без канцелярита и длинных конструкций. Одно замечание — одна мысль. Поле fix — одно короткое предложение: что конкретно сделать.

ЗАДАЧА: проверь решение на соответствие КАЖДОМУ требованию задания.

## Задание
{lesson_title}

{task_description[:10000]}

{f"Эталонное решение (ТОЛЬКО для твоего внутреннего сравнения, НЕ упоминай его студенту):{chr(10)}{correct_answer[:20000]}" if correct_answer else ""}

## Решение студента (строки пронумерованы)
{numbered_solution}
{other_block}

## Уровни серьёзности (поле severity)
- "error" — реальная ошибка: нарушает требование задания, синтаксис или семантику. Обязательна к исправлению.
- "warning" — потенциальная проблема: работает, но может привести к ошибке. Желательно исправить.
- "suggestion" — замечание по стилю/улучшению. Работа корректна и без этого.

## Вердикт (поле verdict) — определяй СТРОГО по этому правилу
- Есть хотя бы один "error" ИЛИ missingRequirements непустой → «Требования не выполнены, нужно исправить N ошибок». Запрещено писать «выполнено».
- Нет "error", но есть "warning" → «Выполнено с замечаниями, желательно исправить (N)».
- Только "suggestion" или замечаний нет → «Требования выполнены» (можно добавить «есть N рекомендаций»).
Вердикт — это только общий итог и количество. НЕ перечисляй в нём сами правки — они уже есть в issues и missingRequirements.
Никогда не пиши «требования выполнены», если в issues есть error или missingRequirements не пуст.
Запрещены хвалебные фразы: «отличная работа», «профессиональный подход», «с превышением требований», «дополнительные элементы» и т.п.

## Что НЕ ЯВЛЯЕТСЯ ошибкой:

### Для Swagger/OpenAPI:
- `format: date-time`, `format: email`, `format: uuid` — стандартные форматы OpenAPI, НЕ избыточны
- `required: [field1, field2]` — обязательные поля для схем, это ХОРОШАЯ практика
- Множественные коды ответов (200, 201, 400, 404, 500) — ПРАВИЛЬНАЯ практика REST API
- `description` в responses и schemas — рекомендуемая практика
- Информативные описания на русском языке ("Пользователь создан", "Пользователь обновлён", "Пользователь удалён") — это ХОРОШО, НЕ нужно менять на "OK", "No Content" и т.п.
- НЕ предлагай менять информативные русские описания на сухие английские статусы

### Для SQL:
- Ключевые слова могут быть в любом регистре (SELECT, select, Select — всё допустимо)
- Алиасы с AS и без AS — оба варианта корректны
- Разные стили форматирования (отступы, переносы) — не ошибка
- Использование подзапросов вместо JOIN и наоборот — допустимо, если результат верный

### Для ERD/DBML:
- Комментарии и Note — хорошая практика документирования
- Явное указание `[pk]`, `[not null]` — не избыточность
- Определение связей таблиц допустимо в любом формате DBML: как внутри самой таблицы (например, `[ref: > tablename.id]`), так и отдельными командами `Ref: table1.id > table2.id` в любом месте файла. Это равнозначные подходы и не являются ошибкой.

### Для PlantUML:
- Подробные подписи на стрелках и диаграммах — хорошая практика

### Для BPMN:
BPMN-решение — это XML из bpmn.io (студент рисует в визуальном редакторе, на проверку уходит XML).

ЧТО ПРОВЕРЯТЬ — ТОЛЬКО логику процесса:
- состав элементов и их связи (последовательность потоков)
- корректность шлюзов: куда ведут ветки «Да»/«Нет», нет ли инверсии
- наличие старта и хотя бы одного завершения
- «висящие» (несоединённые) элементы и недостижимые ветки
- дорожки/исполнители, если требуются заданием

КАК ПИСАТЬ ЗАМЕЧАНИЯ (обязательно):
- Ссылайся на элементы по их РУССКОЙ подписи (атрибут name), а НЕ по техническому id. Пиши «задача „Сборка заказа“», «шлюз „Товар в наличии?“», «событие „Заказ отменён“». Если у элемента нет подписи — опиши его роль по-русски («конечное событие отмены»). Технические id (Task_Assemble, SequenceFlow_1rck7u1, Gateway_0x) в тексте problem/fix НЕ упоминай.
- Направление потоков описывай по-русски через подписи: «при ответе „Да“ поток должен идти к задаче „Сборка заказа“, а при „Нет“ — к событию „Заказ отменён“». НЕ проси переименовывать SequenceFlow и не диктуй значения id/name атрибутов.
- fix — коротко, 1 предложение, простыми словами, что и куда направить/добавить/убрать.
- codeFragment при этом остаётся точной копией XML-строки (там id допустимы — это сам код).

ЧТО НЕ ЯВЛЯЕТСЯ ОШИБКОЙ (не комментируй):
- Графическая разметка (bpmndi:BPMNDiagram, BPMNPlane, BPMNShape, BPMNEdge, координаты, размеры, маршруты) НАМЕРЕННО удалена перед проверкой — её отсутствие не ошибка, не упоминай и не предлагай добавить.
- Атрибут isExecutable, служебные id, namespace, версии и прочие технические атрибуты на логику не влияют.

## Формат ответа (СТРОГО JSON)

{{
  "issues": [
    {{
      "lineStart": <НОМЕР СТРОКИ — ОБЯЗАТЕЛЬНО>,
      "lineEnd": <НОМЕР СТРОКИ>,
      "codeFragment": "<ТОЧНАЯ КОПИЯ проблемной строки из решения студента>",
      "severity": "<error|warning|suggestion>",
      "problem": "<суть проблемы одним предложением, без вводных ярлыков>",
      "fix": "<что сделать, одним предложением в повелительном наклонении: «Заменить X на Y», «Удалить Z», «Добавить ...» — без вводных ярлыков>"
    }}
  ],
  "missingRequirements": ["<требование из задания, которое НЕ выполнено>"],
  "verdict": "<КРАТКИЙ итог на человеческом языке>",
  "plagiarism": {{"detected": false, "similarTo": null, "fragments": []}}
}}

## КРИТИЧЕСКИ ВАЖНО:

1. **issues ОБЯЗАТЕЛЕН** — КАЖДАЯ проблема = ОТДЕЛЬНЫЙ элемент в issues с lineStart
2. **lineStart ОБЯЗАТЕЛЕН** — без него комментарий не отобразится
3. **codeFragment ОБЯЗАТЕЛЕН** — это ДОСЛОВНОЕ содержимое строк с lineStart по lineEnd ВКЛЮЧИТЕЛЬНО, без номеров строк и БЕЗ соседних строк (НЕ включай строку lineStart-1 и НЕ включай строку lineEnd+1). Если проблема охватывает строки 27-35, copy-paste содержимое РОВНО строк 27-35; не добавляй строку 26 или 36
4. **lineEnd** должен соответствовать последней строке codeFragment. Если codeFragment = 1 строка, то lineEnd = lineStart
5. **severity ОБЯЗАТЕЛЕН** — классифицируй каждую проблему: error, warning или suggestion
6. **problem и fix — естественно и БЕЗ ярлыков** — интерфейс сам подставит подписи «Ошибка:» и «Что нужно исправить:», поэтому НЕ начинай текст со слов-подписей («Ошибка:», «Проблема:», «Требование задания:», «Исправить на:», «Что нужно исправить:») — иначе двоеточие и слова задвоятся. Пиши сразу суть, одним коротким предложением. fix — в повелительном наклонении: «Заменить X на Y», «Удалить Z», «Добавить ...». Не повторяй в fix то же, что уже сказано в problem. Не упоминай эталонное решение
7. **verdict** — 1 короткое предложение строго по правилу из раздела «Вердикт» выше. Если есть хотя бы один error или непустой missingRequirements — вердикт ОБЯЗАН говорить, что требования НЕ выполнены и нужно исправить. Без хвалебных фраз
8. **Полнота анализа** — проанализируй ВСЁ решение целиком (включая длинные XML/BPMN/YAML), не обрывай разбор на середине файла. Если файл большой — делай меньше, но полные комментарии, охватывая весь файл от начала до конца

## ПРИМЕР ОТВЕТА (есть ошибка → требования не выполнены):

{{
  "issues": [
    {{"lineStart": 3, "lineEnd": 3, "codeFragment": "participant \\"AUTH ERVICE\\" as auth", "severity": "error", "problem": "Опечатка в названии сервиса «AUTH ERVICE»", "fix": "Заменить название на «Auth Service»"}},
    {{"lineStart": 21, "lineEnd": 21, "codeFragment": "\\"404\\":", "severity": "suggestion", "problem": "Для GET списка ресурсов 404 обычно не нужен — пустой список возвращает 200", "fix": "Удалить блок 404 для GET /users"}}
  ],
  "missingRequirements": [],
  "verdict": "Требования не выполнены, нужно исправить 1 ошибку (плюс 1 рекомендация)."
}}

## ПРИМЕР ДЛЯ BPMN (ссылка на русские подписи, а не на id):

{{
  "issues": [
    {{"lineStart": 14, "lineEnd": 14, "codeFragment": "<bpmn:sequenceFlow id=\\"Flow_1\\" sourceRef=\\"Gateway_1\\" targetRef=\\"End_Cancelled\\" name=\\"Да\\" />", "severity": "error", "problem": "Перепутаны ветки шлюза «Товар в наличии?»: при ответе «Да» заказ отменяется", "fix": "При ответе «Да» направить поток к задаче «Сборка заказа», а к событию «Заказ отменён» — при ответе «Нет»"}}
  ],
  "missingRequirements": [],
  "verdict": "Требования не выполнены, нужно исправить логику шлюза."
}}

## ЕСЛИ ВСЁ ПРАВИЛЬНО:

{{
  "issues": [],
  "missingRequirements": [],
  "verdict": "Требования выполнены."
}}

Отвечай ТОЛЬКО JSON."""

    _RETRYABLE_STATUSES = frozenset({403, 408, 409, 429, 500, 502, 503, 504})
    _MAX_ATTEMPTS = 3

    @staticmethod
    def _error_message(resp: requests.Response) -> str:
        try:
            body = resp.json()
            err = body.get("error") if isinstance(body, dict) else None
            if isinstance(err, dict):
                return err.get("message", "") or ""
            if isinstance(err, str):
                return err
        except ValueError:
            return resp.text[:300]
        return ""

    @staticmethod
    def _repair_json(text: str) -> str:
        out = []
        n = len(text)
        in_str = False
        i = 0
        while i < n:
            ch = text[i]
            if not in_str:
                out.append(ch)
                if ch == '"':
                    in_str = True
                i += 1
                continue
            if ch == '\\':
                out.append(ch)
                if i + 1 < n:
                    out.append(text[i + 1])
                    i += 2
                else:
                    i += 1
                continue
            if ch == '"':
                j = i + 1
                while j < n and text[j] in ' \t\r\n':
                    j += 1
                nxt = text[j] if j < n else ''
                if nxt in (',', '}', ']', ':', ''):
                    out.append('"')
                    in_str = False
                else:
                    out.append('\\"')
                i += 1
                continue
            out.append(ch)
            i += 1
        return ''.join(out)

    @staticmethod
    def _extract_json(content: str) -> dict:
        text = content.strip()
        if text.startswith("```"):
            text = re.sub(r'^```[a-zA-Z0-9]*\s*', '', text)
            text = re.sub(r'\s*```$', '', text).strip()

        candidates = [text]
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end > start:
            candidates.append(text[start:end + 1])

        last_err = None
        for cand in candidates:
            try:
                return json.loads(cand)
            except json.JSONDecodeError as e:
                last_err = e
            try:
                return json.loads(AiCheckService._repair_json(cand))
            except json.JSONDecodeError as e:
                last_err = e

        raise last_err

    @staticmethod
    def _call_llm(api_key: str, prompt: str) -> dict:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": getattr(settings, "SITE_URL", "") or "https://sysanalytiq.ru",
            "X-Title": "SysAnalytiq",
        }
        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": settings.OPENROUTER_MAX_TOKENS,
            "temperature": settings.OPENROUTER_TEMPERATURE,
        }

        last_error = "ИИ-проверка временно недоступна. Попробуйте ещё раз."

        for attempt in range(1, AiCheckService._MAX_ATTEMPTS + 1):
            try:
                resp = requests.post(
                    OPENROUTER_URL, headers=headers, json=payload, timeout=60,
                )
            except requests.RequestException as e:
                logger.warning(
                    "OpenRouter request error (попытка %s/%s): %s",
                    attempt, AiCheckService._MAX_ATTEMPTS, e,
                )
                last_error = f"Ошибка сети при обращении к ИИ: {e}"
                if attempt < AiCheckService._MAX_ATTEMPTS:
                    time.sleep(2 ** (attempt - 1))
                continue

            if resp.status_code >= 400:
                api_message = AiCheckService._error_message(resp)
                logger.error(
                    "OpenRouter API %s (попытка %s/%s): %s",
                    resp.status_code, attempt, AiCheckService._MAX_ATTEMPTS,
                    api_message or resp.text[:300],
                )

                lower = api_message.lower()
                if "context" in lower and ("length" in lower or "window" in lower or "token" in lower):
                    return {"error": "Решение слишком большое для проверки ИИ. Попробуйте уменьшить размер кода."}
                if resp.status_code == 401:
                    return {"error": "Неверный API-ключ OpenRouter."}
                if resp.status_code == 402:
                    return {"error": "Недостаточно средств на балансе OpenRouter."}
                if resp.status_code == 400:
                    return {"error": f"Запрос отклонён ИИ: {api_message or 'Bad Request'}"}

                if resp.status_code in AiCheckService._RETRYABLE_STATUSES:
                    if resp.status_code == 429:
                        last_error = "Превышен лимит запросов к ИИ. Попробуйте позже."
                    else:
                        last_error = "ИИ-проверка временно недоступна (провайдер вернул ошибку). Попробуйте ещё раз."
                    if attempt < AiCheckService._MAX_ATTEMPTS:
                        time.sleep(2 ** (attempt - 1))
                        continue
                    return {"error": last_error}

                return {"error": f"Ошибка ИИ ({resp.status_code}): {api_message or 'неизвестная ошибка'}"}

            try:
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
            except (ValueError, KeyError, IndexError) as e:
                logger.warning(
                    "Неожиданный формат ответа OpenRouter (попытка %s/%s): %s",
                    attempt, AiCheckService._MAX_ATTEMPTS, e,
                )
                last_error = f"Ошибка разбора ответа ИИ: {e}"
                if attempt < AiCheckService._MAX_ATTEMPTS:
                    time.sleep(2 ** (attempt - 1))
                    continue
                return {"error": last_error}

            try:
                return AiCheckService._extract_json(content)
            except json.JSONDecodeError as e:
                logger.warning(
                    "Не удалось разобрать JSON от модели (попытка %s/%s): %s | начало ответа: %s",
                    attempt, AiCheckService._MAX_ATTEMPTS, e, content[:300],
                )
                last_error = f"Ошибка разбора ответа ИИ: {e}"
                if attempt < AiCheckService._MAX_ATTEMPTS:
                    time.sleep(2 ** (attempt - 1))
                    continue
                return {"error": last_error}

        return {"error": last_error}
