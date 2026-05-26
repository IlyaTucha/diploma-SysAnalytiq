import json
import logging
import re

import requests
from django.conf import settings

from app.internal.submissions.db.models import Submission

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class AiCheckService:
    @staticmethod
    def _strip_bpmn_layout(text: str) -> str:
        # Секция bpmndi описывает координаты фигур и не нужна для семантической проверки
        text = re.sub(r'<bpmndi:[^>]*?/>', '', text)
        text = re.sub(r'<bpmndi:.*?</bpmndi:[^>]+>', '', text, flags=re.DOTALL)
        # XML-комментарии
        text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
        # Схлопнуть пустые строки
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
            if correct_answer:
                correct_answer = AiCheckService._strip_bpmn_layout(correct_answer)

        other_solutions = list(
            Submission.objects.filter(lesson=submission.lesson, status='approved')
            .exclude(id=submission_id)
            .exclude(student=submission.student)
            .values_list('student_solution', flat=True)[:10]
        )
        if is_bpmn:
            other_solutions = [AiCheckService._strip_bpmn_layout(s) for s in other_solutions]

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

        return f"""Ты — преподаватель системной аналитики. Пишешь отзыв СТУДЕНТУ на его работу (обращайся на "ты" или безлично).

ОТВЕЧАЙ СТРОГО НА РУССКОМ ЯЗЫКЕ. Все поля JSON (problem, fix, verdict, missingRequirements и т.д.) должны быть НА РУССКОМ. Английские слова в тексте недопустимы (за исключением технических терминов из самого кода — имён тегов, элементов, ключевых слов языка).

Проверь решение на соответствие КАЖДОМУ требованию задания.

## Задание
{lesson_title}

{task_description[:10000]}

{f"Эталонное решение (ТОЛЬКО для твоего внутреннего сравнения, НЕ упоминай его студенту):{chr(10)}{correct_answer[:20000]}" if correct_answer else ""}

## Решение студента (строки пронумерованы)
{numbered_solution}
{other_block}

## ВАЖНО: Уровни серьёзности проблем

Используй поле "severity" для классификации:
- **"error"** — реальная ошибка, нарушающая требования задания, синтаксис или семантику REST API
- **"warning"** — потенциальная проблема, которая может вызвать проблемы (но работает)
- **"suggestion"** — замечание по улучшению стиля (НЕ является ошибкой, работа корректна и без этого)

## Что ЯВЛЯЕТСЯ ОШИБКОЙ:

### Для Swagger/OpenAPI:
- Неправильные HTTP-методы для операций (POST для получения, GET для создания и т.д.)
- Отсутствие обязательных полей в схемах (например, id для сущностей)
- Синтаксические ошибки YAML/OpenAPI

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

### Для PlantUML/BPMN:
- Подробные подписи на стрелках и диаграммах — хорошая практика
- BPMN-решение — это XML-файл из bpmn.io (студент работает в визуальном редакторе, а на проверку уходит XML). В fix указывай конкретные BPMN-элементы которые нужно добавить/изменить, например: «добавить элемент <bpmn:laneSet> с минимум одной <bpmn:lane>», «удалить шлюз ExclusiveGateway и соединить задачи последовательно» — но текст пояснения пиши на РУССКОМ, без английских слов вне самих имён тегов

## Формат ответа (СТРОГО JSON)

{{
  "issues": [
    {{
      "lineStart": <НОМЕР СТРОКИ — ОБЯЗАТЕЛЬНО>,
      "lineEnd": <НОМЕР СТРОКИ>,
      "codeFragment": "<ТОЧНАЯ КОПИЯ проблемной строки из решения студента>",
      "severity": "<error|warning|suggestion>",
      "problem": "<ЧТО неправильно или что можно улучшить>",
      "fix": "<КОНКРЕТНОЕ указание исправления — БЕЗ слов 'рассмотреть', 'возможно'. Для severity=suggestion начинай с 'Можно...' (не 'нужно')>"
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
6. **fix ОБЯЗАТЕЛЕН** — для severity=error/warning пиши «исправить на X», «удалить Y», «добавить Z». Для severity=suggestion пиши «можно улучшить, X», «можно вынести в Y» (это не обязательно к исправлению, а лишь рекомендация). НЕ упоминай эталонное решение
7. **verdict** — КРАТКИЙ сухой итог в 1 предложение. НЕ пиши: "Отличная работа", "превышает требования", "профессиональный подход", "улучшает спецификацию", "с превышением требований", "дополнительные элементы". Только: выполнено/не выполнено + количество замечаний если есть
8. **Полнота анализа** — проанализируй ВСЁ решение целиком (включая длинные XML/BPMN/YAML), не обрывай разбор на середине файла. Если файл большой — делай меньше, но полные комментарии, охватывая весь файл от начала до конца

## ПРИМЕР ПРАВИЛЬНОГО ОТВЕТА:

{{
  "issues": [
    {{"lineStart": 3, "lineEnd": 3, "codeFragment": "participant \\"AUTH ERVICE\\" as auth", "severity": "error", "problem": "Опечатка в названии сервиса", "fix": "Исправить на: participant \\"Auth Service\\" as auth"}},
    {{"lineStart": 21, "lineEnd": 21, "codeFragment": "\\"404\\":", "severity": "suggestion", "problem": "Для GET списка ресурсов 404 обычно не используется — пустой список возвращает 200", "fix": "Удалить блок 404 для GET /users"}}
  ],
  "missingRequirements": [],
  "verdict": "Требования выполнены, есть 2 замечания."
}}

## ЕСЛИ ВСЁ ПРАВИЛЬНО:

{{
  "issues": [],
  "missingRequirements": [],
  "verdict": "Требования выполнены."
}}

Отвечай ТОЛЬКО JSON."""

    @staticmethod
    def _call_llm(api_key: str, prompt: str) -> dict:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": settings.OPENROUTER_MAX_TOKENS,
            "temperature": settings.OPENROUTER_TEMPERATURE,
        }

        try:
            resp = requests.post(
                OPENROUTER_URL, headers=headers, json=payload, timeout=60,
            )

            if resp.status_code >= 400:
                api_message = ""
                try:
                    body = resp.json()
                    err = body.get("error") if isinstance(body, dict) else None
                    if isinstance(err, dict):
                        api_message = err.get("message", "") or ""
                    elif isinstance(err, str):
                        api_message = err
                except ValueError:
                    api_message = resp.text[:300]

                logger.error(
                    "OpenRouter API %s: %s", resp.status_code, api_message or resp.text[:300],
                )

                lower = api_message.lower()
                if "context" in lower and ("length" in lower or "window" in lower or "token" in lower):
                    return {"error": "Решение слишком большое для проверки ИИ. Попробуйте уменьшить размер кода."}
                if resp.status_code == 401:
                    return {"error": "Неверный API-ключ OpenRouter."}
                if resp.status_code == 402:
                    return {"error": "Недостаточно средств на балансе OpenRouter."}
                if resp.status_code == 429:
                    return {"error": "Превышен лимит запросов к ИИ. Попробуйте позже."}
                if resp.status_code == 400:
                    return {"error": f"Запрос отклонён ИИ: {api_message or 'Bad Request'}"}

                return {"error": f"Ошибка ИИ ({resp.status_code}): {api_message or 'неизвестная ошибка'}"}

            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()

            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group()

            return json.loads(content)

        except requests.RequestException as e:
            logger.error("OpenRouter request error: %s", e)
            return {"error": f"Ошибка сети при обращении к ИИ: {e}"}
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error("Failed to parse LLM response: %s", e)
            return {"error": f"Ошибка разбора ответа ИИ: {e}"}
