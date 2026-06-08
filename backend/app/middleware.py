import logging
import threading
from datetime import datetime, timedelta, timezone

from django.core.management import call_command

logger = logging.getLogger(__name__)

CLEANUP_INTERVAL = timedelta(days=1)


class ExpiredTokenCleanupMiddleware:
    _last_run = None
    _lock = threading.Lock()

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        self._maybe_cleanup()
        return self.get_response(request)

    @classmethod
    def _maybe_cleanup(cls):
        now = datetime.now(timezone.utc)
        if cls._last_run is not None and now - cls._last_run < CLEANUP_INTERVAL:
            return
        with cls._lock:
            if cls._last_run is not None and now - cls._last_run < CLEANUP_INTERVAL:
                return
            cls._last_run = now
        threading.Thread(target=cls._run, daemon=True).start()

    @staticmethod
    def _run():
        try:
            call_command('flushexpiredtokens', verbosity=0)
        except Exception:
            logger.exception('flushexpiredtokens failed')
