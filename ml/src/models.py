from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class Transaction(BaseModel):
    """Transaction from database."""
    id: str
    account_id: str
    user_id: str
    txn_id: str
    amount: float
    type: str  # CREDIT or DEBIT
    mode: str
    narration: str
    txn_date: datetime
    category: Optional[str] = None
    is_manual: bool = False


class Account(BaseModel):
    """Bank account from database."""
    id: str
    user_id: str
    fip_name: str
    account_type: str
    masked_account_number: str
    balance: float
    currency: str


class RecurringTransaction(BaseModel):
    """Detected recurring transaction pattern."""
    id: Optional[str] = None
    user_id: str
    account_id: str
    pattern_hash: str
    avg_amount: float
    frequency_days: int
    last_occurrence: datetime
    next_expected: datetime
    narration_pattern: str
    category: Optional[str] = None
    confidence: float
    transaction_count: int


class BalanceSnapshot(BaseModel):
    """Point-in-time balance snapshot."""
    id: Optional[str] = None
    account_id: str
    user_id: str
    balance: float
    snapshot_date: datetime
    source: str  # 'setu_sync', 'manual', 'scheduled'


class BusinessMetrics(BaseModel):
    """Calculated business metrics."""
    user_id: str
    calculated_at: datetime
    
    # Core metrics
    total_balance: float
    net_burn_rate: float  # Monthly (expenses - revenue, negative if profitable)
    gross_burn_rate: float  # Monthly expenses only
    runway_months: Optional[float]  # None if profitable
    
    # Revenue metrics
    avg_monthly_revenue: float
    revenue_growth_rate: float  # Month-over-month %
    
    # Expense breakdown
    expense_by_category: dict[str, float]  # category -> amount
    category_percentages: dict[str, float]  # category -> % of total
    
    # Pattern metrics
    recurring_expense_total: float
    one_time_expense_total: float
    recurring_ratio: float  # % of expenses that are recurring
    
    # Volatility
    cash_flow_volatility: float  # Standard deviation of monthly net
    
    # Top items
    largest_recurring_expenses: list[dict]


class ForecastPoint(BaseModel):
    """Single forecast data point."""
    date: datetime
    predicted_balance: float
    lower_bound: float
    upper_bound: float
    predicted_net_flow: float


class ForecastResult(BaseModel):
    """Complete forecast result."""
    user_id: str
    generated_at: datetime
    forecast_months: int
    current_balance: float
    forecasts: list[ForecastPoint]
    predicted_runway_months: Optional[float]
    trend: str  # 'improving', 'stable', 'declining'
    confidence_score: float


class CachedMetrics(BaseModel):
    """Cached metrics and forecasts."""
    id: Optional[str] = None
    user_id: str
    metric_data: dict
    forecast_data: Optional[dict] = None
    calculated_at: datetime
    expires_at: datetime
