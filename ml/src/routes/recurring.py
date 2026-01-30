"""
Recurring transaction detection API endpoints.
"""

from fastapi import APIRouter, HTTPException

from ..services.recurring_detector import (
    run_detection,
    get_recurring_for_user,
    FREQUENCY_PATTERNS
)

router = APIRouter()


@router.get("/recurring/{user_id}")
async def get_recurring_transactions(user_id: str):
    """
    Get all detected recurring transaction patterns for a user.
    """
    try:
        patterns = get_recurring_for_user(user_id)
        
        # Format for display
        formatted = []
        for p in patterns:
            freq_label = FREQUENCY_PATTERNS.get(
                p['frequency_days'],
                f"every {p['frequency_days']} days"
            )
            formatted.append({
                'id': p['id'],
                'narration': p['narration_pattern'],
                'amount': f"₹{p['avg_amount']:,.2f}",
                'amount_raw': p['avg_amount'],
                'frequency': freq_label,
                'frequency_days': p['frequency_days'],
                'category': p['category'],
                'confidence': f"{p['confidence'] * 100:.0f}%",
                'confidence_raw': p['confidence'],
                'occurrences': p['transaction_count'],
                'next_expected': p['next_expected'],
                'monthly_cost': round(p['avg_amount'] * (30 / p['frequency_days']), 2)
            })
        
        # Calculate total monthly recurring
        total_monthly = sum(p['monthly_cost'] for p in formatted)
        
        return {
            'count': len(formatted),
            'total_monthly_recurring': f"₹{total_monthly:,.2f}",
            'total_monthly_raw': total_monthly,
            'patterns': formatted
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recurring/{user_id}/detect")
async def detect_recurring(user_id: str):
    """
    Run recurring transaction detection for a user.
    This analyzes transaction history and identifies patterns.
    """
    try:
        result = run_detection(user_id)
        return {
            'status': 'success',
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
