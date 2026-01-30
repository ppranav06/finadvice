"""
Balance snapshot API endpoints.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from ..services.snapshots import capture_balance_snapshot, get_balance_history

router = APIRouter()


@router.post("/snapshots/{user_id}")
async def create_snapshot(user_id: str, source: str = 'manual'):
    """
    Capture current balance snapshot for all accounts.
    
    - source: Origin of snapshot ('manual', 'setu_sync', 'scheduled')
    """
    try:
        result = capture_balance_snapshot(user_id, source)
        return {
            'status': 'success',
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/snapshots/{user_id}")
async def get_snapshots(user_id: str, days: int = 90):
    """
    Get balance history for a user.
    
    - days: Number of days of history to return (default: 90)
    """
    try:
        history = get_balance_history(user_id, days)
        
        return {
            'count': len(history),
            'days_requested': days,
            'history': history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
