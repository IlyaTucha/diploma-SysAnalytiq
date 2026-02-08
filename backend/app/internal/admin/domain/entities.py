from ninja import Schema
from typing import List, Optional
import uuid
from datetime import datetime

class StatsSchema(Schema):
    total_students: int
    total_submissions: int
    pending_reviews: int

class ReviewActionSchema(Schema):
    status: str # 'approved', 'rejected'
    feedback: Optional[str] = None
