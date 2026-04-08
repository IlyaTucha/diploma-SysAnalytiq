from ninja import Schema
from typing import Optional, List, Literal

class StatsSchema(Schema):
    total_students: int
    total_submissions: int
    pending_reviews: int

class InlineCommentSchema(Schema):
    line_start: int
    line_end: int
    text: str
    highlighted_text: str

class ReviewActionSchema(Schema):
    status: Literal['approved', 'rejected']
    feedback: Optional[str] = None
    inline_comments: Optional[List[InlineCommentSchema]] = None
