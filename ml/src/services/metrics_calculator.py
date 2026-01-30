"""
Business Metrics Calculator

Calculates key financial metrics for a business:
- Burn rate (net and gross)
- Runway
- Revenue growth
- Expense breakdown
- Cash flow volatility
"""

from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional

import numpy as np
from ..database import get_supabase
from ..models import BusinessMetrics
from .recurring_detector import get_recurring_for_user


def get_transactions_for_period(user_id: str, months: int = 12) -> list[dict]:
    """Fetch transactions for the last N months."""
    supabase = get_supabase()
    
    cutoff_date = datetime.now() - timedelta(days=months * 30)
    
    response = supabase.table('transactions').select('*').eq(
        'user_id', user_id
    ).gte('txn_date', cutoff_date.isoformat()).order('txn_date', desc=True).execute()
    
    return response.data


def get_total_balance(user_id: str) -> float:
    """Get total balance across all accounts."""
    supabase = get_supabase()
    
    response = supabase.table('accounts').select('balance').eq(
        'user_id', user_id
    ).execute()
    
    return sum(acc['balance'] for acc in response.data) if response.data else 0


def aggregate_monthly(transactions: list[dict]) -> dict:
    """
    Aggregate transactions by month.
    Returns dict of 'YYYY-MM' -> {'credits': float, 'debits': float, 'net': float}
    """
    monthly = defaultdict(lambda: {'credits': 0, 'debits': 0, 'net': 0})
    
    for txn in transactions:
        try:
            dt = datetime.fromisoformat(txn['txn_date'].replace('Z', '+00:00'))
            month_key = dt.strftime('%Y-%m')
            amount = float(txn['amount'])
            
            if txn['type'] == 'CREDIT':
                monthly[month_key]['credits'] += amount
                monthly[month_key]['net'] += amount
            else:
                monthly[month_key]['debits'] += amount
                monthly[month_key]['net'] -= amount
        except:
            continue
    
    return dict(monthly)


def calculate_expense_breakdown(transactions: list[dict]) -> tuple[dict, dict]:
    """
    Calculate expense breakdown by category.
    Returns (category_totals, category_percentages).
    """
    category_totals = defaultdict(float)
    total_expenses = 0
    
    for txn in transactions:
        if txn['type'] == 'DEBIT':
            category = txn.get('category') or 'Uncategorized'
            amount = float(txn['amount'])
            category_totals[category] += amount
            total_expenses += amount
    
    # Calculate percentages
    category_percentages = {}
    for cat, total in category_totals.items():
        category_percentages[cat] = round((total / total_expenses * 100), 1) if total_expenses > 0 else 0
    
    return dict(category_totals), category_percentages


def calculate_revenue_growth(monthly_data: dict) -> float:
    """
    Calculate month-over-month revenue growth rate.
    Returns average growth rate as percentage.
    """
    if len(monthly_data) < 2:
        return 0.0
    
    # Sort months chronologically
    sorted_months = sorted(monthly_data.keys())
    
    growth_rates = []
    for i in range(1, len(sorted_months)):
        prev_revenue = monthly_data[sorted_months[i-1]]['credits']
        curr_revenue = monthly_data[sorted_months[i]]['credits']
        
        if prev_revenue > 0:
            growth = ((curr_revenue - prev_revenue) / prev_revenue) * 100
            growth_rates.append(growth)
    
    return round(np.mean(growth_rates), 1) if growth_rates else 0.0


def calculate_cash_flow_volatility(monthly_data: dict) -> float:
    """
    Calculate standard deviation of monthly net cash flow.
    Higher values indicate more volatile cash flow.
    """
    if len(monthly_data) < 2:
        return 0.0
    
    net_flows = [data['net'] for data in monthly_data.values()]
    return round(float(np.std(net_flows)), 2)


def calculate_metrics(user_id: str) -> BusinessMetrics:
    """
    Calculate all business metrics for a user.
    """
    # Fetch data
    transactions = get_transactions_for_period(user_id, months=12)
    total_balance = get_total_balance(user_id)
    recurring = get_recurring_for_user(user_id)
    
    if not transactions:
        # Return empty metrics if no data
        return BusinessMetrics(
            user_id=user_id,
            calculated_at=datetime.now(),
            total_balance=total_balance,
            net_burn_rate=0,
            gross_burn_rate=0,
            runway_months=None,
            avg_monthly_revenue=0,
            revenue_growth_rate=0,
            expense_by_category={},
            category_percentages={},
            recurring_expense_total=0,
            one_time_expense_total=0,
            recurring_ratio=0,
            cash_flow_volatility=0,
            largest_recurring_expenses=[]
        )
    
    # Aggregate by month
    monthly_data = aggregate_monthly(transactions)
    num_months = len(monthly_data) or 1
    
    # Calculate totals
    total_credits = sum(m['credits'] for m in monthly_data.values())
    total_debits = sum(m['debits'] for m in monthly_data.values())
    
    # Monthly averages
    avg_monthly_revenue = round(total_credits / num_months, 2)
    gross_burn_rate = round(total_debits / num_months, 2)
    net_burn_rate = round((total_debits - total_credits) / num_months, 2)
    
    # Runway calculation (only if burning money)
    if net_burn_rate > 0:
        runway_months = round(total_balance / net_burn_rate, 1)
    else:
        runway_months = None  # Profitable - infinite runway
    
    # Revenue growth
    revenue_growth = calculate_revenue_growth(monthly_data)
    
    # Expense breakdown
    expense_by_category, category_percentages = calculate_expense_breakdown(transactions)
    
    # Recurring vs one-time
    recurring_monthly_total = 0
    largest_recurring = []
    
    for rec in recurring:
        monthly_amount = rec['avg_amount'] * (30 / rec['frequency_days'])
        recurring_monthly_total += monthly_amount
        largest_recurring.append({
            'narration': rec['narration_pattern'],
            'monthly_amount': round(monthly_amount, 2),
            'category': rec['category'],
            'frequency_days': rec['frequency_days']
        })
    
    # Sort by amount and take top 5
    largest_recurring.sort(key=lambda x: x['monthly_amount'], reverse=True)
    largest_recurring = largest_recurring[:5]
    
    # Estimate one-time expenses (total - recurring)
    one_time_expense_total = max(0, gross_burn_rate - recurring_monthly_total)
    recurring_ratio = round(
        (recurring_monthly_total / gross_burn_rate * 100) if gross_burn_rate > 0 else 0, 1
    )
    
    # Volatility
    volatility = calculate_cash_flow_volatility(monthly_data)
    
    return BusinessMetrics(
        user_id=user_id,
        calculated_at=datetime.now(),
        total_balance=total_balance,
        net_burn_rate=net_burn_rate,
        gross_burn_rate=gross_burn_rate,
        runway_months=runway_months,
        avg_monthly_revenue=avg_monthly_revenue,
        revenue_growth_rate=revenue_growth,
        expense_by_category=expense_by_category,
        category_percentages=category_percentages,
        recurring_expense_total=round(recurring_monthly_total, 2),
        one_time_expense_total=round(one_time_expense_total, 2),
        recurring_ratio=recurring_ratio,
        cash_flow_volatility=volatility,
        largest_recurring_expenses=largest_recurring
    )


def get_metrics_summary(user_id: str) -> dict:
    """
    Get a summary of metrics suitable for LLM consumption.
    """
    metrics = calculate_metrics(user_id)
    
    # Format for readability
    summary = {
        'snapshot_date': metrics.calculated_at.isoformat(),
        'financial_health': {
            'total_balance': f"₹{metrics.total_balance:,.2f}",
            'total_balance_raw': metrics.total_balance,
            'runway_months': metrics.runway_months,
            'runway_status': 'Profitable' if metrics.runway_months is None else (
                'Critical (<3 months)' if metrics.runway_months < 3 else
                'Caution (3-6 months)' if metrics.runway_months < 6 else
                'Healthy (>6 months)'
            )
        },
        'monthly_averages': {
            'revenue': f"₹{metrics.avg_monthly_revenue:,.2f}",
            'revenue_raw': metrics.avg_monthly_revenue,
            'gross_expenses': f"₹{metrics.gross_burn_rate:,.2f}",
            'gross_expenses_raw': metrics.gross_burn_rate,
            'net_burn': f"₹{abs(metrics.net_burn_rate):,.2f}",
            'net_burn_raw': metrics.net_burn_rate,
            'is_profitable': metrics.net_burn_rate < 0
        },
        'growth': {
            'revenue_growth_rate': f"{metrics.revenue_growth_rate}%",
            'revenue_growth_raw': metrics.revenue_growth_rate,
            'trend': 'Growing' if metrics.revenue_growth_rate > 5 else (
                'Stable' if metrics.revenue_growth_rate > -5 else 'Declining'
            )
        },
        'expense_breakdown': metrics.category_percentages,
        'recurring_expenses': {
            'monthly_total': f"₹{metrics.recurring_expense_total:,.2f}",
            'monthly_total_raw': metrics.recurring_expense_total,
            'percentage_of_expenses': f"{metrics.recurring_ratio}%",
            'top_recurring': metrics.largest_recurring_expenses
        },
        'volatility': {
            'cash_flow_std_dev': metrics.cash_flow_volatility,
            'stability': 'Stable' if metrics.cash_flow_volatility < 50000 else (
                'Moderate' if metrics.cash_flow_volatility < 100000 else 'Volatile'
            )
        }
    }
    
    return summary
