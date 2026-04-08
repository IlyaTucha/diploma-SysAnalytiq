import pytest
from unittest.mock import patch, MagicMock
from app.internal.courses.db.models import Module, Lesson
from app.internal.submissions.db.models import Submission
from app.internal.admin.domain.ai_check_service import AiCheckService


@pytest.mark.django_db
class TestAiCheckService:
    """Unit tests for AI Check Service"""

    @pytest.fixture
    def setup_submission(self, user_client):
        """Create a module, lesson and submission for testing"""
        module = Module.objects.create(
            title="Test Module", slug="test-module",
            description="desc", color="#000", icon="icon"
        )
        lesson = Lesson.objects.create(
            module=module, number=1, title="Test Lesson", slug="test-lesson",
            type="practice", content="Create a SELECT query to get all users"
        )
        submission = Submission.objects.create(
            student=user_client.user,
            lesson=lesson,
            student_solution="SELECT * FROM users;",
            status="pending"
        )
        return submission

    @patch('app.internal.admin.domain.ai_check_service.requests.post')
    @patch('app.internal.admin.domain.ai_check_service.settings')
    def test_check_submission_success(self, mock_settings, mock_post, setup_submission):
        """Test successful AI check with valid response"""
        mock_settings.OPENROUTER_API_KEY = 'test-api-key'
        mock_settings.OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3-0324'
        mock_settings.OPENROUTER_MAX_TOKENS = 2048
        mock_settings.OPENROUTER_TEMPERATURE = 0.3

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": '{"issues": [], "missingRequirements": [], "verdict": "Good solution"}'
                }
            }]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = AiCheckService.check_submission(setup_submission.id)

        assert "error" not in result
        assert result["verdict"] == "Good solution"
        assert result["issues"] == []

    @patch('app.internal.admin.domain.ai_check_service.requests.post')
    @patch('app.internal.admin.domain.ai_check_service.settings')
    def test_check_submission_with_issues(self, mock_settings, mock_post, setup_submission):
        """Test AI check that finds issues"""
        mock_settings.OPENROUTER_API_KEY = 'test-api-key'
        mock_settings.OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3-0324'
        mock_settings.OPENROUTER_MAX_TOKENS = 2048
        mock_settings.OPENROUTER_TEMPERATURE = 0.3

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": '''{
                        "issues": [
                            {"lineStart": 1, "lineEnd": 1, "codeFragment": "SELECT *", "problem": "Using SELECT *", "suggestion": "SELECT id, name"}
                        ],
                        "missingRequirements": ["Missing WHERE clause"],
                        "verdict": "1 issue found"
                    }'''
                }
            }]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = AiCheckService.check_submission(setup_submission.id)

        assert "error" not in result
        assert len(result["issues"]) == 1
        assert result["issues"][0]["lineStart"] == 1
        assert len(result["missingRequirements"]) == 1

    @patch('app.internal.admin.domain.ai_check_service.settings')
    def test_check_submission_no_api_key(self, mock_settings, setup_submission):
        """Test that missing API key returns error"""
        mock_settings.OPENROUTER_API_KEY = ''

        result = AiCheckService.check_submission(setup_submission.id)

        assert "error" in result
        assert "API key" in result["error"]

    @patch('app.internal.admin.domain.ai_check_service.requests.post')
    @patch('app.internal.admin.domain.ai_check_service.settings')
    def test_check_submission_api_error(self, mock_settings, mock_post, setup_submission):
        """Test handling of API errors"""
        import requests
        mock_settings.OPENROUTER_API_KEY = 'test-api-key'
        mock_settings.OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3-0324'
        mock_settings.OPENROUTER_MAX_TOKENS = 2048
        mock_settings.OPENROUTER_TEMPERATURE = 0.3

        mock_post.side_effect = requests.RequestException("API unavailable")

        result = AiCheckService.check_submission(setup_submission.id)

        assert "error" in result
        assert "API" in result["error"]

    @patch('app.internal.admin.domain.ai_check_service.requests.post')
    @patch('app.internal.admin.domain.ai_check_service.settings')
    def test_check_submission_invalid_json(self, mock_settings, mock_post, setup_submission):
        """Test handling of invalid JSON response"""
        mock_settings.OPENROUTER_API_KEY = 'test-api-key'
        mock_settings.OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3-0324'
        mock_settings.OPENROUTER_MAX_TOKENS = 2048
        mock_settings.OPENROUTER_TEMPERATURE = 0.3

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "This is not valid JSON"
                }
            }]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = AiCheckService.check_submission(setup_submission.id)

        assert "error" in result

    def test_build_prompt_contains_task(self):
        """Test that prompt builder includes all required parts"""
        prompt = AiCheckService._build_prompt(
            lesson_title="Test Lesson",
            task_description="Write a SELECT query",
            correct_answer="SELECT id FROM users",
            student_solution="SELECT * FROM users",
            other_solutions=[]
        )

        assert "Test Lesson" in prompt
        assert "Write a SELECT query" in prompt
        assert "SELECT id FROM users" in prompt
        assert "1: SELECT * FROM users" in prompt
        assert "issues" in prompt
        assert "lineStart" in prompt

    def test_build_prompt_with_other_solutions(self):
        """Test that other solutions are included for plagiarism check"""
        prompt = AiCheckService._build_prompt(
            lesson_title="Test",
            task_description="Task",
            correct_answer="",
            student_solution="Solution",
            other_solutions=["Other solution 1", "Other solution 2"]
        )

        assert "Другие принятые решения" in prompt
        assert "Решение 1" in prompt
        assert "Other solution 1" in prompt


@pytest.mark.django_db
class TestAiCheckEndpoint:
    """Integration tests for AI check endpoint"""

    @pytest.fixture
    def setup_submission(self, user_client):
        module = Module.objects.create(
            title="M", slug="m", description="d", color="c", icon="i"
        )
        lesson = Lesson.objects.create(
            module=module, number=1, title="L", slug="l", type="practice", content="c"
        )
        submission = Submission.objects.create(
            student=user_client.user,
            lesson=lesson,
            student_solution="SELECT 1;",
            status="pending"
        )
        return submission

    @patch('app.internal.admin.domain.ai_check_service.AiCheckService.check_submission')
    def test_ai_check_endpoint_admin_only(self, mock_check, user_client, setup_submission):
        """Test that only admins can access AI check endpoint"""
        resp = user_client.post(
            f"/admin/submissions/{setup_submission.id}/ai-check",
            **user_client.auth_headers,
        )
        assert resp.status_code == 403

    @patch('app.internal.admin.domain.ai_check_service.AiCheckService.check_submission')
    def test_ai_check_endpoint_success(self, mock_check, admin_client, setup_submission):
        """Test successful AI check via endpoint"""
        mock_check.return_value = {
            "issues": [],
            "missingRequirements": [],
            "verdict": "Perfect!"
        }

        resp = admin_client.post(
            f"/admin/submissions/{setup_submission.id}/ai-check",
            **admin_client.auth_headers,
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["verdict"] == "Perfect!"
