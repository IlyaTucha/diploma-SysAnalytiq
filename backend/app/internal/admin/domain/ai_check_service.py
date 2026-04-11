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
    def check_submission(submission_id: int) -> dict:
        submission = Submission.objects.select_related('lesson', 'lesson__module', 'student').get(id=submission_id)

        task_description = submission.lesson.content or ''
        correct_answer = submission.lesson.correct_answer or ''
        student_solution = submission.student_solution or ''
        lesson_title = submission.lesson.title or ''

        other_solutions = list(
            Submission.objects.filter(lesson=submission.lesson, status='approved')
            .exclude(id=submission_id)
            .exclude(student=submission.student)
            .values_list('student_solution', flat=True)[:10]
        )

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
                truncated = sol[:2000] if len(sol) > 2000 else sol
                parts.append(f"--- Решение {i} ---\n{truncated}")
            other_block = (
                "\n\nДругие принятые решения этого задания (для сравнения на плагиат):\n"
                + "\n".join(parts)
            )

        # Нумеруем строки решения студента
        lines = student_solution[:5000].splitlines()
        numbered_solution = "\n".join(f"{i+1}: {line}" for i, line in enumerate(lines))

        return f"""Ты — преподаватель системной аналитики. Пишешь отзыв СТУДЕНТУ на его работу (обращайся на "ты" или безлично).

Проверь решение на соответствие КАЖДОМУ требованию задания.

## Задание
{lesson_title}

{task_description[:3000]}

{f"Эталонное решение (ТОЛЬКО для твоего внутреннего сравнения, НЕ упоминай его студенту):{chr(10)}{correct_answer[:2000]}" if correct_answer else ""}

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

## Формат ответа (СТРОГО JSON)

{{
  "issues": [
    {{
      "lineStart": <НОМЕР СТРОКИ — ОБЯЗАТЕЛЬНО>,
      "lineEnd": <НОМЕР СТРОКИ>,
      "codeFragment": "<ТОЧНАЯ КОПИЯ проблемной строки из решения студента>",
      "severity": "<error|warning|suggestion>",
      "problem": "<ЧТО неправильно или можно улучшить>",
      "fix": "<Что нужно исправить: КОНКРЕТНОЕ указание — БЕЗ слов 'рассмотреть', 'возможно', 'можно'>"
    }}
  ],
  "missingRequirements": ["<требование из задания, которое НЕ выполнено>"],
  "verdict": "<КРАТКИЙ итог на человеческом языке>",
  "plagiarism": {{"detected": false, "similarTo": null, "fragments": []}}
}}

## КРИТИЧЕСКИ ВАЖНО:

1. **issues ОБЯЗАТЕЛЕН** — КАЖДАЯ проблема = ОТДЕЛЬНЫЙ элемент в issues с lineStart
2. **lineStart ОБЯЗАТЕЛЕН** — без него комментарий не отобразится
3. **codeFragment ОБЯЗАТЕЛЕН** — точная копия проблемной строки из решения (без номера строки)
4. **severity ОБЯЗАТЕЛЕН** — классифицируй каждую проблему: error, warning или suggestion
5. **fix ОБЯЗАТЕЛЕН** — должен содержать КОНКРЕТНОЕ указание что нужно исправить. НЕ пиши "Рассмотреть...", "Возможно...", "Можно удалить..." — пиши конкретно что исправить. Если что-то лишнее — пиши "Лишний элемент, не требуется по заданию", НЕ упоминай эталонное решение
6. **verdict** — КРАТКИЙ сухой итог в 1 предложение. НЕ пиши: "Отличная работа", "превышает требования", "профессиональный подход", "улучшает спецификацию", "с превышением требований", "дополнительные элементы". Только: выполнено/не выполнено + количество замечаний если есть

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
            resp.raise_for_status()
            data = resp.json()

            content = data["choices"][0]["message"]["content"].strip()

            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group()

            return json.loads(content)

        except requests.RequestException as e:
            logger.error("OpenRouter API error: %s", e)
            return {"error": f"Ошибка API: {e}"}
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error("Failed to parse LLM response: %s", e)
            return {"error": f"Ошибка разбора ответа ИИ: {e}"}
