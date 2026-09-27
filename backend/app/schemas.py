from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --- Auth Schemas ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: Optional[str] = None
    identifier: Optional[str] = None
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    streak: int
    avatar: str
    theme: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Challenge Schemas ---
class TestCaseSchema(BaseModel):
    input: str = ""
    expected: str
    hidden: bool = False
    description: Optional[str] = None


class ChallengeSummary(BaseModel):
    id: int
    chapter_id: int
    chapter_title: str
    level_number: int
    title: str
    difficulty: str
    passed: bool = False
    locked: bool = True

    model_config = ConfigDict(from_attributes=True)


class ChapterGroup(BaseModel):
    chapter_id: int
    chapter_title: str
    levels: List[ChallengeSummary]
    completion_percentage: float


class ChallengeDetail(BaseModel):
    id: int
    chapter_id: int
    chapter_title: str
    level_number: int
    title: str
    story: str
    objective: str
    starter_code: str
    expected_output: str
    hints: List[str]
    visible_test_cases: List[TestCaseSchema]
    total_test_cases: int
    explanation: Optional[str] = None
    difficulty: str
    passed: bool = False
    saved_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Execution Schemas ---
class CodeRunRequest(BaseModel):
    challenge_id: int
    code: str
    custom_input: Optional[str] = None


class TestCaseResult(BaseModel):
    test_case_index: int
    description: str
    passed: bool
    input: str
    expected_output: str
    actual_output: str
    error: Optional[str] = None
    execution_time_ms: float
    hidden: bool = False


class CodeRunResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    test_results: List[TestCaseResult]
    passed_all: bool
    execution_time_ms: float
    security_error: Optional[str] = None


class CodeSubmitRequest(BaseModel):
    challenge_id: int
    code: str
    hints_used: int = 0


class CodeSubmitResponse(BaseModel):
    success: bool
    passed_all: bool
    execution_time_ms: float = 0.0
    test_results: List[TestCaseResult]
    next_challenge_id: Optional[int] = None
    message: str


# --- AI Schemas ---
class ExplainRequest(BaseModel):
    challenge_id: Optional[int] = None
    code: str
    user_question: Optional[str] = None


class ExplainResponse(BaseModel):
    line_by_line: List[Dict[str, Any]]
    beginner_summary: str
    time_complexity: str
    space_complexity: str
    common_mistakes: List[str]
    better_approach: str
    optimized_code: str
    dry_run_trace: List[Dict[str, Any]]


class AITutorChatRequest(BaseModel):
    challenge_id: Optional[int] = None
    code: Optional[str] = None
    starter_code: Optional[str] = None
    last_error: Optional[str] = None
    message: str
    chat_history: Optional[List[Dict[str, str]]] = []


class AITutorChatResponse(BaseModel):
    reply: str


# --- Profile & Admin Schemas ---
class ChapterMastery(BaseModel):
    chapter_id: int
    chapter_title: str
    total_levels: int
    completed_levels: int
    percentage: float


class ProfileResponse(BaseModel):
    user: UserResponse
    total_completed: int
    total_challenges: int
    accuracy_percentage: float
    chapter_mastery: List[ChapterMastery]
    weak_topics: List[str]
    strengths: List[str]
    recent_activity: List[Dict[str, Any]]


class AdminMetricsResponse(BaseModel):
    total_users: int
    total_challenges: int
    total_submissions: int
    overall_pass_rate: float
    popular_challenges: List[Dict[str, Any]]


class AdminChallengeCreate(BaseModel):
    chapter_id: int
    chapter_title: str
    level_number: int
    title: str
    story: str
    objective: str
    starter_code: str
    expected_output: str
    hints: List[str] = []
    test_cases: List[TestCaseSchema] = []
    explanation: str
    difficulty: str = "Beginner"
